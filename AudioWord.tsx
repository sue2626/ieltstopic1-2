import React, { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { speech } from '../utils/speech';
import { CustomTextHighlight } from '../utils/storage';
import { HighlightableText } from './HighlightableText';

interface AudioWordProps {
  text: string;
  cleanWord?: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'synonym' | 'antonym' | 'neutral' | 'subtle';
  isButton?: boolean;
  highlights?: CustomTextHighlight[];
}

export const AudioWord: React.FC<AudioWordProps> = ({
  text,
  cleanWord,
  className = '',
  showIcon = true,
  size = 'md',
  variant = 'primary',
  isButton = true,
  highlights
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const targetToSpeak = cleanWord || text;

  useEffect(() => {
    const unsubscribe = speech.subscribe((isSpeaking, spokenText) => {
      if (isSpeaking && spokenText.toLowerCase().trim() === targetToSpeak.toLowerCase().replace(/[✔✖=·\/\(\)]/g, ' ').replace(/\s+/g, ' ').trim()) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    });
    return unsubscribe;
  }, [targetToSpeak]);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speech.speak(targetToSpeak);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'text-slate-900 dark:text-slate-100 font-semibold hover:text-emerald-700 dark:hover:text-emerald-400';
      case 'synonym':
        return 'text-sky-700 dark:text-sky-300 font-medium hover:text-sky-900 dark:hover:text-sky-200';
      case 'antonym':
        return 'text-rose-700 dark:text-rose-300 font-medium hover:text-rose-900 dark:hover:text-rose-200';
      case 'subtle':
        return 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white';
      default:
        return 'text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400';
    }
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  const handleWordClick = (e: React.MouseEvent) => {
    // If the user was selecting text, don't trigger speech
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) {
      return;
    }
    e.stopPropagation();
    speech.speak(targetToSpeak);
  };

  if (!isButton) {
    return (
      <span className={`inline-flex items-center gap-1 ${getVariantStyles()} ${className}`}>
        <HighlightableText text={text} highlights={highlights} />
        {showIcon && (
          <button
            type="button"
            onClick={handleSpeak}
            className={`p-0.5 rounded text-slate-400 hover:text-emerald-600 transition-colors select-none ${isPlaying ? 'text-emerald-600 animate-pulse' : ''}`}
            title={`Nghe phát âm: "${targetToSpeak}"`}
          >
            <Volume2 className={iconSizes[size]} />
          </button>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-left group transition-colors ${getVariantStyles()} ${className} ${isPlaying ? 'ring-2 ring-emerald-400 rounded px-1 -mx-1' : ''}`}
    >
      <span
        onClick={handleWordClick}
        className="cursor-pointer hover:underline"
        title={`Bấm nghe phát âm: "${targetToSpeak}" (hoặc bôi đen để highlight)`}
      >
        <HighlightableText text={text} highlights={highlights} />
      </span>
      {showIcon && (
        <button
          type="button"
          onClick={handleSpeak}
          className={`shrink-0 p-0.5 rounded text-slate-400 hover:text-emerald-600 transition-colors select-none ${isPlaying ? 'text-emerald-600 animate-pulse' : ''}`}
          title={`Nghe phát âm: "${targetToSpeak}"`}
        >
          <Volume2 className={iconSizes[size]} />
        </button>
      )}
    </span>
  );
};

/**
 * Helper to render comma or slash separated terms with individual speech triggers
 */
export const AudioTermList: React.FC<{
  terms: string[];
  variant?: 'synonym' | 'antonym' | 'neutral';
  prefix?: string;
}> = ({ terms, variant = 'neutral', prefix = '' }) => {
  if (!terms || terms.length === 0) return <span>—</span>;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {prefix && <span className="text-slate-400 text-xs font-mono select-none">{prefix}</span>}
      {terms.map((term, index) => {
        // Handle forms like "deal with / tackle = xử lý"
        // or "complete = hoàn chỉnh"
        const parts = term.split('=').map(p => p.trim());
        const englishPart = parts[0];
        const vietnameseMeaning = parts[1];

        // Also check if englishPart has slash "/" e.g. "discuss / exchange opinions"
        const subTerms = englishPart.split('/').map(s => s.trim());

        return (
          <span key={index} className="inline-flex items-center gap-1 text-xs md:text-sm">
            {subTerms.map((st, sIdx) => (
              <React.Fragment key={sIdx}>
                {sIdx > 0 && <span className="text-slate-300">/</span>}
                <AudioWord
                  text={st}
                  variant={variant}
                  size="sm"
                />
              </React.Fragment>
            ))}
            {vietnameseMeaning && (
              <span className="text-slate-500 text-xs">
                = {vietnameseMeaning}
              </span>
            )}
            {index < terms.length - 1 && <span className="text-slate-300">·</span>}
          </span>
        );
      })}
    </div>
  );
};
