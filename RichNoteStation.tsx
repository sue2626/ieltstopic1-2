import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Highlighter, 
  Palette, 
  List, 
  ListOrdered, 
  RotateCcw, 
  Save, 
  Download, 
  Copy, 
  Check, 
  BookOpen, 
  X
} from 'lucide-react';
import { VocabItem } from '../types/vocab';

interface RichNoteStationProps {
  initialContent: string;
  onSave: (contentHtml: string) => void;
  wordContext?: VocabItem | null;
  onClose?: () => void;
  title?: string;
  isModal?: boolean;
}

import { HIGHLIGHT_PALETTE } from '../utils/highlightColors';

const HIGHLIGHT_COLORS = HIGHLIGHT_PALETTE.map(c => ({ name: c.name, value: c.bg, text: c.text }));

const TEXT_COLORS = [
  { name: 'Đen than', value: '#1e293b' },
  { name: 'Xanh dương đậm', value: '#1d4ed8' },
  { name: 'Đỏ mận', value: '#b91c1c' },
  { name: 'Xanh lục bảo', value: '#047857' },
  { name: 'Tím đậm', value: '#6d28d9' },
  { name: 'Nâu đất', value: '#78350f' },
];

export const RichNoteStation: React.FC<RichNoteStationProps> = ({
  initialContent,
  onSave,
  wordContext,
  onClose,
  title = 'Sổ Tay Ghi Chú & Định Dạng Thông Minh',
  isModal = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<string>('#fef08a');
  const [selectedTextColor, setSelectedTextColor] = useState<string>('#1e293b');
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showTextColorMenu, setShowTextColorMenu] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialContent) {
      editorRef.current.innerHTML = initialContent || '<p>Nhập ghi chú tại đây...</p>';
    }
  }, [initialContent]);

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const applyHighlight = (color: string) => {
    setSelectedHighlight(color);
    exec('hiliteColor', color);
    setShowHighlightMenu(false);
  };

  const applyTextColor = (color: string) => {
    setSelectedTextColor(color);
    exec('foreColor', color);
    setShowTextColorMenu(false);
  };

  const handleSave = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onSave(html);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    }
  };

  const handleInsertWordSnippet = () => {
    if (!wordContext || !editorRef.current) return;
    const snippetHtml = `
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin: 8px 0; font-size: 13px;">
        <b style="color: #0f172a; font-size: 14px;">${wordContext.word}</b> 
        <span style="color: #64748b; font-family: monospace;">${wordContext.phonetic || ''}</span>
        <div style="color: #334155; margin-top: 4px;">• <b>Nghĩa:</b> ${wordContext.vietnamese}</div>
        ${wordContext.synonyms.length > 0 ? `<div style="color: #0369a1; margin-top: 2px;">• <b>Đồng nghĩa:</b> ${wordContext.synonyms.join(', ')}</div>` : ''}
        ${wordContext.antonyms.length > 0 ? `<div style="color: #b91c1c; margin-top: 2px;">• <b>Trái nghĩa:</b> ${wordContext.antonyms.join(', ')}</div>` : ''}
        ${wordContext.example ? `<div style="color: #475569; font-style: italic; margin-top: 2px;">• <b>Ví dụ:</b> "${wordContext.example}"</div>` : ''}
      </div>
      <p></p>
    `;
    document.execCommand('insertHTML', false, snippetHtml);
    handleSave();
  };

  const handleCopyText = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText;
      navigator.clipboard.writeText(text);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    }
  };

  const handleDownload = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText;
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IELTS_Vocab_Notes_${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm md:text-base">{title}</h3>
          {wordContext && (
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium px-2 py-0.5 rounded">
              {wordContext.word}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Rich Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm">
        {/* Bold */}
        <button
          type="button"
          onClick={() => exec('bold')}
          className="p-1.5 hover:bg-white hover:text-slate-900 rounded border border-transparent hover:border-slate-300 transition-colors"
          title="In đậm (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => exec('italic')}
          className="p-1.5 hover:bg-white hover:text-slate-900 rounded border border-transparent hover:border-slate-300 transition-colors"
          title="In nghiêng (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => exec('underline')}
          className="p-1.5 hover:bg-white hover:text-slate-900 rounded border border-transparent hover:border-slate-300 transition-colors"
          title="Gạch chân (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Highlight Marker Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowHighlightMenu(!showHighlightMenu);
              setShowTextColorMenu(false);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            title="Highlight đổi màu nền"
          >
            <Highlighter className="w-4 h-4 text-amber-500" />
            <span
              className="w-3.5 h-3.5 rounded border border-slate-300"
              style={{ backgroundColor: selectedHighlight }}
            />
          </button>

          {showHighlightMenu && (
            <div className="absolute top-full left-0 mt-1 p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 w-64 space-y-2">
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Chọn màu highlight:</div>
              <div className="grid grid-cols-7 gap-1.5">
                {HIGHLIGHT_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => applyHighlight(c.value)}
                    className="w-6 h-6 rounded-md border border-slate-300 dark:border-slate-600 hover:scale-115 transition-transform"
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => applyHighlight('transparent')}
                  className="px-2 py-0.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                  title="Xóa highlight"
                >
                  Xóa highlight
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Text Color Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowTextColorMenu(!showTextColorMenu);
              setShowHighlightMenu(false);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            title="Đổi màu chữ"
          >
            <Palette className="w-4 h-4 text-indigo-600" />
            <span
              className="w-3.5 h-3.5 rounded border border-slate-300"
              style={{ backgroundColor: selectedTextColor }}
            />
          </button>

          {showTextColorMenu && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-slate-200 z-50 flex gap-1.5">
              {TEXT_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => applyTextColor(c.value)}
                  className="w-6 h-6 rounded-full border border-slate-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          className="p-1.5 hover:bg-white hover:text-slate-900 rounded border border-transparent hover:border-slate-300 transition-colors"
          title="Danh sách gạch đầu dòng"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={() => exec('insertOrderedList')}
          className="p-1.5 hover:bg-white hover:text-slate-900 rounded border border-transparent hover:border-slate-300 transition-colors"
          title="Danh sách số thứ tự"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        {/* Clear Format */}
        <button
          type="button"
          onClick={() => exec('removeFormat')}
          className="p-1.5 hover:bg-white hover:text-slate-900 rounded border border-transparent hover:border-slate-300 transition-colors"
          title="Xóa định dạng"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Insert Word Context Button if available */}
        {wordContext && (
          <button
            type="button"
            onClick={handleInsertWordSnippet}
            className="ml-auto text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 font-medium transition-colors"
            title="Chèn thông tin từ vựng này vào ghi chú"
          >
            + Chèn từ vựng này
          </button>
        )}
      </div>

      {/* Editable Content Canvas */}
      <div
        ref={editorRef}
        contentEditable
        onBlur={handleSave}
        className="flex-1 p-4 overflow-y-auto focus:outline-none min-h-[160px] text-slate-800 dark:text-slate-100 text-sm leading-relaxed"
        style={{ minHeight: isModal ? '280px' : '180px' }}
      />

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>{savedFeedback ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Đã tự động lưu
            </span>
          ) : 'Tự động lưu khi nhập hoặc rời ô'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-1 px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            title="Sao chép văn bản"
          >
            {copiedFeedback ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFeedback ? 'Đã sao chép' : 'Sao chép'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            title="Tải ghi chú về máy"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải file</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-700 font-medium rounded transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs">
        <div className="w-full max-w-2xl max-h-[85vh] h-[540px] flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
