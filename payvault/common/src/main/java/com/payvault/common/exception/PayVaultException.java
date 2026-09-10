package com.payvault.common.exception;

import org.springframework.http.HttpStatus;

public class PayVaultException extends RuntimeException {
    private final HttpStatus status;

    public PayVaultException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static class InsufficientBalanceException extends PayVaultException {
        public InsufficientBalanceException(String message) {
            super(message, HttpStatus.BAD_REQUEST);
        }
    }

    public static class ResourceNotFoundException extends PayVaultException {
        public ResourceNotFoundException(String message) {
            super(message, HttpStatus.NOT_FOUND);
        }
    }

    public static class IdempotencyConflictException extends PayVaultException {
        public IdempotencyConflictException(String message) {
            super(message, HttpStatus.CONFLICT);
        }
    }

    public static class OptimisticLockException extends PayVaultException {
        public OptimisticLockException(String message) {
            super(message, HttpStatus.CONFLICT);
        }
    }

    public static class WalletSuspendedException extends PayVaultException {
        public WalletSuspendedException(String message) {
            super(message, HttpStatus.BAD_REQUEST);
        }
    }

    public static class InvalidTransactionStateException extends PayVaultException {
        public InvalidTransactionStateException(String message) {
            super(message, HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    public static class UnauthorizedException extends PayVaultException {
        public UnauthorizedException(String message) {
            super(message, HttpStatus.UNAUTHORIZED);
        }
    }

    public static class BadRequestException extends PayVaultException {
        public BadRequestException(String message) {
            super(message, HttpStatus.BAD_REQUEST);
        }
    }
}
