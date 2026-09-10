package com.payvault.transaction.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Value("${payvault.kafka.topics.wallet-debit-command:wallet.debit.command}")
    private String debitCommandTopic;

    @Value("${payvault.kafka.topics.wallet-credit-command:wallet.credit.command}")
    private String creditCommandTopic;

    @Value("${payvault.kafka.topics.wallet-compensate-command:wallet.compensate.command}")
    private String compensateCommandTopic;

    @Value("${payvault.kafka.topics.wallet-events:wallet.events}")
    private String walletEventsTopic;

    @Value("${payvault.kafka.topics.transaction-events:transaction.events}")
    private String transactionEventsTopic;

    @Bean
    public NewTopic debitCommandTopic() {
        return TopicBuilder.name(debitCommandTopic).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic creditCommandTopic() {
        return TopicBuilder.name(creditCommandTopic).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic compensateCommandTopic() {
        return TopicBuilder.name(compensateCommandTopic).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic walletEventsTopic() {
        return TopicBuilder.name(walletEventsTopic).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic transactionEventsTopic() {
        return TopicBuilder.name(transactionEventsTopic).partitions(3).replicas(1).build();
    }
}
