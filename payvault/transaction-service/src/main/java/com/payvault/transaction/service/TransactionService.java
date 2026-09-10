package com.payvault.transaction.service;

import com.payvault.common.dto.TransactionStatus;
import com.payvault.common.event.SagaEvents.*;
import com.payvault.common.exception.PayVaultException.ResourceNotFoundException;
import com.payvault.transaction.dto.TransferRequest.Initiate;
import com.payvault.transaction.dto.TransferRequest.TransferResponse;
import com.payvault.transaction.entity.Transaction;
import com.payvault.transaction.outbox.OutboxPublisher;
import com.payvault.transaction.repository.TransactionRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Core Saga Orchestrator for Distributed Wallet Transfers.
 *
 * SAGA STEP PROGRESSION:
 * 1. [INITIATE]: Atomically creates Transaction record and writes DebitWalletCommand to Outbox.
 * 2. [DEBIT COMPLETED]: On WalletDebitedEvent, transitions status to DEBIT_SUCCESS, writes CreditWalletCommand to Outbox.
 * 3. [DEBIT FAILED]: On WalletDebitFailedEvent (e.g., insufficient balance), marks transaction FAILED; no rollback required.
 * 4. [CREDIT COMPLETED]: On WalletCreditedEvent, marks transaction COMPLETED; publishes TransactionCompletedEvent.
 * 5. [CREDIT FAILED]: On WalletCreditFailedEvent (e.g., target wallet locked/inactive), triggers COMPENSATION:
 *    transitions status to COMPENSATING, writes CompensateDebitCommand to Outbox to refund the sender.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final OutboxPublisher outboxPublisher;
    private final IdempotencyService idempotencyService;

    /**
     * Entry point for initiating a money transfer between two wallets.
     * Protected by Resilience4j CircuitBreaker and RateLimiter.
     */
    @Transactional
    @CircuitBreaker(name = "walletService", fallbackMethod = "initiateTransferFallback")
    @RateLimiter(name = "transferApi")
    public TransferResponse initiateTransfer(Initiate request, String idempotencyKey) {
        log.info("Initiating transfer request with idempotency key: {}", idempotencyKey);

        // 1. Check idempotency in Redis
        Optional<TransferResponse> cached = idempotencyService.acquireLockOrGetCached(idempotencyKey);
        if (cached.isPresent()) {
            return cached.get();
        }

        UUID transactionId = UUID.randomUUID();

        // 2. Persist transaction entity (local ACID transaction)
        Transaction transaction = Transaction.builder()
                .id(transactionId)
                .idempotencyKey(idempotencyKey)
                .sourceWalletId(request.getSourceWalletId())
                .destinationWalletId(request.getDestinationWalletId())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status(TransactionStatus.INITIATED)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        transactionRepository.save(transaction);

        // 3. Saga Step 1: Enqueue DebitWalletCommand via Transactional Outbox
        DebitWalletCommand debitCommand = DebitWalletCommand.builder()
                .transactionId(transactionId)
                .sourceWalletId(request.getSourceWalletId())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .idempotencyKey(idempotencyKey)
                .build();

        outboxPublisher.publish("Transaction", transactionId.toString(), "DebitWalletCommand", debitCommand);

        TransferResponse response = TransferResponse.builder()
                .transactionId(transactionId)
                .idempotencyKey(idempotencyKey)
                .sourceWalletId(request.getSourceWalletId())
                .destinationWalletId(request.getDestinationWalletId())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status(TransactionStatus.INITIATED)
                .message("Transfer successfully initiated. Processing Saga workflow asynchronously.")
                .timestamp(Instant.now())
                .build();

        // 4. Cache response in Redis for subsequent duplicate calls
        idempotencyService.recordCompletedResponse(idempotencyKey, response);

        return response;
    }

    /**
     * Fallback method when Circuit Breaker is OPEN or rate limit exceeded.
     */
    public TransferResponse initiateTransferFallback(Initiate request, String idempotencyKey, Throwable t) {
        log.error("Circuit breaker tripped or rate limit triggered for transfer with key {}: {}", idempotencyKey, t.getMessage());
        idempotencyService.releaseLockOnFailure(idempotencyKey);
        return TransferResponse.builder()
                .idempotencyKey(idempotencyKey)
                .sourceWalletId(request.getSourceWalletId())
                .destinationWalletId(request.getDestinationWalletId())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status(TransactionStatus.FAILED)
                .message("Transfer temporarily unavailable due to downstream system protection: " + t.getMessage())
                .timestamp(Instant.now())
                .build();
    }

    /**
     * Saga Step 2: Handle Debit Success from wallet-service.
     */
    @Transactional
    public void processWalletDebited(WalletDebitedEvent event) {
        Transaction tx = getTransaction(event.getTransactionId());
        log.info("Saga Orchestrator: Sender debited for tx {}. Moving to credit step.", tx.getId());

        tx.setStatus(TransactionStatus.DEBIT_SUCCESS);
        transactionRepository.save(tx);

        // Dispatch Credit command to destination wallet
        CreditWalletCommand creditCmd = CreditWalletCommand.builder()
                .transactionId(tx.getId())
                .destinationWalletId(tx.getDestinationWalletId())
                .amount(tx.getAmount())
                .currency(tx.getCurrency())
                .build();

        outboxPublisher.publish("Transaction", tx.getId().toString(), "CreditWalletCommand", creditCmd);
    }

    /**
     * Saga Step 2 Alternative: Handle Debit Failure (e.g. Insufficient Balance).
     */
    @Transactional
    public void processWalletDebitFailed(WalletDebitFailedEvent event) {
        Transaction tx = getTransaction(event.getTransactionId());
        log.warn("Saga Orchestrator: Debit failed for tx {}: {}", tx.getId(), event.getReason());

        tx.setStatus(TransactionStatus.FAILED);
        tx.setFailureReason(event.getReason());
        transactionRepository.save(tx);

        // Broadcast failure event
        TransactionFailedEvent failedEvent = TransactionFailedEvent.builder()
                .transactionId(tx.getId())
                .sourceWalletId(tx.getSourceWalletId())
                .amount(tx.getAmount())
                .failureReason(event.getReason())
                .failedAt(Instant.now())
                .build();

        outboxPublisher.publish("Transaction", tx.getId().toString(), "TransactionFailedEvent", failedEvent);
    }

    /**
     * Saga Step 3: Handle Credit Success -> Transaction COMPLETED!
     */
    @Transactional
    public void processWalletCredited(WalletCreditedEvent event) {
        Transaction tx = getTransaction(event.getTransactionId());
        log.info("Saga Orchestrator: Destination credited for tx {}. Transaction COMPLETED successfully.", tx.getId());

        tx.setStatus(TransactionStatus.COMPLETED);
        transactionRepository.save(tx);

        TransactionCompletedEvent completedEvent = TransactionCompletedEvent.builder()
                .transactionId(tx.getId())
                .sourceWalletId(tx.getSourceWalletId())
                .destinationWalletId(tx.getDestinationWalletId())
                .amount(tx.getAmount())
                .currency(tx.getCurrency())
                .completedAt(Instant.now())
                .build();

        outboxPublisher.publish("Transaction", tx.getId().toString(), "TransactionCompletedEvent", completedEvent);
    }

    /**
     * Saga Compensation: Handle Credit Failure -> Trigger rollback of Step 1 (debit refund).
     */
    @Transactional
    public void processWalletCreditFailed(WalletCreditFailedEvent event) {
        Transaction tx = getTransaction(event.getTransactionId());
        log.error("Saga Orchestrator: Destination credit failed for tx {}: {}. Triggering compensating rollback!",
                tx.getId(), event.getReason());

        tx.setStatus(TransactionStatus.COMPENSATING);
        tx.setFailureReason("Credit step failed: " + event.getReason());
        transactionRepository.save(tx);

        // Emit compensating action: Refund sender wallet
        CompensateDebitCommand compensateCmd = CompensateDebitCommand.builder()
                .transactionId(tx.getId())
                .sourceWalletId(tx.getSourceWalletId())
                .amount(tx.getAmount())
                .reason("Compensating transfer failure: " + event.getReason())
                .build();

        outboxPublisher.publish("Transaction", tx.getId().toString(), "CompensateDebitCommand", compensateCmd);
    }

    /**
     * Saga Compensation Completed: Sender has been refunded.
     */
    @Transactional
    public void processDebitCompensated(UUID transactionId) {
        Transaction tx = getTransaction(transactionId);
        log.info("Saga Orchestrator: Compensation complete for tx {}. Status marked COMPENSATED.", tx.getId());

        tx.setStatus(TransactionStatus.COMPENSATED);
        transactionRepository.save(tx);

        TransactionFailedEvent failedEvent = TransactionFailedEvent.builder()
                .transactionId(tx.getId())
                .sourceWalletId(tx.getSourceWalletId())
                .amount(tx.getAmount())
                .failureReason("Transaction rolled back and refunded: " + tx.getFailureReason())
                .failedAt(Instant.now())
                .build();

        outboxPublisher.publish("Transaction", tx.getId().toString(), "TransactionFailedEvent", failedEvent);
    }

    @Transactional(readOnly = true)
    public Transaction getTransactionById(UUID id) {
        return getTransaction(id);
    }

    @Transactional(readOnly = true)
    public Transaction getTransactionByIdempotencyKey(String idempotencyKey) {
        return transactionRepository.findByIdempotencyKey(idempotencyKey)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found for idempotency key: " + idempotencyKey));
    }

    @Transactional(readOnly = true)
    public java.util.List<Transaction> getTransactionsByWallet(UUID walletId) {
        return transactionRepository.findBySourceWalletIdOrDestinationWalletIdOrderByCreatedAtDesc(walletId, walletId);
    }

    private Transaction getTransaction(UUID transactionId) {
        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + transactionId));
    }
}
