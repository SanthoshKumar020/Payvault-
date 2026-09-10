package com.payvault.wallet.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.payvault.common.event.SagaEvents.*;
import com.payvault.wallet.entity.Wallet;
import com.payvault.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

/**
 * Kafka Consumer in wallet-service executing Saga commands dispatched by the Orchestrator.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WalletSagaConsumer {

    private final WalletService walletService;
    private final WalletEventProducer eventProducer;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "${payvault.kafka.topics.wallet-debit-command:wallet.debit.command}", groupId = "wallet-service-group")
    public void handleDebitCommand(String payload) {
        log.info("Wallet Service received DebitWalletCommand: {}", payload);
        DebitWalletCommand command = null;
        try {
            command = objectMapper.readValue(payload, DebitWalletCommand.class);
            Wallet updatedWallet = walletService.debit(command.getSourceWalletId(), command.getTransactionId(), command.getAmount());

            WalletDebitedEvent event = WalletDebitedEvent.builder()
                    .transactionId(command.getTransactionId())
                    .sourceWalletId(command.getSourceWalletId())
                    .amount(command.getAmount())
                    .remainingBalance(updatedWallet.getBalance())
                    .timestamp(Instant.now())
                    .build();

            eventProducer.publishEvent(command.getTransactionId().toString(), event);

        } catch (Exception ex) {
            log.error("Debit command failed: {}", ex.getMessage());
            if (command != null) {
                WalletDebitFailedEvent failedEvent = WalletDebitFailedEvent.builder()
                        .transactionId(command.getTransactionId())
                        .sourceWalletId(command.getSourceWalletId())
                        .amount(command.getAmount())
                        .reason(ex.getMessage())
                        .timestamp(Instant.now())
                        .build();
                eventProducer.publishEvent(command.getTransactionId().toString(), failedEvent);
            }
        }
    }

    @KafkaListener(topics = "${payvault.kafka.topics.wallet-credit-command:wallet.credit.command}", groupId = "wallet-service-group")
    public void handleCreditCommand(String payload) {
        log.info("Wallet Service received CreditWalletCommand: {}", payload);
        CreditWalletCommand command = null;
        try {
            command = objectMapper.readValue(payload, CreditWalletCommand.class);
            walletService.credit(command.getDestinationWalletId(), command.getTransactionId(), command.getAmount());

            WalletCreditedEvent event = WalletCreditedEvent.builder()
                    .transactionId(command.getTransactionId())
                    .destinationWalletId(command.getDestinationWalletId())
                    .amount(command.getAmount())
                    .timestamp(Instant.now())
                    .build();

            eventProducer.publishEvent(command.getTransactionId().toString(), event);

        } catch (Exception ex) {
            log.error("Credit command failed: {}", ex.getMessage());
            if (command != null) {
                WalletCreditFailedEvent failedEvent = WalletCreditFailedEvent.builder()
                        .transactionId(command.getTransactionId())
                        .destinationWalletId(command.getDestinationWalletId())
                        .amount(command.getAmount())
                        .reason(ex.getMessage())
                        .timestamp(Instant.now())
                        .build();
                eventProducer.publishEvent(command.getTransactionId().toString(), failedEvent);
            }
        }
    }

    @KafkaListener(topics = "${payvault.kafka.topics.wallet-compensate-command:wallet.compensate.command}", groupId = "wallet-service-group")
    public void handleCompensateCommand(String payload) {
        log.info("Wallet Service received CompensateDebitCommand: {}", payload);
        try {
            CompensateDebitCommand command = objectMapper.readValue(payload, CompensateDebitCommand.class);
            walletService.reverseDebit(command.getSourceWalletId(), command.getTransactionId(), command.getAmount(), command.getReason());

            // Emit compensated status confirmation
            Map<String, Object> confirmation = Map.of(
                    "transactionId", command.getTransactionId().toString(),
                    "sourceWalletId", command.getSourceWalletId().toString(),
                    "compensated", true,
                    "timestamp", Instant.now().toString()
            );
            eventProducer.publishEvent(command.getTransactionId().toString(), confirmation);

        } catch (Exception ex) {
            log.error("Compensating action error", ex);
        }
    }
}
