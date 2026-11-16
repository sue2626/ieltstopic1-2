import React, { useState } from 'react';
import { 
  Volume2, 
  Star, 
  Edit3, 
  Highlighter, 
  CheckCircle2, 
  Circle, 
  HelpCircle,
  FileText,
  Eye,
  EyeOff
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

interface PDFTableViewProps {
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

export const PDFTableView: React.FC<PDFTableViewProps> = ({
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

  // Group items by Day and Table Type
  const daysOrder: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' | 'synthesis')[] = [
    'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'synthesis'
  ];

  const filteredDays = selectedDay === 'all'
    ? daysOrder.filter(d => items.some(i => i.day === d))
    : [selectedDay as any];

  const getDayDisplayName = (dayKey: string) => {
    switch (dayKey) {
      case 'mon': return 'MON (Thứ Hai)';
      case 'tue': return 'TUE (Thứ Ba)';
      case 'wed': return 'WED (Thứ Tư)';
      case 'thu': return 'THU (Thứ Năm)';
      case 'fri': return 'FRI (Thứ Sáu)';
      case 'sat': return 'SAT (Thứ Bảy)';
      case 'sun': return 'SUN (Chủ Nhật)';
      case 'synthesis': return 'SYNTHESIS & EXAMPLES (Từ Tổng Hợp)';
      default: return dayKey;
    }
  };

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
      styleClasses += ' underline decoration-2 decoration-emerald-600 ';
    } else if (customHl?.note) {
      styleClasses += ' underline decoration-dotted decoration-amber-500 underline-offset-4 ';
    }
    if (isBold) {
      styleClasses += ' font-bold ';
    }
    if (isItalic) {
      styleClasses += ' italic ';
    }

    return (
      <span
        style={inlineStyle}
        title={customHl?.note ? `📝 Ghi chú: ${customHl.note}` : undefined}
        className={`${activeColor ? 'px-1 py-0.5 rounded' : ''} transition-colors ${styleClasses}`}
      >
        {item.word}
      </span>
    );
  };

  return (
    <div className="space-y-12">
      {filteredDays.map(dayKey => {
        const dayItems = items.filter(i => i.day === dayKey);
        if (dayItems.length === 0) return null;

        const table1Items = dayItems.filter(i => i.tableType === 'table1');
        const table2Items = dayItems.filter(i => i.tableType === 'table2');
        const synthesisItems = dayItems.filter(i => i.tableType === 'synthesis');

        return (
          <div key={dayKey} className="space-y-8 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs print-page transition-colors">
            {/* Day Header Banner (PDF Replica style) */}
            <div className={`flex flex-wrap items-center justify-between pb-3 border-b-2 ${
              isEnvironment ? 'border-teal-600 dark:border-teal-500' : 'border-indigo-600 dark:border-indigo-500'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-sm font-bold tracking-wide uppercase rounded text-white ${
                  isEnvironment ? 'bg-teal-700' : 'bg-indigo-700'
                }`}>
                  {getDayDisplayName(dayKey)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {dayItems.length} từ vựng & cấu trúc
                </span>
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                {isEnvironment ? 'Topic 1: Environment' : 'Topic 2: Education'}
              </div>
            </div>

            {/* BẢNG 1: TÍNH TỪ & TRẠNG TỪ */}
            {table1Items.length > 0 && (
              <div className="space-y-3">
                <div className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-lg ${
                  isEnvironment 
                    ? 'bg-teal-100/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-900/60' 
                    : 'bg-indigo-100/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-900/60'
                }`}>
                  BẢNG 1: TÍNH TỪ & TRẠNG TỪ
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider">
                        <th className="py-3 px-4 w-[22%]">
                          <div className="flex items-center justify-between">
                            <span>Từ Tiếng Anh</span>
                            {onToggleMask && (
                              <button
                                type="button"
                                onClick={() => onToggleMask('word')}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                                  maskState?.word ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={maskState?.word ? 'Đang che - Bấm để hiện' : 'Che cột Từ Tiếng Anh (rà chuột để xem)'}
                              >
                                {maskState?.word ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 w-[22%]">
                          <div className="flex items-center justify-between">
                            <span>Nghĩa Tiếng Việt</span>
                            {onToggleMask && (
                              <button
                                type="button"
                                onClick={() => onToggleMask('meaning')}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                                  maskState?.meaning ? 'text-emerald-500 font-bold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={maskState?.meaning ? 'Đang che - Bấm để hiện' : 'Che cột Nghĩa Tiếng Việt (rà chuột để xem)'}
                              >
                                {maskState?.meaning ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 w-[26%]">
                          <div className="flex items-center justify-between">
                            <span>Đồng Nghĩa / Trái Nghĩa</span>
                            {onToggleMask && (
                              <button
                                type="button"
                                onClick={() => onToggleMask('synonymAntonym')}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                                  maskState?.synonymAntonym ? 'text-sky-500 font-bold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={maskState?.synonymAntonym ? 'Đang che - Bấm để hiện' : 'Che cột Đồng/Trái nghĩa (rà chuột để xem)'}
                              >
                                {maskState?.synonymAntonym ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 w-[30%]">
                          <div className="flex items-center justify-between">
                            <span>Ví Dụ Thực Tế</span>
                            {onToggleMask && (
                              <button
                                type="button"
                                onClick={() => onToggleMask('example')}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                                  maskState?.example ? 'text-indigo-500 font-bold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={maskState?.example ? 'Đang che - Bấm để hiện' : 'Che cột Ví Dụ (rà chuột để xem)'}
                              >
                                {maskState?.example ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {table1Items.map(item => {
                        const isStarred = starredIds.includes(item.id);
                        const mastery = masteryMap[item.id] || 'new';
                        const hasNote = !!wordNotes[item.id];
                        const hl = highlights[item.id];

                        return (
                          <tr 
                            key={item.id} 
                            id={`vocab-${item.id}`}
                            data-vocab-id={item.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                          >
                            {/* Cột 1: Từ tiếng Anh */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="flex flex-col gap-1">
                                <StudyMaskCell isMasked={!!maskState?.word} hintText="Rà chuột xem từ">
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
                                      className="font-semibold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 text-left transition-colors cursor-pointer select-text"
                                    >
                                      {renderStyledWord(item)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => speech.speak(item.word)}
                                      className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1 select-none"
                                      title="Nghe phát âm từ này"
                                    >
                                      <Volume2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {item.phonetic && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                      {item.phonetic}
                                    </span>
                                  )}
                                </StudyMaskCell>

                                {/* Interactive row action tools: Star, Highlight, Note, Status */}
                                <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                                  {/* Star */}
                                  <button
                                    onClick={() => onToggleStar(item.id)}
                                    className={`p-1 rounded transition-colors ${
                                      isStarred ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                                    }`}
                                    title={isStarred ? 'Bỏ đánh dấu sao' : 'Đánh dấu từ quan trọng'}
                                  >
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                  </button>

                                  {/* Direct Word Formatting: 14 colors, Bold, Underline, Clear */}
                                  <DirectWordFormatBar
                                    wordId={item.id}
                                    wordText={item.word}
                                    currentHighlight={hl}
                                    onSaveHighlight={onSaveHighlight}
                                  />

                                  {/* Note button */}
                                  <button
                                    onClick={() => setActiveNoteWord(item)}
                                    className={`p-1 rounded transition-colors ${
                                      hasNote ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 font-medium' : 'text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                                    title={hasNote ? 'Xem/Chỉnh sửa ghi chú' : 'Thêm ghi chú cho từ này'}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Mastery status toggle */}
                                  <button
                                    onClick={() => {
                                      const nextStatus = mastery === 'new' ? 'learning' : mastery === 'learning' ? 'mastered' : 'new';
                                      onSetMastery(item.id, nextStatus);
                                    }}
                                    className={`text-[11px] px-1.5 py-0.2 rounded transition-colors ${
                                      mastery === 'mastered' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                                      mastery === 'learning' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                                      'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                                    title="Chuyển trạng thái học: Mới -> Đang học -> Đã thuộc"
                                  >
                                    {mastery === 'mastered' ? 'Đã thuộc' : mastery === 'learning' ? 'Đang học' : 'Chưa học'}
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Cột 2: Nghĩa tiếng Việt */}
                            <td className="py-3.5 px-4 align-top text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                              <StudyMaskCell isMasked={!!maskState?.meaning} hintText="Rà chuột xem nghĩa">
                                <HighlightableText text={item.vietnamese} highlights={customHighlights} />
                                {hasNote && (
                                  <div className="mt-2 p-2 bg-amber-50/80 dark:bg-amber-950/40 rounded border border-amber-200/60 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200">
                                    <div className="flex items-center gap-1 font-semibold text-[10px] uppercase text-amber-700 dark:text-amber-400">
                                      <FileText className="w-3 h-3" /> Ghi chú của bạn:
                                    </div>
                                    <div 
                                      className="line-clamp-2 mt-0.5"
                                      dangerouslySetInnerHTML={{ __html: wordNotes[item.id] }} 
                                    />
                                  </div>
                                )}
                              </StudyMaskCell>
                            </td>

                            {/* Cột 3: Đồng nghĩa / Trái nghĩa */}
                            <td className="py-3.5 px-4 align-top">
                              <StudyMaskCell isMasked={!!maskState?.synonymAntonym} hintText="Rà chuột xem từ">
                                <div className="space-y-2 text-xs">
                                  {/* Đồng nghĩa ✔ */}
                                  {item.synonyms.length > 0 && (
                                    <div className="p-1.5 rounded-lg bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-sky-900 dark:text-sky-200 space-y-1">
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold block text-[11px]">✔ Đồng nghĩa:</span>
                                      <div className="space-y-0.5">
                                        {item.synonyms.map((syn, idx) => {
                                          const parts = syn.split('=').map(p => p.trim());
                                          return (
                                            <div key={idx} className="flex items-start gap-1 flex-wrap">
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
                                    </div>
                                  )}

                                  {/* Trái nghĩa ✖ */}
                                  {item.antonyms.length > 0 && (
                                    <div className="p-1.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 space-y-1">
                                      <span className="text-rose-600 dark:text-rose-400 font-bold block text-[11px]">✖ Trái nghĩa:</span>
                                      <div className="space-y-0.5">
                                        {item.antonyms.map((ant, idx) => {
                                          const parts = ant.split('=').map(p => p.trim());
                                          return (
                                            <div key={idx} className="flex items-start gap-1 flex-wrap">
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
                                    </div>
                                  )}
                                </div>
                              </StudyMaskCell>
                            </td>

                            {/* Cột 4: Ví dụ thực tế */}
                            <td className="py-3.5 px-4 align-top text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              <StudyMaskCell isMasked={!!maskState?.example} hintText="Rà chuột xem ví dụ">
                                {item.example && (
                                  <div className="space-y-1">
                                    <div className="flex items-start gap-1.5 group/ex">
                                      <button
                                        type="button"
                                        onClick={() => speech.speak(item.example!)}
                                        className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-0.5 shrink-0 mt-0.5 transition-colors select-none"
                                        title="Nghe toàn bộ câu ví dụ"
                                      >
                                        <Volume2 className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="italic text-slate-800 dark:text-slate-200">
                                        <HighlightableText text={item.example} highlights={customHighlights} />
                                      </span>
                                    </div>
                                    {item.exampleMeaning && (
                                      <p className="text-slate-500 dark:text-slate-400 pl-5 text-[11px]">
                                        <HighlightableText text={item.exampleMeaning} highlights={customHighlights} />
                                      </p>
                                    )}
                                  </div>
                                )}
                              </StudyMaskCell>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BẢNG 2: DANH TỪ & ĐỘNG TỪ */}
            {table2Items.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-lg ${
                  isEnvironment 
                    ? 'bg-teal-100/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-900/60' 
                    : 'bg-indigo-100/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-900/60'
                }`}>
                  BẢNG 2: DANH TỪ & ĐỘNG TỪ
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider">
                        <th className="py-3 px-4 w-[22%]">
                          <div className="flex items-center justify-between">
                            <span>Từ Tiếng Anh</span>
                            {onToggleMask && (
                              <button
                                type="button"
                                onClick={() => onToggleMask('word')}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                                  maskState?.word ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={maskState?.word ? 'Đang che - Bấm để hiện' : 'Che cột Từ Tiếng Anh (rà chuột để xem)'}
                              >
                                {maskState?.word ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 w-[24%]">
                          <div className="flex items-center justify-between">
                            <span>Nghĩa Tiếng Việt</span>
                            {onToggleMask && (
                              <button
                                type="button"
                                onClick={() => onToggleMask('meaning')}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                                  maskState?.meaning ? 'text-emerald-500 font-bold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={maskState?.meaning ? 'Đang che - Bấm để hiện' : 'Che cột Nghĩa Tiếng Việt (rà chuột để xem)'}
                              >
                                {maskState?.meaning ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 w-[27%]">
                          <div className="flex items-center justify-between">
                            <span>Đồng Nghĩa / Diễn Đạt Khác</span>
                            {onToggleMask && (
                              <button
                                type="button"
                                onClick={() => onToggleMask('synonymAntonym')}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                                  maskState?.synonymAntonym ? 'text-sky-500 font-bold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={maskState?.synonymAntonym ? 'Đang che - Bấm để hiện' : 'Che cột Đồng Nghĩa (rà chuột để xem)'}
                              >
                                {maskState?.synonymAntonym ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 w-[27%]">
                          <div className="flex items-center justify-between">
                            <span>Trái Nghĩa / Diễn Đạt Ngược</span>
                            {onToggleMask && (
                              <button
                                type="button"
                                onClick={() => onToggleMask('synonymAntonym')}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                                  maskState?.synonymAntonym ? 'text-rose-500 font-bold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={maskState?.synonymAntonym ? 'Đang che - Bấm để hiện' : 'Che cột Trái Nghĩa (rà chuột để xem)'}
                              >
                                {maskState?.synonymAntonym ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {table2Items.map(item => {
                        const isStarred = starredIds.includes(item.id);
                        const mastery = masteryMap[item.id] || 'new';
                        const hasNote = !!wordNotes[item.id];
                        const hl = highlights[item.id];

                        return (
                          <tr 
                            key={item.id} 
                            id={`vocab-${item.id}`}
                            data-vocab-id={item.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                          >
                            {/* Cột 1: Từ tiếng Anh */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="flex flex-col gap-1">
                                <StudyMaskCell isMasked={!!maskState?.word} hintText="Rà chuột xem từ">
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
                                      className="font-semibold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 text-left transition-colors cursor-pointer select-text"
                                    >
                                      {renderStyledWord(item)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => speech.speak(item.word)}
                                      className="text-slate-400 hover:text-emerald-600 transition-colors p-1 select-none"
                                      title="Nghe phát âm từ này"
                                    >
                                      <Volume2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {item.phonetic && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                      {item.phonetic}
                                    </span>
                                  )}
                                </StudyMaskCell>

                                {/* Interactive row action tools */}
                                <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                                  <button
                                    onClick={() => onToggleStar(item.id)}
                                    className={`p-1 rounded transition-colors ${
                                      isStarred ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
                                    }`}
                                    title={isStarred ? 'Bỏ đánh dấu sao' : 'Đánh dấu từ quan trọng'}
                                  >
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                  </button>

                                  {/* Direct Word Formatting: 14 colors, Bold, Underline, Clear */}
                                  <DirectWordFormatBar
                                    wordId={item.id}
                                    wordText={item.word}
                                    currentHighlight={hl}
                                    onSaveHighlight={onSaveHighlight}
                                  />

                                  <button
                                    onClick={() => setActiveNoteWord(item)}
                                    className={`p-1 rounded transition-colors ${
                                      hasNote ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 font-medium' : 'text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                                    title={hasNote ? 'Xem/Chỉnh sửa ghi chú' : 'Thêm ghi chú cho từ này'}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      const nextStatus = mastery === 'new' ? 'learning' : mastery === 'learning' ? 'mastered' : 'new';
                                      onSetMastery(item.id, nextStatus);
                                    }}
                                    className={`text-[11px] px-1.5 py-0.2 rounded transition-colors ${
                                      mastery === 'mastered' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                                      mastery === 'learning' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                                      'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                                  >
                                    {mastery === 'mastered' ? 'Đã thuộc' : mastery === 'learning' ? 'Đang học' : 'Chưa học'}
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Cột 2: Nghĩa tiếng Việt */}
                            <td className="py-3.5 px-4 align-top text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                              <StudyMaskCell isMasked={!!maskState?.meaning} hintText="Rà chuột xem nghĩa">
                                <HighlightableText text={item.vietnamese} highlights={customHighlights} />
                                {hasNote && (
                                  <div className="mt-2 p-2 bg-amber-50/80 dark:bg-amber-950/40 rounded border border-amber-200/60 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200">
                                    <div className="flex items-center gap-1 font-semibold text-[10px] uppercase text-amber-700 dark:text-amber-400">
                                      <FileText className="w-3 h-3" /> Ghi chú của bạn:
                                    </div>
                                    <div 
                                      className="line-clamp-2 mt-0.5"
                                      dangerouslySetInnerHTML={{ __html: wordNotes[item.id] }} 
                                    />
                                  </div>
                                )}
                                {item.note && (
                                  <div className="mt-2 p-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 text-xs rounded border border-sky-100 dark:border-sky-800 italic">
                                    <HighlightableText text={item.note} highlights={customHighlights} />
                                  </div>
                                )}
                              </StudyMaskCell>
                            </td>

                            {/* Cột 3: Đồng nghĩa / Diễn đạt khác */}
                            <td className="py-3.5 px-4 align-top text-xs text-sky-900 dark:text-sky-300 leading-relaxed">
                              <StudyMaskCell isMasked={!!maskState?.synonymAntonym} hintText="Rà chuột xem đồng nghĩa">
                                {item.synonyms.length > 0 ? (
                                  <div className="space-y-1">
                                    {item.synonyms.map((syn, idx) => {
                                      const parts = syn.split('=').map(p => p.trim());
                                      const en = parts[0];
                                      const vi = parts[1];
                                      return (
                                        <div key={idx} className="flex items-start gap-1 flex-wrap">
                                          <AudioWord text={en} variant="synonym" size="sm" highlights={customHighlights} />
                                          {vi && (
                                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                              = <HighlightableText text={vi} highlights={customHighlights} />
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-600">—</span>
                                )}
                              </StudyMaskCell>
                            </td>

                            {/* Cột 4: Trái nghĩa / Diễn đạt ngược */}
                            <td className="py-3.5 px-4 align-top text-xs text-rose-900 dark:text-rose-300 leading-relaxed">
                              <StudyMaskCell isMasked={!!maskState?.synonymAntonym} hintText="Rà chuột xem trái nghĩa">
                                {item.antonyms.length > 0 ? (
                                  <div className="space-y-1">
                                    {item.antonyms.map((ant, idx) => {
                                      const parts = ant.split('=').map(p => p.trim());
                                      const en = parts[0];
                                      const vi = parts[1];
                                      return (
                                        <div key={idx} className="flex items-start gap-1 flex-wrap">
                                          <AudioWord text={en} variant="antonym" size="sm" highlights={customHighlights} />
                                          {vi && (
                                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                              = <HighlightableText text={vi} highlights={customHighlights} />
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-600">—</span>
                                )}
                              </StudyMaskCell>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SYNTHESIS & EXAMPLES (Từ tổng hợp từ các topic) */}
            {synthesisItems.length > 0 && (
              <div className="space-y-3 pt-4">
                <div className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-lg shadow-sm ${
                  isEnvironment ? 'bg-teal-800 text-white' : 'bg-indigo-800 text-white'
                }`}>
                  TỪ TỔNG HỢP TỪ CÁC TOPIC & VÍ DỤ MINH HỌA
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider">
                        <th className="py-3 px-4 w-[12%]">Ngày</th>
                        <th className="py-3 px-4 w-[28%]">
                          <div className="flex items-center justify-between">
                            <span>Từ / Cụm Từ</span>
                            {onToggleMask && (
                              <button
                                type="button"
                                onClick={() => onToggleMask('word')}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                                  maskState?.word ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={maskState?.word ? 'Đang che - Bấm để hiện' : 'Che cột Từ / Cụm từ'}
                              >
                                {maskState?.word ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 w-[28%]">
                          <div className="flex items-center justify-between">
                            <span>Nghĩa Tiếng Việt</span>
                            {onToggleMask && (
                              <button
                                type="button"
                                onClick={() => onToggleMask('meaning')}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                                  maskState?.meaning ? 'text-emerald-500 font-bold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={maskState?.meaning ? 'Đang che - Bấm để hiện' : 'Che cột Nghĩa'}
                              >
                                {maskState?.meaning ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 w-[32%]">
                          <div className="flex items-center justify-between">
                            <span>Ví Dụ Minh Họa</span>
                            {onToggleMask && (
                              <button
                                type="button"
                                onClick={() => onToggleMask('example')}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                                  maskState?.example ? 'text-indigo-500 font-bold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={maskState?.example ? 'Đang che - Bấm để hiện' : 'Che cột Ví Dụ'}
                              >
                                {maskState?.example ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {synthesisItems.map(item => {
                        const isStarred = starredIds.includes(item.id);
                        const hasNote = !!wordNotes[item.id];
                        const hl = highlights[item.id];

                        return (
                          <tr key={item.id} id={`vocab-${item.id}`} data-vocab-id={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                            {/* Cột 1: Ngày */}
                            <td className="py-3 px-4 align-top text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                              {item.dayLabel}
                            </td>

                            {/* Cột 2: Từ / Cụm từ */}
                            <td className="py-3 px-4 align-top">
                              <StudyMaskCell isMasked={!!maskState?.word} hintText="Rà chuột xem từ">
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
                                    className="font-semibold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 text-left transition-colors cursor-pointer select-text"
                                  >
                                    {renderStyledWord(item)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => speech.speak(item.word)}
                                    className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-0.5 select-none"
                                    title="Nghe phát âm"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </StudyMaskCell>

                              <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                                <button
                                  onClick={() => onToggleStar(item.id)}
                                  className={`p-0.5 rounded transition-colors ${
                                    isStarred ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                                  }`}
                                  title="Đánh dấu sao"
                                >
                                  <Star className="w-3 h-3 fill-current" />
                                </button>

                                <DirectWordFormatBar
                                  wordId={item.id}
                                  wordText={item.word}
                                  currentHighlight={hl}
                                  onSaveHighlight={onSaveHighlight}
                                />

                                <button
                                  onClick={() => setActiveNoteWord(item)}
                                  className={`p-0.5 rounded transition-colors ${
                                    hasNote ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300'
                                  }`}
                                  title="Ghi chú"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* Cột 3: Nghĩa tiếng Việt */}
                            <td className="py-3 px-4 align-top text-slate-800 dark:text-slate-200 font-medium leading-relaxed text-xs md:text-sm">
                              <StudyMaskCell isMasked={!!maskState?.meaning} hintText="Rà chuột xem nghĩa">
                                <HighlightableText text={item.vietnamese} highlights={customHighlights} />
                                {hasNote && (
                                  <div className="mt-1.5 p-1.5 bg-amber-50 dark:bg-amber-950/40 rounded border border-amber-200/60 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200">
                                    <div 
                                      className="line-clamp-2"
                                      dangerouslySetInnerHTML={{ __html: wordNotes[item.id] }} 
                                    />
                                  </div>
                                )}
                              </StudyMaskCell>
                            </td>

                            {/* Cột 4: Ví dụ minh họa */}
                            <td className="py-3 px-4 align-top text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                              <StudyMaskCell isMasked={!!maskState?.example} hintText="Rà chuột xem ví dụ">
                                {item.example && (
                                  <div className="space-y-1">
                                    <div className="flex items-start gap-1">
                                      <button
                                        type="button"
                                        onClick={() => speech.speak(item.example!)}
                                        className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 p-0.5 shrink-0 mt-0.5 select-none"
                                        title="Nghe câu ví dụ"
                                      >
                                        <Volume2 className="w-3 h-3" />
                                      </button>
                                      <span className="italic text-slate-800 dark:text-slate-200">
                                        <HighlightableText text={item.example} highlights={customHighlights} />
                                      </span>
                                    </div>
                                    {item.exampleMeaning && (
                                      <p className="text-slate-500 dark:text-slate-400 pl-4 text-[11px]">
                                        <HighlightableText text={item.exampleMeaning} highlights={customHighlights} />
                                      </p>
                                    )}
                                  </div>
                                )}
                              </StudyMaskCell>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Floating Note Modal for Active Word */}
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
