package com.payvault.transaction.outbox;

import com.payvault.transaction.entity.OutboxEvent;
import com.payvault.transaction.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Outbox Poller guarantees At-Least-Once delivery of domain and saga events to Apache Kafka.
 * Eliminates Dual-Write problems (database state vs broker event divergence).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPoller {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${payvault.kafka.topics.wallet-debit-command:wallet.debit.command}")
    private String debitCommandTopic;

    @Value("${payvault.kafka.topics.wallet-credit-command:wallet.credit.command}")
    private String creditCommandTopic;

    @Value("${payvault.kafka.topics.wallet-compensate-command:wallet.compensate.command}")
    private String compensateCommandTopic;

    @Value("${payvault.kafka.topics.transaction-events:transaction.events}")
    private String transactionEventsTopic;

    @Scheduled(fixedDelayString = "${payvault.outbox.poller.fixed-delay-ms:1000}")
    @Transactional
    public void pollAndPublish() {
        List<OutboxEvent> pendingEvents = outboxEventRepository.findTopPendingEvents(
                OutboxEvent.EventStatus.PENDING,
                PageRequest.of(0, 50)
        );

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.debug("Outbox poller found {} pending events to dispatch", pendingEvents.size());

        for (OutboxEvent event : pendingEvents) {
            try {
                String topic = resolveTopicForEvent(event.getEventType());
                kafkaTemplate.send(topic, event.getAggregateId(), event.getPayload()).whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Successfully delivered Outbox event [{}] to topic [{}]", event.getId(), topic);
                    } else {
                        log.error("Failed delivering Outbox event [{}] to topic [{}]", event.getId(), topic, ex);
                    }
                });

                event.setStatus(OutboxEvent.EventStatus.PROCESSED);
                event.setProcessedAt(Instant.now());
                outboxEventRepository.save(event);
            } catch (Exception ex) {
                log.error("Error processing outbox event id: {}", event.getId(), ex);
                event.setRetryCount(event.getRetryCount() + 1);
                if (event.getRetryCount() >= 5) {
                    event.setStatus(OutboxEvent.EventStatus.FAILED);
                }
                outboxEventRepository.save(event);
            }
        }
    }

    private String resolveTopicForEvent(String eventType) {
        return switch (eventType) {
            case "DebitWalletCommand" -> debitCommandTopic;
            case "CreditWalletCommand" -> creditCommandTopic;
            case "CompensateDebitCommand" -> compensateCommandTopic;
            default -> transactionEventsTopic;
        };
    }
}
