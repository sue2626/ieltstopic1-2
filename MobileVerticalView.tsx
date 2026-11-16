import React, { useState } from 'react';
import { 
  Volume2, 
  Star, 
  Edit3, 
  Highlighter, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  BookOpen, 
  Share2,
  FileText
} from 'lucide-react';
import { VocabItem, TopicId, DayKey, UserHighlight, StudyMaskState } from '../types/vocab';
import { AudioWord } from './AudioWord';
import { speech } from '../utils/speech';
import { RichNoteStation } from './RichNoteStation';
import { StudyMaskCell } from './StudyMaskCell';
import { DirectWordFormatBar } from './DirectWordFormatBar';
import { getContrastTextColor } from '../utils/highlightColors';
import { CustomTextHighlight, normalizeHighlightKey } from '../utils/storage';
import { HighlightableText } from './HighlightableText';

interface MobileVerticalViewProps {
  items: VocabItem[];
  topic: TopicId;
  selectedDay: DayKey;
  starredIds: string[];
  masteryMap: Record<string, 'new' | 'learning' | 'mastered'>;
  wordNotes: Record<string, string>;
  highlights: Record<string, UserHighlight>;
  customHighlights?: CustomTextHighlight[];
  onToggleStar: (id: string) => void;
  onSetMastery: (id: string, status: 'new' | 'learning' | 'mastered') => void;
  onSaveWordNote: (id: string, html: string) => void;
  onSaveHighlight: (id: string, highlight: Partial<UserHighlight> | null) => void;
  onSelectWordDetail: (item: VocabItem) => void;
  maskState?: StudyMaskState;
  onToggleMask?: (key: keyof StudyMaskState) => void;
}

