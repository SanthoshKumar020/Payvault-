package com.payvault.wallet.controller;

import com.payvault.wallet.entity.Wallet;
import com.payvault.wallet.entity.WalletLedger;
import com.payvault.wallet.repository.WalletLedgerRepository;
import com.payvault.wallet.service.WalletService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
@Slf4j
public class WalletController {

    private final WalletService walletService;
    private final WalletLedgerRepository ledgerRepository;

    @Data
    public static class CreateWalletRequest {
        private UUID userId;
        private String currency;
    }

    @Data
    public static class DepositRequest {
        private BigDecimal amount;
    }

    @PostMapping
    public ResponseEntity<Wallet> createWallet(@RequestBody CreateWalletRequest request) {
        Wallet wallet = walletService.createWallet(request.getUserId(), request.getCurrency());
        return ResponseEntity.status(HttpStatus.CREATED).body(wallet);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Wallet> getWallet(@PathVariable UUID id) {
        return ResponseEntity.ok(walletService.getWalletById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Wallet> getWalletByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(walletService.getWalletByUserId(userId));
    }

    /**
     * Helper endpoint to seed/deposit initial funds into a test wallet
     */
    @PostMapping("/{id}/deposit")
    public ResponseEntity<Wallet> depositFunds(@PathVariable UUID id, @RequestBody DepositRequest request) {
        Wallet updated = walletService.credit(id, UUID.randomUUID(), request.getAmount());
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}/ledger")
    public ResponseEntity<List<WalletLedger>> getWalletLedger(@PathVariable UUID id) {
        return ResponseEntity.ok(ledgerRepository.findByWalletIdOrderByCreatedAtDesc(id));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "wallet-service",
                "locking", "Optimistic Locking with JPA @Version"
        ));
    }
}
