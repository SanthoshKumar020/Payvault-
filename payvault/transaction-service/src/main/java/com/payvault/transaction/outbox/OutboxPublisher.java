package com.payvault.transaction.outbox;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.payvault.transaction.entity.OutboxEvent;
import com.payvault.transaction.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Outbox Publisher ensures 100% reliable event dispatching via the Transactional Outbox Pattern.
 * Saves outbox events in the SAME atomic DB transaction as the business entity update.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisher {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    /**
     * Serializes event and commits to outbox table inside current JPA transaction.
     */
    public <T> OutboxEvent publish(String aggregateType, String aggregateId, String eventType, T eventPayload) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(eventPayload);

            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .id(UUID.randomUUID())
                    .aggregateType(aggregateType)
                    .aggregateId(aggregateId)
                    .eventType(eventType)
                    .payload(jsonPayload)
                    .status(OutboxEvent.EventStatus.PENDING)
                    .retryCount(0)
                    .build();

            OutboxEvent saved = outboxEventRepository.save(outboxEvent);
            log.debug("Outbox event created: id={}, type={}", saved.getId(), eventType);
            return saved;
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize outbox event payload", e);
        }
    }
}
