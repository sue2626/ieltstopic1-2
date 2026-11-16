import React, { useState, useRef, useEffect } from 'react';
import { Highlighter, Bold, Underline as UnderlineIcon, Trash2, Check, Sparkles, X } from 'lucide-react';
import { UserHighlight } from '../types/vocab';
import { HIGHLIGHT_PALETTE, getContrastTextColor } from '../utils/highlightColors';

interface DirectWordFormatBarProps {
  wordId: string;
  wordText: string;
  currentHighlight?: UserHighlight;
  onSaveHighlight: (id: string, highlight: Partial<UserHighlight> | null) => void;
  className?: string;
  compact?: boolean;
}

export const DirectWordFormatBar: React.FC<DirectWordFormatBarProps> = ({
  wordId,
  wordText,
  currentHighlight,
  onSaveHighlight,
  className = '',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState<{ left: number; top: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or scrolling
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => {
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const handleToggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popWidth = 288; // w-72
      const popHeight = 250;
      const left = Math.max(8, Math.min(window.innerWidth - popWidth - 8, rect.left));
      const openUp = rect.bottom + popHeight > window.innerHeight - 12 && rect.top > popHeight;
      const top = openUp ? Math.max(8, rect.top - popHeight - 6) : Math.min(window.innerHeight - popHeight - 8, rect.bottom + 6);
      setPopoverCoords({ left, top });
    }
    setIsOpen(!isOpen);
  };

  const hasColor = !!(currentHighlight?.color && currentHighlight.color !== 'transparent');
  const hasAnyFormat = !!(
    currentHighlight &&
    (hasColor || currentHighlight.isBold || currentHighlight.isUnderline)
  );

  const handlePickColor = (bg: string, text: string) => {
    // If clicking the same color, toggle back to transparent
    const isSameColor = currentHighlight?.color === bg;
    const newColor = isSameColor ? 'transparent' : bg;
    const newTextColor = isSameColor ? 'inherit' : text;

    if (!newColor || newColor === 'transparent') {
      if (!currentHighlight?.isBold && !currentHighlight?.isUnderline) {
        onSaveHighlight(wordId, null);
        return;
      }
    }

    onSaveHighlight(wordId, {
      color: newColor,
      textColor: newTextColor,
      isBold: currentHighlight?.isBold || false,
      isUnderline: currentHighlight?.isUnderline || false,
    });
  };

  const handleToggleBold = () => {
    const nextBold = !currentHighlight?.isBold;
    if (!nextBold && !currentHighlight?.isUnderline && !hasColor) {
      onSaveHighlight(wordId, null);
      return;
    }

    onSaveHighlight(wordId, {
      isBold: nextBold,
      color: currentHighlight?.color || 'transparent',
      textColor: currentHighlight?.textColor || 'inherit',
      isUnderline: currentHighlight?.isUnderline || false,
    });
  };

  const handleToggleUnderline = () => {
    const nextUnderline = !currentHighlight?.isUnderline;
    if (!nextUnderline && !currentHighlight?.isBold && !hasColor) {
      onSaveHighlight(wordId, null);
      return;
    }

    onSaveHighlight(wordId, {
      isUnderline: nextUnderline,
      color: currentHighlight?.color || 'transparent',
      textColor: currentHighlight?.textColor || 'inherit',
      isBold: currentHighlight?.isBold || false,
    });
  };

  const handleClearAll = () => {
    onSaveHighlight(wordId, null);
    setIsOpen(false);
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggleOpen}
        className={`p-1 rounded-md transition-all flex items-center gap-1 ${
          hasAnyFormat
            ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-emerald-400 dark:ring-emerald-700 font-semibold'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Định dạng trực tiếp: Highlight, In đậm, Gạch chân, Xóa định dạng"
        aria-label="Format word"
      >
        <Highlighter className="w-3.5 h-3.5" />
        {hasAnyFormat && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </button>

      {/* Popover Toolbar */}
      {isOpen && popoverCoords && (
        <div
          style={{ left: `${popoverCoords.left}px`, top: `${popoverCoords.top}px` }}
          className="fixed z-[90] w-72 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 text-xs animate-in fade-in zoom-in-95"
        >
          {/* Header Preview */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Định dạng:</span>
              <span
                style={{
                  backgroundColor: currentHighlight?.color || 'transparent',
                  color: currentHighlight?.textColor || getContrastTextColor(currentHighlight?.color),
                }}
                className={`px-1.5 py-0.5 rounded text-[11px] truncate max-w-[130px] border border-slate-200/50 dark:border-slate-700/50 ${
                  currentHighlight?.isBold ? 'font-bold' : ''
                } ${currentHighlight?.isUnderline ? 'underline decoration-2 decoration-emerald-500' : ''}`}
              >
                {wordText}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Style Buttons (B, U, Xóa) */}
          <div className="flex items-center justify-between gap-1 mb-3 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-1">
              {/* Bold Button */}
              <button
                type="button"
                onClick={handleToggleBold}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all text-xs ${
                  currentHighlight?.isBold
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Bật/Tắt In đậm (Bold)"
              >
                <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>In đậm</span>
              </button>

              {/* Underline Button */}
              <button
                type="button"
                onClick={handleToggleUnderline}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition-all text-xs ${
                  currentHighlight?.isUnderline
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs underline decoration-2'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Bật/Tắt Gạch chân (Underline)"
              >
                <UnderlineIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Gạch dưới</span>
              </button>
            </div>

            {/* Clear Button */}
            {hasAnyFormat && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1 px-2 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-medium transition-colors"
                title="Xóa highlight và bỏ toàn bộ định dạng từ này"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa</span>
              </button>
            )}
          </div>

          {/* Color Palette Grid */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Bảng màu highlight (Tương phản cao)</span>
              <span className="text-[10px] text-slate-400">14 màu</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {HIGHLIGHT_PALETTE.map(color => {
                const isSelected = currentHighlight?.color === color.bg;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => handlePickColor(color.bg, color.text)}
                    className="relative w-7 h-7 rounded-lg border flex items-center justify-center transition-all hover:scale-115 shadow-xs"
                    style={{
                      backgroundColor: color.bg,
                      borderColor: color.border,
                    }}
                    title={`${color.name} (Chữ: ${color.text === '#ffffff' ? 'Trắng' : 'Đen rõ nét'})`}
                  >
                    {isSelected && (
                      <Check
                        className="w-4 h-4 stroke-[3]"
                        style={{ color: color.text }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Notice */}
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>✨ Tự động đồng bộ vào Sổ tay</span>
            {hasAnyFormat && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Đã lưu</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
