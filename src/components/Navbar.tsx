import React, { useState } from 'react';
import { Download, ShieldCheck, Database, Layers, Terminal, BookOpen, Activity, CheckCircle, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { PROJECT_FILES } from '../data/projectFiles';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setDownloading(true);
      const zip = new JSZip();
      const rootFolder = zip.folder('payvault');

      // Add all project files into zip
      PROJECT_FILES.forEach(file => {
        rootFolder?.file(file.path, file.content);
      });

      // Add Dockerfiles and migrations
      rootFolder?.file('init-databases.sql', `-- Create distinct databases for each microservice boundary\nCREATE DATABASE payvault_user;\nCREATE DATABASE payvault_wallet;\nCREATE DATABASE payvault_transaction;\n`);
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'payvault-digital-wallet-project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate zip', err);
    } finally {
      setDownloading(false);
    }
  };

  const navItems = [
    { id: 'architecture', label: 'Architecture & System', icon: Layers },
    { id: 'simulator', label: 'Saga Simulator', icon: Activity },
    { id: 'code', label: 'Code Explorer', icon: Terminal },
    { id: 'api', label: 'API Workbench', icon: ShieldCheck },
    { id: 'docs', label: 'Run Guide & Docs', icon: BookOpen },
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xl shadow-sm border border-slate-800">
              PV
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">PayVault</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Spring Boot 3.3
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700">
                  Saga Orchestrator
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Enterprise Digital Wallet & Payment Engine</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Download Zip Action */}
          <div className="flex items-center">
            <button
              id="download-project-zip-btn"
              onClick={handleDownloadZip}
              disabled={downloading}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                downloaded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : downloaded ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {downloading ? 'Packing...' : downloaded ? 'Downloaded!' : 'Download Maven ZIP'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
