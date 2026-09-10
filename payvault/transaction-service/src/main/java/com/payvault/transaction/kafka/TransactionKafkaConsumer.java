package com.payvault.transaction.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.payvault.common.event.SagaEvents.*;
import com.payvault.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Kafka Consumer for Saga Reply Events from wallet-service.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionKafkaConsumer {

    private final TransactionService transactionService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "${payvault.kafka.topics.wallet-events:wallet.events}", groupId = "transaction-service-group")
    public void handleWalletEvents(String payload) {
        log.info("Received wallet event payload: {}", payload);
        try {
            JsonNode rootNode = objectMapper.readTree(payload);

            if (rootNode.has("remainingBalance")) {
                // WalletDebitedEvent
                WalletDebitedEvent event = objectMapper.readValue(payload, WalletDebitedEvent.class);
                transactionService.processWalletDebited(event);
            } else if (rootNode.has("reason") && rootNode.has("sourceWalletId") && !rootNode.has("compensated")) {
                // WalletDebitFailedEvent
                WalletDebitFailedEvent event = objectMapper.readValue(payload, WalletDebitFailedEvent.class);
                transactionService.processWalletDebitFailed(event);
            } else if (rootNode.has("destinationWalletId") && !rootNode.has("reason")) {
                // WalletCreditedEvent
                WalletCreditedEvent event = objectMapper.readValue(payload, WalletCreditedEvent.class);
                transactionService.processWalletCredited(event);
            } else if (rootNode.has("destinationWalletId") && rootNode.has("reason")) {
                // WalletCreditFailedEvent
                WalletCreditFailedEvent event = objectMapper.readValue(payload, WalletCreditFailedEvent.class);
                transactionService.processWalletCreditFailed(event);
            } else if (rootNode.has("compensated") && rootNode.get("compensated").asBoolean()) {
                // Compensated event
                UUID txId = UUID.fromString(rootNode.get("transactionId").asText());
                transactionService.processDebitCompensated(txId);
            } else {
                log.warn("Unknown event format received: {}", payload);
            }
        } catch (Exception e) {
            log.error("Failed to process incoming wallet event", e);
        }
    }
}
