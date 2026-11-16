import React, { useState, useEffect, useRef } from 'react';
import { 
  BookMarked, 
  Volume2, 
  Copy, 
  Check, 
  Bold, 
  Underline as UnderlineIcon, 
  Italic, 
  Trash2, 
  Palette,
  Edit3,
  X
} from 'lucide-react';
import { speech } from '../utils/speech';
import { HIGHLIGHT_PALETTE } from '../utils/highlightColors';
import { CustomTextHighlight, normalizeHighlightKey } from '../utils/storage';

interface TextSelectionHighlighterProps {
  onAppendToNotebook: (text: string, noteHtml?: string) => void;
  onSaveCustomHighlight: (highlight: CustomTextHighlight) => void;
  onRemoveCustomHighlight: (text: string) => void;
  customHighlights?: CustomTextHighlight[];
}

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const cleanSegment = (raw: string): string => {
  return raw
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[\s,.;:!?"'()\[\]{}“”‘’«»–—…·/=+]+|[\s,.;:!?"'()\[\]{}“”‘’«»–—…·/=+]+$/gu, '')
    .trim();
};

const extractSubParts = (rawText: string, mainText: string): string[] => {
  const seen = new Set<string>([normalizeHighlightKey(mainText)]);
  const parts: string[] = [];

  const addPart = (candidate: string) => {
    const cleaned = cleanSegment(candidate);
    if (cleaned.length < 2) return;
    const key = normalizeHighlightKey(cleaned);
    if (!seen.has(key)) {
      seen.add(key);
      parts.push(cleaned);
    }
  };

  // Split by newlines (captures multi-line drags like Example + ExampleMeaning)
  const lines = rawText.split(/[\r\n]+/);
  for (const line of lines) {
    addPart(line);
    // Also split by '=' (captures cross-span Synonym/Antonym drags like "unplanned = không lên kế hoạch")
    if (line.includes('=')) {
      for (const seg of line.split('=')) {
        addPart(seg);
      }
    }
  }

  return parts;
};

export const TextSelectionHighlighter: React.FC<TextSelectionHighlighterProps> = ({
  onAppendToNotebook,
  onSaveCustomHighlight,
  onRemoveCustomHighlight,
  customHighlights = []
}) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectedSubParts, setSelectedSubParts] = useState<string[]>([]);
  const [selectedVocabId, setSelectedVocabId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [noteDraft, setNoteDraft] = useState<string>('');
  const toolbarRef = useRef<HTMLDivElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const currentRangeRef = useRef<Range | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const processSelection = (target: EventTarget | null) => {
      // Don't reposition if interacting inside the toolbar itself
      if (toolbarRef.current && toolbarRef.current.contains(target as Node)) {
        return;
      }

      // Ignore selections inside inputs, textareas, or RichNoteStation contenteditable editors
      const targetEl = target as HTMLElement | null;
      if (
        targetEl &&
        targetEl.closest('input, textarea, [contenteditable="true"]') !== null
      ) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        return;
      }

      const rawText = selection.toString();
      const text = cleanSegment(rawText.replace(/[\r\n\t]+/g, ' '));
      if (text.length < 2) {
        setPosition(null);
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        currentRangeRef.current = range.cloneRange();
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        // Detect closest vocab row/card ancestor so Notebook can jump straight back to it
        const getElement = (node: Node | null): HTMLElement | null =>
          node ? (node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)) : null;

        const ancestorEl = getElement(range.commonAncestorContainer);
        const startEl = getElement(range.startContainer);
        const vocabEl = ancestorEl?.closest('[data-vocab-id]') || startEl?.closest('[data-vocab-id]');
        const vocabId = vocabEl?.getAttribute('data-vocab-id') || undefined;

        const subParts = extractSubParts(rawText, text);

        // Position toolbar with fixed viewport coordinates above selection (or below if near top)
        const toolbarWidth = 390;
        const x = Math.max(8, Math.min(window.innerWidth - toolbarWidth - 8, rect.left + rect.width / 2 - toolbarWidth / 2));
        const y = rect.top - 58 < 8 ? Math.min(window.innerHeight - 68, rect.bottom + 8) : rect.top - 58;

        setSelectedText(text);
        setSelectedSubParts(subParts);
        setSelectedVocabId(vocabId);
        setPosition({ x, y });
        setShowColorPicker(false);
        setShowNoteInput(false);
      } catch (err) {
        console.error(err);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      setTimeout(() => processSelection(e.target), 10);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      setTimeout(() => processSelection(e.target), 60);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) {
        return;
      }
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
          setPosition(null);
          setShowColorPicker(false);
          setShowNoteInput(false);
        }
      }, 120);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    if (showNoteInput) {
      setTimeout(() => noteInputRef.current?.focus(), 30);
    }
  }, [showNoteInput]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  const closeToolbar = () => {
    setPosition(null);
    setShowColorPicker(false);
    setShowNoteInput(false);
    window.getSelection()?.removeAllRanges();
  };

  const existingHighlight = customHighlights.find(
    h => normalizeHighlightKey(h.text) === normalizeHighlightKey(selectedText)
  );

  const buildNoteHtml = (hl: {
    text: string;
    bgColor: string;
    textColor: string;
    isBold?: boolean;
    isUnderline?: boolean;
    isItalic?: boolean;
    note?: string;
  }) => {
    const safeText = escapeHtml(hl.text);
    const hasBg = hl.bgColor && hl.bgColor !== 'transparent';
    const styles: string[] = [];
    if (hasBg) {
      styles.push(`background-color: ${hl.bgColor}`);
      styles.push(`color: ${hl.textColor}`);
      styles.push('padding: 1px 5px');
      styles.push('border-radius: 4px');
      styles.push('box-decoration-break: clone');
    }
    if (hl.isBold || hasBg) styles.push('font-weight: 600');
    if (hl.isUnderline) styles.push('text-decoration: underline; text-underline-offset: 3px');
    if (hl.isItalic) styles.push('font-style: italic');

    const formattedText = `<span style="${styles.join('; ')}">${safeText}</span>`;
    const noteLine = hl.note
      ? `<div style="margin-top: 4px; font-size: 12px; color: #92400e;">📝 <em>Ghi chú: ${escapeHtml(hl.note)}</em></div>`
      : '';
    return `<p>${formattedText}</p>${noteLine}`;
  };

  const mergedSubParts =
    selectedSubParts.length > 0 ? selectedSubParts : existingHighlight?.subParts;
  const mergedVocabId = selectedVocabId || existingHighlight?.vocabId;

  // Direct Highlight: changes color directly, replacing previous color without stacking/nesting
  const handleHighlight = (bgColor: string, textColor: string, colorName: string) => {
    if (!selectedText) return;

    const nextItem: CustomTextHighlight = {
      text: selectedText,
      bgColor,
      textColor,
      isBold: existingHighlight?.isBold,
      isUnderline: existingHighlight?.isUnderline,
      isItalic: existingHighlight?.isItalic,
      note: existingHighlight?.note,
      vocabId: mergedVocabId,
      subParts: mergedSubParts
    };

    onSaveCustomHighlight(nextItem);
    closeToolbar();
    onAppendToNotebook(selectedText, buildNoteHtml(nextItem));
    triggerToast(`Đã highlight màu ${colorName} & lưu tự động!`);
  };

  // Direct Bold (In đậm)
  const handleDirectBold = () => {
    if (!selectedText) return;

    const nextBold = existingHighlight ? !existingHighlight.isBold : true;
    const hasColor = !!(existingHighlight?.bgColor && existingHighlight.bgColor !== 'transparent');
    if (!nextBold && !hasColor && !existingHighlight?.isUnderline && !existingHighlight?.isItalic && !existingHighlight?.note) {
      onRemoveCustomHighlight(selectedText);
      closeToolbar();
      triggerToast('Đã xóa định dạng in đậm!');
      return;
    }

    const nextItem: CustomTextHighlight = {
      text: selectedText,
      bgColor: existingHighlight?.bgColor || 'transparent',
      textColor: existingHighlight?.textColor || 'inherit',
      isBold: nextBold,
      isUnderline: existingHighlight?.isUnderline || false,
      isItalic: existingHighlight?.isItalic || false,
      note: existingHighlight?.note,
      vocabId: mergedVocabId,
      subParts: mergedSubParts
    };

    onSaveCustomHighlight(nextItem);
    closeToolbar();
    if (nextBold || hasColor || nextItem.isUnderline || nextItem.isItalic || nextItem.note) {
      onAppendToNotebook(selectedText, buildNoteHtml(nextItem));
    }
    triggerToast(nextBold ? 'Đã bật in đậm!' : 'Đã tắt in đậm!');
  };

  // Direct Underline (Gạch chân)
  const handleDirectUnderline = () => {
    if (!selectedText) return;

    const nextUnderline = existingHighlight ? !existingHighlight.isUnderline : true;
    const hasColor = !!(existingHighlight?.bgColor && existingHighlight.bgColor !== 'transparent');
    if (!nextUnderline && !hasColor && !existingHighlight?.isBold && !existingHighlight?.isItalic && !existingHighlight?.note) {
      onRemoveCustomHighlight(selectedText);
      closeToolbar();
      triggerToast('Đã xóa định dạng gạch chân!');
      return;
    }

    const nextItem: CustomTextHighlight = {
      text: selectedText,
      bgColor: existingHighlight?.bgColor || 'transparent',
      textColor: existingHighlight?.textColor || 'inherit',
      isUnderline: nextUnderline,
      isBold: existingHighlight?.isBold || false,
      isItalic: existingHighlight?.isItalic || false,
      note: existingHighlight?.note,
      vocabId: mergedVocabId,
      subParts: mergedSubParts
    };

    onSaveCustomHighlight(nextItem);
    closeToolbar();
    if (nextUnderline || hasColor || nextItem.isBold || nextItem.isItalic || nextItem.note) {
      onAppendToNotebook(selectedText, buildNoteHtml(nextItem));
    }
    triggerToast(nextUnderline ? 'Đã bật gạch chân!' : 'Đã tắt gạch chân!');
  };

  // Direct Italic (In nghiêng)
  const handleDirectItalic = () => {
    if (!selectedText) return;

    const nextItalic = existingHighlight ? !existingHighlight.isItalic : true;
    const hasColor = !!(existingHighlight?.bgColor && existingHighlight.bgColor !== 'transparent');
    if (!nextItalic && !hasColor && !existingHighlight?.isBold && !existingHighlight?.isUnderline && !existingHighlight?.note) {
      onRemoveCustomHighlight(selectedText);
      closeToolbar();
      triggerToast('Đã xóa định dạng in nghiêng!');
      return;
    }

    const nextItem: CustomTextHighlight = {
      text: selectedText,
      bgColor: existingHighlight?.bgColor || 'transparent',
      textColor: existingHighlight?.textColor || 'inherit',
      isItalic: nextItalic,
      isBold: existingHighlight?.isBold || false,
      isUnderline: existingHighlight?.isUnderline || false,
      note: existingHighlight?.note,
      vocabId: mergedVocabId,
      subParts: mergedSubParts
    };

    onSaveCustomHighlight(nextItem);
    closeToolbar();
    if (nextItalic || hasColor || nextItem.isBold || nextItem.isUnderline || nextItem.note) {
      onAppendToNotebook(selectedText, buildNoteHtml(nextItem));
    }
    triggerToast(nextItalic ? 'Đã bật in nghiêng!' : 'Đã tắt in nghiêng!');
  };

  // Toggle inline note editor
  const handleOpenNoteInput = () => {
    setNoteDraft(existingHighlight?.note || '');
    setShowNoteInput(prev => !prev);
    setShowColorPicker(false);
  };

  // Save inline note attached to the selected text
  const handleSaveInlineNote = () => {
    if (!selectedText) return;
    const trimmed = noteDraft.trim();

    if (!trimmed) {
      const hasFormat =
        (existingHighlight?.bgColor && existingHighlight.bgColor !== 'transparent') ||
        existingHighlight?.isBold ||
        existingHighlight?.isUnderline ||
        existingHighlight?.isItalic;

      if (!hasFormat) {
        onRemoveCustomHighlight(selectedText);
      } else if (existingHighlight) {
        const updated = { ...existingHighlight, note: undefined };
        onSaveCustomHighlight(updated);
        onAppendToNotebook(selectedText, buildNoteHtml(updated));
      }
      closeToolbar();
      triggerToast('Đã xóa ghi chú đoạn này!');
      return;
    }

    const hasExistingFormat =
      (existingHighlight?.bgColor && existingHighlight.bgColor !== 'transparent') ||
      existingHighlight?.isBold ||
      existingHighlight?.isUnderline ||
      existingHighlight?.isItalic;

    const nextItem: CustomTextHighlight = {
      text: selectedText,
      bgColor: hasExistingFormat ? (existingHighlight?.bgColor || 'transparent') : '#fef08a',
      textColor: hasExistingFormat ? (existingHighlight?.textColor || 'inherit') : '#0f172a',
      isBold: existingHighlight?.isBold || false,
      isUnderline: existingHighlight?.isUnderline || false,
      isItalic: existingHighlight?.isItalic || false,
      note: trimmed,
      vocabId: mergedVocabId,
      subParts: mergedSubParts
    };

    onSaveCustomHighlight(nextItem);
    onAppendToNotebook(selectedText, buildNoteHtml(nextItem));
    closeToolbar();
    triggerToast('Đã lưu ghi chú & cập nhật Sổ tay!');
  };

  // Direct Clear Highlight / Clear Formatting (Xóa highlight & định dạng)
  const handleClearHighlight = () => {
    if (!selectedText) return;
    onRemoveCustomHighlight(selectedText);
    closeToolbar();
    triggerToast('Đã xóa highlight và khôi phục chữ gốc!');
  };

  const handleSaveToNotebook = () => {
    const html = existingHighlight ? buildNoteHtml(existingHighlight) : undefined;
    if (!existingHighlight) {
      onSaveCustomHighlight({
        text: selectedText,
        bgColor: '#fef08a',
        textColor: '#0f172a',
        vocabId: mergedVocabId,
        subParts: mergedSubParts
      });
    }
    onAppendToNotebook(
      selectedText,
      html || buildNoteHtml({ text: selectedText, bgColor: '#fef08a', textColor: '#0f172a' })
    );
    closeToolbar();
    triggerToast('Đã lưu & cập nhật vào Sổ tay!');
  };

  const handleSpeak = () => {
    speech.speak(selectedText);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText);
    closeToolbar();
    triggerToast('Đã sao chép!');
  };

  if (!position) {
    return toastMessage ? (
      <div className="fixed bottom-6 right-6 z-[110] bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
        <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
        <span className="font-medium">{toastMessage}</span>
      </div>
    ) : null;
  }

  // First 5 popular colors in the quick bar
  const quickColors = HIGHLIGHT_PALETTE.slice(0, 5);

  return (
    <>
      <div
        ref={toolbarRef}
        onMouseDown={(e) => {
          const tag = (e.target as HTMLElement).tagName;
          if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
            e.preventDefault();
          }
        }}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        className="fixed z-[100] flex flex-col gap-1.5 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl text-xs animate-in fade-in zoom-in-95"
      >
        {/* Main action strip */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Quick color dots */}
          <div className="flex items-center gap-1 px-1 border-r border-slate-200 dark:border-slate-800">
            {quickColors.map(c => {
              const isCurrent = existingHighlight?.bgColor === c.bg;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleHighlight(c.bg, c.text, c.name)}
                  className={`w-4.5 h-4.5 rounded-full border hover:scale-125 transition-transform flex items-center justify-center ${
                    isCurrent ? 'ring-2 ring-emerald-500 scale-110' : 'border-slate-300 dark:border-slate-600'
                  }`}
                  style={{ backgroundColor: c.bg }}
                  title={`Highlight màu ${c.name} (chữ tương phản cao)`}
                >
                  {isCurrent && <Check className="w-2.5 h-2.5 stroke-[3]" style={{ color: c.text }} />}
                </button>
              );
            })}
            
            {/* Open full color palette toggle */}
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowNoteInput(false);
              }}
              className={`p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                showColorPicker ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : ''
              }`}
              title="Xem thêm tất cả 14 màu highlight tương phản cao"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Direct Formatting Buttons: Bold, Underline, Italic, Note, Clear */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-800">
            {/* Bold */}
            <button
              type="button"
              onClick={handleDirectBold}
              className={`p-1.5 rounded-lg font-black transition-colors ${
                existingHighlight?.isBold
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="In đậm trực tiếp (Bold)"
            >
              <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={handleDirectUnderline}
              className={`p-1.5 rounded-lg font-semibold transition-colors ${
                existingHighlight?.isUnderline
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Gạch chân trực tiếp (Underline)"
            >
              <UnderlineIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={handleDirectItalic}
              className={`p-1.5 rounded-lg italic transition-colors ${
                existingHighlight?.isItalic
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="In nghiêng trực tiếp (Italic)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            {/* Inline Note Button */}
            <button
              type="button"
              onClick={handleOpenNoteInput}
              className={`p-1.5 rounded-lg transition-colors relative ${
                showNoteInput || existingHighlight?.note
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ring-1 ring-amber-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={existingHighlight?.note ? `Sửa ghi chú: ${existingHighlight.note}` : 'Thêm ghi chú nhanh cho đoạn chữ này'}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Clear Formatting / Delete Highlight */}
            {existingHighlight && (
              <button
                type="button"
                onClick={handleClearHighlight}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                title="Xóa highlight và bỏ toàn bộ định dạng đoạn này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Save to Notebook Button */}
          <button
            type="button"
            onClick={handleSaveToNotebook}
            className="flex items-center gap-1 px-2 py-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
            title="Lưu hoặc thay thế đoạn này vào Sổ tay"
          >
            <BookMarked className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="whitespace-nowrap font-semibold">Lưu Sổ Tay</span>
          </button>

          {/* Pronounce & Copy */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleSpeak}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Đọc phát âm đoạn này"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Sao chép"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Inline Note Input Box */}
        {showNoteInput && (
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
            <input
              ref={noteInputRef}
              type="text"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveInlineNote();
                } else if (e.key === 'Escape') {
                  setShowNoteInput(false);
                }
              }}
              placeholder="Ghi chú nhanh cho đoạn chữ này..."
              className="flex-1 min-w-[180px] px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={handleSaveInlineNote}
              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={() => setShowNoteInput(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              title="Đóng"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Expanded 14-Color High Contrast Palette Dropdown */}
        {showColorPicker && (
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Bảng màu highlight (Chống lóa chữ trong Dark Mode)</span>
              <span>14 màu</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {HIGHLIGHT_PALETTE.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleHighlight(c.bg, c.text, c.name)}
                  className="w-6 h-6 rounded-md border border-slate-300/80 dark:border-slate-600 hover:scale-120 transition-transform shadow-xs flex items-center justify-center"
                  style={{ backgroundColor: c.bg }}
                  title={`${c.name} - Chữ: ${c.text === '#ffffff' ? 'Trắng' : 'Đen rõ nét'}`}
                >
                  <span style={{ color: c.text }} className="text-[9px] font-bold">Aa</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[110] bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </>
  );
};
