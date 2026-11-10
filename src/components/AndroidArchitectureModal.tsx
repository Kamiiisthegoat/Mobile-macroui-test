import React, { useState } from 'react';
import { ANDROID_ARCHITECTURE_FILES } from '../data/androidArchitectureFiles';
import { AndroidCodeFile } from '../types/macro';
import { Code, Copy, Check, FileCode, Folder, Download, X } from 'lucide-react';

interface AndroidArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidArchitectureModal: React.FC<AndroidArchitectureModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedFile, setSelectedFile] = useState<AndroidCodeFile>(ANDROID_ARCHITECTURE_FILES[0]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.path.split('/').pop() || 'file.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 pt-14 sm:pt-6 pb-8 overflow-y-auto select-none">
      <div className="bg-[#12141c] border border-[#22273a] rounded-2xl w-full max-w-4xl max-h-[82dvh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden shrink-0 mt-2 sm:my-auto">
        {/* Header */}
        <div className="p-4 bg-[#151824] border-b border-[#212638] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Code className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                MacroExecutor Android Native Architecture & Codebase
              </h2>
              <p className="text-[11px] text-slate-400">
                Multi-module structure: app, engine, automator, and NDK JNI drivers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="py-1.5 px-3 rounded-lg bg-[#1f2436] hover:bg-[#282e46] text-slate-200 border border-[#2d344e] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              Copy File
            </button>

            <button
              onClick={handleDownloadFile}
              className="py-1.5 px-3 rounded-lg bg-[#1f2436] hover:bg-[#282e46] text-slate-200 border border-[#2d344e] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Download
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2436] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left: Files Tree Sidebar */}
          <div className="w-full md:w-64 bg-[#0e1017] border-b md:border-b-0 md:border-r border-[#1e2232] p-3 overflow-y-auto space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
              <Folder className="w-3 h-3 text-emerald-400" />
              Project Files
            </div>

            {ANDROID_ARCHITECTURE_FILES.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-all ${
                  selectedFile.path === file.path
                    ? 'bg-[#1e2335] text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#151722]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{file.title}</span>
              </button>
            ))}
          </div>

          {/* Right: Code Viewer */}
          <div className="flex-1 bg-[#090a0e] flex flex-col min-h-0 overflow-hidden">
            {/* File Info Bar */}
            <div className="px-4 py-2 bg-[#10121a] border-b border-[#1b1e2c] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold">{selectedFile.path}</span>
              <span className="text-[10px] text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                {selectedFile.language.toUpperCase()}
              </span>
            </div>

            <p className="px-4 py-1.5 text-[11px] text-slate-400 bg-[#0c0e14] border-b border-[#171924]">
              {selectedFile.description}
            </p>

            <div className="p-4 overflow-y-auto overflow-x-auto flex-1 font-mono text-xs text-slate-200 leading-relaxed selection:bg-emerald-500/30">
              <pre className="whitespace-pre">{selectedFile.content}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
