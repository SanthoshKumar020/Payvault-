import React, { useState } from 'react';
import { Server, Database, Radio, Shield, Key, ArrowRight, Check, AlertTriangle, RefreshCw, Cpu, Layers } from 'lucide-react';

interface ComponentDetail {
  id: string;
  name: string;
  type: string;
  port?: string;
  description: string;
  responsibilities: string[];
  keyTechnologies: string[];
  kafkaTopics?: string[];
  dbName?: string;
}

const COMPONENTS_DATA: Record<string, ComponentDetail> = {
  'transaction-service': {
    id: 'transaction-service',
    name: 'transaction-service',
    type: 'Saga Orchestrator & API Gateway',
    port: '8083',
    description: 'Central brain of PayVault. Coordinates end-to-end money transfers using Saga Orchestration and Transactional Outbox Pattern to eliminate distributed dual-write inconsistencies.',
    responsibilities: [
      'Validates transfer initiation requests and enforces client Idempotency-Key via Redis',
      'Persists initial Transaction state (INITIATED) and OutboxEvent atomically inside local PostgreSQL transaction',
      'OutboxPoller background thread reads pending outbox entries and publishes to Kafka with At-Least-Once delivery',
      'Advances Saga state machine based on reply events from wallet-service (DEBIT_SUCCESS -> CREDIT_SUCCESS -> COMPLETED)',
      'Detects failure events and triggers compensating transactions (CompensateDebitCommand) to refund sender',
      'Protected by Resilience4j Circuit Breaker (sliding window = 10) and Rate Limiter'
    ],
    keyTechnologies: ['Spring Boot 3.3.4', 'Spring Data JPA', 'Redis StringRedisTemplate', 'KafkaTemplate', 'Resilience4j', 'Flyway'],
    kafkaTopics: ['wallet.debit.command', 'wallet.credit.command', 'wallet.compensate.command', 'wallet.events', 'transaction.events'],
    dbName: 'payvault_transaction (transactions, outbox_events)'
  },
  'wallet-service': {
    id: 'wallet-service',
    name: 'wallet-service',
    type: 'Core Account & Balance Ledger',
    port: '8082',
    description: 'Maintains wallet balances and audit ledgers. Employs JPA @Version optimistic locking to completely prevent race conditions and lost update anomalies under high concurrent load.',
    responsibilities: [
      'Creates user wallets with currency and zero balance',
      'Executes atomic debit with balance sufficiency checks and immutable ledger entry',
      'Executes credit operations on destination wallets',
      'Executes Saga compensating refunds (reverseDebit) when downstream credits fail',
      'Kafka listeners consume saga commands and emit reply events (WalletDebitedEvent, WalletDebitFailedEvent, etc.)'
    ],
    keyTechnologies: ['Spring Boot 3.3.4', 'Spring Data JPA with @Version', 'PostgreSQL', 'Spring Kafka', 'Flyway'],
    kafkaTopics: ['wallet.debit.command', 'wallet.credit.command', 'wallet.compensate.command', 'wallet.events'],
    dbName: 'payvault_wallet (wallets, wallet_ledger)'
  },
  'user-service': {
    id: 'user-service',
    name: 'user-service',
    type: 'Authentication & Identity',
    port: '8081',
    description: 'Manages user registration, credential authentication with BCrypt hashing, and issues signed HMAC-SHA256 JWT tokens.',
    responsibilities: [
      'User signup with uniqueness validation on username and email',
      'Secure login generating stateless JWT tokens with role claims',
      'User profile queries and management'
    ],
    keyTechnologies: ['Spring Security 6', 'JJWT 0.12.6', 'BCrypt', 'Spring Data JPA', 'PostgreSQL', 'Flyway'],
    dbName: 'payvault_user (users)'
  },
  'notification-service': {
    id: 'notification-service',
    name: 'notification-service',
    type: 'Event-Driven Dispatcher',
    port: '8084',
    description: 'Consumes business completion and failure events from the transaction.events topic and triggers asynchronous customer notifications.',
    responsibilities: [
      'Listens to transaction.events Kafka topic',
      'Dispatches transactional email / SMS notifications for completed payments',
      'Dispatches alert notifications when transfers fail or are compensated with refunds'
    ],
    keyTechnologies: ['Spring Boot 3.3.4', 'Spring Kafka Listener', 'Micrometer Prometheus'],
    kafkaTopics: ['transaction.events']
  },
  'redis': {
    id: 'redis',
    name: 'Redis 7.2',
    type: 'In-Memory Store & Lock Engine',
    port: '6379',
    description: 'Enforces strictly once business semantics by providing atomic distributed locking and fast 24-hour response caching.',
    responsibilities: [
      'Atomic SETNX creates 60-second lock to eliminate in-flight concurrent duplicate requests',
      'Caches final TransferResponse for 24 hours so identical retries receive instant cached responses without re-executing business logic'
    ],
    keyTechnologies: ['Redis 7.2-alpine', 'Spring Data Redis']
  },
  'kafka': {
    id: 'kafka',
    name: 'Apache Kafka 7.6',
    type: 'Distributed Event Streaming Backbone',
    port: '9092 / 29092',
    description: 'Decouples microservices through high-throughput, partitioned topic logs.',
    responsibilities: [
      'Routes Saga commands: wallet.debit.command, wallet.credit.command, wallet.compensate.command',
      'Routes Saga replies: wallet.events',
      'Broadcasts domain events: transaction.events to notification-service'
    ],
    keyTechnologies: ['Apache Kafka', 'Zookeeper', 'JSON Serializer/Deserializer']
  }
};

