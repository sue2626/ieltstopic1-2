import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles, X, Moon, Sun } from 'lucide-react';
import { THEME_SKINS, ThemeSkin, ThemeSkinId } from '../utils/themeSkins';

interface ThemeSkinPickerProps {
  currentSkin: ThemeSkin;
  onSelectSkin: (skinId: ThemeSkinId) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  className?: string;
}

export const ThemeSkinPicker: React.FC<ThemeSkinPickerProps> = ({
  currentSkin,
  onSelectSkin,
  isDark = true,
  onToggleTheme,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border transition-all shadow-xs cursor-pointer"
        style={{ borderColor: `${currentSkin.colorHex}60` }}
        title="Đổi màu nền Pastel Tối & Tông màu giao diện"
      >
        <span className="text-sm">{currentSkin.emoji}</span>
        <span className="hidden sm:inline font-bold" style={{ color: currentSkin.colorHex }}>{currentSkin.nameVi}</span>
        <Palette className="w-3.5 h-3.5 ml-0.5" style={{ color: currentSkin.colorHex }} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-76 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 text-xs animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
              <Sparkles className="w-4 h-4" style={{ color: currentSkin.colorHex }} />
              <span>Màu Nền Pastel</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {onToggleTheme && (
            <div className="grid grid-cols-2 gap-1.5 mb-2.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  if (!isDark) onToggleTheme();
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Moon className="w-3.5 h-3.5" style={{ color: isDark ? currentSkin.colorHex : undefined }} />
                <span>Pastel Tối</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isDark) onToggleTheme();
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Pastel Sáng</span>
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            {THEME_SKINS.map(skin => {
              const isSelected = currentSkin.id === skin.id;
              const previewBg = isDark ? skin.pageBgDark : skin.pageBgLight;
              return (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => {
                    onSelectSkin(skin.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'text-slate-900 dark:text-white font-bold shadow-xs'
                      : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                  style={isSelected ? {
                    borderColor: skin.colorHex,
                    backgroundColor: `${skin.colorHex}20`,
                  } : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{skin.emoji}</span>
                    <div>
                      <div className="text-xs font-semibold" style={isSelected ? { color: skin.colorHex } : undefined}>
                        {skin.nameVi}
                      </div>
                      <div className="text-[10px] text-slate-400">{skin.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-400/50 shadow-xs"
                      style={{ backgroundColor: previewBg }}
                      title="Màu nền"
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs"
                      style={{ backgroundColor: skin.colorHex }}
                      title="Màu nhấn"
                    />
                    {isSelected && (
                      <Check className="w-4 h-4 stroke-[2.5]" style={{ color: skin.colorHex }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
