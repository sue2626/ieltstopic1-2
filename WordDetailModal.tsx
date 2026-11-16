import React, { useState } from 'react';
import { 
  X, 
  Volume2, 
  Star, 
  CheckCircle2, 
  Circle, 
  Edit3, 
  Highlighter, 
  BookOpen, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { VocabItem, UserHighlight } from '../types/vocab';
import { speech } from '../utils/speech';
import { AudioWord } from './AudioWord';
import { RichNoteStation } from './RichNoteStation';
import { DirectWordFormatBar } from './DirectWordFormatBar';
import { getContrastTextColor } from '../utils/highlightColors';
import { CustomTextHighlight, normalizeHighlightKey } from '../utils/storage';
import { HighlightableText } from './HighlightableText';

interface WordDetailModalProps {
  item: VocabItem | null;
  onClose: () => void;
  isStarred: boolean;
  masteryStatus: 'new' | 'learning' | 'mastered';
  userNote: string;
  highlight?: UserHighlight;
  customHighlights?: CustomTextHighlight[];
  onToggleStar: () => void;
  onSetMastery: (status: 'new' | 'learning' | 'mastered') => void;
  onSaveNote: (html: string) => void;
  onSaveHighlight: (hl: Partial<UserHighlight> | null) => void;
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({
  item,
  onClose,
  isStarred,
  masteryStatus,
  userNote,
  highlight,
  customHighlights = [],
  onToggleStar,
  onSetMastery,
  onSaveNote,
  onSaveHighlight
}) => {
  const [showNoteEditor, setShowNoteEditor] = useState<boolean>(false);

  if (!item) return null;

  const customHl = customHighlights.find(
    h => normalizeHighlightKey(h.text) === normalizeHighlightKey(item.word)
  );
  const activeColor = highlight?.color || customHl?.bgColor;
  const activeTextColor = highlight?.textColor || customHl?.textColor || (activeColor && activeColor !== 'transparent' ? getContrastTextColor(activeColor) : undefined);
  const isBold = highlight?.isBold || customHl?.isBold;
  const isUnderline = highlight?.isUnderline || customHl?.isUnderline;
  const isItalic = customHl?.isItalic;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div data-vocab-id={item.id} className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Strip */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2.5 py-1 rounded font-semibold uppercase ${
              item.topic === 'environment' 
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800' 
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
            }`}>
              {item.topic === 'environment' ? 'Environment' : 'Education'}
            </span>
            <span className="text-slate-400 font-mono">·</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">{item.dayLabel}</span>
            <span className="text-slate-400 font-mono">·</span>
            <span className="text-slate-500 dark:text-slate-400">{item.tableTitle}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleStar}
              className={`p-1.5 rounded-lg border transition-colors ${
                isStarred 
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-500 border-amber-200 dark:border-amber-800' 
                  : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-amber-400'
              }`}
              title="Đánh dấu sao"
            >
              <Star className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          {/* Main Word Title & Audio */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1
                  style={{
                    backgroundColor: activeColor || 'transparent',
                    color: activeTextColor
                  }}
                  title={customHl?.note ? `📝 Ghi chú: ${customHl.note}` : undefined}
                  className={`text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight px-2 py-0.5 rounded transition-all inline-block ${
                    isUnderline ? 'underline decoration-2 decoration-emerald-500' : ''
                  } ${isBold ? 'font-black' : ''} ${isItalic ? 'italic' : ''}`}
                >
                  {(!activeColor || activeColor === 'transparent') && !isBold && !isUnderline && !isItalic ? (
                    <HighlightableText text={item.word} highlights={customHighlights} />
                  ) : (
                    item.word
                  )}
                </h1>
                <button
                  type="button"
                  onClick={() => speech.speak(item.word)}
                  className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-full transition-colors select-none"
                  title="Nghe phát âm chuẩn"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>

              {item.phonetic && (
                <div className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">
                  {item.phonetic} {item.pos && <span className="text-slate-400">({item.pos})</span>}
                </div>
              )}
            </div>

            {/* Quick Highlight & Format Strip */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Định dạng trực tiếp:</span>
              <DirectWordFormatBar
                wordId={item.id}
                wordText={item.word}
                currentHighlight={highlight}
                onSaveHighlight={(_, hl) => onSaveHighlight(hl)}
              />
            </div>
          </div>

          {/* Vietnamese Definition Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
              Nghĩa Tiếng Việt (Bản dịch chuẩn PDF)
            </span>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
              <HighlightableText text={item.vietnamese} highlights={customHighlights} />
            </div>
          </div>

          {/* Synonyms & Antonyms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Synonyms */}
            <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wider">
                  ✔ Từ Đồng Nghĩa (Synonyms)
                </span>
                <span className="text-[11px] text-sky-600 dark:text-sky-400">Bấm để nghe phát âm</span>
              </div>
              {item.synonyms.length > 0 ? (
                <div className="space-y-1.5 text-sm">
                  {item.synonyms.map((syn, idx) => {
                    const parts = syn.split('=').map(p => p.trim());
                    return (
                      <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                        <AudioWord text={parts[0]} variant="synonym" size="md" highlights={customHighlights} />
                        {parts[1] && (
                          <span className="text-slate-500 dark:text-slate-400 text-xs">
                            = <HighlightableText text={parts[1]} highlights={customHighlights} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Không có trong bảng này</span>
              )}
            </div>

            {/* Antonyms */}
            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider">
                  ✖ Từ Trái Nghĩa (Antonyms)
                </span>
                <span className="text-[11px] text-rose-600 dark:text-rose-400">Bấm để nghe phát âm</span>
              </div>
              {item.antonyms.length > 0 ? (
                <div className="space-y-1.5 text-sm">
                  {item.antonyms.map((ant, idx) => {
                    const parts = ant.split('=').map(p => p.trim());
                    return (
                      <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                        <AudioWord text={parts[0]} variant="antonym" size="md" highlights={customHighlights} />
                        {parts[1] && (
                          <span className="text-slate-500 dark:text-slate-400 text-xs">
                            = <HighlightableText text={parts[1]} highlights={customHighlights} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Không có trong bảng này</span>
              )}
            </div>
          </div>

          {/* Example Sentence Card */}
          {item.example && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Ví dụ thực tế trong ngữ cảnh
                </span>
                <button
                  type="button"
                  onClick={() => speech.speak(item.example!)}
                  className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-semibold select-none"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Nghe toàn câu</span>
                </button>
              </div>

              <p className="text-base font-medium italic text-slate-800 dark:text-slate-200">
                "<HighlightableText text={item.example} highlights={customHighlights} />"
              </p>
              {item.exampleMeaning && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <HighlightableText text={item.exampleMeaning} highlights={customHighlights} />
                </p>
              )}
            </div>
          )}

          {/* User Rich Note Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Ghi chú cá nhân của bạn</span>
              </span>

              <button
                type="button"
                onClick={() => setShowNoteEditor(!showNoteEditor)}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 underline"
              >
                {showNoteEditor ? 'Thu gọn soạn thảo' : userNote ? 'Mở rộng soạn thảo' : '+ Soạn ghi chú'}
              </button>
            </div>

            {showNoteEditor ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <RichNoteStation
                  title={`Ghi chú cho "${item.word}"`}
                  wordContext={item}
                  initialContent={userNote}
                  onSave={onSaveNote}
                />
              </div>
            ) : userNote ? (
              <div 
                className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl text-xs md:text-sm text-slate-800 dark:text-amber-100 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: userNote }}
              />
            ) : (
              <p className="text-xs text-slate-400 italic">
                Chưa có ghi chú riêng cho từ này. Bấm nút "+ Soạn ghi chú" để highlight, đổi màu chữ, gạch chân hoặc ghi nhớ mẹo học.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer: Mastery status toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Trạng thái học:</span>
            {(['new', 'learning', 'mastered'] as const).map(status => (
              <button
                key={status}
                type="button"
                onClick={() => onSetMastery(status)}
                className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  masteryStatus === status
                    ? status === 'mastered'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : status === 'learning'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-slate-700 text-white border-slate-700'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {status === 'mastered' ? 'Đã thuộc ✔' : status === 'learning' ? 'Đang học 🔄' : 'Chưa học'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600 rounded-xl font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
