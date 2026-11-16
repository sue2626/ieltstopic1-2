import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Star, 
  CheckCircle2, 
  RotateCcw, 
  Printer, 
  BookMarked, 
  Filter, 
  FileText, 
  Volume2, 
  Layers, 
  CheckSquare, 
  Sparkles,
  BookOpen,
  Laptop,
  Smartphone
} from 'lucide-react';
import { VocabItem, TopicId, DayKey, WordType, UserHighlight, StudyMaskState } from './types/vocab';
import { ALL_VOCAB, TOPIC_INFO, DAY_TABS, filterVocab } from './data/allVocab';
import { storage, CustomTextHighlight, normalizeHighlightKey } from './utils/storage';
import { getContrastTextColor } from './utils/highlightColors';
import { Header, ActiveTab, LayoutMode } from './components/Header';
import { PDFTableView } from './components/PDFTableView';
import { MobileVerticalView } from './components/MobileVerticalView';
import { FlashcardView } from './components/FlashcardView';
import { QuizView } from './components/QuizView';
import { WordDetailModal } from './components/WordDetailModal';
import { PdfModal } from './components/PdfModal';
import { RichNoteStation } from './components/RichNoteStation';
import { NotebookModal } from './components/NotebookModal';
import { TextSelectionHighlighter } from './components/TextSelectionHighlighter';
import { StudyMaskControlBar } from './components/StudyMaskControlBar';
import { CuteStudyCompanion } from './components/CuteStudyCompanion';
import { ResetProgressModal } from './components/ResetProgressModal';
import { THEME_SKINS, getThemeSkin, ThemeSkinId } from './utils/themeSkins';
import { ILLUSTRATIONS } from './assets/illustrations';

const removeMatchingNotebookNodes = (container: HTMLElement, key: string) => {
  // Remove explicitly keyed entries
  container.querySelectorAll('[data-hl-key]').forEach(el => {
    const elKey = normalizeHighlightKey(el.getAttribute('data-hl-key') || '');
    if (elKey === key) {
      el.remove();
    }
  });

  // Clean up legacy un-keyed top-level highlight snippets whose normalized text matches
  Array.from(container.children).forEach(child => {
    const tag = child.tagName.toLowerCase();
    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') return;
    if (tag === 'p' || tag === 'div') {
      const childText = normalizeHighlightKey(child.textContent || '');
      if (!childText) return;
      if (childText === key) {
        child.remove();
        return;
      }
      // Match legacy "[trích xuất ...] <text>" div blocks
      if (childText.startsWith('[trích xuất') && childText.endsWith(key)) {
        child.remove();
      }
    }
  });
};

const cleanupTrailingBreaks = (container: HTMLElement) => {
  while (
    container.lastElementChild &&
    container.lastElementChild.tagName.toLowerCase() === 'br'
  ) {
    container.lastElementChild.remove();
  }
};

const upsertNotebookSnippet = (html: string, rawText: string, innerHtml: string): { nextHtml: string; replaced: boolean } => {
  const key = normalizeHighlightKey(rawText);
  if (!key) return { nextHtml: html, replaced: false };

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__nb_root">${html || ''}</div>`, 'text/html');
  const root = doc.getElementById('__nb_root');
  if (!root) return { nextHtml: html, replaced: false };

  const beforeCount = root.children.length;
  const hadKeyed = Array.from(root.querySelectorAll('[data-hl-key]')).some(
    el => normalizeHighlightKey(el.getAttribute('data-hl-key') || '') === key
  );

  removeMatchingNotebookNodes(root, key);
  const replaced = hadKeyed || root.children.length < beforeCount;

  cleanupTrailingBreaks(root);

  const entry = doc.createElement('div');
  entry.setAttribute('data-hl-key', key);
  entry.setAttribute(
    'style',
    'margin: 8px 0; padding: 8px 12px; border-left: 3px solid #10b981; background: rgba(16, 185, 129, 0.06); border-radius: 6px;'
  );
  entry.innerHTML = innerHtml;
  root.appendChild(entry);

  return { nextHtml: root.innerHTML, replaced };
};

