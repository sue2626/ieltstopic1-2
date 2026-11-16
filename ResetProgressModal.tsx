import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, Check, X, Sparkles, Trash2, ShieldAlert } from 'lucide-react';

interface ResetProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetProgressOnly: () => void;
  onResetEverything: () => void;
  stats: {
    masteredCount: number;
    starredCount: number;
    highlightCount: number;
    noteCount: number;
  };
}

export const ResetProgressModal: React.FC<ResetProgressModalProps> = ({
  isOpen,
  onClose,
  onResetProgressOnly,
  onResetEverything,
  stats
}) => {
  const [resetType, setResetType] = useState<'progress' | 'all'>('progress');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/70 dark:bg-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Đặt Lại Tiến Độ & Giao Diện
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Xóa dữ liệu để học lại từ đầu hoặc khôi phục mặc định
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Current Progress Summary to be cleared */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Dữ liệu học tập hiện tại của bạn:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Từ đã thuộc:</span>
                <span className="font-bold text-emerald-600">{stats.masteredCount} từ</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Từ đánh dấu sao:</span>
                <span className="font-bold text-amber-500">{stats.starredCount} từ</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Từ highlight / định dạng:</span>
                <span className="font-bold text-purple-600">{stats.highlightCount} từ</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ghi chú riêng:</span>
                <span className="font-bold text-indigo-600">{stats.noteCount} ghi chú</span>
              </div>
            </div>
          </div>

          {/* Reset Options Selection */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Chọn mức độ đặt lại bạn mong muốn:
            </span>

            {/* Option 1: Progress only */}
            <label
              onClick={() => setResetType('progress')}
              className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                resetType === 'progress'
                  ? 'border-rose-400 dark:border-rose-600 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                type="radio"
                name="resetOption"
                checked={resetType === 'progress'}
                onChange={() => setResetType('progress')}
                className="mt-0.5 text-rose-600 focus:ring-rose-500"
              />
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Chỉ xóa tiến độ học tập (Khuyên dùng)
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Xóa sạch trạng thái đã thuộc, sao, highlight và ghi chú để tập lại từ đầu; <strong>vẫn giữ lại tông màu giao diện bạn đang dùng</strong>.
                </p>
              </div>
            </label>

            {/* Option 2: Full factory reset */}
            <label
              onClick={() => setResetType('all')}
              className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                resetType === 'all'
                  ? 'border-rose-400 dark:border-rose-600 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                type="radio"
                name="resetOption"
                checked={resetType === 'all'}
                onChange={() => setResetType('all')}
                className="mt-0.5 text-rose-600 focus:ring-rose-500"
              />
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Khôi phục toàn bộ về gốc ban đầu (Full Factory Reset)
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Đưa toàn bộ ứng dụng về nguyên bản: xóa tiến độ, đặt lại màu giao diện về mặc định, khôi phục trạng thái bảng ban đầu.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={() => {
              if (resetType === 'progress') {
                onResetProgressOnly();
              } else {
                onResetEverything();
              }
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xác nhận Đặt lại</span>
          </button>
        </div>
      </div>
    </div>
  );
};
