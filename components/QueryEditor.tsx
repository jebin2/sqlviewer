import React, { useState } from 'react';
import { Play, Terminal, Copy, Check } from 'lucide-react';
import { Button } from './Button';
import { QueryResult } from '../types';

interface QueryEditorProps {
  onExecute: (sql: string) => void;
  schema: string;
  lastResult: QueryResult | null;
  error: string | null;
}

export const QueryEditor: React.FC<QueryEditorProps> = ({ onExecute, schema, lastResult, error }) => {
  const [query, setQuery] = useState('SELECT * FROM sqlite_master;');
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(query);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 gap-6 overflow-y-auto">
      {/* Editor Section */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[350px]">
        <div className="bg-slate-800 px-5 py-3 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2 text-slate-300">
                <Terminal className="w-5 h-5" />
                <span className="text-base font-mono">SQL Input</span>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                    title="Copy Query"
                >
                    {isCopied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
            </div>
        </div>
        <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-5 font-mono text-base bg-slate-900 text-blue-300 resize-none focus:outline-none leading-relaxed"
            spellCheck={false}
        />
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <Button onClick={() => onExecute(query)}>
                <Play className="w-5 h-5 mr-2 fill-current" />
                Run Query
            </Button>
        </div>
      </div>

      {/* Results Section */}
      {error && (
        <div className="bg-red-50 text-red-700 p-5 rounded-lg border border-red-200 font-mono text-base">
            <strong>Error:</strong> {error}
        </div>
      )}

      {lastResult && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[500px]">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-semibold text-slate-700 text-lg">Result</h3>
                {lastResult.executionTime !== undefined && (
                    <span className="text-sm text-slate-400 font-mono">{lastResult.executionTime.toFixed(2)}ms</span>
                )}
            </div>
            <div className="overflow-auto">
                <table className="w-full text-base text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0">
                        <tr>
                            {lastResult.columns.map((c, i) => (
                                <th key={i} className="px-6 py-3 border-b border-slate-200 whitespace-nowrap">{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {lastResult.values.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                {row.map((val, j) => (
                                    <td key={j} className="px-6 py-3 text-slate-600 whitespace-nowrap max-w-sm truncate">
                                        {val === null ? <span className="text-slate-300 italic">null</span> : String(val)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {lastResult.values.length === 0 && (
                     <div className="p-10 text-center text-slate-500 italic text-lg">Query returned no results.</div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};