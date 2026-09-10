package com.payvault.transaction.dto;

import com.payvault.common.dto.TransactionStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class TransferRequest {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Initiate {
        @NotNull(message = "Source wallet ID is required")
        private UUID sourceWalletId;

        @NotNull(message = "Destination wallet ID is required")
        private UUID destinationWalletId;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Transfer amount must be at least 0.01")
        private BigDecimal amount;

        @Builder.Default
        private String currency = "USD";
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransferResponse {
        private UUID transactionId;
        private String idempotencyKey;
        private UUID sourceWalletId;
        private UUID destinationWalletId;
        private BigDecimal amount;
        private String currency;
        private TransactionStatus status;
        private String message;
        private Instant timestamp;
    }
}
