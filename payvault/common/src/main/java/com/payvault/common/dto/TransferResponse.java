package com.payvault.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Standard response payload returned after initiating or querying a transfer.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferResponse {
    private UUID transactionId;
    private String idempotencyKey;
    private UUID sourceWalletId;
    private UUID destinationWalletId;
    private BigDecimal amount;
    private String currency;
    private TransactionStatus status;
    private String message;
    private String failureReason;
    private Instant timestamp;
}
