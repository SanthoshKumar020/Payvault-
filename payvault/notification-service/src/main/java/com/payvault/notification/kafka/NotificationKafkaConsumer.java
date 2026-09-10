package com.payvault.notification.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.payvault.common.event.SagaEvents.TransactionCompletedEvent;
import com.payvault.common.event.SagaEvents.TransactionFailedEvent;
import com.payvault.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationKafkaConsumer {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "${payvault.kafka.topics.transaction-events:transaction.events}", groupId = "notification-service-group")
    public void consumeTransactionEvent(String payload) {
        log.info("Notification service received event payload: {}", payload);
        try {
            JsonNode node = objectMapper.readTree(payload);

            if (node.has("failureReason")) {
                TransactionFailedEvent failedEvent = objectMapper.readValue(payload, TransactionFailedEvent.class);
                notificationService.sendTransactionFailedNotification(failedEvent);
            } else if (node.has("completedAt")) {
                TransactionCompletedEvent completedEvent = objectMapper.readValue(payload, TransactionCompletedEvent.class);
                notificationService.sendTransactionCompletedNotification(completedEvent);
            } else {
                log.debug("Ignored intermediate transaction event: {}", payload);
            }
        } catch (Exception e) {
            log.error("Failed to parse event in notification consumer", e);
        }
    }
}