export const ArchitectureView: React.FC = () => {
  const [selectedComponent, setSelectedComponent] = useState<string>('transaction-service');

  const selected = COMPONENTS_DATA[selectedComponent];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <Layers className="w-4 h-4" />
              <span>Microservices & Event Mesh Topology</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">PayVault System Architecture</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              An enterprise distributed payment ecosystem with 4 decoupled Spring Boot microservices,
              Saga Orchestration, PostgreSQL Transactional Outbox, Redis Idempotency, and Apache Kafka.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-emerald-400">
              Java 17
            </span>
            <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-cyan-400">
              Spring Boot 3.3.4
            </span>
            <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-amber-400">
              Kafka 7.6
            </span>
            <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-rose-400">
              Redis 7.2
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Topology Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Visual Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Interactive Architecture Diagram</span>
              <span className="text-xs font-normal text-slate-500">Click any component to inspect details</span>
            </h3>

            {/* Client Tier */}
            <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center mb-4">
              <span className="text-xs font-semibold text-slate-600">Client / API Consumers (Authorization: Bearer &lt;JWT&gt;, Header: Idempotency-Key)</span>
            </div>

            {/* Microservices Tier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* User Service */}
              <button
                onClick={() => setSelectedComponent('user-service')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedComponent === 'user-service'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">user-service</span>
                  <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Port 8081</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">User registration, login, and JWT generation with Spring Security 6</p>
                <div className="mt-3 flex items-center text-xs text-indigo-600 font-medium">
                  <Database className="w-3.5 h-3.5 mr-1" />
                  <span>payvault_user</span>
                </div>
              </button>

              {/* Transaction Service (Orchestrator) */}
              <button
                onClick={() => setSelectedComponent('transaction-service')}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  selectedComponent === 'transaction-service'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-amber-300 hover:border-amber-400 bg-amber-50/30'
                }`}
              >
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                  ORCHESTRATOR
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-bold text-slate-900 text-sm">transaction-service</span>
                  <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Port 8083</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">Saga Orchestrator + Outbox Poller + Redis Idempotency + Resilience4j</p>
                <div className="mt-3 flex items-center text-xs text-amber-700 font-medium space-x-3">
                  <span className="flex items-center"><Database className="w-3.5 h-3.5 mr-1" /> payvault_tx</span>
                  <span className="flex items-center"><Shield className="w-3.5 h-3.5 mr-1" /> Resilience4j</span>
                </div>
              </button>

              {/* Wallet Service */}
              <button
                onClick={() => setSelectedComponent('wallet-service')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedComponent === 'wallet-service'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">wallet-service</span>
                  <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Port 8082</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">Balance, Debit, Credit, Reversals, with Optimistic Locking (@Version)</p>
                <div className="mt-3 flex items-center text-xs text-emerald-600 font-medium">
                  <Database className="w-3.5 h-3.5 mr-1" />
                  <span>payvault_wallet (Ledger)</span>
                </div>
              </button>

              {/* Notification Service */}
              <button
                onClick={() => setSelectedComponent('notification-service')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedComponent === 'notification-service'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">notification-service</span>
                  <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Port 8084</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">Listens to transaction.events topic and triggers Email/SMS simulations</p>
                <div className="mt-3 flex items-center text-xs text-indigo-600 font-medium">
                  <Radio className="w-3.5 h-3.5 mr-1" />
                  <span>Kafka Consumer</span>
                </div>
              </button>
            </div>

            {/* Infrastructure Tier (Redis & Kafka) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedComponent('redis')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedComponent === 'redis'
                    ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-rose-700 text-xs flex items-center">
                    <Key className="w-3.5 h-3.5 mr-1" /> Redis Cluster (Port 6379)
                  </span>
                  <span className="text-[10px] font-mono bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">SETNX</span>
                </div>
                <p className="text-xs text-slate-600">60s atomic distributed lock + 24h response cache</p>
              </button>

              <button
                onClick={() => setSelectedComponent('kafka')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedComponent === 'kafka'
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-800 text-xs flex items-center">
                    <Radio className="w-3.5 h-3.5 mr-1" /> Apache Kafka (Port 9092)
                  </span>
                  <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">5 Topics</span>
                </div>
                <p className="text-xs text-slate-600">Event mesh for Saga commands, replies, and notifications</p>
              </button>
            </div>
          </div>

          {/* Architectural Patterns Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="text-xs font-bold text-slate-900 mb-1 flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                Saga Orchestrator
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Coordinates multi-step transfers. Handles happy path and executes compensating refunds if credit fails.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="text-xs font-bold text-slate-900 mb-1 flex items-center">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1.5" />
                Transactional Outbox
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prevents dual-write bugs. Business state and event entries are saved in the same local ACID transaction.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="text-xs font-bold text-slate-900 mb-1 flex items-center">
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
                Optimistic Locking
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                JPA @Version on Wallet entity automatically detects concurrent balance updates and prevents lost updates.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Component Inspector Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Component</span>
              {selected.port && (
                <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">
                  Port {selected.port}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{selected.name}</h3>
            <span className="inline-block mt-0.5 text-xs font-medium text-slate-500">{selected.type}</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
            {selected.description}
          </p>

          {/* Key Responsibilities */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Core Responsibilities</h4>
            <ul className="space-y-1.5">
              {selected.responsibilities.map((resp, i) => (
                <li key={i} className="text-xs text-slate-600 flex items-start">
                  <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 mr-1.5 shrink-0" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Database / Topics */}
          {selected.dbName && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Database Schema</h4>
              <div className="text-xs font-mono bg-slate-100 text-slate-800 px-2.5 py-1.5 rounded">
                {selected.dbName}
              </div>
            </div>
          )}

          {selected.kafkaTopics && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">Kafka Topics</h4>
              <div className="flex flex-wrap gap-1">
                {selected.kafkaTopics.map((topic, i) => (
                  <span key={i} className="text-[11px] font-mono bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tech Stack */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">Key Technologies</h4>
            <div className="flex flex-wrap gap-1">
              {selected.keyTechnologies.map((tech, i) => (
                <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
