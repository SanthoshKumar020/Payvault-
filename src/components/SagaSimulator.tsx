import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle2, XCircle, AlertCircle, ArrowRight, ShieldAlert, Zap, Clock, Database, Radio, Key } from 'lucide-react';
import { SagaSimulationEvent, SagaStepState } from '../types';

export const SagaSimulator: React.FC = () => {
  const [scenario, setScenario] = useState<'happy' | 'insufficient_funds' | 'credit_failure' | 'duplicate_idempotency'>('happy');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000);

  const getScenarioEvents = (): SagaSimulationEvent[] => {
    const txId = 't8849-5f21-482a-99ef';
    const sourceWallet = 'w1000-alice ($500.00)';
    const destWallet = 'w2000-bob ($120.00)';
    const now = new Date().toLocaleTimeString();

    if (scenario === 'happy') {
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          service: 'Client',
          title: 'Submit Transfer Request',
          description: 'POST /api/v1/transactions/transfers with Header Idempotency-Key: idemp-8849 ($150.00 Alice -> Bob)',
          status: 'success',
          timestamp: now,
          payload: { amount: 150.0, currency: 'USD', source: 'Alice', destination: 'Bob' }
        },
        {
          id: 'step-2',
          stepNumber: 2,
          service: 'Redis',
          title: 'Idempotency Lock Check',
          description: 'Atomic SETNX payvault:idempotency:idemp-8849 "IN_FLIGHT" with 60s TTL. Lock acquired successfully.',
          status: 'success',
          timestamp: now,
          payload: { redisKey: 'payvault:idempotency:idemp-8849', result: 'ACQUIRED', ttl: '60s' }
        },
        {
          id: 'step-3',
          stepNumber: 3,
          service: 'PostgreSQL',
          title: 'Local ACID Transaction (Outbox Pattern)',
          description: 'Insert into transactions table (status: INITIATED) + insert into outbox_events (DebitWalletCommand).',
          status: 'success',
          timestamp: now,
          payload: { txStatus: 'INITIATED', outboxEventType: 'DebitWalletCommand', atomicCommit: true }
        },
        {
          id: 'step-4',
          stepNumber: 4,
          service: 'OutboxPoller',
          title: 'Outbox Poller Dispatch',
          description: 'Scheduled poller reads pending outbox event and delivers DebitWalletCommand to Kafka topic wallet.debit.command.',
          status: 'success',
          timestamp: now,
          payload: { kafkaTopic: 'wallet.debit.command', partition: 0, acks: 'all' }
        },
        {
          id: 'step-5',
          stepNumber: 5,
          service: 'wallet-service',
          title: 'Optimistic Debit & Ledger Write',
          description: 'Checks Alice balance ($500 >= $150). Updates balance to $350.00 with @Version check. Appends to wallet_ledger.',
          status: 'success',
          timestamp: now,
          payload: { walletId: sourceWallet, newBalance: '$350.00', version: 2, event: 'WalletDebitedEvent' }
        },
        {
          id: 'step-6',
          stepNumber: 6,
          service: 'transaction-service',
          title: 'Saga Orchestrator Advances Step 2',
          description: 'Consumes WalletDebitedEvent. Updates transaction status to DEBIT_SUCCESS. Enqueues CreditWalletCommand in Outbox.',
          status: 'success',
          timestamp: now,
          payload: { txStatus: 'DEBIT_SUCCESS', nextCommand: 'CreditWalletCommand' }
        },
        {
          id: 'step-7',
          stepNumber: 7,
          service: 'wallet-service',
          title: 'Credit Destination Wallet',
          description: 'Consumes CreditWalletCommand. Credits Bob wallet with $150.00. Balance increases to $270.00. Emits WalletCreditedEvent.',
          status: 'success',
          timestamp: now,
          payload: { walletId: destWallet, newBalance: '$270.00', version: 1, event: 'WalletCreditedEvent' }
        },
        {
          id: 'step-8',
          stepNumber: 8,
          service: 'transaction-service',
          title: 'Saga Completed & Redis Cache',
          description: 'Transaction marked COMPLETED. Records response in Redis with 24h TTL. Emits TransactionCompletedEvent.',
          status: 'success',
          timestamp: now,
          payload: { txStatus: 'COMPLETED', redisTtl: '24 hours', event: 'TransactionCompletedEvent' }
        },
        {
          id: 'step-9',
          stepNumber: 9,
          service: 'notification-service',
          title: 'Customer Notifications Dispatched',
          description: 'Kafka listener consumes TransactionCompletedEvent and sends simulated Email & SMS receipts to Alice and Bob.',
          status: 'success',
          timestamp: now,
          payload: { emailSent: 'alice@payvault.io', smsSent: '+1-555-0199', notificationStatus: 'DELIVERED' }
        }
      ];
    } else if (scenario === 'insufficient_funds') {
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          service: 'Client',
          title: 'Submit Overdraft Transfer',
          description: 'POST /api/v1/transactions/transfers requesting $10,000.00 (Alice balance is only $500.00)',
          status: 'success',
          timestamp: now,
          payload: { amount: 10000.0, source: 'Alice ($500.00)', destination: 'Bob' }
        },
        {
          id: 'step-2',
          stepNumber: 2,
          service: 'Redis',
          title: 'Idempotency Lock Acquired',
          description: 'SETNX payvault:idempotency:idemp-overdraft "IN_FLIGHT" lock set.',
          status: 'success',
          timestamp: now
        },
        {
          id: 'step-3',
          stepNumber: 3,
          service: 'transaction-service',
          title: 'Transaction Initiated & Outbox Written',
          description: 'Transaction saved as INITIATED. DebitWalletCommand sent via Outbox to Kafka.',
          status: 'success',
          timestamp: now
        },
        {
          id: 'step-4',
          stepNumber: 4,
          service: 'wallet-service',
          title: 'Debit Rejected (Insufficient Balance)',
          description: 'Balance check fails: current balance $500.00 < requested $10,000.00. Emits WalletDebitFailedEvent to Kafka.',
          status: 'failed',
          timestamp: now,
          payload: { error: 'InsufficientBalanceException', currentBalance: '$500.00', requested: '$10,000.00' }
        },
        {
          id: 'step-5',
          stepNumber: 5,
          service: 'transaction-service',
          title: 'Saga Fast-Fail Termination',
          description: 'Consumes WalletDebitFailedEvent. Marks transaction status FAILED. No compensation needed as debit never took place.',
          status: 'failed',
          timestamp: now,
          payload: { txStatus: 'FAILED', reason: 'Insufficient wallet balance', compensationNeeded: false }
        },
        {
          id: 'step-6',
          stepNumber: 6,
          service: 'notification-service',
          title: 'Customer Alert Dispatched',
          description: 'Notifies Alice that the payment failed due to insufficient balance. Wallet remains untouched at $500.00.',
          status: 'failed',
          timestamp: now,
          payload: { alertType: 'TRANSFER_REJECTED', reason: 'Insufficient funds' }
        }
      ];
    } else if (scenario === 'credit_failure') {
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          service: 'Client',
          title: 'Submit Transfer',
          description: 'POST /api/v1/transactions/transfers: $150.00 to an inactive/locked destination wallet.',
          status: 'success',
          timestamp: now
        },
        {
          id: 'step-2',
          stepNumber: 2,
          service: 'wallet-service',
          title: 'Step 1 Succeeded: Sender Debited',
          description: 'Alice debited $150.00. Balance reduced to $350.00. Emits WalletDebitedEvent.',
          status: 'success',
          timestamp: now,
          payload: { aliceBalance: '$350.00' }
        },
        {
          id: 'step-3',
          stepNumber: 3,
          service: 'wallet-service',
          title: 'Step 2 Failed: Destination Locked',
          description: 'Destination wallet is SUSPENDED / INACTIVE. Credit operation fails! Emits WalletCreditFailedEvent.',
          status: 'failed',
          timestamp: now,
          payload: { destinationStatus: 'SUSPENDED', error: 'WalletCreditFailedEvent' }
        },
        {
          id: 'step-4',
          stepNumber: 4,
          service: 'transaction-service',
          title: 'Saga Triggers Compensating Action',
          description: 'Saga Orchestrator detects Step 2 failure. Marks status COMPENSATING. Enqueues CompensateDebitCommand to Outbox.',
          status: 'compensating',
          timestamp: now,
          payload: { txStatus: 'COMPENSATING', command: 'CompensateDebitCommand', refundAmount: '$150.00' }
        },
        {
          id: 'step-5',
          stepNumber: 5,
          service: 'wallet-service',
          title: 'Execute Compensating Refund (reverseDebit)',
          description: 'Restores $150.00 back to Alice wallet. Balance restored to $500.00. Writes REVERSAL entry to wallet_ledger.',
          status: 'compensated',
          timestamp: now,
          payload: { restoredBalance: '$500.00', ledgerType: 'REVERSAL', reason: 'Destination credit failed' }
        },
        {
          id: 'step-6',
          stepNumber: 6,
          service: 'transaction-service',
          title: 'Saga Finalized as COMPENSATED',
          description: 'Transaction status transitioned to COMPENSATED. Client funds fully refunded and guaranteed consistent.',
          status: 'compensated',
          timestamp: now,
          payload: { txStatus: 'COMPENSATED', refunded: true }
        },
        {
          id: 'step-7',
          stepNumber: 7,
          service: 'notification-service',
          title: 'Refund Notice Sent to Customer',
          description: 'Dispatches alert: "Your transfer could not be delivered to recipient. $150.00 has been credited back to your wallet."',
          status: 'compensated',
          timestamp: now
        }
      ];
    } else {
      // duplicate_idempotency
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          service: 'Client',
          title: 'Request A Initiated (Key: idemp-same-key)',
          description: 'Client clicks "Pay" button. Atomic SETNX in Redis sets key to "IN_FLIGHT" with 60s lock.',
          status: 'success',
          timestamp: now,
          payload: { idempotencyKey: 'idemp-same-key', lockState: 'IN_FLIGHT' }
        },
        {
          id: 'step-2',
          stepNumber: 2,
          service: 'Client',
          title: 'Duplicate Request B Arrives Concurrently',
          description: 'User double-clicks "Pay". Request B checks Redis: key already exists with value "IN_FLIGHT"!',
          status: 'failed',
          timestamp: now,
          payload: { error: 'IdempotencyConflictException (HTTP 409 Conflict)', message: 'Transfer with this key is already in progress' }
        },
        {
          id: 'step-3',
          stepNumber: 3,
          service: 'transaction-service',
          title: 'Request A Completes Successfully',
          description: 'Request A finishes Saga workflow. Serializes TransferResponse and updates Redis key with 24h TTL.',
          status: 'success',
          timestamp: now,
          payload: { redisStoredValue: '{ "transactionId": "t-1", "status": "COMPLETED" }', ttl: '86400s' }
        },
        {
          id: 'step-4',
          stepNumber: 4,
          service: 'Client',
          title: 'Network Retry / Duplicate Request C Arrives',
          description: 'Mobile app retries transfer with same Idempotency-Key. Redis detects cached TransferResponse.',
          status: 'success',
          timestamp: now,
          payload: { cacheHit: true, databaseBypassed: true, returnedResponse: 'HTTP 200 (Cached TransferResponse)' }
        }
      ];
    }
  };

  const events = getScenarioEvents();

  const handleStart = () => {
    setCurrentStepIndex(0);
    setIsRunning(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < events.length) {
        setCurrentStepIndex(step);
      } else {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, speed);
  };

  const handleReset = () => {
    setCurrentStepIndex(-1);
    setIsRunning(false);
  };

  const getStatusBadge = (status: SagaStepState) => {
    switch (status) {
      case 'success':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">Success</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-100 text-rose-800">Failed</span>;
      case 'compensating':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">Compensating</span>;
      case 'compensated':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-800">Refunded / Compensated</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Scenario Selection */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Live Simulation Console</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">Saga & Idempotency Visualizer</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Step through real distributed event interactions: PostgreSQL Outbox poller, Kafka messages, and compensations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleStart}
              disabled={isRunning}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunning ? 'Simulating...' : 'Run Simulation'}</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Scenario Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-5">
          <button
            onClick={() => { setScenario('happy'); handleReset(); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              scenario === 'happy'
                ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>1. Happy Path Transfer</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Full 2-phase debit & credit with outbox and notification</p>
          </button>

          <button
            onClick={() => { setScenario('insufficient_funds'); handleReset(); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              scenario === 'insufficient_funds'
                ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-800">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>2. Insufficient Funds</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Debit rejected immediately; no compensating rollback needed</p>
          </button>

          <button
            onClick={() => { setScenario('credit_failure'); handleReset(); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              scenario === 'credit_failure'
                ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>3. Saga Compensation</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Step 2 fails &rarr; orchestrator triggers reverseDebit refund</p>
          </button>

          <button
            onClick={() => { setScenario('duplicate_idempotency'); handleReset(); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              scenario === 'duplicate_idempotency'
                ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-800">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>4. Redis Idempotency</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">In-flight 409 Conflict vs completed 24h response cache hit</p>
          </button>
        </div>
      </div>

      {/* Steps Progression Timeline */}
      <div className="space-y-3">
        {events.map((evt, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isPassed = currentStepIndex >= idx;

          return (
            <div
              key={evt.id}
              className={`p-4 rounded-xl border transition-all ${
                isCurrent
                  ? 'border-indigo-500 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-500/20 scale-[1.005]'
                  : isPassed
                  ? 'border-slate-200 bg-white shadow-2xs'
                  : 'border-slate-100 bg-slate-50/50 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      isPassed
                        ? evt.status === 'failed'
                          ? 'bg-rose-600 text-white'
                          : evt.status === 'compensating' || evt.status === 'compensated'
                          ? 'bg-purple-600 text-white'
                          : 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {evt.stepNumber}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{evt.title}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {evt.service}
                      </span>
                      {isPassed && getStatusBadge(evt.status)}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{evt.description}</p>
                  </div>
                </div>

                {/* Payload snippet if available and passed */}
                {isPassed && evt.payload && (
                  <div className="text-[11px] font-mono bg-slate-900 text-emerald-400 px-3 py-1.5 rounded-lg max-w-sm overflow-x-auto whitespace-pre">
                    {JSON.stringify(evt.payload, null, 1)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
