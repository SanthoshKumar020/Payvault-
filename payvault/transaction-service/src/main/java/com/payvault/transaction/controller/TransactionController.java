package com.payvault.transaction.controller;

import com.payvault.transaction.dto.TransferRequest;
import com.payvault.transaction.entity.Transaction;
import com.payvault.transaction.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/transfers")
    public ResponseEntity<TransferRequest.TransferResponse> initiateTransfer(
            @RequestHeader(value = "Idempotency-Key", required = true) String idempotencyKey,
            @Valid @RequestBody TransferRequest.Initiate request) {

        log.info("Received POST /transfers request. Key: {}, From: {}, To: {}, Amount: {}",
                idempotencyKey, request.getSourceWalletId(), request.getDestinationWalletId(), request.getAmount());

        TransferRequest.TransferResponse response = transactionService.initiateTransfer(request, idempotencyKey);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransaction(@PathVariable UUID id) {
        Transaction tx = transactionService.getTransactionById(id);
        return ResponseEntity.ok(tx);
    }

    @GetMapping("/idempotency/{idempotencyKey}")
    public ResponseEntity<Transaction> getTransactionByIdempotencyKey(@PathVariable String idempotencyKey) {
        Transaction tx = transactionService.getTransactionByIdempotencyKey(idempotencyKey);
        return ResponseEntity.ok(tx);
    }

    @GetMapping("/wallet/{walletId}")
    public ResponseEntity<java.util.List<Transaction>> getTransactionsByWallet(@PathVariable UUID walletId) {
        return ResponseEntity.ok(transactionService.getTransactionsByWallet(walletId));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "transaction-service",
                "pattern", "Saga Orchestrator + Transactional Outbox + Redis Idempotency"
        ));
    }
}
