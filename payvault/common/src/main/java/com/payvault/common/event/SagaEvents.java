package com.payvault.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class SagaEvents {

    /**
     * Orchestrator Command: Instructs wallet-service to debit the sender
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DebitWalletCommand {
        private UUID transactionId;
        private UUID sourceWalletId;
        private BigDecimal amount;
        private String currency;
        private String idempotencyKey;
    }

    /**
     * Reply Event: Emitted by wallet-service upon successful debit
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalletDebitedEvent {
        private UUID transactionId;
        private UUID sourceWalletId;
        private BigDecimal amount;
        private BigDecimal remainingBalance;
        private Instant timestamp;
    }

    /**
     * Reply Event: Emitted by wallet-service when debit fails (e.g., insufficient funds)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalletDebitFailedEvent {
        private UUID transactionId;
        private UUID sourceWalletId;
        private BigDecimal amount;
        private String reason;
        private Instant timestamp;
    }

    /**
     * Orchestrator Command: Instructs wallet-service to credit the destination
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreditWalletCommand {
        private UUID transactionId;
        private UUID destinationWalletId;
        private BigDecimal amount;
        private String currency;
    }

    /**
     * Reply Event: Emitted by wallet-service upon successful credit
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalletCreditedEvent {
        private UUID transactionId;
        private UUID destinationWalletId;
        private BigDecimal amount;
        private Instant timestamp;
    }

    /**
     * Reply Event: Emitted by wallet-service when credit fails (e.g., destination wallet inactive)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalletCreditFailedEvent {
        private UUID transactionId;
        private UUID destinationWalletId;
        private BigDecimal amount;
        private String reason;
        private Instant timestamp;
    }

    /**
     * Compensating Command: Reverses the debit if downstream step failed
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompensateDebitCommand {
        private UUID transactionId;
        private UUID sourceWalletId;
        private BigDecimal amount;
        private String reason;
    }

    /**
     * Reply Event: Emitted by wallet-service when compensating debit reversal completes
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalletCompensatedEvent {
        private UUID transactionId;
        private UUID sourceWalletId;
        private BigDecimal refundedAmount;
        private boolean compensated;
        private Instant timestamp;
    }

    /**
     * Final Broadcast Event: Notifies notification-service and audit listeners
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionCompletedEvent {
        private UUID transactionId;
        private UUID sourceWalletId;
        private UUID destinationWalletId;
        private BigDecimal amount;
        private String currency;
        private String userEmail;
        private Instant completedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionFailedEvent {
        private UUID transactionId;
        private UUID sourceWalletId;
        private BigDecimal amount;
        private String failureReason;
        private String userEmail;
        private Instant failedAt;
    }
}
