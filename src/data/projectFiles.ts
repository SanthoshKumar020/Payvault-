import { ProjectFile } from '../types';

export const PROJECT_FILES: ProjectFile[] = [
  {
    path: 'pom.xml',
    module: 'root',
    language: 'xml',
    description: 'Parent Maven POM with Spring Boot 3.3.4, Spring Cloud 2023.0.3, Resilience4j, and multi-module dependencies',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.payvault</groupId>
    <artifactId>payvault-parent</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>

    <name>PayVault :: Digital Wallet Payment System</name>
    <description>Enterprise distributed wallet system featuring Saga Orchestration, Outbox Pattern, Redis Idempotency, and Kafka</description>

    <modules>
        <module>common</module>
        <module>user-service</module>
        <module>wallet-service</module>
        <module>transaction-service</module>
        <module>notification-service</module>
    </modules>

    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        
        <!-- Versions according to user requirements -->
        <spring-boot.version>3.3.4</spring-boot.version>
        <spring-cloud.version>2023.0.3</spring-cloud.version>
        <resilience4j.version>2.2.0</resilience4j.version>
        <jjwt.version>0.12.6</jjwt.version>
        <lombok.version>1.18.34</lombok.version>
        <mapstruct.version>1.6.2</mapstruct.version>
        <testcontainers.version>1.20.1</testcontainers.version>
        <flyway.version>10.18.0</flyway.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>\${spring-boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>\${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.testcontainers</groupId>
                <artifactId>testcontainers-bom</artifactId>
                <version>\${testcontainers.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>com.payvault</groupId>
                <artifactId>common</artifactId>
                <version>\${project.version}</version>
            </dependency>
            <dependency>
                <groupId>io.jsonwebtoken</groupId>
                <artifactId>jjwt-api</artifactId>
                <version>\${jjwt.version}</version>
            </dependency>
            <dependency>
                <groupId>io.jsonwebtoken</groupId>
                <artifactId>jjwt-impl</artifactId>
                <version>\${jjwt.version}</version>
                <scope>runtime</scope>
            </dependency>
            <dependency>
                <groupId>io.jsonwebtoken</groupId>
                <artifactId>jjwt-jackson</artifactId>
                <version>\${jjwt.version}</version>
                <scope>runtime</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>\${lombok.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>`
  },
  {
    path: 'docker-compose.yml',
    module: 'root',
    language: 'yaml',
    description: 'Starts PostgreSQL, Redis, Kafka, Zookeeper, and all 4 microservices with health checks',
    content: `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: payvault-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    ports:
      - "5432:5432"
    volumes:
      - ./init-databases.sql:/docker-entrypoint-initdb.d/init-databases.sql
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - payvault-network

  redis:
    image: redis:7.2-alpine
    container_name: payvault-redis
    ports:
      - "6379:6379"
    command: ["redis-server", "--appendonly", "yes"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - payvault-network

  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.1
    container_name: payvault-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    networks:
      - payvault-network

  kafka:
    image: confluentinc/cp-kafka:7.6.1
    container_name: payvault-kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
      - "29092:29092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'
    healthcheck:
      test: ["CMD-SHELL", "nc -z localhost 29092 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - payvault-network

  user-service:
    build:
      context: ./user-service
      dockerfile: Dockerfile
    container_name: payvault-user-service
    ports:
      - "8081:8081"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/payvault_user
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: postgres
      JWT_SECRET: payvault-super-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - payvault-network

  wallet-service:
    build:
      context: ./wallet-service
      dockerfile: Dockerfile
    container_name: payvault-wallet-service
    ports:
      - "8082:8082"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/payvault_wallet
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: postgres
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:29092
    depends_on:
      postgres:
        condition: service_healthy
      kafka:
        condition: service_healthy
    networks:
      - payvault-network

  transaction-service:
    build:
      context: ./transaction-service
      dockerfile: Dockerfile
    container_name: payvault-transaction-service
    ports:
      - "8083:8083"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/payvault_transaction
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: postgres
      SPRING_REDIS_HOST: redis
      SPRING_REDIS_PORT: 6379
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:29092
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      kafka:
        condition: service_healthy
    networks:
      - payvault-network

  notification-service:
    build:
      context: ./notification-service
      dockerfile: Dockerfile
    container_name: payvault-notification-service
    ports:
      - "8084:8084"
    environment:
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:29092
    depends_on:
      kafka:
        condition: service_healthy
    networks:
      - payvault-network

volumes:
  postgres_data:

networks:
  payvault-network:
    driver: bridge`
  },
  {
    path: 'transaction-service/src/main/java/com/payvault/transaction/service/TransactionService.java',
    module: 'transaction-service',
    language: 'java',
    description: 'Core Saga Orchestrator handling transfer initiation, outbox enqueue, step advancing, and compensating rollbacks',
    content: `package com.payvault.transaction.service;

import com.payvault.common.dto.TransactionStatus;
import com.payvault.common.event.SagaEvents.*;
import com.payvault.common.exception.PayVaultException.ResourceNotFoundException;
import com.payvault.transaction.dto.TransferRequest.Initiate;
import com.payvault.transaction.dto.TransferRequest.TransferResponse;
import com.payvault.transaction.entity.Transaction;
import com.payvault.transaction.outbox.OutboxPublisher;
import com.payvault.transaction.repository.TransactionRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Core Saga Orchestrator for Distributed Wallet Transfers.
 *
 * SAGA STEP PROGRESSION:
 * 1. [INITIATE]: Atomically creates Transaction record and writes DebitWalletCommand to Outbox.
 * 2. [DEBIT COMPLETED]: On WalletDebitedEvent, transitions status to DEBIT_SUCCESS, writes CreditWalletCommand to Outbox.
 * 3. [DEBIT FAILED]: On WalletDebitFailedEvent (e.g., insufficient balance), marks transaction FAILED; no rollback required.
 * 4. [CREDIT COMPLETED]: On WalletCreditedEvent, marks transaction COMPLETED; publishes TransactionCompletedEvent.
 * 5. [CREDIT FAILED]: On WalletCreditFailedEvent, triggers COMPENSATION: writes CompensateDebitCommand to Outbox.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final OutboxPublisher outboxPublisher;
    private final IdempotencyService idempotencyService;

    @Transactional
    @CircuitBreaker(name = "walletService", fallbackMethod = "initiateTransferFallback")
    @RateLimiter(name = "transferApi")
    public TransferResponse initiateTransfer(Initiate request, String idempotencyKey) {
        log.info("Initiating transfer request with idempotency key: {}", idempotencyKey);

        // 1. Check idempotency in Redis (Atomic SETNX)
        Optional<TransferResponse> cached = idempotencyService.acquireLockOrGetCached(idempotencyKey);
        if (cached.isPresent()) {
            return cached.get();
        }

        UUID transactionId = UUID.randomUUID();

        // 2. Persist transaction entity (local ACID transaction)
        Transaction transaction = Transaction.builder()
                .id(transactionId)
                .idempotencyKey(idempotencyKey)
                .sourceWalletId(request.getSourceWalletId())
                .destinationWalletId(request.getDestinationWalletId())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status(TransactionStatus.INITIATED)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        transactionRepository.save(transaction);

        // 3. Saga Step 1: Enqueue DebitWalletCommand via Transactional Outbox
        DebitWalletCommand debitCommand = DebitWalletCommand.builder()
                .transactionId(transactionId)
                .sourceWalletId(request.getSourceWalletId())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .idempotencyKey(idempotencyKey)
                .build();

        outboxPublisher.publish("Transaction", transactionId.toString(), "DebitWalletCommand", debitCommand);

        TransferResponse response = TransferResponse.builder()
                .transactionId(transactionId)
                .idempotencyKey(idempotencyKey)
                .sourceWalletId(request.getSourceWalletId())
                .destinationWalletId(request.getDestinationWalletId())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status(TransactionStatus.INITIATED)
                .message("Transfer successfully initiated. Processing Saga workflow asynchronously.")
                .timestamp(Instant.now())
                .build();

        // 4. Cache response in Redis for subsequent duplicate calls
        idempotencyService.recordCompletedResponse(idempotencyKey, response);

        return response;
    }

    public TransferResponse initiateTransferFallback(Initiate request, String idempotencyKey, Throwable t) {
        log.error("Circuit breaker tripped for key {}: {}", idempotencyKey, t.getMessage());
        idempotencyService.releaseLockOnFailure(idempotencyKey);
        return TransferResponse.builder()
                .idempotencyKey(idempotencyKey)
                .status(TransactionStatus.FAILED)
                .message("Transfer temporarily unavailable: " + t.getMessage())
                .build();
    }

    @Transactional
    public void processWalletDebited(WalletDebitedEvent event) {
        Transaction tx = getTransaction(event.getTransactionId());
        tx.setStatus(TransactionStatus.DEBIT_SUCCESS);
        transactionRepository.save(tx);

        CreditWalletCommand creditCmd = CreditWalletCommand.builder()
                .transactionId(tx.getId())
                .destinationWalletId(tx.getDestinationWalletId())
                .amount(tx.getAmount())
                .currency(tx.getCurrency())
                .build();

        outboxPublisher.publish("Transaction", tx.getId().toString(), "CreditWalletCommand", creditCmd);
    }

    @Transactional
    public void processWalletDebitFailed(WalletDebitFailedEvent event) {
        Transaction tx = getTransaction(event.getTransactionId());
        tx.setStatus(TransactionStatus.FAILED);
        tx.setFailureReason(event.getReason());
        transactionRepository.save(tx);

        outboxPublisher.publish("Transaction", tx.getId().toString(), "TransactionFailedEvent",
                TransactionFailedEvent.builder()
                        .transactionId(tx.getId())
                        .sourceWalletId(tx.getSourceWalletId())
                        .amount(tx.getAmount())
                        .failureReason(event.getReason())
                        .build());
    }

    @Transactional
    public void processWalletCredited(WalletCreditedEvent event) {
        Transaction tx = getTransaction(event.getTransactionId());
        tx.setStatus(TransactionStatus.COMPLETED);
        transactionRepository.save(tx);

        outboxPublisher.publish("Transaction", tx.getId().toString(), "TransactionCompletedEvent",
                TransactionCompletedEvent.builder()
                        .transactionId(tx.getId())
                        .sourceWalletId(tx.getSourceWalletId())
                        .destinationWalletId(tx.getDestinationWalletId())
                        .amount(tx.getAmount())
                        .completedAt(Instant.now())
                        .build());
    }

    @Transactional
    public void processWalletCreditFailed(WalletCreditFailedEvent event) {
        Transaction tx = getTransaction(event.getTransactionId());
        tx.setStatus(TransactionStatus.COMPENSATING);
        tx.setFailureReason("Credit step failed: " + event.getReason());
        transactionRepository.save(tx);

        // Compensating Rollback: Refund source wallet
        outboxPublisher.publish("Transaction", tx.getId().toString(), "CompensateDebitCommand",
                CompensateDebitCommand.builder()
                        .transactionId(tx.getId())
                        .sourceWalletId(tx.getSourceWalletId())
                        .amount(tx.getAmount())
                        .reason("Compensating transfer failure: " + event.getReason())
                        .build());
    }

    @Transactional
    public void processDebitCompensated(UUID transactionId) {
        Transaction tx = getTransaction(transactionId);
        tx.setStatus(TransactionStatus.COMPENSATED);
        transactionRepository.save(tx);
    }

    private Transaction getTransaction(UUID transactionId) {
        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));
    }
}`
  },
  {
    path: 'transaction-service/src/main/java/com/payvault/transaction/service/IdempotencyService.java',
    module: 'transaction-service',
    language: 'java',
    description: 'Redis 2-phase idempotency protocol (SETNX with 60s lock TTL, 24h cached completed response)',
    content: `package com.payvault.transaction.service;

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

    public void recordCompletedResponse(String idempotencyKey, TransferResponse response) {
        String redisKey = IDEMPOTENCY_KEY_PREFIX + idempotencyKey;
        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(redisKey, json, COMPLETED_TTL);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize TransferResponse for key: {}", idempotencyKey, e);
        }
    }

    public void releaseLockOnFailure(String idempotencyKey) {
        String redisKey = IDEMPOTENCY_KEY_PREFIX + idempotencyKey;
        redisTemplate.delete(redisKey);
    }
}`
  },
  {
    path: 'transaction-service/src/main/java/com/payvault/transaction/outbox/OutboxPoller.java',
    module: 'transaction-service',
    language: 'java',
    description: 'Transactional Outbox Poller reading pending events from PostgreSQL and dispatching to Kafka with at-least-once delivery',
    content: `package com.payvault.transaction.outbox;

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

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPoller {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("\${payvault.kafka.topics.wallet-debit-command:wallet.debit.command}")
    private String debitCommandTopic;

    @Value("\${payvault.kafka.topics.wallet-credit-command:wallet.credit.command}")
    private String creditCommandTopic;

    @Value("\${payvault.kafka.topics.wallet-compensate-command:wallet.compensate.command}")
    private String compensateCommandTopic;

    @Value("\${payvault.kafka.topics.transaction-events:transaction.events}")
    private String transactionEventsTopic;

    @Scheduled(fixedDelayString = "\${payvault.outbox.poller.fixed-delay-ms:1000}")
    @Transactional
    public void pollAndPublish() {
        List<OutboxEvent> pendingEvents = outboxEventRepository.findTopPendingEvents(
                OutboxEvent.EventStatus.PENDING,
                PageRequest.of(0, 50)
        );

        if (pendingEvents.isEmpty()) return;

        for (OutboxEvent event : pendingEvents) {
            try {
                String topic = resolveTopicForEvent(event.getEventType());
                kafkaTemplate.send(topic, event.getAggregateId(), event.getPayload());

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
}`
  },
  {
    path: 'wallet-service/src/main/java/com/payvault/wallet/entity/Wallet.java',
    module: 'wallet-service',
    language: 'java',
    description: 'Wallet entity with JPA @Version optimistic locking preventing race conditions on concurrent balance modifications',
    content: `package com.payvault.wallet.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wallets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Wallet {

    public enum WalletStatus {
        ACTIVE,
        LOCKED,
        SUSPENDED
    }

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal balance;

    @Column(nullable = false, length = 3)
    private String currency;

    /**
     * Optimistic Locking Version attribute.
     * Guarantees prevention of lost updates when multiple transactions hit the same wallet concurrently.
     */
    @Version
    @Column(nullable = false)
    private Long version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private WalletStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}`
  },
  {
    path: 'wallet-service/src/main/java/com/payvault/wallet/service/WalletService.java',
    module: 'wallet-service',
    language: 'java',
    description: 'Wallet operations (debit, credit, reverseDebit) with optimistic locking exception translation and ledger audit entries',
    content: `package com.payvault.wallet.service;

import com.payvault.common.exception.PayVaultException.*;
import com.payvault.wallet.entity.Wallet;
import com.payvault.wallet.entity.WalletLedger;
import com.payvault.wallet.repository.WalletLedgerRepository;
import com.payvault.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletLedgerRepository ledgerRepository;

    @Transactional
    public Wallet debit(UUID walletId, UUID transactionId, BigDecimal amount) {
        try {
            Wallet wallet = walletRepository.findById(walletId)
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet not found: " + walletId));

            if (wallet.getBalance().compareTo(amount) < 0) {
                throw new InsufficientBalanceException("Insufficient balance: current=" + wallet.getBalance() + ", requested=" + amount);
            }

            BigDecimal newBalance = wallet.getBalance().subtract(amount);
            wallet.setBalance(newBalance);
            Wallet saved = walletRepository.save(wallet);

            ledgerRepository.save(WalletLedger.builder()
                    .id(UUID.randomUUID())
                    .walletId(walletId)
                    .transactionId(transactionId)
                    .type(WalletLedger.EntryType.DEBIT)
                    .amount(amount)
                    .balanceAfter(newBalance)
                    .build());

            return saved;
        } catch (OptimisticLockingFailureException ex) {
            throw new OptimisticLockException("Concurrent modification on wallet " + walletId);
        }
    }

    @Transactional
    public Wallet credit(UUID walletId, UUID transactionId, BigDecimal amount) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found: " + walletId));

        BigDecimal newBalance = wallet.getBalance().add(amount);
        wallet.setBalance(newBalance);
        Wallet saved = walletRepository.save(wallet);

        ledgerRepository.save(WalletLedger.builder()
                .id(UUID.randomUUID())
                .walletId(walletId)
                .transactionId(transactionId)
                .type(WalletLedger.EntryType.CREDIT)
                .amount(amount)
                .balanceAfter(newBalance)
                .build());

        return saved;
    }

    @Transactional
    public Wallet reverseDebit(UUID walletId, UUID transactionId, BigDecimal amount, String reason) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found: " + walletId));

        BigDecimal newBalance = wallet.getBalance().add(amount);
        wallet.setBalance(newBalance);
        Wallet saved = walletRepository.save(wallet);

        ledgerRepository.save(WalletLedger.builder()
                .id(UUID.randomUUID())
                .walletId(walletId)
                .transactionId(transactionId)
                .type(WalletLedger.EntryType.REVERSAL)
                .amount(amount)
                .balanceAfter(newBalance)
                .description("Compensating rollback: " + reason)
                .build());

        return saved;
    }
}`
  },
  {
    path: 'user-service/src/main/java/com/payvault/user/service/UserService.java',
    module: 'user-service',
    language: 'java',
    description: 'User registration with BCrypt hashing, credential validation, and JWT token issuance',
    content: `package com.payvault.user.service;

import com.payvault.common.exception.PayVaultException.ResourceNotFoundException;
import com.payvault.user.entity.User;
import com.payvault.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public User register(String username, String email, String password, String fullName) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already taken: " + username);
        }
        User user = User.builder()
                .id(UUID.randomUUID())
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .fullName(fullName)
                .role("USER")
                .status("ACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        return userRepository.save(user);
    }

    public String authenticate(String username, String rawPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid username or password"));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        return jwtService.generateToken(user);
    }
}`
  },
  {
    path: 'notification-service/src/main/java/com/payvault/notification/kafka/NotificationKafkaConsumer.java',
    module: 'notification-service',
    language: 'java',
    description: 'Listens to transaction.events Kafka topic and triggers simulated customer notifications',
    content: `package com.payvault.notification.kafka;

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

    @KafkaListener(topics = "\${payvault.kafka.topics.transaction-events:transaction.events}", groupId = "notification-service-group")
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
            }
        } catch (Exception e) {
            log.error("Failed to parse event in notification consumer", e);
        }
    }
}`
  }
];
