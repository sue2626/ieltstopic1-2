import React, { useState, useMemo } from 'react';
import { 
  BookMarked, 
  X, 
  Search, 
  Trash2, 
  Volume2, 
  Highlighter, 
  Sparkles, 
  Copy, 
  Check, 
  FileText,
  ExternalLink,
  Star,
  Edit3,
  Navigation
} from 'lucide-react';
import { VocabItem, UserHighlight, TopicId } from '../types/vocab';
import { speech } from '../utils/speech';
import { DirectWordFormatBar } from './DirectWordFormatBar';
import { RichNoteStation } from './RichNoteStation';
import { getContrastTextColor } from '../utils/highlightColors';
import { CustomTextHighlight, normalizeHighlightKey } from '../utils/storage';
import { HighlightableText } from './HighlightableText';

interface NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  allVocab: VocabItem[];
  highlights: Record<string, UserHighlight>;
  starredIds: string[];
  customHighlights?: CustomTextHighlight[];
  onToggleStar: (id: string) => void;
  onSaveHighlight: (id: string, highlight: Partial<UserHighlight> | null) => void;
  onSaveCustomHighlight?: (highlight: CustomTextHighlight) => void;
  onRemoveCustomHighlight?: (text: string) => void;
  onAppendToNotebook?: (text: string, noteHtml?: string) => void;
  onSelectWordDetail: (item: VocabItem) => void;
  masterNotebookHtml: string;
  onSaveMasterNotebook: (html: string) => void;
  onJumpToWord: (item: VocabItem) => void;
}

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const matchCustomHighlightToItem = (ch: CustomTextHighlight, item: VocabItem): boolean => {
  if (ch.vocabId && ch.vocabId === item.id) return true;
  const queries = [ch.text, ...(ch.subParts || [])]
    .map(normalizeHighlightKey)
    .filter(q => q.length >= 2);
  if (queries.length === 0) return false;

  const fields = [
    item.word,
    item.vietnamese,
    item.example || '',
    item.exampleMeaning || '',
    ...item.synonyms,
    ...item.antonyms
  ].map(f => normalizeHighlightKey(f));

  return queries.some(q => fields.some(f => f.includes(q)));
};

