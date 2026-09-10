package com.payvault.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletDto {
    private UUID id;
    private UUID userId;
    private BigDecimal balance;
    private String currency;
    private String status;
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;
}
