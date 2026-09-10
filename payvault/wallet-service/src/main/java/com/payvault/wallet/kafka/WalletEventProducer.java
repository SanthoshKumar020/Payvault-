package com.payvault.wallet.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WalletEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${payvault.kafka.topics.wallet-events:wallet.events}")
    private String walletEventsTopic;

    public <T> void publishEvent(String key, T event) {
        try {
            String json = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(walletEventsTopic, key, json);
            log.info("Published wallet event to topic [{}]: {}", walletEventsTopic, json);
        } catch (Exception e) {
            log.error("Failed to publish event to topic [{}]", walletEventsTopic, e);
        }
    }
}
