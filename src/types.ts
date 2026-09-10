export interface ProjectFile {
  path: string;
  module: 'root' | 'common' | 'user-service' | 'wallet-service' | 'transaction-service' | 'notification-service';
  language: 'java' | 'xml' | 'yaml' | 'sql' | 'dockerfile' | 'markdown';
  content: string;
  description?: string;
}

export type SagaStepState = 'idle' | 'pending' | 'success' | 'failed' | 'compensating' | 'compensated';

export interface SagaSimulationEvent {
  id: string;
  stepNumber: number;
  service: 'Client' | 'Redis' | 'transaction-service' | 'PostgreSQL' | 'OutboxPoller' | 'Kafka' | 'wallet-service' | 'notification-service';
  title: string;
  description: string;
  status: SagaStepState;
  payload?: any;
  timestamp: string;
}

export interface ApiEndpoint {
  id: string;
  service: string;
  port: number;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  headers?: Record<string, string>;
  requestBody?: any;
  responseStatus: number;
  responseBody: any;
  description: string;
}