export const NotebookModal: React.FC<NotebookModalProps> = ({
  isOpen,
  onClose,
  allVocab,
  highlights,
  starredIds,
  customHighlights = [],
  onToggleStar,
  onSaveHighlight,
  onSaveCustomHighlight,
  onRemoveCustomHighlight,
  onAppendToNotebook,
  onSelectWordDetail,
  masterNotebookHtml,
  onSaveMasterNotebook,
  onJumpToWord
}) => {
  const [activeTab, setActiveTab] = useState<'highlights' | 'editor'>('highlights');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopic, setFilterTopic] = useState<'all' | TopicId>('all');
  const [filterFormat, setFilterFormat] = useState<'all' | 'color' | 'bold' | 'underline' | 'starred'>('all');
  const [copiedAll, setCopiedAll] = useState(false);

  // Inline note editing state for custom phrase highlights
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editNoteDraft, setEditNoteDraft] = useState<string>('');

  // Standalone custom highlights (phrases from Synonyms, Antonyms, Examples, Meaning, etc. not an exact full-word match)
  const standaloneCustomHighlights = useMemo(() => {
    const vocabWordKeys = new Set(allVocab.map(v => normalizeHighlightKey(v.word)));
    return customHighlights.filter(h => {
      const key = normalizeHighlightKey(h.text);
      if (!key || vocabWordKeys.has(key)) return false;

      if (filterTopic !== 'all') {
        const linkedItem = h.vocabId
          ? allVocab.find(v => v.id === h.vocabId)
          : allVocab.find(v => matchCustomHighlightToItem(h, v));
        if (linkedItem && linkedItem.topic !== filterTopic) return false;
      }

      if (filterFormat === 'color' && (!h.bgColor || h.bgColor === 'transparent')) return false;
      if (filterFormat === 'bold' && !h.isBold) return false;
      if (filterFormat === 'underline' && !h.isUnderline) return false;
      if (filterFormat === 'starred') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchText = h.text.toLowerCase().includes(q);
        const matchNote = h.note?.toLowerCase().includes(q);
        if (!matchText && !matchNote) return false;
      }
      return true;
    });
  }, [customHighlights, allVocab, filterTopic, filterFormat, searchQuery]);

  // Extract all vocabulary items that have active highlight, bold, underline, or are starred
  const notebookItems = useMemo(() => {
    return allVocab.filter(item => {
      const hl = highlights[item.id];
      const customHl = customHighlights.find(
        h => normalizeHighlightKey(h.text) === normalizeHighlightKey(item.word)
      );
      const isStarred = starredIds.includes(item.id);
      const hasColor = (hl && hl.color && hl.color !== 'transparent') || (customHl && customHl.bgColor && customHl.bgColor !== 'transparent');
      const hasBold = (hl && !!hl.isBold) || (customHl && !!customHl.isBold);
      const hasUnderline = (hl && !!hl.isUnderline) || (customHl && !!customHl.isUnderline);
      const hasItalic = !!(customHl && customHl.isItalic);
      const hasNote = !!(customHl && customHl.note);
      const hasSubHighlight = customHighlights.some(ch => matchCustomHighlightToItem(ch, item));
      return hasColor || hasBold || hasUnderline || hasItalic || hasNote || isStarred || hasSubHighlight;
    });
  }, [allVocab, highlights, starredIds, customHighlights]);

  // Filtered notebook items list
  const filteredItems = useMemo(() => {
    return notebookItems.filter(item => {
      const hl = highlights[item.id];
      const isStarred = starredIds.includes(item.id);

      if (filterTopic !== 'all' && item.topic !== filterTopic) {
        return false;
      }

      const customHl = customHighlights.find(
        h => normalizeHighlightKey(h.text) === normalizeHighlightKey(item.word)
      );
      const matchingSubs = customHighlights.filter(ch => matchCustomHighlightToItem(ch, item));

      const hasColor =
        (hl && hl.color && hl.color !== 'transparent') ||
        (customHl && customHl.bgColor && customHl.bgColor !== 'transparent') ||
        matchingSubs.some(s => s.bgColor && s.bgColor !== 'transparent');
      const hasBold =
        (hl && !!hl.isBold) ||
        (customHl && !!customHl.isBold) ||
        matchingSubs.some(s => !!s.isBold);
      const hasUnderline =
        (hl && !!hl.isUnderline) ||
        (customHl && !!customHl.isUnderline) ||
        matchingSubs.some(s => !!s.isUnderline);

      if (filterFormat === 'color' && !hasColor) return false;
      if (filterFormat === 'bold' && !hasBold) return false;
      if (filterFormat === 'underline' && !hasUnderline) return false;
      if (filterFormat === 'starred' && !isStarred) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchWord = item.word.toLowerCase().includes(q);
        const matchMeaning = item.vietnamese.toLowerCase().includes(q);
        const matchSyn = item.synonyms.some(s => s.toLowerCase().includes(q));
        const matchAnt = item.antonyms.some(a => a.toLowerCase().includes(q));
        const matchEx = item.example?.toLowerCase().includes(q);
        const matchCustomNote = customHl?.note?.toLowerCase().includes(q) || matchingSubs.some(s => s.note?.toLowerCase().includes(q));
        if (!matchWord && !matchMeaning && !matchSyn && !matchAnt && !matchEx && !matchCustomNote) {
          return false;
        }
      }

      return true;
    });
  }, [notebookItems, highlights, starredIds, customHighlights, filterTopic, filterFormat, searchQuery]);

  const totalSavedCount = useMemo(() => {
    const standaloneTotal = customHighlights.filter(
      h => !allVocab.some(v => normalizeHighlightKey(v.word) === normalizeHighlightKey(h.text))
    ).length;
    return Math.max(notebookItems.length, standaloneTotal);
  }, [notebookItems.length, customHighlights, allVocab]);

  const handleSaveCustomNoteEdit = (h: CustomTextHighlight) => {
    const trimmed = editNoteDraft.trim();
    const updated: CustomTextHighlight = {
      ...h,
      note: trimmed || undefined
    };

    const hasOtherStyle =
      (updated.bgColor && updated.bgColor !== 'transparent') ||
      updated.isBold ||
      updated.isUnderline ||
      updated.isItalic;

    if (!trimmed && !hasOtherStyle) {
      onRemoveCustomHighlight?.(h.text);
    } else {
      onSaveCustomHighlight?.(updated);
      if (onAppendToNotebook) {
        const hasBg = updated.bgColor && updated.bgColor !== 'transparent';
        const styles: string[] = [];
        if (hasBg) {
          styles.push(`background-color: ${updated.bgColor}`);
          styles.push(`color: ${updated.textColor}`);
          styles.push('padding: 1px 5px');
          styles.push('border-radius: 4px');
          styles.push('box-decoration-break: clone');
        }
        if (updated.isBold || hasBg) styles.push('font-weight: 600');
        if (updated.isUnderline) styles.push('text-decoration: underline; text-underline-offset: 3px');
        if (updated.isItalic) styles.push('font-style: italic');

        const noteHtml = `<p><span style="${styles.join('; ')}">${escapeHtml(updated.text)}</span></p>${
          trimmed ? `<div style="margin-top: 4px; font-size: 12px; color: #92400e;">📝 <em>Ghi chú: ${escapeHtml(trimmed)}</em></div>` : ''
        }`;
        onAppendToNotebook(updated.text, noteHtml);
      }
    }
    setEditingKey(null);
  };

  // Copy all notebook words as markdown/text list
  const handleCopyAllWords = () => {
    if (notebookItems.length === 0 && customHighlights.length === 0) return;
    const lines = notebookItems.map((item: VocabItem, idx: number) => {
      const syn = item.synonyms.length > 0 ? ` [Đồng nghĩa: ${item.synonyms.join(', ')}]` : '';
      const ant = item.antonyms.length > 0 ? ` [Trái nghĩa: ${item.antonyms.join(', ')}]` : '';
      return `${idx + 1}. ${item.word} (${item.phonetic || ''}) : ${item.vietnamese}${syn}${ant}`;
    });
    const extraLines = standaloneCustomHighlights.map(
      (h, idx) => `${lines.length + idx + 1}. "${h.text}"${h.note ? ` — Ghi chú: ${h.note}` : ''}`
    );
    const allLines = [...lines, ...extraLines];
    navigator.clipboard.writeText(`DANH SÁCH ĐÃ LƯU TRONG SỔ TAY (${allLines.length} mục):\n\n` + allLines.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Sổ Tay Từ Vựng Tổng Hợp</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                  {totalSavedCount} mục đã lưu
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lưu tự động mọi từ, đồng/trái nghĩa, ví dụ & ghi chú (bấm lại sẽ cập nhật, không trùng lặp)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Đóng sổ tay"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('highlights')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'highlights'
                  ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Highlighter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Từ & Đoạn Đã Highlight ({notebookItems.length + standaloneCustomHighlights.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'editor'
                  ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Trình Soạn Thảo Ghi Chú & Trích Đoạn</span>
            </button>
          </div>

          {activeTab === 'highlights' && (notebookItems.length > 0 || customHighlights.length > 0) && (
            <button
              onClick={handleCopyAllWords}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Sao chép toàn bộ danh sách đã lưu"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? 'Đã sao chép' : 'Sao chép danh sách'}</span>
            </button>
          )}
        </div>

        {/* Tab 1 Content: Highlighted & Starred Words List */}
        {activeTab === 'highlights' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter and Search Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm từ vựng, nghĩa, cụm từ, ghi chú..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Topic Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-medium">Chủ đề:</span>
                <select
                  value={filterTopic}
                  onChange={e => setFilterTopic(e.target.value as any)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">Tất cả ({notebookItems.length})</option>
                  <option value="environment">Môi trường (Environment)</option>
                  <option value="education">Giáo dục (Education)</option>
                </select>
              </div>

              {/* Format Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-medium">Kiểu:</span>
                <select
                  value={filterFormat}
                  onChange={e => setFilterFormat(e.target.value as any)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">Tất cả kiểu</option>
                  <option value="color">Có màu Highlight</option>
                  <option value="bold">Có In đậm</option>
                  <option value="underline">Có Gạch chân</option>
                  <option value="starred">Đã gắn Sao (★)</option>
                </select>
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {filteredItems.length === 0 && standaloneCustomHighlights.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {notebookItems.length === 0 && customHighlights.length === 0
                      ? 'Sổ tay hiện chưa có từ hoặc đoạn chữ nào được Highlight, Ghi chú hoặc Đánh dấu Sao' 
                      : 'Không tìm thấy mục nào phù hợp với bộ lọc'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    {notebookItems.length === 0 && customHighlights.length === 0 ? (
                      <>
                        Bạn có thể highlight & ghi chú mọi chữ trên trang:
                        <br />
                        1. Bấm vào biểu tượng <strong>Bút dạ (Highlighter)</strong> ở mỗi dòng từ vựng trên bảng.
                        <br />
                        2. Hoặc <strong>bôi đen (chọn) bất kỳ chữ nào</strong> ở mọi cột (Nghĩa, Đồng/Trái nghĩa, Ví dụ...) để highlight hoặc thêm ghi chú nhanh!
                      </>
                    ) : (
                      'Hãy thử điều chỉnh lại từ khóa tìm kiếm hoặc chọn "Tất cả kiểu" để hiển thị đầy đủ.'
                    )}
                  </p>
                </div>
              ) : (
                <>
                  {/* Standalone highlighted phrases & notes (Synonyms, Antonyms, Examples, Meaning snippets) */}
                  {standaloneCustomHighlights.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <span>📌 Cụm từ, Đồng/Trái nghĩa, Ví dụ & Ghi chú riêng ({standaloneCustomHighlights.length})</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {standaloneCustomHighlights.map(h => {
                          const key = normalizeHighlightKey(h.text);
                          const hasBg = h.bgColor && h.bgColor !== 'transparent';
                          const targetVocab =
                            (h.vocabId ? allVocab.find(v => v.id === h.vocabId) : undefined) ||
                            allVocab.find(v => matchCustomHighlightToItem(h, v));
                          const isEditing = editingKey === key;

                          return (
                            <div
                              key={key}
                              className="p-3 bg-white dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between gap-2 shadow-xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <span
                                    style={{
                                      backgroundColor: hasBg ? h.bgColor : undefined,
                                      color: hasBg ? h.textColor : (h.textColor !== 'inherit' ? h.textColor : undefined)
                                    }}
                                    className={`inline-block text-xs sm:text-sm px-2 py-0.5 rounded break-words ${
                                      h.isBold ? 'font-bold' : 'font-medium'
                                    } ${h.isUnderline ? 'underline decoration-emerald-500 decoration-2' : ''} ${
                                      h.isItalic ? 'italic' : ''
                                    }`}
                                  >
                                    {h.text}
                                  </span>

                                  {h.note && !isEditing && (
                                    <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200/70 dark:border-amber-800/50">
                                      📝 {h.note}
                                    </div>
                                  )}

                                  {isEditing && (
                                    <div className="flex items-center gap-1.5 pt-1">
                                      <input
                                        type="text"
                                        value={editNoteDraft}
                                        onChange={e => setEditNoteDraft(e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') handleSaveCustomNoteEdit(h);
                                          if (e.key === 'Escape') setEditingKey(null);
                                        }}
                                        placeholder="Nhập ghi chú..."
                                        className="flex-1 min-w-0 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveCustomNoteEdit(h)}
                                        className="px-2 py-1 text-[11px] bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700"
                                      >
                                        Lưu
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingKey(null)}
                                        className="px-1.5 py-1 text-[11px] text-slate-500 hover:text-slate-700"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => speech.speak(h.text)}
                                    className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                                    title="Nghe phát âm"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingKey(isEditing ? null : key);
                                      setEditNoteDraft(h.note || '');
                                    }}
                                    className={`p-1 rounded transition-colors ${
                                      h.note || isEditing
                                        ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                                        : 'text-slate-400 hover:text-amber-600'
                                    }`}
                                    title="Thêm / Sửa ghi chú"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onRemoveCustomHighlight?.(h.text)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                                    title="Xóa highlight & ghi chú này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {targetVocab && (
                                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                                  <span className="truncate">
                                    Thuộc từ: <strong className="text-slate-600 dark:text-slate-300">{targetVocab.word}</strong> ({targetVocab.dayLabel})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onJumpToWord(targetVocab)}
                                    className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-semibold shrink-0"
                                  >
                                    <Navigation className="w-2.5 h-2.5" />
                                    <span>Đi tới vị trí</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Vocab word cards */}
                  {filteredItems.length > 0 && (
                    <div className="space-y-2.5">
                      {standaloneCustomHighlights.length > 0 && (
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          📚 Từ vựng liên quan ({filteredItems.length})
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredItems.map(item => {
                          const hl = highlights[item.id];
                          const customHl = customHighlights.find(
                            h => normalizeHighlightKey(h.text) === normalizeHighlightKey(item.word)
                          );
                          const matchingSubs = customHighlights.filter(ch => matchCustomHighlightToItem(ch, item));
                          const activeColor = hl?.color || customHl?.bgColor || 'transparent';
                          const activeTextColor = hl?.textColor || customHl?.textColor || (activeColor !== 'transparent' ? getContrastTextColor(activeColor) : undefined);
                          const isBold = hl?.isBold || customHl?.isBold;
                          const isUnderline = hl?.isUnderline || customHl?.isUnderline;
                          const isItalic = customHl?.isItalic;

                          return (
                            <div
                              key={item.id}
                              onClick={() => onJumpToWord(item)}
                              className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex flex-col justify-between gap-2.5 cursor-pointer group shadow-xs"
                              title="Bấm để di chuyển đến vị trí từ này trong bảng"
                            >
                              {/* Word Title + Pronunciation + Direct Format Controls */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      style={{
                                        backgroundColor: activeColor,
                                        color: activeTextColor,
                                      }}
                                      className={`text-base font-bold px-2 py-0.5 rounded transition-all inline-block ${
                                        isBold ? 'font-black' : ''
                                      } ${isUnderline ? 'underline decoration-2 decoration-emerald-500' : ''} ${
                                        isItalic ? 'italic' : ''
                                      }`}
                                    >
                                      {item.word}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        speech.speak(item.word);
                                      }}
                                      className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                      title="Phát âm từ này"
                                    >
                                      <Volume2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {item.phonetic && (
                                    <div className="text-xs text-slate-400 font-mono">
                                      {item.phonetic} {item.pos && <span className="text-slate-500">({item.pos})</span>}
                                    </div>
                                  )}
                                </div>

                                {/* Action tools: Star button + Direct Format Bar + Delete button */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleStar(item.id);
                                    }}
                                    className={`p-1 rounded transition-colors ${
                                      starredIds.includes(item.id) ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                                    }`}
                                    title={starredIds.includes(item.id) ? 'Bỏ đánh dấu sao' : 'Đánh dấu sao quan trọng'}
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
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSaveHighlight(item.id, null);
                                      if (onRemoveCustomHighlight) {
                                        onRemoveCustomHighlight(item.word);
                                        matchingSubs.forEach(sub => {
                                          if (sub.vocabId === item.id || !sub.vocabId) {
                                            onRemoveCustomHighlight(sub.text);
                                          }
                                        });
                                      }
                                      if (starredIds.includes(item.id)) {
                                        onToggleStar(item.id);
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                                    title="Xóa khỏi sổ tay (Hủy toàn bộ highlight & định dạng từ này)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Meaning */}
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800">
                                <HighlightableText text={item.vietnamese} highlights={customHighlights} />
                              </div>

                              {/* Attached Note preview if any */}
                              {customHl?.note && (
                                <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200/60 dark:border-amber-800/50">
                                  📝 {customHl.note}
                                </div>
                              )}

                              {/* Synonyms / Antonyms summary if any */}
                              {(item.synonyms.length > 0 || item.antonyms.length > 0) && (
                                <div className="text-[11px] space-y-1 text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                  {item.synonyms.length > 0 && (
                                    <div className="truncate">
                                      <span className="font-semibold text-sky-600 dark:text-sky-400">Đồng nghĩa:</span>{' '}
                                      <HighlightableText text={item.synonyms.join(', ')} highlights={customHighlights} />
                                    </div>
                                  )}
                                  {item.antonyms.length > 0 && (
                                    <div className="truncate">
                                      <span className="font-semibold text-rose-600 dark:text-rose-400">Trái nghĩa:</span>{' '}
                                      <HighlightableText text={item.antonyms.join(', ')} highlights={customHighlights} />
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Footer badges: Topic & Day */}
                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                                <span className="font-medium">
                                  {item.topic === 'environment' ? '🌿 Môi trường' : '🎓 Giáo dục'} · {item.dayLabel}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectWordDetail(item);
                                  }}
                                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                                >
                                  <span>Xem chi tiết</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab 2 Content: Rich Notes Station & Snippets */}
        {activeTab === 'editor' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <RichNoteStation
              isModal={false}
              initialContent={masterNotebookHtml}
              onSave={onSaveMasterNotebook}
              title="Trình Soạn Thảo Ghi Chú & Trích Đoạn"
            />
          </div>
        )}

      </div>
    </div>
  );
};
