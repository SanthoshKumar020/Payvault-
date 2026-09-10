package com.payvault.common.dto;

public enum TransactionStatus {
    INITIATED,
    PENDING,
    DEBIT_SUCCESS,
    CREDIT_SUCCESS,
    COMPLETED,
    FAILED,
    COMPENSATING,
    COMPENSATED
}
