import React, { useState } from 'react';
import { 
  Maximize2, Minimize2, Minus, Plus, X, Move, 
  ArrowUp, ArrowDown, Columns, Check
} from 'lucide-react';

export type WidgetWidthSize = 'half' | 'full';
export type WidgetHeightSize = 'compact' | 'standard' | 'expanded';

interface WidgetProps {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isMaximized: boolean;
  isCollapsed: boolean;
  widthSize: WidgetWidthSize;
  heightSize?: WidgetHeightSize;
  index: number;
  totalWidgets: number;
  theme?: 'dark' | 'light';
  onToggleMaximize: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onToggleWidthSize: (id: string) => void;
  onCycleHeightSize?: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onMoveTo: (id: string, targetIndex: number) => void;
  onClose: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (id: string) => void;
  isDragOver?: boolean;
}

export const Widget: React.FC<WidgetProps> = ({
  id,
  title,
  icon: Icon,
  children,
  isMaximized,
  isCollapsed,
  widthSize,
  heightSize = 'standard',
  index,
  totalWidgets,
  theme = 'dark',
  onToggleMaximize,
  onToggleCollapse,
  onToggleWidthSize,
  onCycleHeightSize,
  onMoveUp,
  onMoveDown,
  onMoveTo,
  onClose,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver = false,
}) => {
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const isLight = theme === 'light';

  // Height styles based on user requested height
  const getHeightClasses = () => {
    if (isMaximized) return 'p-4 sm:p-6 min-h-[85vh] max-h-[88vh]';
    if (isCollapsed) return 'hidden';
    switch (heightSize) {
      case 'compact':
        return 'p-3 max-h-[420px]';
      case 'expanded':
        return 'p-4 sm:p-5 min-h-[600px] max-h-[1000px]';
      case 'standard':
      default:
        return 'p-3 sm:p-4 max-h-[820px]';
    }
  };

  return (
    <div
      onDragOver={(e) => onDragOver(e, id)}
      onDrop={() => onDrop(id)}
      className={`rounded-2xl shadow-xl flex flex-col transition-all duration-200 relative backdrop-blur-md border ${
        isLight
          ? isMaximized
            ? 'col-span-full row-span-full z-50 bg-white/70 border-sky-500 shadow-2xl text-slate-900 ring-2 ring-sky-400/30'
            : widthSize === 'full'
            ? 'col-span-full bg-white/50 border-slate-300/80 hover:border-sky-400/60 shadow-lg text-slate-900'
            : 'col-span-1 bg-white/50 border-slate-300/80 hover:border-sky-400/60 shadow-lg text-slate-900'
          : isMaximized
            ? 'col-span-full row-span-full z-50 bg-slate-950/65 border-cyan-500/80 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-slate-100 ring-2 ring-cyan-500/30'
            : widthSize === 'full'
            ? 'col-span-full bg-slate-950/40 border-slate-800/70 hover:border-cyan-500/50 shadow-2xl text-slate-100'
            : 'col-span-1 bg-slate-950/40 border-slate-800/70 hover:border-cyan-500/50 shadow-2xl text-slate-100'
      } ${
        isDragOver 
          ? isLight 
            ? 'border-sky-500 ring-2 ring-sky-400/40 scale-[1.008]' 
            : 'border-cyan-400 ring-2 ring-cyan-400/40 scale-[1.008]' 
          : ''
      }`}
    >
      {/* =========================================================================
          WINDOW TITLE BAR (Move Handle, Title, Universal Control Icons)
          ========================================================================= */}
      <div 
        className={`flex items-center justify-between px-3 sm:px-4 py-2.5 border-b rounded-t-2xl group select-none gap-2 ${
          isLight 
            ? 'bg-white/65 border-slate-200/80 text-slate-800' 
            : 'bg-slate-900/50 border-slate-800/70 text-slate-200'
        }`}
      >
        {/* Left Side: Drag Handle & Title */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0 flex-1">
          {/* Universal Move / Drag Handle */}
          <div
            draggable
            onDragStart={() => onDragStart(id)}
            className={`p-1 rounded cursor-grab active:cursor-grabbing transition-colors flex items-center ${
              isLight 
                ? 'text-slate-400 hover:text-sky-600 hover:bg-slate-100' 
                : 'text-slate-500 hover:text-cyan-400 hover:bg-slate-800/80'
            }`}
            title="Drag to relocate window to any position"
          >
            <Move className="w-3.5 h-3.5" />
          </div>

          {/* Universal Module Icon */}
          <div className={`p-1 rounded-lg flex-shrink-0 ${
            isLight 
              ? 'bg-sky-50 text-sky-600 border border-sky-200/60' 
              : 'bg-slate-800/60 text-cyan-400 border border-slate-700/50'
          }`}>
            <Icon className="w-3.5 h-3.5" />
          </div>

          {/* Window Title */}
          <h3 className={`text-xs font-bold uppercase tracking-wider font-mono truncate ${
            isLight ? 'text-slate-800' : 'text-slate-200'
          }`}>
            {title}
          </h3>

          {/* Location Position Tag (Click to relocate) */}
          <div className="relative">
            <button
              onClick={() => setShowLocationMenu(!showLocationMenu)}
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors border hidden sm:inline-flex items-center space-x-1 cursor-pointer ${
                isLight 
                  ? 'bg-slate-100 text-slate-600 hover:text-sky-600 hover:bg-slate-200 border-slate-300' 
                  : 'bg-slate-800/80 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 border-slate-700/50'
              }`}
              title="Click to jump window to requested slot"
            >
              <span>#{index + 1}</span>
            </button>

            {/* Quick Location Jump Popup */}
            {showLocationMenu && (
              <div className={`absolute left-0 top-full mt-1.5 z-40 rounded-xl shadow-2xl p-2 min-w-[140px] font-mono text-xs border ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-800' 
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}>
                <div className={`text-[10px] pb-1 mb-1 font-bold border-b ${
                  isLight ? 'text-slate-500 border-slate-100' : 'text-slate-400 border-slate-800'
                }`}>
                  Move to Position:
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {Array.from({ length: totalWidgets }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onMoveTo(id, i);
                        setShowLocationMenu(false);
                      }}
                      className={`p-1.5 text-center rounded text-xs transition-colors ${
                        i === index
                          ? isLight 
                            ? 'bg-sky-500 text-white font-bold' 
                            : 'bg-cyan-500 text-slate-950 font-bold'
                          : isLight 
                            ? 'hover:bg-slate-100 text-slate-700' 
                            : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      #{i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Collapsed Pill Indicator */}
          {isCollapsed && (
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400'
            }`}>
              Collapsed
            </span>
          )}
        </div>

        {/* Right Side: Universal Window Control Symbols */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0">
          
          {/* Universal Move Earlier (Up / Left) */}
          <button
            onClick={() => onMoveUp(id)}
            disabled={index === 0}
            className={`p-1.5 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors ${
              isLight 
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Move window up / earlier"
            aria-label="Move window up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          {/* Universal Move Later (Down / Right) */}
          <button
            onClick={() => onMoveDown(id)}
            disabled={index === totalWidgets - 1}
            className={`p-1.5 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors ${
              isLight 
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Move window down / later"
            aria-label="Move window down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          {/* Universal Width Size Toggle: 1-Column Half vs Full Width */}
          {!isMaximized && (
            <button
              onClick={() => onToggleWidthSize(id)}
              className={`p-1.5 rounded-lg transition-colors ${
                widthSize === 'full' 
                  ? isLight 
                    ? 'bg-sky-100 text-sky-700 border border-sky-300' 
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : isLight 
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
              title={widthSize === 'full' ? 'Switch to Half-Width' : 'Expand to Full-Width'}
              aria-label="Toggle window width"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Universal Collapse / Expand Toggle */}
          <button
            onClick={() => onToggleCollapse(id)}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight 
                ? 'text-slate-500 hover:text-sky-600 hover:bg-slate-100' 
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80'
            }`}
            title={isCollapsed ? 'Expand Window' : 'Collapse Window'}
            aria-label={isCollapsed ? 'Expand Window' : 'Collapse Window'}
          >
            {isCollapsed ? (
              <Plus className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Universal Maximize / Restore Toggle */}
          <button
            onClick={() => onToggleMaximize(id)}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight 
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
            title={isMaximized ? 'Restore Down' : 'Maximize Window'}
            aria-label={isMaximized ? 'Restore Down' : 'Maximize Window'}
          >
            {isMaximized ? (
              <Minimize2 className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Universal Close Window Symbol */}
          <button
            onClick={() => onClose(id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors ml-0.5"
            title="Close Window"
            aria-label="Close Window"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          WINDOW BODY CONTENT (Hidden when collapsed)
          ========================================================================= */}
      {!isCollapsed && (
        <div 
          className={`flex-1 overflow-auto rounded-b-2xl custom-scrollbar ${getHeightClasses()}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};
