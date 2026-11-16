import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Award, Volume2, VolumeX, X, ChevronUp, ChevronDown, Smile, Trophy } from 'lucide-react';
import { ILLUSTRATIONS } from '../assets/illustrations';
import { ThemeSkin } from '../utils/themeSkins';

interface CuteStudyCompanionProps {
  masteredCount: number;
  totalWords: number;
  themeSkin: ThemeSkin;
}

const ENCOURAGING_MESSAGES = [
  'Bạn ơi, học 1 từ mới là mở thêm 1 cánh cửa tương lai nha! 🌟',
  'Cố lên nha! Mỗi ngày tiến bộ một chút xíu là siêu đỉnh rồi! 🐾',
  'Đừng quên uống chút nước ấm và vươn vai thư giãn nhé! 💧',
  'Chậm mà chắc, từng bước một mình sẽ chinh phục cả 2 topic! 💖',
  'Gâu gâu! Chúc bạn một buổi học từ vựng tràn đầy năng lượng! 🐶✨',
  'Bé luôn ở đây đồng hành và cổ vũ cho bạn học giỏi nha! 🌸',
  'IELTS 7.5+ đang chờ đón bạn phía trước đó, tuyệt vời lắm! 🎓',
];

export const CuteStudyCompanion: React.FC<CuteStudyCompanionProps> = ({
  masteredCount,
  totalWords,
  themeSkin
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    return localStorage.getItem('ielts_mascot_minimized') === 'true';
  });
  const [messageIndex, setMessageIndex] = useState(0);
  const [showHearts, setShowHearts] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Compute EXP & Level
  const exp = masteredCount * 12;
  const levelInfo = (() => {
    if (exp >= 450) return { level: 5, title: 'Bậc Thầy IELTS 8.0', emoji: '🎓', nextThreshold: 600, badge: 'Đỉnh cao' };
    if (exp >= 250) return { level: 4, title: 'Cổ Thụ Tri Thức', emoji: '🌳', nextThreshold: 450, badge: 'Xuất sắc' };
    if (exp >= 120) return { level: 3, title: 'Cây Con Nở Hoa', emoji: '🌸', nextThreshold: 250, badge: 'Tiến bộ vượt bậc' };
    if (exp >= 40) return { level: 2, title: 'Mầm Xanh Chăm Chỉ', emoji: '🌿', nextThreshold: 120, badge: 'Khởi đầu tốt' };
    return { level: 1, title: 'Hạt Mầm Cần Cù', emoji: '🌱', nextThreshold: 40, badge: 'Tập sự' };
  })();

  const progressPercent = Math.min(100, Math.round((exp / levelInfo.nextThreshold) * 100));

  // Rotate message periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % ENCOURAGING_MESSAGES.length);
    }, 14000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleMinimize = () => {
    const next = !isMinimized;
    setIsMinimized(next);
    localStorage.setItem('ielts_mascot_minimized', String(next));
  };

  const handlePetMascot = () => {
    setShowHearts(true);
    // Play gentle cute chime tone via Web Audio API if sound enabled
    if (soundEnabled) {
      playCuteChime();
    }
    setMessageIndex(prev => (prev + 1) % ENCOURAGING_MESSAGES.length);
    setTimeout(() => setShowHearts(false), 1600);
  };

  const playCuteChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay restrictions
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-40 select-none no-print">
      {/* Minimized Cute Floating Bubble */}
      {isMinimized ? (
        <button
          type="button"
          onClick={handleToggleMinimize}
          className="group relative flex items-center gap-2 p-1.5 pr-3.5 bg-white dark:bg-slate-900 rounded-full shadow-xl border-2 hover:scale-105 transition-all cursor-pointer animate-in fade-in"
          style={{ borderColor: themeSkin.colorHex }}
          title="Bấm để mở Trợ lý học tập Corgi dễ thương"
        >
          <div 
            className="relative w-11 h-11 rounded-full overflow-hidden bg-amber-50 ring-2"
            style={{ borderColor: themeSkin.colorHex }}
          >
            <img
              src={ILLUSTRATIONS.mascotCorgi}
              alt="Mascot Corgi"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <span>Bé Corgi</span>
              <span 
                className="text-[10px] px-1 py-0.2 rounded font-bold"
                style={{ 
                  backgroundColor: `${themeSkin.colorHex}25`, 
                  color: themeSkin.colorHex 
                }}
              >
                Lv.{levelInfo.level}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">
              {levelInfo.emoji} {masteredCount} từ thuộc
            </div>
          </div>
          <span 
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"
            style={{ backgroundColor: themeSkin.colorHex }}
          />
        </button>
      ) : (
        /* Expanded Cute Card */
        <div 
          className="w-72 sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl shadow-2xl border-2 overflow-hidden animate-in fade-in zoom-in-95 transition-all"
          style={{ borderColor: themeSkin.colorHex }}
        >
          {/* Header Banner */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-amber-100 via-orange-50 to-rose-100 dark:from-amber-950/60 dark:via-orange-950/40 dark:to-rose-950/60 border-b border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🐾</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Trợ Lý Học Tập Dễ Thương
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                title={soundEnabled ? 'Tắt âm thanh dễ thương' : 'Bật âm thanh dễ thương'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-600" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleToggleMinimize}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                title="Thu nhỏ lại góc màn hình"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-3.5 space-y-3">
            {/* Mascot Avatar & Speech Bubble */}
            <div className="flex items-start gap-3">
              <div
                onClick={handlePetMascot}
                className="relative shrink-0 cursor-pointer group"
                title="Chạm vào bé để nhận lời khen & thả tim nha! 💖"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-amber-300 dark:ring-amber-600 shadow-md group-hover:scale-105 transition-transform bg-amber-50">
                  <img
                    src={ILLUSTRATIONS.mascotCorgi}
                    alt="Mascot Corgi"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Floating Heart Animation */}
                {showHearts && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-rose-500 animate-bounce">
                    <Heart className="w-4 h-4 fill-current" />
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                )}
                <span className="block text-[9px] text-center text-slate-400 dark:text-slate-500 font-medium mt-0.5 group-hover:text-amber-600 transition-colors">
                  Vuốt ve 🐾
                </span>
              </div>

              {/* Chat Speech Bubble */}
              <div className="flex-1 bg-amber-50/80 dark:bg-slate-800/80 rounded-2xl p-2.5 border border-amber-200/70 dark:border-amber-900/40 relative text-xs leading-relaxed text-slate-700 dark:text-slate-200 shadow-xs">
                {/* Speech tail */}
                <div className="absolute top-4 -left-1.5 w-3 h-3 bg-amber-50/80 dark:bg-slate-800/80 border-l border-b border-amber-200/70 dark:border-amber-900/40 rotate-45" />
                <p className="relative font-medium text-[11px] sm:text-xs">
                  {ENCOURAGING_MESSAGES[messageIndex]}
                </p>
              </div>
            </div>

            {/* Level & Tri Thức Progress Bar */}
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <span>{levelInfo.emoji}</span>
                  <span>Cấp {levelInfo.level}: {levelInfo.title}</span>
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded-full">
                  {exp} EXP
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 shadow-xs"
                  style={{ 
                    width: `${progressPercent}%`,
                    backgroundColor: themeSkin.colorHex 
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Đã thuộc {masteredCount} / {totalWords} từ</span>
                <span>{progressPercent}% lên cấp sau</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