export const MobileVerticalView: React.FC<MobileVerticalViewProps> = ({
  items,
  topic,
  selectedDay,
  starredIds,
  masteryMap,
  wordNotes,
  highlights,
  customHighlights = [],
  onToggleStar,
  onSetMastery,
  onSaveWordNote,
  onSaveHighlight,
  onSelectWordDetail,
  maskState,
  onToggleMask
}) => {
  const [activeNoteWord, setActiveNoteWord] = useState<VocabItem | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const daysOrder: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' | 'synthesis')[] = [
    'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'synthesis'
  ];

  const filteredDays = selectedDay === 'all'
    ? daysOrder.filter(d => items.some(i => i.day === d))
    : [selectedDay as any];

  const isEnvironment = topic === 'environment';

  // Apply highlight styles to a word
  const renderStyledWord = (item: VocabItem) => {
    const hl = highlights[item.id];
    const customHl = customHighlights.find(
      h => normalizeHighlightKey(h.text) === normalizeHighlightKey(item.word)
    );
    const activeColor =
      (hl?.color && hl.color !== 'transparent' ? hl.color : undefined) ||
      (customHl?.bgColor && customHl.bgColor !== 'transparent' ? customHl.bgColor : undefined);
    const activeTextColor = activeColor
      ? (hl?.textColor || customHl?.textColor || getContrastTextColor(activeColor))
      : undefined;
    const isBold = hl?.isBold || customHl?.isBold;
    const isUnderline = hl?.isUnderline || customHl?.isUnderline;
    const isItalic = customHl?.isItalic;

    if (!activeColor && !isBold && !isUnderline && !isItalic && !customHl?.note) {
      return <HighlightableText text={item.word} highlights={customHighlights} />;
    }

    let styleClasses = '';
    const inlineStyle: React.CSSProperties = {};

    if (activeColor) {
      inlineStyle.backgroundColor = activeColor;
      inlineStyle.color = activeTextColor;
    }
    if (isUnderline) {
      styleClasses += ' underline decoration-2 decoration-emerald-500 ';
    } else if (customHl?.note) {
      styleClasses += ' underline decoration-dotted decoration-amber-500 underline-offset-4 ';
    }
    if (isBold) {
      styleClasses += ' font-black ';
    }
    if (isItalic) {
      styleClasses += ' italic ';
    }

    return (
      <span
        style={inlineStyle}
        title={customHl?.note ? `📝 Ghi chú: ${customHl.note}` : undefined}
        className={`${activeColor ? 'px-1 py-0.5 rounded' : ''} transition-all ${styleClasses}`}
      >
        {item.word}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {filteredDays.map(dayKey => {
        const dayItems = items.filter(i => i.day === dayKey);
        if (dayItems.length === 0) return null;

        const table1Items = dayItems.filter(i => i.tableType === 'table1');
        const table2Items = dayItems.filter(i => i.tableType === 'table2');
        const synthesisItems = dayItems.filter(i => i.tableType === 'synthesis');

        const isCollapsed = selectedDay === 'all' && !!collapsedSections[dayKey];

        return (
          <div 
            key={dayKey}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
          >
            {/* Day Header Accordion Toggle */}
            <button
              type="button"
              onClick={() => toggleSection(dayKey)}
              className={`w-full flex items-center justify-between p-4 text-left border-b transition-colors ${
                isEnvironment 
                  ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/50 text-teal-950 dark:text-teal-200'
                  : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50 text-indigo-950 dark:text-indigo-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold text-white uppercase tracking-wider ${
                  isEnvironment ? 'bg-teal-700' : 'bg-indigo-700'
                }`}>
                  {dayItems[0]?.dayLabel || dayKey}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {dayItems.length} từ
                </span>
              </div>

              <div className="text-slate-400">
                {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </div>
            </button>

            {!isCollapsed && (
              <div className="p-4 space-y-6">
                {/* BẢNG 1: TÍNH TỪ & TRẠNG TỪ */}
                {table1Items.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span>BẢNG 1: TÍNH TỪ & TRẠNG TỪ ({table1Items.length})</span>
                    </div>

                    <div className="space-y-3">
                      {table1Items.map(item => {
                        const isStarred = starredIds.includes(item.id);
                        const mastery = masteryMap[item.id] || 'new';
                        const hasNote = !!wordNotes[item.id];
                        const hl = highlights[item.id];

                        return (
                          <div
                            key={item.id}
                            id={`vocab-${item.id}`}
                            data-vocab-id={item.id}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                          >
                            {/* Word title and Audio */}
                            <div className="flex items-start justify-between gap-2">
                              <StudyMaskCell isMasked={!!maskState?.word} hintText="Chạm xem từ">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      onClick={() => {
                                        if (window.getSelection()?.toString().trim()) return;
                                        onSelectWordDetail(item);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.preventDefault();
                                          onSelectWordDetail(item);
                                        }
                                      }}
                                      className="text-left font-bold cursor-pointer select-text"
                                    >
                                      {renderStyledWord(item)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => speech.speak(item.word)}
                                      className="p-1 text-slate-400 hover:text-emerald-600 dark:text-slate-400 select-none"
                                      title="Nghe phát âm"
                                    >
                                      <Volume2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {item.phonetic && (
                                    <span className="text-xs text-slate-400 font-mono">
                                      {item.phonetic} {item.pos && `(${item.pos})`}
                                    </span>
                                  )}
                                </div>
                              </StudyMaskCell>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onToggleStar(item.id)}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    isStarred 
                                      ? 'text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-950/40' 
                                      : 'text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700'
                                  }`}
                                  title="Đánh dấu sao"
                                >
                                  <Star className="w-4 h-4 fill-current" />
                                </button>

                                <DirectWordFormatBar
                                  wordId={item.id}
                                  wordText={item.word}
                                  currentHighlight={hl}
                                  onSaveHighlight={onSaveHighlight}
                                />

                                <button
                                  onClick={() => setActiveNoteWord(item)}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    hasNote 
                                      ? 'text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40' 
                                      : 'text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700'
                                  }`}
                                  title="Ghi chú"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Vietnamese Definition */}
                            <StudyMaskCell isMasked={!!maskState?.meaning} hintText="Chạm xem nghĩa">
                              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                <HighlightableText text={item.vietnamese} highlights={customHighlights} />
                              </div>
                            </StudyMaskCell>

                            {/* Synonyms & Antonyms */}
                            <StudyMaskCell isMasked={!!maskState?.synonymAntonym} hintText="Chạm xem đồng/trái nghĩa">
                              <div className="space-y-1.5 text-xs">
                                {item.synonyms.length > 0 && (
                                  <div className="p-2 rounded bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-sky-900 dark:text-sky-200 space-y-1">
                                    <span className="font-semibold text-sky-700 dark:text-sky-300 block text-[11px]">
                                      ✔ Đồng nghĩa (Synonyms):
                                    </span>
                                    {item.synonyms.map((s, idx) => {
                                      const parts = s.split('=').map(p => p.trim());
                                      return (
                                        <div key={idx} className="flex items-start gap-1">
                                          <AudioWord text={parts[0]} variant="synonym" size="sm" highlights={customHighlights} />
                                          {parts[1] && (
                                            <span className="text-slate-500 dark:text-slate-400">
                                              = <HighlightableText text={parts[1]} highlights={customHighlights} />
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {item.antonyms.length > 0 && (
                                  <div className="p-2 rounded bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 space-y-1">
                                    <span className="font-semibold text-rose-700 dark:text-rose-300 block text-[11px]">
                                      ✖ Trái nghĩa (Antonyms):
                                    </span>
                                    {item.antonyms.map((a, idx) => {
                                      const parts = a.split('=').map(p => p.trim());
                                      return (
                                        <div key={idx} className="flex items-start gap-1">
                                          <AudioWord text={parts[0]} variant="antonym" size="sm" highlights={customHighlights} />
                                          {parts[1] && (
                                            <span className="text-slate-500 dark:text-slate-400">
                                              = <HighlightableText text={parts[1]} highlights={customHighlights} />
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </StudyMaskCell>

                            {/* Example */}
                            {item.example && (
                              <StudyMaskCell isMasked={!!maskState?.example} hintText="Chạm xem câu ví dụ">
                                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => speech.speak(item.example!)}
                                    className="p-0.5 text-slate-400 hover:text-emerald-600 shrink-0 mt-0.5 select-none"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                  <div>
                                    <span className="italic font-medium">
                                      "<HighlightableText text={item.example} highlights={customHighlights} />"
                                    </span>
                                    {item.exampleMeaning && (
                                      <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">
                                        <HighlightableText text={item.exampleMeaning} highlights={customHighlights} />
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </StudyMaskCell>
                            )}

                            {/* Note preview if any */}
                            {hasNote && (
                              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded text-xs text-amber-900 dark:text-amber-200">
                                <div 
                                  className="line-clamp-2"
                                  dangerouslySetInnerHTML={{ __html: wordNotes[item.id] }}
                                />
                              </div>
                            )}

                            {/* Status toggle pill */}
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                              <span className="text-slate-400 text-[11px]">Trạng thái:</span>
                              <button
                                onClick={() => {
                                  const next = mastery === 'new' ? 'learning' : mastery === 'learning' ? 'mastered' : 'new';
                                  onSetMastery(item.id, next);
                                }}
                                className={`px-2.5 py-1 rounded-md font-medium text-[11px] ${
                                  mastery === 'mastered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                  mastery === 'learning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                  'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {mastery === 'mastered' ? 'Đã thuộc ✔' : mastery === 'learning' ? 'Đang học 🔄' : 'Chưa học'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* BẢNG 2: DANH TỪ & ĐỘNG TỪ */}
                {table2Items.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span>BẢNG 2: DANH TỪ & ĐỘNG TỪ ({table2Items.length})</span>
                    </div>

                    <div className="space-y-3">
                      {table2Items.map(item => {
                        const isStarred = starredIds.includes(item.id);
                        const mastery = masteryMap[item.id] || 'new';
                        const hasNote = !!wordNotes[item.id];
                        const hl = highlights[item.id];

                        return (
                          <div
                            key={item.id}
                            id={`vocab-${item.id}`}
                            data-vocab-id={item.id}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => {
                                      if (window.getSelection()?.toString().trim()) return;
                                      onSelectWordDetail(item);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onSelectWordDetail(item);
                                      }
                                    }}
                                    className="text-left font-bold cursor-pointer select-text"
                                  >
                                    {renderStyledWord(item)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => speech.speak(item.word)}
                                    className="p-1 text-slate-400 hover:text-emerald-600 dark:text-slate-400 select-none"
                                    title="Nghe phát âm"
                                  >
                                    <Volume2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {item.phonetic && (
                                  <span className="text-xs text-slate-400 font-mono">
                                    {item.phonetic} {item.pos && `(${item.pos})`}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onToggleStar(item.id)}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    isStarred 
                                      ? 'text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-950/40' 
                                      : 'text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700'
                                  }`}
                                  title="Đánh dấu sao"
                                >
                                  <Star className="w-4 h-4 fill-current" />
                                </button>

                                <DirectWordFormatBar
                                  wordId={item.id}
                                  wordText={item.word}
                                  currentHighlight={hl}
                                  onSaveHighlight={onSaveHighlight}
                                />

                                <button
                                  onClick={() => setActiveNoteWord(item)}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    hasNote 
                                      ? 'text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40' 
                                      : 'text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700'
                                  }`}
                                  title="Ghi chú"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100">
                              <HighlightableText text={item.vietnamese} highlights={customHighlights} />
                            </div>

                            <div className="space-y-1.5 text-xs">
                              {item.synonyms.length > 0 && (
                                <div className="p-2 rounded bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-sky-900 dark:text-sky-200 space-y-1">
                                  <span className="font-semibold text-sky-700 dark:text-sky-300 block text-[11px]">
                                    ✔ Đồng nghĩa / Diễn đạt khác:
                                  </span>
                                  {item.synonyms.map((s, idx) => {
                                    const parts = s.split('=').map(p => p.trim());
                                    return (
                                      <div key={idx} className="flex items-start gap-1">
                                        <AudioWord text={parts[0]} variant="synonym" size="sm" highlights={customHighlights} />
                                        {parts[1] && (
                                          <span className="text-slate-500 dark:text-slate-400">
                                            = <HighlightableText text={parts[1]} highlights={customHighlights} />
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {item.antonyms.length > 0 && (
                                <div className="p-2 rounded bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 space-y-1">
                                  <span className="font-semibold text-rose-700 dark:text-rose-300 block text-[11px]">
                                    ✖ Trái nghĩa / Diễn đạt ngược:
                                  </span>
                                  {item.antonyms.map((a, idx) => {
                                    const parts = a.split('=').map(p => p.trim());
                                    return (
                                      <div key={idx} className="flex items-start gap-1">
                                        <AudioWord text={parts[0]} variant="antonym" size="sm" highlights={customHighlights} />
                                        {parts[1] && (
                                          <span className="text-slate-500 dark:text-slate-400">
                                            = <HighlightableText text={parts[1]} highlights={customHighlights} />
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {item.example && (
                              <div className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => speech.speak(item.example!)}
                                  className="p-0.5 text-slate-400 hover:text-emerald-600 shrink-0 mt-0.5 select-none"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                                <div>
                                  <span className="italic font-medium">
                                    "<HighlightableText text={item.example} highlights={customHighlights} />"
                                  </span>
                                  {item.exampleMeaning && (
                                    <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">
                                      <HighlightableText text={item.exampleMeaning} highlights={customHighlights} />
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                              <span className="text-slate-400 text-[11px]">Trạng thái:</span>
                              <button
                                onClick={() => {
                                  const next = mastery === 'new' ? 'learning' : mastery === 'learning' ? 'mastered' : 'new';
                                  onSetMastery(item.id, next);
                                }}
                                className={`px-2.5 py-1 rounded-md font-medium text-[11px] ${
                                  mastery === 'mastered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                  mastery === 'learning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                  'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {mastery === 'mastered' ? 'Đã thuộc ✔' : mastery === 'learning' ? 'Đang học 🔄' : 'Chưa học'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SYNTHESIS & EXAMPLES */}
                {synthesisItems.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      TỪ TỔNG HỢP & COLLOCATIONS ({synthesisItems.length})
                    </div>

                    <div className="space-y-3">
                      {synthesisItems.map(item => {
                        const hl = highlights[item.id];
                        return (
                          <div
                            key={item.id}
                            id={`vocab-${item.id}`}
                            data-vocab-id={item.id}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  if (window.getSelection()?.toString().trim()) return;
                                  onSelectWordDetail(item);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSelectWordDetail(item);
                                  }
                                }}
                                className="text-left font-bold cursor-pointer select-text"
                              >
                                {renderStyledWord(item)}
                              </span>
                              <div className="flex items-center gap-1">
                                <DirectWordFormatBar
                                  wordId={item.id}
                                  wordText={item.word}
                                  currentHighlight={hl}
                                  onSaveHighlight={onSaveHighlight}
                                />
                                <button
                                  type="button"
                                  onClick={() => speech.speak(item.word)}
                                  className="text-slate-400 hover:text-emerald-600 p-1 select-none"
                                  title="Nghe phát âm"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            <HighlightableText text={item.vietnamese} highlights={customHighlights} />
                          </p>

                          {item.example && (
                            <p className="text-xs italic text-slate-500 dark:text-slate-400">
                              "<HighlightableText text={item.example} highlights={customHighlights} />"
                            </p>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {activeNoteWord && (
        <RichNoteStation
          isModal
          title={`Ghi chú cho từ: ${activeNoteWord.word}`}
          wordContext={activeNoteWord}
          initialContent={wordNotes[activeNoteWord.id] || ''}
          onSave={(html) => onSaveWordNote(activeNoteWord.id, html)}
          onClose={() => setActiveNoteWord(null)}
        />
      )}
    </div>
  );
};
