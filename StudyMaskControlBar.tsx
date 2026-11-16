import React from 'react';
import { Eye, EyeOff, Sparkles, HelpCircle, Check, RotateCcw } from 'lucide-react';
import { StudyMaskState } from '../types/vocab';

interface StudyMaskControlBarProps {
  maskState: StudyMaskState;
  onToggleMask: (key: keyof StudyMaskState) => void;
  onSetAllMasks: (masked: boolean) => void;
}

export const StudyMaskControlBar: React.FC<StudyMaskControlBarProps> = ({
  maskState,
  onToggleMask,
  onSetAllMasks,
}) => {
  const isAnyMasked = Object.values(maskState).some(Boolean);
  const isAllMasked = Object.values(maskState).every(Boolean);

  return (
    <div className="study-mask-bar bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-sky-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 p-3.5 sm:p-4 rounded-2xl border border-emerald-200/80 dark:border-slate-800 shadow-xs space-y-2.5 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
            <EyeOff className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Chế Độ Che Cột Tự Học (Flash Mask)
              </span>
              {isAnyMasked && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-semibold">
                  Đang bật
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Che bớt cột thông tin để tự kiểm tra; <b>rà chuột (hover) hoặc chạm vào ô bất kỳ</b> để hiện chữ ngay tức thì.
            </p>
          </div>
        </div>

        {/* Global Toggle buttons */}
        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
          {isAnyMasked ? (
            <button
              type="button"
              onClick={() => onSetAllMasks(false)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Hiện tất cả</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onToggleMask('meaning')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-xs cursor-pointer"
              title="Che cột nghĩa tiếng Việt để nhìn tiếng Anh nhớ nghĩa"
            >
              <EyeOff className="w-3.5 h-3.5 text-amber-500" />
              <span>Gợi ý: Che nhanh cột Nghĩa</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onSetAllMasks(!isAllMasked)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-xs cursor-pointer ${
              isAllMasked
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>{isAllMasked ? 'Đang che tất cả' : 'Che tất cả'}</span>
          </button>
        </div>
      </div>

      {/* Column mask pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-200/50 dark:border-slate-800/80 text-xs">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
          Chọn cột muốn che:
        </span>

        {/* 1. Từ tiếng Anh */}
        <button
          type="button"
          onClick={() => onToggleMask('word')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
            maskState.word
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-semibold'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          {maskState.word ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
          <span>1. Từ Tiếng Anh</span>
        </button>

        {/* 2. Nghĩa tiếng Việt */}
        <button
          type="button"
          onClick={() => onToggleMask('meaning')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
            maskState.meaning
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-semibold'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          {maskState.meaning ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
          <span>2. Nghĩa Tiếng Việt</span>
        </button>

        {/* 3. Đồng nghĩa & Trái nghĩa */}
        <button
          type="button"
          onClick={() => onToggleMask('synonymAntonym')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
            maskState.synonymAntonym
              ? 'bg-sky-600 text-white border-sky-700 shadow-xs font-semibold'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          {maskState.synonymAntonym ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
          <span>3. Đồng Nghĩa / Trái Nghĩa</span>
        </button>

        {/* 4. Ví dụ thực tế */}
        <button
          type="button"
          onClick={() => onToggleMask('example')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
            maskState.example
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs font-semibold'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          {maskState.example ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
          <span>4. Ví Dụ Thực Tế</span>
        </button>
      </div>
    </div>
  );
};
