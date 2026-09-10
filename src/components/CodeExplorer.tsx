import React, { useState } from 'react';
import { PROJECT_FILES } from '../data/projectFiles';
import { ProjectFile } from '../types';
import { FileCode, Copy, Check, Terminal, Folder, ExternalLink } from 'lucide-react';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(PROJECT_FILES[2]); // TransactionService.java default
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [copied, setCopied] = useState<boolean>(false);

  const filteredFiles = selectedModule === 'all'
    ? PROJECT_FILES
    : PROJECT_FILES.filter(f => f.module === selectedModule);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modules = [
    { id: 'all', label: 'All Files' },
    { id: 'root', label: 'Root (pom/docker)' },
    { id: 'transaction-service', label: 'transaction-service' },
    { id: 'wallet-service', label: 'wallet-service' },
    { id: 'user-service', label: 'user-service' },
    { id: 'notification-service', label: 'notification-service' },
  ];

  return (
    <div className="space-y-4">
      {/* Module filter tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3">
        {modules.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedModule(m.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedModule === m.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Main Grid: File list on left, code viewer on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: File Tree */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs max-h-[700px] overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
            <Folder className="w-3.5 h-3.5 mr-1" />
            <span>Project Files ({filteredFiles.length})</span>
          </div>

          <div className="space-y-1">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="truncate">{file.path.split('/').pop()}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5 ml-6">
                    {file.path}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-8 bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/80">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="ml-2 font-mono text-xs text-slate-300 font-semibold">
                {selectedFile.path}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Description banner */}
          {selectedFile.description && (
            <div className="px-5 py-2.5 bg-slate-900/40 border-b border-slate-800/80 text-xs text-slate-400">
              <span className="text-indigo-400 font-medium mr-1.5">Note:</span>
              {selectedFile.description}
            </div>
          )}

          {/* Code Text Area with Line Numbers */}
          <div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto max-h-[620px] overflow-y-auto">
            <pre className="text-slate-300">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
