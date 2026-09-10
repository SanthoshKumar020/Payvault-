package com.payvault.wallet.service;

import com.payvault.common.exception.PayVaultException.*;
import com.payvault.wallet.entity.Wallet;
import com.payvault.wallet.entity.WalletLedger;
import com.payvault.wallet.repository.WalletLedgerRepository;
import com.payvault.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletLedgerRepository ledgerRepository;

    @Transactional
    public Wallet createWallet(UUID userId, String currency) {
        log.info("Creating new wallet for user: {}", userId);
        Wallet wallet = Wallet.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .balance(BigDecimal.ZERO)
                .currency(currency != null ? currency : "USD")
                .version(0L)
                .status(Wallet.WalletStatus.ACTIVE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        return walletRepository.save(wallet);
    }

    @Transactional(readOnly = true)
    public Wallet getWalletById(UUID walletId) {
        return walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found: " + walletId));
    }

    @Transactional(readOnly = true)
    public Wallet getWalletByUserId(UUID userId) {
        return walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + userId));
    }

    /**
     * Executes debit operation on source wallet.
     * Uses JPA @Version for optimistic locking concurrency control.
     */
    @Transactional
    public Wallet debit(UUID walletId, UUID transactionId, BigDecimal amount) {
        try {
            Wallet wallet = getWalletById(walletId);

            if (wallet.getStatus() != Wallet.WalletStatus.ACTIVE) {
                throw new IllegalStateException("Wallet " + walletId + " is not ACTIVE");
            }

            if (wallet.getBalance().compareTo(amount) < 0) {
                log.warn("Debit rejected: Wallet {} balance {} insufficient for requested amount {}",
                        walletId, wallet.getBalance(), amount);
                throw new InsufficientBalanceException("Insufficient wallet balance: current=" +
                        wallet.getBalance() + ", requested=" + amount);
            }

            BigDecimal newBalance = wallet.getBalance().subtract(amount);
            wallet.setBalance(newBalance);
            Wallet savedWallet = walletRepository.save(wallet);

            // Audit in immutable ledger
            ledgerRepository.save(WalletLedger.builder()
                    .id(UUID.randomUUID())
                    .walletId(walletId)
                    .transactionId(transactionId)
                    .type(WalletLedger.EntryType.DEBIT)
                    .amount(amount)
                    .balanceAfter(newBalance)
                    .description("Transfer debit for tx: " + transactionId)
                    .build());

            log.info("Debited wallet {}: amount={}, remainingBalance={}", walletId, amount, newBalance);
            return savedWallet;

        } catch (OptimisticLockingFailureException ex) {
            log.error("Optimistic lock conflict on debit for wallet: {}", walletId);
            throw new OptimisticLockException("Concurrent modification detected on wallet " + walletId);
        }
    }

    /**
     * Executes credit operation on destination wallet.
     */
    @Transactional
    public Wallet credit(UUID walletId, UUID transactionId, BigDecimal amount) {
        try {
            Wallet wallet = getWalletById(walletId);

            if (wallet.getStatus() != Wallet.WalletStatus.ACTIVE) {
                throw new IllegalStateException("Destination wallet " + walletId + " is not ACTIVE");
            }

            BigDecimal newBalance = wallet.getBalance().add(amount);
            wallet.setBalance(newBalance);
            Wallet savedWallet = walletRepository.save(wallet);

            ledgerRepository.save(WalletLedger.builder()
                    .id(UUID.randomUUID())
                    .walletId(walletId)
                    .transactionId(transactionId)
                    .type(WalletLedger.EntryType.CREDIT)
                    .amount(amount)
                    .balanceAfter(newBalance)
                    .description("Transfer credit for tx: " + transactionId)
                    .build());

            log.info("Credited wallet {}: amount={}, newBalance={}", walletId, amount, newBalance);
            return savedWallet;

        } catch (OptimisticLockingFailureException ex) {
            log.error("Optimistic lock conflict on credit for wallet: {}", walletId);
            throw new OptimisticLockException("Concurrent modification detected on wallet " + walletId);
        }
    }

    /**
     * SAGA COMPENSATING ACTION:
     * Restores debited funds back to the sender if destination credit fails.
     */
    @Transactional
    public Wallet reverseDebit(UUID walletId, UUID transactionId, BigDecimal amount, String reason) {
        Wallet wallet = getWalletById(walletId);
        BigDecimal newBalance = wallet.getBalance().add(amount);
        wallet.setBalance(newBalance);
        Wallet savedWallet = walletRepository.save(wallet);

        ledgerRepository.save(WalletLedger.builder()
                .id(UUID.randomUUID())
                .walletId(walletId)
                .transactionId(transactionId)
                .type(WalletLedger.EntryType.REVERSAL)
                .amount(amount)
                .balanceAfter(newBalance)
                .description("Compensating rollback: " + reason)
                .build());

        log.info("Compensated/Restored wallet {}: amount={}, restoredBalance={}", walletId, amount, newBalance);
        return savedWallet;
    }
}
