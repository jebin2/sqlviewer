import React, { useCallback, useState } from 'react';
import { Database, Upload, FileType, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-2xl mb-6">
            <Database className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Lumina SQLite Viewer</h1>
          <p className="text-lg text-slate-600">
            Secure, client-side database explorer. Your data never leaves your browser.
          </p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative group rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out
            flex flex-col items-center justify-center p-12 bg-white
            ${isDragging 
              ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-xl' 
              : 'border-slate-200 hover:border-blue-400 hover:shadow-lg'
            }
          `}
        >
          <input
            type="file"
            accept=".db,.sqlite,.sqlite3"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={isProcessing}
          />
          
          {isProcessing ? (
            <div className="flex flex-col items-center animate-pulse">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-lg font-medium text-slate-700">Processing database...</p>
              <p className="text-sm text-slate-500">Initializing WASM engine</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Drop your database file here
              </h3>
              <p className="text-slate-500 mb-8 text-center max-w-sm">
                Supports .sqlite, .db, .sqlite3 files. 
              </p>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm font-medium text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                <FileType className="w-4 h-4" />
                <span>Browse Files</span>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Powered by SQL.js & React</p>
        </div>
      </div>
    </div>
  );
};
