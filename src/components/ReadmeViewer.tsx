import React from 'react';
import { Terminal, CheckCircle2, Play, AlertTriangle, Cpu, Layers } from 'lucide-react';

export const ReadmeViewer: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-8 max-w-4xl mx-auto">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Complete Run & Test Guide</span>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">PayVault Execution & Testing Runbook</h2>
        <p className="text-sm text-slate-600 mt-2">
          Step-by-step instructions to compile, containerize, run, and execute test scenarios on your local machine.
        </p>
      </div>

      {/* 1. Prerequisites & Build */}
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center">
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs mr-2">1</span>
          Build Multi-Module JARs
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Compile the common shared module, followed by all 4 microservices with Maven and Java 17:
        </p>
        <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`# From project root /payvault:
mvn clean package -DskipTests`}
        </pre>
      </section>

      {/* 2. Boot Docker Compose */}
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center">
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs mr-2">2</span>
          Start Entire Ecosystem via Docker Compose
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Spins up PostgreSQL 16 (creating 3 isolated databases via <code className="text-indigo-600 font-mono">init-databases.sql</code>),
          Redis 7.2, Zookeeper, Apache Kafka, and all 4 Spring Boot microservices:
        </p>
        <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`docker-compose up --build -d

# Verify all 8 containers are healthy:
docker-compose ps`}
        </pre>
      </section>

      {/* 3. Verify Healthchecks */}
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center">
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs mr-2">3</span>
          Actuator & Health Verification
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Inspect Spring Boot Actuator endpoints and Resilience4j Circuit Breakers across the microservices:
        </p>
        <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`curl -s http://localhost:8081/actuator/health | jq
curl -s http://localhost:8082/actuator/health | jq
curl -s http://localhost:8083/actuator/health | jq
curl -s http://localhost:8084/actuator/health | jq`}
        </pre>
      </section>

      {/* 4. Complete Test Walkthrough */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center">
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs mr-2">4</span>
          Execute End-to-End Payment Flow
        </h3>

        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Step A: Register User Alice & Login</h4>
            <pre className="bg-slate-950 text-slate-300 p-3.5 rounded-xl text-xs font-mono mt-1 overflow-x-auto">
{`# 1. Register User
curl -X POST http://localhost:8081/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"username": "alice", "email": "alice@payvault.io", "password": "Password123!", "fullName": "Alice Johnson"}'

# 2. Login to get JWT Token
JWT_TOKEN=$(curl -s -X POST http://localhost:8081/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "alice", "password": "Password123!"}' | jq -r '.token')

echo "JWT: $JWT_TOKEN"`}
            </pre>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Step B: Create Wallets & Seed Funds</h4>
            <pre className="bg-slate-950 text-slate-300 p-3.5 rounded-xl text-xs font-mono mt-1 overflow-x-auto">
{`# 1. Create Alice's Wallet
ALICE_WALLET=$(curl -s -X POST http://localhost:8082/api/v1/wallets \\
  -H "Content-Type: application/json" \\
  -d '{"userId": "a1000000-0000-0000-0000-000000000001", "currency": "USD"}' | jq -r '.id')

# 2. Deposit $500.00 into Alice's Wallet
curl -X POST http://localhost:8082/api/v1/wallets/$ALICE_WALLET/deposit \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 500.00}'

# 3. Create Bob's Wallet
BOB_WALLET=$(curl -s -X POST http://localhost:8082/api/v1/wallets \\
  -H "Content-Type: application/json" \\
  -d '{"userId": "b2000000-0000-0000-0000-000000000002", "currency": "USD"}' | jq -r '.id')`}
            </pre>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Step C: Execute Transfer with Idempotency Key</h4>
            <pre className="bg-slate-950 text-slate-300 p-3.5 rounded-xl text-xs font-mono mt-1 overflow-x-auto">
{`curl -X POST http://localhost:8083/api/v1/transactions/transfers \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $JWT_TOKEN" \\
  -H "Idempotency-Key: idemp-req-unique-9921" \\
  -d '{
    "sourceWalletId": "'$ALICE_WALLET'",
    "destinationWalletId": "'$BOB_WALLET'",
    "amount": 150.00,
    "currency": "USD"
  }'`}
            </pre>
          </div>
        </div>
      </section>

      {/* 5. How to Test Saga Failure Scenarios */}
      <section className="space-y-3 bg-amber-50/60 border border-amber-200 rounded-2xl p-5">
        <h3 className="text-base font-bold text-amber-900 flex items-center">
          <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
          How to Test the Saga Failure & Compensating Rollback Scenario
        </h3>
        <p className="text-xs text-amber-800 leading-relaxed">
          Follow these exact steps to trigger a real compensating refund in the system:
        </p>

        <div className="space-y-3 mt-2 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-amber-200">
            <span className="font-bold text-slate-900 block mb-1">Scenario A: Insufficient Funds (Fast-Fail)</span>
            <p className="text-slate-600 mb-2">Request a transfer of $50,000 when Alice only has $500:</p>
            <pre className="bg-slate-950 text-slate-200 p-2.5 rounded text-[11px] font-mono overflow-x-auto">
{`curl -X POST http://localhost:8083/api/v1/transactions/transfers \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $JWT_TOKEN" \\
  -H "Idempotency-Key: idemp-fail-overdraft-01" \\
  -d '{"sourceWalletId": "'$ALICE_WALLET'", "destinationWalletId": "'$BOB_WALLET'", "amount": 50000.00, "currency": "USD"}'`}
            </pre>
            <p className="text-slate-600 mt-2">
              <strong>Expected Result:</strong> <code className="text-indigo-600">WalletDebitFailedEvent</code> emitted. Transaction status transitions to <code className="text-rose-600 font-bold">FAILED</code>.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-amber-200">
            <span className="font-bold text-slate-900 block mb-1">Scenario B: Credit Step Failure (Triggers Compensating Refund)</span>
            <p className="text-slate-600 mb-2">Transfer to a non-existent or suspended wallet UUID:</p>
            <pre className="bg-slate-950 text-slate-200 p-2.5 rounded text-[11px] font-mono overflow-x-auto">
{`curl -X POST http://localhost:8083/api/v1/transactions/transfers \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $JWT_TOKEN" \\
  -H "Idempotency-Key: idemp-fail-credit-02" \\
  -d '{"sourceWalletId": "'$ALICE_WALLET'", "destinationWalletId": "00000000-0000-0000-0000-000000000000", "amount": 100.00, "currency": "USD"}'`}
            </pre>
            <p className="text-slate-600 mt-2 leading-relaxed">
              <strong>Expected Result:</strong><br />
              1. Alice is debited $100.00 in Step 1 (<code className="text-emerald-600 font-mono">WalletDebitedEvent</code>).<br />
              2. Destination credit fails in Step 2 (<code className="text-rose-600 font-mono">WalletCreditFailedEvent</code>).<br />
              3. Saga Orchestrator transitions to <code className="text-amber-600 font-mono font-bold">COMPENSATING</code> and enqueues <code className="font-mono">CompensateDebitCommand</code> in Outbox.<br />
              4. <code className="font-mono">wallet-service</code> executes <code className="font-mono">reverseDebit()</code>, crediting $100.00 back to Alice.<br />
              5. Alice's ledger records a <code className="text-purple-700 font-bold font-mono">REVERSAL</code> entry, and transaction finishes as <code className="text-purple-700 font-bold font-mono">COMPENSATED</code>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
