package com.payvault.common.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Data Transfer Object representing a transfer initiation payload across services.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferRequest {

    @NotNull(message = "Source wallet ID is required")
    private UUID sourceWalletId;

    @NotNull(message = "Destination wallet ID is required")
    private UUID destinationWalletId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Transfer amount must be at least 0.01")
    private BigDecimal amount;

    @Builder.Default
    private String currency = "USD";

    private String description;

    /**
     * Nested class for backwards-compatibility with TransactionService initiate payload.
     */
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

        private String description;
    }
}
