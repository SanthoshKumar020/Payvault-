import { ApiEndpoint } from '../types';

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'auth-register',
    service: 'user-service',
    port: 8081,
    method: 'POST',
    path: '/api/v1/auth/register',
    summary: 'Register New User',
    description: 'Registers a new user profile with BCrypt salted password hashing and default USER role.',
    headers: { 'Content-Type': 'application/json' },
    requestBody: {
      username: 'alice',
      email: 'alice@payvault.io',
      password: 'Password123!',
      fullName: 'Alice Johnson'
    },
    responseStatus: 201,
    responseBody: {
      id: 'a1000000-0000-0000-0000-000000000001',
      username: 'alice',
      email: 'alice@payvault.io',
      fullName: 'Alice Johnson',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: '2026-09-10T14:20:00Z'
    }
  },
  {
    id: 'auth-login',
    service: 'user-service',
    port: 8081,
    method: 'POST',
    path: '/api/v1/auth/login',
    summary: 'Login & Obtain JWT',
    description: 'Verifies credentials and issues a signed HMAC-SHA256 JWT bearer token.',
    headers: { 'Content-Type': 'application/json' },
    requestBody: {
      username: 'alice',
      password: 'Password123!'
    },
    responseStatus: 200,
    responseBody: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZSIsInVzZXJJZCI6ImExMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsInJvbGVzIjpbIlJPTEVfVVNFUiJdLCJpYXQiOjE3MjYwMDEyMDAsImV4cCI6MTcyNjA4NzYwMH0.signature',
      tokenType: 'Bearer',
      username: 'alice',
      userId: 'a1000000-0000-0000-0000-000000000001'
    }
  },
  {
    id: 'wallet-create',
    service: 'wallet-service',
    port: 8082,
    method: 'POST',
    path: '/api/v1/wallets',
    summary: 'Create User Wallet',
    description: 'Initializes a new balance ledger wallet with optimistic locking version = 0.',
    headers: { 'Content-Type': 'application/json' },
    requestBody: {
      userId: 'a1000000-0000-0000-0000-000000000001',
      currency: 'USD'
    },
    responseStatus: 201,
    responseBody: {
      id: 'w1000000-0000-0000-0000-000000000001',
      userId: 'a1000000-0000-0000-0000-000000000001',
      balance: 0.0000,
      currency: 'USD',
      version: 0,
      status: 'ACTIVE'
    }
  },
  {
    id: 'wallet-deposit',
    service: 'wallet-service',
    port: 8082,
    method: 'POST',
    path: '/api/v1/wallets/w1000000-0000-0000-0000-000000000001/deposit',
    summary: 'Deposit / Seed Funds',
    description: 'Top-up wallet balance for testing and development, creating a CREDIT ledger entry.',
    headers: { 'Content-Type': 'application/json' },
    requestBody: {
      amount: 500.00
    },
    responseStatus: 200,
    responseBody: {
      id: 'w1000000-0000-0000-0000-000000000001',
      userId: 'a1000000-0000-0000-0000-000000000001',
      balance: 500.0000,
      currency: 'USD',
      version: 1,
      status: 'ACTIVE'
    }
  },
  {
    id: 'wallet-get',
    service: 'wallet-service',
    port: 8082,
    method: 'GET',
    path: '/api/v1/wallets/w1000000-0000-0000-0000-000000000001',
    summary: 'Get Wallet Details',
    description: 'Retrieves current wallet balance, currency, and version state.',
    responseStatus: 200,
    responseBody: {
      id: 'w1000000-0000-0000-0000-000000000001',
      userId: 'a1000000-0000-0000-0000-000000000001',
      balance: 500.0000,
      currency: 'USD',
      version: 1,
      status: 'ACTIVE'
    }
  },
  {
    id: 'wallet-ledger',
    service: 'wallet-service',
    port: 8082,
    method: 'GET',
    path: '/api/v1/wallets/w1000000-0000-0000-0000-000000000001/ledger',
    summary: 'Get Wallet Ledger History',
    description: 'Returns immutable chronological audit logs of all credits, debits, and reversals.',
    responseStatus: 200,
    responseBody: [
      {
        id: 'l1000000-0000-0000-0000-000000000001',
        walletId: 'w1000000-0000-0000-0000-000000000001',
        transactionId: 't1000000-0000-0000-0000-000000000001',
        type: 'CREDIT',
        amount: 500.0000,
        balanceAfter: 500.0000,
        description: 'Initial deposit',
        createdAt: '2026-09-10T14:22:00Z'
      }
    ]
  },
  {
    id: 'tx-transfer',
    service: 'transaction-service',
    port: 8083,
    method: 'POST',
    path: '/api/v1/transactions/transfers',
    summary: 'Initiate Idempotent Money Transfer',
    description: 'Triggers the distributed Saga workflow. Enforces Idempotency-Key via Redis and writes to PostgreSQL Outbox.',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer <JWT_TOKEN>',
      'Idempotency-Key': 'idemp-req-8849-xyz'
    },
    requestBody: {
      sourceWalletId: 'w1000000-0000-0000-0000-000000000001',
      destinationWalletId: 'w2000000-0000-0000-0000-000000000002',
      amount: 150.00,
      currency: 'USD'
    },
    responseStatus: 202,
    responseBody: {
      transactionId: 't1000000-0000-0000-0000-000000000001',
      idempotencyKey: 'idemp-req-8849-xyz',
      sourceWalletId: 'w1000000-0000-0000-0000-000000000001',
      destinationWalletId: 'w2000000-0000-0000-0000-000000000002',
      amount: 150.00,
      currency: 'USD',
      status: 'INITIATED',
      message: 'Transfer successfully initiated. Processing Saga workflow asynchronously.',
      timestamp: '2026-09-10T14:25:00Z'
    }
  },
  {
    id: 'tx-get',
    service: 'transaction-service',
    port: 8083,
    method: 'GET',
    path: '/api/v1/transactions/t1000000-0000-0000-0000-000000000001',
    summary: 'Query Transaction Saga Status',
    description: 'Polls the current status of the Saga workflow (INITIATED -> DEBIT_SUCCESS -> COMPLETED, or COMPENSATED).',
    headers: {
      'Authorization': 'Bearer <JWT_TOKEN>'
    },
    responseStatus: 200,
    responseBody: {
      id: 't1000000-0000-0000-0000-000000000001',
      idempotencyKey: 'idemp-req-8849-xyz',
      sourceWalletId: 'w1000000-0000-0000-0000-000000000001',
      destinationWalletId: 'w2000000-0000-0000-0000-000000000002',
      amount: 150.00,
      currency: 'USD',
      status: 'COMPLETED',
      failureReason: null,
      createdAt: '2026-09-10T14:25:00Z',
      updatedAt: '2026-09-10T14:25:02Z'
    }
  },
  {
    id: 'actuator-health',
    service: 'transaction-service',
    port: 8083,
    method: 'GET',
    path: '/actuator/health',
    summary: 'Actuator & Resilience4j Health',
    description: 'Exposes database connectivity, disk space, and Resilience4j circuit breaker state (CLOSED / OPEN / HALF_OPEN).',
    responseStatus: 200,
    responseBody: {
      status: 'UP',
      components: {
        circuitBreakers: {
          status: 'UP',
          details: {
            walletService: {
              status: 'UP',
              state: 'CLOSED',
              failureRate: '0.0%',
              slowCallRate: '0.0%'
            }
          }
        },
        db: {
          status: 'UP',
          details: { database: 'PostgreSQL', validationQuery: 'isValid()' }
        },
        redis: {
          status: 'UP',
          details: { version: '7.2.4' }
        }
      }
    }
  }
];
