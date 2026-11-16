import React, { useState } from 'react';
import { 
  Table, 
  Layers, 
  CheckSquare, 
  FileText, 
  Volume2, 
  BookMarked,
  Sun,
  Moon,
  Smartphone,
  Laptop,
  RotateCcw
} from 'lucide-react';
import { TopicId } from '../types/vocab';
import { speech } from '../utils/speech';
import { ThemeSkin, ThemeSkinId } from '../utils/themeSkins';
import { ThemeSkinPicker } from './ThemeSkinPicker';

export type ActiveTab = 'table' | 'flashcard' | 'quiz';
export type LayoutMode = 'horizontal' | 'vertical';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentTopic: TopicId;
  setCurrentTopic: (topic: TopicId) => void;
  onOpenPdfModal: () => void;
  onOpenNotebook: () => void;
  onOpenResetModal: () => void;
  starredCount: number;
  highlightedCount?: number;
  isDark: boolean;
  onToggleTheme: () => void;
  currentSkin: ThemeSkin;
  onSelectSkin: (skinId: ThemeSkinId) => void;
  layoutMode: LayoutMode;
  onToggleLayoutMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentTopic,
  setCurrentTopic,
  onOpenPdfModal,
  onOpenNotebook,
  onOpenResetModal,
  starredCount,
  highlightedCount = 0,
  isDark,
  onToggleTheme,
  currentSkin,
  onSelectSkin,
  layoutMode,
  onToggleLayoutMode
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(speech.getRate());
  const [speechVoice, setSpeechVoice] = useState<'en-US' | 'en-GB'>(speech.getVoice());

  const handleRateChange = (newRate: number) => {
    setSpeechRate(newRate);
    speech.setRate(newRate);
  };

  const handleVoiceChange = (v: 'en-US' | 'en-GB') => {
    setSpeechVoice(v);
    speech.setVoice(v);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 lg:gap-5 px-4 sm:px-6 py-2.5">
        {/* Zone 1: Single text element wordmark with cute theme accent */}
        <div className="flex items-center gap-2 shrink-0">
          <span 
            className="w-2.5 h-2.5 rounded-full transition-transform duration-300 shadow-xs hover:scale-125"
            style={{ backgroundColor: currentSkin.colorHex }}
            title={`Giao diện: ${currentSkin.nameVi}`}
          />
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('table');
            }}
            className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap"
          >
            IELTS Vocab Master
          </a>
        </div>

        {/* Zone 2: 4–5 clean single-line nav links with dynamic skin color */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4 xl:gap-5 text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setActiveTab('table')}
            className={`whitespace-nowrap pb-1 border-b-2 transition-all cursor-pointer ${
              activeTab === 'table' 
                ? 'theme-tab-active' 
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
            style={activeTab === 'table' ? { color: currentSkin.colorHex, borderBottomColor: currentSkin.colorHex } : undefined}
          >
            Bảng PDF Gốc
          </button>

          <button
            onClick={() => setActiveTab('flashcard')}
            className={`whitespace-nowrap pb-1 border-b-2 transition-all cursor-pointer ${
              activeTab === 'flashcard' 
                ? 'theme-tab-active' 
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
            style={activeTab === 'flashcard' ? { color: currentSkin.colorHex, borderBottomColor: currentSkin.colorHex } : undefined}
          >
            Flashcard
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`whitespace-nowrap pb-1 border-b-2 transition-all cursor-pointer ${
              activeTab === 'quiz' 
                ? 'theme-tab-active' 
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
            style={activeTab === 'quiz' ? { color: currentSkin.colorHex, borderBottomColor: currentSkin.colorHex } : undefined}
          >
            Trắc Nghiệm
          </button>

          <button
            onClick={onOpenNotebook}
            className="whitespace-nowrap pb-1 border-b-2 border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            title="Sổ tay gom tất cả từ đã highlight, in đậm, gạch chân"
          >
            <BookMarked className="w-4 h-4 transition-colors" style={{ color: currentSkin.colorHex }} />
            <span>Sổ Tay</span>
            {highlightedCount > 0 && (
              <span 
                className="px-1.5 py-0.2 rounded-full text-[10px] font-bold border transition-colors"
                style={{ 
                  backgroundColor: isDark ? currentSkin.pageBgDark : currentSkin.pageBgLight, 
                  color: currentSkin.colorHex,
                  borderColor: currentSkin.colorHex
                }}
              >
                {highlightedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 primary action button + Quick Utility Toggles */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Cute Color Theme Skin Picker */}
          <ThemeSkinPicker
            currentSkin={currentSkin}
            onSelectSkin={onSelectSkin}
            isDark={isDark}
            onToggleTheme={onToggleTheme}
          />

          {/* Orientation Mode: Dọc (Điện thoại) vs Ngang (Laptop) */}
          <button
            type="button"
            onClick={onToggleLayoutMode}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors"
            title={layoutMode === 'horizontal' ? 'Chuyển sang Chế độ Dọc (Điện thoại)' : 'Chuyển sang Chế độ Ngang (Laptop)'}
          >
            {layoutMode === 'horizontal' ? (
              <>
                <Laptop className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden xl:inline">Ngang</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden xl:inline">Dọc</span>
              </>
            )}
          </button>

          {/* Theme Toggle: Sáng / Tối */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            title={isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Reset / Đặt lại tiến độ ban đầu */}
          <button
            type="button"
            onClick={onOpenResetModal}
            className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Đặt lại tiến độ học tập hoặc khôi phục ban đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Audio TTS Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              title="Cài đặt phát âm (Giọng đọc & Tốc độ)"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {showSettings && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 space-y-3.5 text-xs text-slate-700 dark:text-slate-200">
                <div className="font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                  Cài Đặt Phát Âm (Audio TTS)
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Giọng Đọc Tiếng Anh</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleVoiceChange('en-US')}
                      className={`p-1.5 rounded-lg border text-center font-medium ${
                        speechVoice === 'en-US' 
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-semibold' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Anh - Mỹ (US)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVoiceChange('en-GB')}
                      className={`p-1.5 rounded-lg border text-center font-medium ${
                        speechVoice === 'en-GB' 
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-semibold' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Anh - Anh (UK)
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-500 dark:text-slate-400 font-medium">Tốc độ đọc</label>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{speechRate.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.3"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Chậm (0.7x)</span>
                    <span>Chuẩn (1.0x)</span>
                    <span>Nhanh (1.3x)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => speech.speak('The rapid implementation of renewable energy protects the environment.')}
                  className="w-full py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-lg transition-colors text-center"
                >
                  Nghe thử câu mẫu
                </button>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onOpenPdfModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-xl hover:opacity-90 transition-all whitespace-nowrap shadow-xs cursor-pointer"
            style={{ backgroundColor: currentSkin.colorHex }}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Gốc</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 px-2 py-2 text-xs font-medium text-slate-600 dark:text-slate-300">
        <button
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
            activeTab === 'table' ? 'bg-white dark:bg-slate-800 font-bold shadow-xs' : ''
          }`}
          style={activeTab === 'table' ? { color: currentSkin.colorHex } : undefined}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Bảng</span>
        </button>

        <button
          onClick={() => setActiveTab('flashcard')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
            activeTab === 'flashcard' ? 'bg-white dark:bg-slate-800 font-bold shadow-xs' : ''
          }`}
          style={activeTab === 'flashcard' ? { color: currentSkin.colorHex } : undefined}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Thẻ</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
            activeTab === 'quiz' ? 'bg-white dark:bg-slate-800 font-bold shadow-xs' : ''
          }`}
          style={activeTab === 'quiz' ? { color: currentSkin.colorHex } : undefined}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Trắc nghiệm</span>
        </button>

        <button
          onClick={onOpenNotebook}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 relative"
        >
          <BookMarked className="w-3.5 h-3.5" style={{ color: currentSkin.colorHex }} />
          <span>Sổ tay</span>
          {highlightedCount > 0 && (
            <span 
              className="w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-xs"
              style={{ backgroundColor: currentSkin.colorHex }}
            >
              {highlightedCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
