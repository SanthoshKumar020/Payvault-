package com.payvault.transaction.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.payvault.common.exception.PayVaultException;
import com.payvault.transaction.dto.TransferRequest.TransferResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

/**
 * Enterprise Idempotency Service using Redis.
 *
 * Implements a 2-phase idempotency protocol:
 * 1. Lock phase: Atomic SETNX creates an "IN_FLIGHT" lock with a 60-second TTL to avoid distributed race conditions.
 * 2. Completion phase: Once the transaction is persisted, the key is updated with the serialized TransferResponse
 *    and an extended 24-hour TTL.
 *
 * Subsequent requests with the same key will either:
 * - Return the previously cached response (if COMPLETED), ensuring exactly-once business semantics.
 * - Throw an IdempotencyConflictException (if still IN_FLIGHT).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IdempotencyService {

    private static final String IDEMPOTENCY_KEY_PREFIX = "payvault:idempotency:";
    private static final String IN_FLIGHT_MARKER = "IN_FLIGHT";
    private static final Duration LOCK_TTL = Duration.ofSeconds(60);
    private static final Duration COMPLETED_TTL = Duration.ofHours(24);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Attempts to acquire an idempotency lock.
     *
     * @param idempotencyKey The unique client-supplied header value.
     * @return Optional.empty() if successfully locked and should proceed;
     *         Optional of TransferResponse if previously completed.
     * @throws PayVaultException.IdempotencyConflictException if another request with same key is currently running.
     */
    public Optional<TransferResponse> acquireLockOrGetCached(String idempotencyKey) {
        String redisKey = IDEMPOTENCY_KEY_PREFIX + idempotencyKey;

        // Try atomic SETNX with short lock TTL
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(redisKey, IN_FLIGHT_MARKER, LOCK_TTL);

        if (Boolean.TRUE.equals(acquired)) {
            log.info("Acquired fresh idempotency lock for key: {}", idempotencyKey);
            return Optional.empty(); // Proceed with new transaction
        }

        // Key already exists, inspect current value
        String existingValue = redisTemplate.opsForValue().get(redisKey);
        if (IN_FLIGHT_MARKER.equals(existingValue)) {
            log.warn("Concurrent duplicate request detected for in-flight key: {}", idempotencyKey);
            throw new PayVaultException.IdempotencyConflictException(
                    "A transfer request with idempotency key '" + idempotencyKey + "' is already in progress.");
        }

        if (existingValue != null) {
            try {
                log.info("Returning cached response for completed idempotency key: {}", idempotencyKey);
                TransferResponse cachedResponse = objectMapper.readValue(existingValue, TransferResponse.class);
                return Optional.of(cachedResponse);
            } catch (JsonProcessingException e) {
                log.error("Failed to deserialize cached idempotency response for key: {}", idempotencyKey, e);
            }
        }

        return Optional.empty();
    }

    /**
     * Records the final response in Redis to fulfill future duplicate requests.
     */
    public void recordCompletedResponse(String idempotencyKey, TransferResponse response) {
        String redisKey = IDEMPOTENCY_KEY_PREFIX + idempotencyKey;
        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(redisKey, json, COMPLETED_TTL);
            log.info("Recorded idempotency response for key: {} (TTL 24h)", idempotencyKey);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize TransferResponse for key: {}", idempotencyKey, e);
        }
    }

    /**
     * Clears the lock in case of an early system/validation failure before DB commit.
     */
    public void releaseLockOnFailure(String idempotencyKey) {
        String redisKey = IDEMPOTENCY_KEY_PREFIX + idempotencyKey;
        redisTemplate.delete(redisKey);
        log.info("Released idempotency lock on failure for key: {}", idempotencyKey);
    }
}
