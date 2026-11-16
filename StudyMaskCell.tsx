import React, { useState } from 'react';
import { Eye } from 'lucide-react';

interface StudyMaskCellProps {
  isMasked: boolean;
  children: React.ReactNode;
  hintText?: string;
  className?: string;
}

/**
 * StudyMaskCell:
 * Khi isMasked = true, nội dung ô sẽ bị làm mờ (blur) và giảm opacity.
 * Khi người dùng rà chuột (hover) vào hoặc chạm (click/tap) trên điện thoại,
 * nội dung sẽ lập tức hiện rõ mồn một.
 */
export const StudyMaskCell: React.FC<StudyMaskCellProps> = ({
  isMasked,
  children,
  hintText = 'Rà chuột / chạm để hiện',
  className = ''
}) => {
  const [touchRevealed, setTouchRevealed] = useState(false);

  if (!isMasked) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      onClick={() => setTouchRevealed(prev => !prev)}
      className={`relative group/mask select-none cursor-pointer transition-all duration-200 min-h-[26px] ${className}`}
      title={touchRevealed ? "Bấm để che lại" : "Rà chuột hoặc chạm vào để mở xem nội dung"}
    >
      <div
        className={`transition-all duration-200 ${
          touchRevealed
            ? 'filter-none opacity-100 blur-0'
            : 'filter blur-[7px] opacity-25 group-hover/mask:filter-none group-hover/mask:opacity-100 group-hover/mask:blur-0'
        }`}
      >
        {children}
      </div>

      {!touchRevealed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover/mask:opacity-0 transition-opacity duration-200 z-10 p-1">
          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-100 dark:bg-slate-100/90 dark:text-slate-900 backdrop-blur-xs shadow-sm flex items-center gap-1 border border-slate-700/50 dark:border-slate-300">
            <Eye className="w-3 h-3 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">{hintText}</span>
            <span className="sm:hidden">Chạm xem</span>
          </span>
        </div>
      )}
    </div>
  );
};