const removeNotebookSnippet = (html: string, rawText: string): string => {
  const key = normalizeHighlightKey(rawText);
  if (!key || !html) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__nb_root">${html}</div>`, 'text/html');
  const root = doc.getElementById('__nb_root');
  if (!root) return html;

  removeMatchingNotebookNodes(root, key);
  cleanupTrailingBreaks(root);
  return root.innerHTML;
};

export default function App() {
  // Theme & Orientation State (Default to Pastel Tối / Dark Pastel)
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (!localStorage.getItem('ielts_pastel_dusk_v1')) {
      localStorage.setItem('ielts_pastel_dusk_v1', '1');
      localStorage.setItem('ielts_theme', 'dark');
      return true;
    }
    const saved = localStorage.getItem('ielts_theme');
    if (saved) return saved === 'dark';
    return true;
  });

  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = localStorage.getItem('ielts_layout');
    if (saved === 'horizontal' || saved === 'vertical') return saved;
    return window.innerWidth < 768 ? 'vertical' : 'horizontal';
  });

  // Navigation & Topic Selection
  const [activeTab, setActiveTab] = useState<ActiveTab>('table');
  const [currentTopic, setCurrentTopic] = useState<TopicId>(() => {
    const saved = localStorage.getItem('ielts_current_topic');
    return (saved === 'environment' || saved === 'education') ? saved : 'environment';
  });
  const [selectedDay, setSelectedDay] = useState<DayKey>(() => {
    const saved = localStorage.getItem('ielts_selected_day') as DayKey;
    return saved || 'all';
  });
  const [selectedWordType, setSelectedWordType] = useState<WordType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'starred' | 'learning' | 'mastered'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // LocalStorage State (Instant Load from Storage)
  const [starredIds, setStarredIds] = useState<string[]>(() => storage.getStarred());
  const [masteryMap, setMasteryMap] = useState<Record<string, 'new' | 'learning' | 'mastered'>>(() => storage.getMastery());
  const [wordNotes, setWordNotes] = useState<Record<string, string>>(() => storage.getWordNotes());
  const [highlights, setHighlights] = useState<Record<string, UserHighlight>>(() => storage.getHighlights());
  const [customHighlights, setCustomHighlights] = useState<CustomTextHighlight[]>(() => storage.getCustomHighlights());
  const [masterNotebookHtml, setMasterNotebookHtml] = useState<string>(() => storage.getMasterNotebook());
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Study Mask State (Che Cột Tự Kiểm Tra & Rà Chuột Để Hiện)
  const [maskState, setMaskState] = useState<StudyMaskState>(() => {
    const saved = localStorage.getItem('ielts_mask_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return { word: false, meaning: false, synonymAntonym: false, example: false };
  });

  const handleToggleMask = (key: keyof StudyMaskState) => {
    setMaskState(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('ielts_mask_state', JSON.stringify(next));
      return next;
    });
  };

  const handleSetAllMasks = (masked: boolean) => {
    const next: StudyMaskState = {
      word: masked,
      meaning: masked,
      synonymAntonym: masked,
      example: masked
    };
    setMaskState(next);
    localStorage.setItem('ielts_mask_state', JSON.stringify(next));
  };

  // Modals
  const [selectedWordDetail, setSelectedWordDetail] = useState<VocabItem | null>(null);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [showNotebookModal, setShowNotebookModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Cute Color Theme Skin State (Default to Tím Khói Pastel)
  const [themeSkinId, setThemeSkinId] = useState<ThemeSkinId>(() => {
    const saved = localStorage.getItem('ielts_theme_skin') as ThemeSkinId;
    if (!localStorage.getItem('ielts_pastel_dusk_skin_v1')) {
      localStorage.setItem('ielts_pastel_dusk_skin_v1', '1');
      const nextSkin: ThemeSkinId = saved && saved !== 'emerald' && THEME_SKINS.some(s => s.id === saved) ? saved : 'lavender';
      localStorage.setItem('ielts_theme_skin', nextSkin);
      return nextSkin;
    }
    return saved && THEME_SKINS.some(s => s.id === saved) ? saved : 'lavender';
  });

  const currentSkin = useMemo(() => getThemeSkin(themeSkinId), [themeSkinId]);

  const handleSelectSkin = (id: ThemeSkinId) => {
    setThemeSkinId(id);
    localStorage.setItem('ielts_theme_skin', id);
    document.documentElement.setAttribute('data-theme', id);
    setNotificationToast(`Đã chuyển sang giao diện: ${getThemeSkin(id).emoji} ${getThemeSkin(id).nameVi}`);
    setTimeout(() => setNotificationToast(null), 2500);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeSkinId);
  }, [themeSkinId]);

  // Reset Progress & Factory Settings Handlers
  const handleResetProgressOnly = () => {
    storage.resetProgress();
    storage.clearCustomHighlights();
    setStarredIds([]);
    setMasteryMap({});
    setWordNotes({});
    setHighlights({});
    setCustomHighlights([]);
    setMasterNotebookHtml('<h3>Sổ Tay Từ Vựng & Ghi Chú Cá Nhân</h3><p>Ghi lại cấu trúc câu hay, collocations cần nhớ và phân biệt từ dễ nhầm lẫn tại đây.</p>');
    setNotificationToast('✨ Đã xóa toàn bộ tiến độ học tập! Chúc bạn bắt đầu lại thật hứng khởi!');
    setTimeout(() => setNotificationToast(null), 3500);
  };

  const handleResetEverything = () => {
    storage.resetAll();
    storage.clearCustomHighlights();
    localStorage.removeItem('ielts_current_topic');
    localStorage.removeItem('ielts_selected_day');
    setCurrentTopic('environment');
    setSelectedDay('all');
    setStarredIds([]);
    setMasteryMap({});
    setWordNotes({});
    setHighlights({});
    setCustomHighlights([]);
    setMasterNotebookHtml('<h3>Sổ Tay Từ Vựng & Ghi Chú Cá Nhân</h3><p>Ghi lại cấu trúc câu hay, collocations cần nhớ và phân biệt từ dễ nhầm lẫn tại đây.</p>');
    setThemeSkinId('lavender');
    setIsDark(true);
    setLayoutMode('horizontal');
    setMaskState({ word: false, meaning: false, synonymAntonym: false, example: false });
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'lavender');
    setNotificationToast('🌱 Đã khôi phục toàn bộ giao diện & tiến độ về trạng thái ban đầu!');
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // Apply Dark Mode class to document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ielts_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ielts_theme', 'light');
    }
  }, [isDark]);

  // Persist layout mode
  const handleToggleLayoutMode = () => {
    const nextMode = layoutMode === 'horizontal' ? 'vertical' : 'horizontal';
    setLayoutMode(nextMode);
    localStorage.setItem('ielts_layout', nextMode);
  };

  // Persist currentTopic and selectedDay
  useEffect(() => {
    localStorage.setItem('ielts_current_topic', currentTopic);
  }, [currentTopic]);

  useEffect(() => {
    localStorage.setItem('ielts_selected_day', selectedDay);
  }, [selectedDay]);

  const handleToggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // Initialize storage
  useEffect(() => {
    setStarredIds(storage.getStarred());
    setMasteryMap(storage.getMastery());
    setWordNotes(storage.getWordNotes());
    setHighlights(storage.getHighlights());
    setCustomHighlights(storage.getCustomHighlights());
    setMasterNotebookHtml(storage.getMasterNotebook());
  }, []);

  // Handlers
  const handleToggleStar = (id: string) => {
    const updated = storage.toggleStarred(id);
    setStarredIds(updated);
  };

  const handleSetMastery = (id: string, status: 'new' | 'learning' | 'mastered') => {
    const updated = storage.setMastery(id, status);
    setMasteryMap(updated);
  };

  const handleSaveWordNote = (id: string, html: string) => {
    const updated = storage.saveWordNote(id, html);
    setWordNotes(updated);
  };

  const handleSaveHighlight = (id: string, hl: Partial<UserHighlight> | null) => {
    const updated = storage.saveHighlight(id, hl);
    setHighlights(updated);

    const item = ALL_VOCAB.find(v => v.id === id);
    if (item) {
      if (!hl) {
        const updatedCustom = storage.removeCustomHighlight(item.word);
        setCustomHighlights(updatedCustom);
        const cleanedNotebook = removeNotebookSnippet(masterNotebookHtml, item.word);
        if (cleanedNotebook !== masterNotebookHtml) {
          handleSaveMasterNotebook(cleanedNotebook);
        }
      } else {
        const bgColor = hl.color || 'transparent';
        const textColor = hl.textColor || (bgColor !== 'transparent' ? getContrastTextColor(bgColor) : 'inherit');
        const updatedCustom = storage.saveCustomHighlight({
          text: item.word,
          bgColor,
          textColor,
          isBold: hl.isBold,
          isUnderline: hl.isUnderline,
          vocabId: item.id,
        });
        setCustomHighlights(updatedCustom);
      }
    }
  };

  const handleSaveCustomHighlight = (item: CustomTextHighlight) => {
    const updated = storage.saveCustomHighlight(item);
    setCustomHighlights(updated);

    // If highlighted text matches a vocab word, sync to word highlight too
    const clean = normalizeHighlightKey(item.text);
    const matched = ALL_VOCAB.find(v => normalizeHighlightKey(v.word) === clean);
    if (matched) {
      const updatedHl = storage.saveHighlight(matched.id, {
        color: item.bgColor,
        textColor: item.textColor,
        isBold: item.isBold,
        isUnderline: item.isUnderline
      });
      setHighlights(updatedHl);
    }
  };

  const handleRemoveCustomHighlight = (text: string) => {
    const updated = storage.removeCustomHighlight(text);
    setCustomHighlights(updated);

    const clean = normalizeHighlightKey(text);
    const matched = ALL_VOCAB.find(v => normalizeHighlightKey(v.word) === clean);
    if (matched) {
      const updatedHl = storage.saveHighlight(matched.id, null);
      setHighlights(updatedHl);
    }

    const cleanedNotebook = removeNotebookSnippet(masterNotebookHtml, text);
    if (cleanedNotebook !== masterNotebookHtml) {
      handleSaveMasterNotebook(cleanedNotebook);
    }
  };

  const handleSaveMasterNotebook = (html: string) => {
    storage.saveMasterNotebook(html);
    setMasterNotebookHtml(html);
  };

  // Upsert / replace highlighted text in Master Notebook (prevents duplicates cleanly)
  const handleAppendToNotebook = (text: string, noteHtml?: string) => {
    const cleanText = text.replace(/[\u00a0\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    const dateStr = new Date().toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });

    const snippetInner =
      noteHtml ||
      `<span style="font-weight: 600; color: #854d0e;">[Trích xuất ${dateStr}]</span><div style="font-size: 14px; margin-top: 4px;">${cleanText}</div>`;

    const { nextHtml, replaced } = upsertNotebookSnippet(masterNotebookHtml, cleanText, snippetInner);
    handleSaveMasterNotebook(nextHtml);

    setNotificationToast(
      replaced
        ? `Đã cập nhật "${cleanText.slice(0, 24)}" trong Sổ Tay!`
        : `Đã lưu "${cleanText.slice(0, 24)}" vào Sổ Tay!`
    );
    setTimeout(() => {
      setNotificationToast(null);
    }, 2500);
  };

  // Filtered vocabulary list for Table view
  const currentTopicVocab = useMemo(() => {
    return filterVocab({
      topic: currentTopic,
      day: selectedDay,
      wordType: selectedWordType,
      query: searchQuery,
      starredIds,
      masteryMap,
      statusFilter
    });
  }, [currentTopic, selectedDay, selectedWordType, searchQuery, starredIds, masteryMap, statusFilter]);

  // Overall Topic Stats
  const topicStats = useMemo(() => {
    const allTopicItems = ALL_VOCAB.filter(i => i.topic === currentTopic);
    const mastered = allTopicItems.filter(i => masteryMap[i.id] === 'mastered').length;
    const learning = allTopicItems.filter(i => masteryMap[i.id] === 'learning').length;
    const starred = allTopicItems.filter(i => starredIds.includes(i.id)).length;
    const total = allTopicItems.length;
    const progressPct = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return { mastered, learning, starred, total, progressPct };
  }, [currentTopic, masteryMap, starredIds]);

  const currentTopicInfo = TOPIC_INFO[currentTopic];

  const highlightedWordsCount = useMemo(() => {
    const keys = new Set<string>();
    Object.keys(highlights).forEach(id => {
      const hl = highlights[id];
      if ((hl?.color && hl.color !== 'transparent') || hl?.isBold || hl?.isUnderline) {
        const item = ALL_VOCAB.find(v => v.id === id);
        keys.add(item ? normalizeHighlightKey(item.word) : id);
      }
    });
    customHighlights.forEach(h => {
      if ((h.bgColor && h.bgColor !== 'transparent') || h.isBold || h.isUnderline || h.isItalic || h.note) {
        keys.add(normalizeHighlightKey(h.text));
      }
    });
    return keys.size;
  }, [highlights, customHighlights]);

  return (
    <div 
      className="min-h-screen app-container text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300"
      style={{ backgroundColor: isDark ? currentSkin.pageBgDark : currentSkin.pageBgLight }}
    >
      {/* 1. Floating Text Selection Toolbar (Highlight & Note Trực Tiếp Khi Bôi Đen) */}
      <TextSelectionHighlighter 
        onAppendToNotebook={handleAppendToNotebook}
        onSaveCustomHighlight={handleSaveCustomHighlight}
        onRemoveCustomHighlight={handleRemoveCustomHighlight}
        customHighlights={customHighlights}
      />

      {/* Floating Notification Toast */}
      {notificationToast && (
        <div 
          className="fixed bottom-6 right-6 z-50 text-white px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
          style={{ 
            backgroundColor: isDark ? '#1a1429' : '#0f172a',
            borderColor: currentSkin.colorHex,
            boxShadow: `0 10px 25px -5px ${currentSkin.colorHex}50`
          }}
        >
          <Sparkles className="w-4 h-4" style={{ color: currentSkin.colorHex }} />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* 2. Header (Adheres to Top Bar Contract) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTopic={currentTopic}
        setCurrentTopic={setCurrentTopic}
        onOpenPdfModal={() => setShowPdfModal(true)}
        onOpenNotebook={() => setShowNotebookModal(true)}
        onOpenResetModal={() => setShowResetModal(true)}
        starredCount={starredIds.length}
        highlightedCount={highlightedWordsCount}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        currentSkin={currentSkin}
        onSelectSkin={handleSelectSkin}
        layoutMode={layoutMode}
        onToggleLayoutMode={handleToggleLayoutMode}
      />

      {/* 3. Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* Topic Switcher & Hero Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 md:p-6 no-print">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Topic Segmented Switcher */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Chọn Chủ Đề Từ Vựng Cần Học:
              </span>
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTopic('environment');
                    setSelectedDay('all');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                    currentTopic === 'environment'
                      ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                  <span>Topic 1: Environment</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentTopic('education');
                    setSelectedDay('all');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                    currentTopic === 'education'
                      ? 'bg-white dark:bg-slate-900 text-indigo-800 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span>Topic 2: Education</span>
                </button>
              </div>
            </div>

            {/* Progress & Quick Stats */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Đã thuộc: <b className="text-slate-900 dark:text-white font-mono">{topicStats.mastered}</b>/{topicStats.total} từ ({topicStats.progressPct}%)
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span>
                  Đã gắn sao: <b className="text-slate-900 dark:text-white font-mono">{topicStats.starred}</b> từ
                </span>
              </div>

              {/* Layout Mode quick indicator */}
              <button
                type="button"
                onClick={handleToggleLayoutMode}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors font-medium border border-slate-200 dark:border-slate-700 cursor-pointer"
                title={layoutMode === 'horizontal' ? 'Chuyển sang Chế độ Dọc (Điện thoại)' : 'Chuyển sang Chế độ Ngang (Laptop)'}
              >
                {layoutMode === 'horizontal' ? (
                  <>
                    <Laptop className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Ngang (Laptop)</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Dọc (Mobile)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors font-medium border border-slate-200 dark:border-slate-700 cursor-pointer"
                title="In tài liệu từ vựng theo bảng chuẩn"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In bảng học</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cute Topic Illustration Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm h-36 sm:h-44 flex items-end p-4 sm:p-6 no-print group">
          <img
            src={currentTopic === 'environment' ? ILLUSTRATIONS.environment : ILLUSTRATIONS.education}
            alt={currentTopicInfo.title}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between w-full gap-2 text-white">
            <div className="space-y-1">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg backdrop-blur-md border border-white/20 ${
                currentTopic === 'environment' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-indigo-500/30 text-indigo-300'
              }`}>
                {currentTopic === 'environment' ? '🌿 Hình Ảnh Minh Họa: Môi Trường Tươi Đẹp' : '🎓 Hình Ảnh Minh Họa: Không Gian Học Tập Lý Tưởng'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md">
                {currentTopicInfo.title}
              </h2>
              <p className="text-xs text-slate-200 line-clamp-1 max-w-xl font-medium">
                {currentTopicInfo.subtitle} · {currentTopicInfo.tagline}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl font-semibold border border-white/20 shadow-xs">
                {topicStats.total} từ vựng chuẩn
              </span>
            </div>
          </div>
        </div>

        {/* 4. VIEW 1: TABLE VIEW (Trình bày chuẩn bảng như file PDF gốc / Chế độ Dọc Mobile) */}
        {activeTab === 'table' && (
          <div className="space-y-6">
            {/* Search, Day filter, and Status filter Toolbar */}
            <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 no-print">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Instant Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm nhanh từ tiếng Anh, nghĩa tiếng Việt, từ đồng nghĩa hoặc câu ví dụ..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">Lọc:</span>
                  {(['all', 'starred', 'learning', 'mastered'] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-2 rounded-xl border font-medium transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === status
                          ? 'font-bold shadow-xs text-white'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      style={statusFilter === status ? {
                        backgroundColor: currentSkin.colorHex,
                        borderColor: currentSkin.colorHex,
                      } : undefined}
                    >
                      {status === 'all' && 'Tất cả'}
                      {status === 'starred' && 'Có sao ★'}
                      {status === 'learning' && 'Đang học'}
                      {status === 'mastered' && 'Đã thuộc'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Tabs (MON -> SUN + SYNTHESIS) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {DAY_TABS.map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedDay(tab.key)}
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                      selectedDay === tab.key
                        ? 'font-bold shadow-xs text-white'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    style={selectedDay === tab.key ? {
                      backgroundColor: currentSkin.colorHex,
                      borderColor: currentSkin.colorHex,
                    } : undefined}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Flash Mask Study Control Bar (Che Cột Tự Kiểm Tra & Rà Chuột Để Hiện) */}
            <StudyMaskControlBar
              maskState={maskState}
              onToggleMask={handleToggleMask}
              onSetAllMasks={handleSetAllMasks}
            />

            {/* Content: Switch between Horizontal PDF Table & Vertical Mobile Cards */}
            {currentTopicVocab.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                Không tìm thấy từ vựng nào khớp với tìm kiếm "{searchQuery}".
              </div>
            ) : layoutMode === 'horizontal' ? (
              <PDFTableView
                items={currentTopicVocab}
                topic={currentTopic}
                selectedDay={selectedDay}
                starredIds={starredIds}
                masteryMap={masteryMap}
                wordNotes={wordNotes}
                highlights={highlights}
                customHighlights={customHighlights}
                onToggleStar={handleToggleStar}
                onSetMastery={handleSetMastery}
                onSaveWordNote={handleSaveWordNote}
                onSaveHighlight={handleSaveHighlight}
                onSelectWordDetail={setSelectedWordDetail}
                maskState={maskState}
                onToggleMask={handleToggleMask}
              />
            ) : (
              <MobileVerticalView
                items={currentTopicVocab}
                topic={currentTopic}
                selectedDay={selectedDay}
                starredIds={starredIds}
                masteryMap={masteryMap}
                wordNotes={wordNotes}
                highlights={highlights}
                customHighlights={customHighlights}
                onToggleStar={handleToggleStar}
                onSetMastery={handleSetMastery}
                onSaveWordNote={handleSaveWordNote}
                onSaveHighlight={handleSaveHighlight}
                onSelectWordDetail={setSelectedWordDetail}
                maskState={maskState}
                onToggleMask={handleToggleMask}
              />
            )}
          </div>
        )}

        {/* 5. VIEW 2: FLASHCARD */}
        {activeTab === 'flashcard' && (
          <FlashcardView
            items={ALL_VOCAB}
            starredIds={starredIds}
            masteryMap={masteryMap}
            wordNotes={wordNotes}
            customHighlights={customHighlights}
            onToggleStar={handleToggleStar}
            onSetMastery={handleSetMastery}
            onSaveWordNote={handleSaveWordNote}
            initialTopic={currentTopic}
          />
        )}

        {/* 6. VIEW 3: TRẮC NGHIỆM CÓ BỘ LỌC (Multiple Choice Quiz) */}
        {activeTab === 'quiz' && (
          <QuizView
            allVocab={ALL_VOCAB}
            starredIds={starredIds}
            masteryMap={masteryMap}
            customHighlights={customHighlights}
            onSelectWordDetail={setSelectedWordDetail}
            onSetMastery={handleSetMastery}
          />
        )}
      </main>

      {/* 8. Word Detail Inspector Modal */}
      {selectedWordDetail && (
        <WordDetailModal
          item={selectedWordDetail}
          onClose={() => setSelectedWordDetail(null)}
          isStarred={starredIds.includes(selectedWordDetail.id)}
          masteryStatus={masteryMap[selectedWordDetail.id] || 'new'}
          userNote={wordNotes[selectedWordDetail.id] || ''}
          highlight={highlights[selectedWordDetail.id]}
          customHighlights={customHighlights}
          onToggleStar={() => handleToggleStar(selectedWordDetail.id)}
          onSetMastery={(status) => handleSetMastery(selectedWordDetail.id, status)}
          onSaveNote={(html) => handleSaveWordNote(selectedWordDetail.id, html)}
          onSaveHighlight={(hl) => handleSaveHighlight(selectedWordDetail.id, hl)}
        />
      )}

      {/* 9. Original PDF Modal */}
      {showPdfModal && (
        <PdfModal
          topic={currentTopic}
          onClose={() => setShowPdfModal(false)}
        />
      )}

      {/* 10. Master Notebook Modal (Sổ Tay Tổng Hợp: Tự động gom mọi từ Highlight, In đậm, Gạch chân hoặc Đánh dấu sao) */}
      <NotebookModal
        isOpen={showNotebookModal}
        onClose={() => setShowNotebookModal(false)}
        allVocab={ALL_VOCAB}
        highlights={highlights}
        starredIds={starredIds}
        customHighlights={customHighlights}
        onToggleStar={handleToggleStar}
        onSaveHighlight={handleSaveHighlight}
        onSaveCustomHighlight={handleSaveCustomHighlight}
        onRemoveCustomHighlight={handleRemoveCustomHighlight}
        onAppendToNotebook={handleAppendToNotebook}
        onSelectWordDetail={(item) => setSelectedWordDetail(item)}
        masterNotebookHtml={masterNotebookHtml}
        onSaveMasterNotebook={handleSaveMasterNotebook}
        onJumpToWord={(item) => {
          setCurrentTopic(item.topic);
          setSelectedDay(item.day);
          setActiveTab('table');
          setStatusFilter('all');
          setSearchQuery('');
          setSelectedWordType('all');
          setShowNotebookModal(false);
          setTimeout(() => {
            const el = document.getElementById(`vocab-${item.id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('bg-emerald-100', 'dark:bg-emerald-950', 'transition-colors', 'duration-1000');
              setTimeout(() => {
                el.classList.remove('bg-emerald-100', 'dark:bg-emerald-950');
              }, 2000);
            }
          }, 300);
        }}
      />

      {/* 11. Cute Study Companion Mascot (Bé Corgi học bá cổ vũ & thăng cấp tri thức) */}
      <CuteStudyCompanion
        masteredCount={topicStats.mastered}
        totalWords={topicStats.total}
        themeSkin={currentSkin}
      />

      {/* 12. Reset Progress & Factory Settings Modal (Đặt lại tiến độ hoặc khôi phục mặc định) */}
      <ResetProgressModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onResetProgressOnly={handleResetProgressOnly}
        onResetEverything={handleResetEverything}
        stats={{
          masteredCount: Object.values(masteryMap).filter(v => v === 'mastered').length,
          starredCount: starredIds.length,
          highlightCount: Object.keys(highlights).length,
          noteCount: Object.keys(wordNotes).length
        }}
      />

      {/* Clean quiet footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400 no-print transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>IELTS Vocab Master · Hệ thống học từ vựng chuyên sâu chuẩn hóa theo tài liệu gốc (Environment & Education)</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPdfModal(true)}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
            >
              Đối chiếu PDF gốc
            </button>
            <button
              onClick={() => setShowNotebookModal(true)}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
            >
              Mở sổ tay ghi chú
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1 font-medium"
              title="Đặt lại tiến độ để học lại từ đầu hoặc khôi phục giao diện ban đầu"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại ban đầu</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
