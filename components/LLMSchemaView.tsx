import React, { useState } from 'react';
import { Copy, Check, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from './Button';

interface LLMSchemaViewProps {
    schema: string;
}

export const LLMSchemaView: React.FC<LLMSchemaViewProps> = ({ schema }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(schema);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 gap-6 overflow-hidden">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 mb-1">LLM Ready Schema</h2>
                            <p className="text-slate-500 max-w-2xl">
                                This schema is formatted to be easily understood by AI models like ChatGPT, Claude, or Gemini.
                                Copy this and paste it into your prompt to get help with query optimization, schema improvements, or generating complex SQL.
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleCopy} size="lg" className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20">
                        {isCopied ? (
                            <>
                                <Check className="w-5 h-5 mr-2" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="w-5 h-5 mr-2" />
                                Copy Schema
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 bg-slate-900 rounded-xl shadow-inner border border-slate-800 overflow-hidden flex flex-col">
                <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">schema.sql</span>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-6">
                    <pre className="font-mono text-sm text-purple-300 whitespace-pre-wrap leading-relaxed">
                        {schema || "-- No schema available"}
                    </pre>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
                <div className="flex-shrink-0 bg-white p-4 rounded-lg border border-slate-200 shadow-sm w-72">
                    <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        <span>Optimization Prompt</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Ask AI to optimize your tables.</p>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100 text-xs text-slate-600 font-mono mb-2">
                        "Here is my SQLite schema. Can you suggest indexes to improve query performance?"
                    </div>
                </div>

                <div className="flex-shrink-0 bg-white p-4 rounded-lg border border-slate-200 shadow-sm w-72">
                    <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
                        <MessageSquare className="w-4 h-4 text-green-500" />
                        <span>Query Generation</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Generate complex queries easily.</p>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100 text-xs text-slate-600 font-mono mb-2">
                        "Based on this schema, write a query to find the top 5 users by order volume in 2024."
                    </div>
                </div>

                <div className="flex-shrink-0 bg-white p-4 rounded-lg border border-slate-200 shadow-sm w-72">
                    <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
                        <MessageSquare className="w-4 h-4 text-amber-500" />
                        <span>Explanation</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Understand complex relationships.</p>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100 text-xs text-slate-600 font-mono mb-2">
                        "Explain the relationship between the 'orders' and 'products' tables in this schema."
                    </div>
                </div>
            </div>
        </div>
    );
};
