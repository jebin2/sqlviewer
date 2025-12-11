import React, { useState, useEffect, useRef } from 'react';
import { TableInfo } from '../types';
import { Key, GitMerge, GripHorizontal } from 'lucide-react';

interface SchemaVisualizerProps {
  tables: TableInfo[];
}

interface Position {
  x: number;
  y: number;
}

export const SchemaVisualizer: React.FC<SchemaVisualizerProps> = ({ tables }) => {
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  // Card dimensions for line calculation
  const CARD_WIDTH = 280;
  
  // Initialize positions in a grid layout
  useEffect(() => {
    const newPositions: Record<string, Position> = {};
    const GRID_COLS = 3;
    const X_SPACING = 350;
    const Y_SPACING = 400;
    const PADDING = 50;

    tables.forEach((table, index) => {
      const col = index % GRID_COLS;
      const row = Math.floor(index / GRID_COLS);
      newPositions[table.name] = {
        x: PADDING + col * X_SPACING,
        y: PADDING + row * Y_SPACING
      };
    });
    setPositions(newPositions);
  }, [tables.length]); // Only re-calc if table count changes drastically (initial load)

  const handleMouseDown = (e: React.MouseEvent, tableName: string) => {
    e.stopPropagation();
    const pos = positions[tableName];
    setDraggedTable(tableName);
    setOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedTable) return;
    
    setPositions(prev => ({
      ...prev,
      [draggedTable]: {
        x: e.clientX - offset.x,
        y: e.clientY - offset.y
      }
    }));
  };

  const handleMouseUp = () => {
    setDraggedTable(null);
  };

  // Helper to draw bezier curves
  const renderConnections = () => {
    const lines = [];
    
    for (const table of tables) {
      if (!positions[table.name]) continue;
      
      const startPos = positions[table.name];

      table.foreignKeys.forEach((fk, idx) => {
        const targetTable = tables.find(t => t.name === fk.toTable);
        if (targetTable && positions[targetTable.name]) {
          const endPos = positions[targetTable.name];
          
          // Simple anchor points: Right of source -> Left of target
          // Or automatic based on relative position
          
          const startX = startPos.x + CARD_WIDTH;
          const startY = startPos.y + 60 + (idx * 20); // rough approximation of row height
          
          const endX = endPos.x;
          const endY = endPos.y + 40; // Connect to top area of target

          // Bezier Control Points
          const cp1x = startX + 50;
          const cp1y = startY;
          const cp2x = endX - 50;
          const cp2y = endY;

          const path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
          
          // Generate a color based on table name hash for variety
          const colorHash = table.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
          const color = colors[colorHash % colors.length];

          lines.push(
            <g key={`${table.name}-${fk.toTable}-${idx}`}>
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeOpacity="0.6"
              />
              <circle cx={startX} cy={startY} r="3" fill={color} />
              <polygon points={`${endX},${endY} ${endX-6},${endY-3} ${endX-6},${endY+3}`} fill={color} />
            </g>
          );
        }
      });
    }
    return lines;
  };

  return (
    <div 
      className="flex-1 overflow-hidden bg-slate-100 relative cursor-grab active:cursor-grabbing"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ 
                 backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
                 backgroundSize: '20px 20px' 
             }} 
        />

        {/* Connections Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
            {renderConnections()}
        </svg>

        {/* Nodes Layer */}
        <div className="absolute inset-0 overflow-auto">
             {/* We use a large container to allow scrolling if nodes are dragged far */}
            <div className="w-[3000px] h-[3000px] relative">
                {tables.map(table => {
                    const pos = positions[table.name] || { x: 0, y: 0 };
                    
                    return (
                        <div
                            key={table.name}
                            className="absolute bg-white rounded-lg shadow-md border border-slate-200 flex flex-col w-[280px] z-10 transition-shadow hover:shadow-xl hover:ring-1 hover:ring-blue-400"
                            style={{
                                transform: `translate(${pos.x}px, ${pos.y}px)`,
                            }}
                        >
                            {/* Header */}
                            <div 
                                className="bg-slate-50 p-3 border-b border-slate-200 rounded-t-lg cursor-move flex items-center justify-between group"
                                onMouseDown={(e) => handleMouseDown(e, table.name)}
                            >
                                <span className="font-bold text-slate-700 truncate" title={table.name}>{table.name}</span>
                                <GripHorizontal className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                            </div>

                            {/* Columns */}
                            <div className="p-2 space-y-1">
                                {table.columns.map(col => {
                                    const isFk = table.foreignKeys.some(fk => fk.from === col.name);
                                    
                                    return (
                                        <div key={col.name} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-slate-50">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {col.primaryKey && <Key className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                                                {isFk && <GitMerge className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                                                <span className={`truncate ${col.primaryKey ? 'font-semibold text-slate-800' : 'text-slate-600'}`} title={col.name}>
                                                    {col.name}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-400 font-mono ml-2 flex-shrink-0">{col.type}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* FK Footer if exists */}
                            {table.foreignKeys.length > 0 && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-2 text-xs text-slate-500 space-y-1">
                                    {table.foreignKeys.map((fk, i) => (
                                        <div key={i} className="flex items-center gap-1 overflow-hidden">
                                            <GitMerge className="w-3 h-3 text-blue-400" />
                                            <span className="truncate">
                                                {fk.from} → {fk.toTable}.{fk.toColumn}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};
