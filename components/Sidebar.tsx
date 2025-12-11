import React, { useMemo, useState } from 'react';
import { TableInfo, ViewMode } from '../types';
import { 
  Table, 
  Search, 
  Database, 
  Layers, 
  ChevronRight, 
  ChevronDown, 
  Hash, 
  Type, 
  Calendar, 
  CheckCircle2, 
  Key,
  Binary,
  Workflow
} from 'lucide-react';

interface SidebarProps {
  tables: TableInfo[];
  selectedTable: string | null;
  onSelectTable: (tableName: string) => void;
  onModeChange: (mode: ViewMode) => void;
  currentMode: ViewMode;
  dbName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  tables, 
  selectedTable, 
  onSelectTable,
  onModeChange,
  currentMode,
  dbName
}) => {
  const [search, setSearch] = useState('');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const filteredTables = useMemo(() => {
    return tables.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  }, [tables, search]);

  const toggleTable = (e: React.MouseEvent, tableName: string) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  // Auto-expand selected table
  React.useEffect(() => {
    if (selectedTable) {
      setExpandedTables(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedTable);
        return newSet;
      });
    }
  }, [selectedTable]);

  const getColumnIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('INT') || t.includes('REAL') || t.includes('NUM') || t.includes('FLOAT') || t.includes('DOUBLE')) {
      return <Hash className="w-3.5 h-3.5" />;
    }
    if (t.includes('DATE') || t.includes('TIME')) {
      return <Calendar className="w-3.5 h-3.5" />;
    }
    if (t.includes('BOOL')) {
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    }
    if (t.includes('BLOB') || t.includes('BIN')) {
      return <Binary className="w-3.5 h-3.5" />;
    }
    return <Type className="w-3.5 h-3.5" />;
  };

  const menuButtonClass = (isActive: boolean) => `
    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200
    ${isActive 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 ring-1 ring-blue-500' 
      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700'
    }
  `;

  return (
    <div className="w-80 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 flex-shrink-0 font-sans">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3 text-white mb-2">
          <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
             <Database className="w-5 h-5" />
          </div>
          <span className="font-semibold truncate text-base" title={dbName}>{dbName}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-500 pl-1">
          <span>{tables.length} tables found</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <button
          onClick={() => onModeChange('QUERY')}
          className={menuButtonClass(currentMode === 'QUERY')}
        >
          <Layers className="w-5 h-5" />
          <span>SQL Editor</span>
        </button>

        <button
          onClick={() => onModeChange('SCHEMA')}
          className={menuButtonClass(currentMode === 'SCHEMA')}
        >
          <Workflow className="w-5 h-5" />
          <span>Relations Diagram</span>
        </button>

        <div className="relative group mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Filter tables..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2.5 text-base text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-4 mt-2">Database Schema</div>
        
        <div className="space-y-1">
          {filteredTables.map((table) => {
            const isExpanded = expandedTables.has(table.name);
            const isSelected = selectedTable === table.name && currentMode === 'BROWSE';

            return (
              <div key={table.name} className="select-none">
                <div
                  onClick={() => {
                    onSelectTable(table.name);
                    onModeChange('BROWSE');
                  }}
                  className={`
                    group w-full flex items-center justify-between px-3 py-2.5 rounded-md text-base transition-all cursor-pointer border border-transparent
                    ${isSelected
                      ? 'bg-slate-800 text-white border-slate-700' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <button 
                      onClick={(e) => toggleTable(e, table.name)}
                      className={`p-1 rounded hover:bg-slate-700/50 transition-colors ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <Table className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span className="truncate font-medium">{table.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${isSelected ? 'bg-slate-950 text-slate-400' : 'bg-slate-800/50 text-slate-600'}`}>
                    {table.rowCount.toLocaleString()}
                  </span>
                </div>

                {isExpanded && (
                  <div className="ml-5 mt-1 pl-4 border-l border-slate-800 space-y-0.5 mb-2">
                    {table.columns.map((col) => (
                      <div key={col.name} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 rounded cursor-default group/col">
                        <span className={`${col.primaryKey ? 'text-yellow-500' : 'text-slate-600 group-hover/col:text-slate-500'}`}>
                           {col.primaryKey ? <Key className="w-3.5 h-3.5" /> : getColumnIcon(col.type)}
                        </span>
                        <span className={`truncate ${col.primaryKey ? 'text-yellow-500/90 font-medium' : ''}`}>{col.name}</span>
                        <span className="ml-auto text-[10px] uppercase text-slate-600 opacity-50 group-hover/col:opacity-100">{col.type}</span>
                      </div>
                    ))}
                    {table.columns.length === 0 && (
                        <div className="px-3 py-1 text-sm text-slate-600 italic">No columns info</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredTables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-600">
            <Search className="w-10 h-10 mb-3 opacity-20" />
            <span className="text-sm">No tables match your search</span>
          </div>
        )}
      </div>
    </div>
  );
};