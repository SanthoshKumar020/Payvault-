import React, { useState } from 'react';
import { API_ENDPOINTS } from '../data/endpoints';
import { ApiEndpoint } from '../types';
import { Terminal, Copy, Check, Send, Shield, Globe } from 'lucide-react';

export const ApiWorkbench: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(API_ENDPOINTS[6]); // tx-transfer default
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [simulatedResponse, setSimulatedResponse] = useState<any | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  const generateCurl = (ep: ApiEndpoint) => {
    let curl = `curl -X ${ep.method} http://localhost:${ep.port}${ep.path}`;

    if (ep.headers) {
      Object.entries(ep.headers).forEach(([k, v]) => {
        curl += ` \\\n  -H "${k}: ${v}"`;
      });
    }

    if (ep.requestBody) {
      curl += ` \\\n  -d '${JSON.stringify(ep.requestBody, null, 2)}'`;
    }

    return curl;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generateCurl(selectedEndpoint));
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleSendSimulated = () => {
    setIsSending(true);
    setTimeout(() => {
      setSimulatedResponse(selectedEndpoint.responseBody);
      setIsSending(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">API & cURL Interactive Workbench</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore and test production endpoints across the 4 microservices with exact request headers and JSON payloads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Endpoint list */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2 max-h-[720px] overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
            Available Endpoints ({API_ENDPOINTS.length})
          </div>

          {API_ENDPOINTS.map((ep) => {
            const isSelected = selectedEndpoint.id === ep.id;
            return (
              <button
                key={ep.id}
                onClick={() => {
                  setSelectedEndpoint(ep);
                  setSimulatedResponse(null);
                }}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border border-indigo-200 shadow-2xs'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ep.method === 'POST'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate">{ep.summary}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate mt-1">
                  :{ep.port}{ep.path}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Col: Details, cURL generator & Response */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Endpoint Spec */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold ${
                      selectedEndpoint.method === 'POST'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {selectedEndpoint.method}
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    http://localhost:{selectedEndpoint.port}{selectedEndpoint.path}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedEndpoint.description}</p>
              </div>

              <button
                onClick={handleSendSimulated}
                disabled={isSending}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Test In Preview'}</span>
              </button>
            </div>

            {/* Headers if any */}
            {selectedEndpoint.headers && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Required Headers</div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 font-mono text-xs text-slate-700">
                  {Object.entries(selectedEndpoint.headers).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{k}:</span>
                      <span className="text-slate-600 truncate max-w-xs">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Body if any */}
            {selectedEndpoint.requestBody && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Request Body (JSON)</div>
                <pre className="bg-slate-900 text-slate-200 rounded-xl p-4 text-xs font-mono overflow-x-auto">
                  {JSON.stringify(selectedEndpoint.requestBody, null, 2)}
                </pre>
              </div>
            )}

            {/* cURL Command Generator */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                  <Terminal className="w-3.5 h-3.5 mr-1" />
                  <span>Copyable cURL Command</span>
                </div>
                <button
                  onClick={handleCopyCurl}
                  className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {copiedCurl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCurl ? 'Copied!' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs font-mono overflow-x-auto">
                {generateCurl(selectedEndpoint)}
              </pre>
            </div>

            {/* Response Preview */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Expected Response</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  HTTP {selectedEndpoint.responseStatus}
                </span>
              </div>
              <pre className="bg-slate-950 text-slate-300 rounded-xl p-4 text-xs font-mono overflow-x-auto border border-slate-800">
                {JSON.stringify(simulatedResponse || selectedEndpoint.responseBody, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
