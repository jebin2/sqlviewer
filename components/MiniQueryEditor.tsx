import React, { useState, useEffect } from 'react';
import { Play, Terminal, Copy, Check, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface MiniQueryEditorProps {
    onExecute: (sql: string) => void;
    onReset: () => void;
    initialQuery?: string;
    tableName: string;
}

export const MiniQueryEditor: React.FC<MiniQueryEditorProps> = ({ onExecute, onReset, initialQuery = '', tableName }) => {
    const [query, setQuery] = useState(initialQuery);
    const [isCopied, setIsCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (tableName) {
            setQuery(`SELECT * FROM "${tableName}" LIMIT 100;`);
        }
    }, [tableName]);


    const copyToClipboard = () => {
        navigator.clipboard.writeText(query);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            onExecute(query);
        }
    };

    return (
        <div className="bg-white border-b border-slate-200 shadow-sm transition-all duration-300">
            <div
                className="flex items-center justify-between px-6 py-2 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                    <Terminal className="w-4 h-4" />
                    <span>Mini SQL Editor</span>
                </div>
                <button className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {isExpanded && (
                <div className="p-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="relative rounded-lg border border-slate-300 overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full h-32 p-4 font-mono text-sm bg-slate-900 text-blue-300 resize-y focus:outline-none leading-relaxed"
                            placeholder="Enter SQL query..."
                            spellCheck={false}
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                            <button
                                onClick={copyToClipboard}
                                className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors backdrop-blur-sm"
                                title="Copy Query"
                            >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                        <span className="text-xs text-slate-400">
                            Press <kbd className="font-sans px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-500">Ctrl</kbd> + <kbd className="font-sans px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-500">Enter</kbd> to run
                        </span>
                        <div className="flex gap-2">
                            <Button onClick={onReset} variant="secondary" size="sm">
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                Reset
                            </Button>
                            <Button onClick={() => onExecute(query)} size="sm">
                                <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                                Run Query
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
