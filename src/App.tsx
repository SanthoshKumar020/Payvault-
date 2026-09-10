import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ArchitectureView } from './components/ArchitectureView';
import { SagaSimulator } from './components/SagaSimulator';
import { CodeExplorer } from './components/CodeExplorer';
import { ApiWorkbench } from './components/ApiWorkbench';
import { ReadmeViewer } from './components/ReadmeViewer';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('architecture');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'architecture' && <ArchitectureView />}
        {activeTab === 'simulator' && <SagaSimulator />}
        {activeTab === 'code' && <CodeExplorer />}
        {activeTab === 'api' && <ApiWorkbench />}
        {activeTab === 'docs' && <ReadmeViewer />}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <span className="font-semibold text-slate-700">PayVault</span> — Distributed Architecture with Spring Boot 3.3, Kafka & Redis
          </div>
          <div className="flex items-center space-x-4">
            <span>Orchestrated Saga Pattern</span>
            <span>•</span>
            <span>Transactional Outbox</span>
            <span>•</span>
            <span>Optimistic Locking (@Version)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
