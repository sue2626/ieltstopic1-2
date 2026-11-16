import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Volume2, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  Shuffle, 
  Star, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  VolumeX, 
  Filter,
  RotateCcw
} from 'lucide-react';
import { VocabItem, TopicId, DayKey, WordType } from '../types/vocab';
import { speech } from '../utils/speech';
import { CustomTextHighlight, normalizeHighlightKey } from '../utils/storage';
import { AudioWord } from './AudioWord';
import { RichNoteStation } from './RichNoteStation';
import { HighlightableText } from './HighlightableText';

interface FlashcardViewProps {
  items: VocabItem[];
  starredIds: string[];
  masteryMap: Record<string, 'new' | 'learning' | 'mastered'>;
  wordNotes: Record<string, string>;
  customHighlights?: CustomTextHighlight[];
  onToggleStar: (id: string) => void;
  onSetMastery: (id: string, status: 'new' | 'learning' | 'mastered') => void;
  onSaveWordNote: (id: string, html: string) => void;
  initialTopic?: TopicId;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  items,
  starredIds,
  masteryMap,
  wordNotes,
  customHighlights = [],
  onToggleStar,
  onSetMastery,
  onSaveWordNote
}) => {
  // Filter States
  const [selectedTopic, setSelectedTopic] = useState<TopicId | 'all'>('all');
  const [selectedDay, setSelectedDay] = useState<DayKey>('all');
  const [selectedType, setSelectedType] = useState<WordType>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'new' | 'starred' | 'learning' | 'mastered'>('all');
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(false);

  // Deck state
  const [filteredDeck, setFilteredDeck] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [activeNoteWord, setActiveNoteWord] = useState<VocabItem | null>(null);
  const prevFilterKeyRef = useRef<string>('');

  const topicCounts = useMemo(() => ({
    all: items.length,
    environment: items.filter(i => i.topic === 'environment').length,
    education: items.filter(i => i.topic === 'education').length
  }), [items]);

  const computedList = useMemo(() => {
    let list = items;
    if (selectedTopic !== 'all') {
      list = list.filter(i => i.topic === selectedTopic);
    }
    if (selectedDay !== 'all') {
      list = list.filter(i => i.day === selectedDay);
    }
    if (selectedType === 'adj_adv') {
      list = list.filter(i => i.tableType === 'table1');
    } else if (selectedType === 'noun_verb') {
      list = list.filter(i => i.tableType === 'table2');
    } else if (selectedType === 'synthesis') {
      list = list.filter(i => i.tableType === 'synthesis');
    }

    if (selectedStatus === 'starred') {
      list = list.filter(i => starredIds.includes(i.id));
    } else if (selectedStatus === 'learning') {
      list = list.filter(i => masteryMap[i.id] === 'learning');
    } else if (selectedStatus === 'mastered') {
      list = list.filter(i => masteryMap[i.id] === 'mastered');
    } else if (selectedStatus === 'new') {
      list = list.filter(i => !masteryMap[i.id] || masteryMap[i.id] === 'new');
    }
    return list;
  }, [items, selectedTopic, selectedDay, selectedType, selectedStatus, starredIds, masteryMap]);

  // Update deck ONLY when filter criteria change (or clamp safely if dynamic status filter removes a card)
  useEffect(() => {
    const filterKey = `${selectedTopic}|${selectedDay}|${selectedType}|${selectedStatus}|${items.length}`;
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey;
      setFilteredDeck(computedList);
      setCurrentIndex(0);
      setIsFlipped(false);
    } else if (selectedStatus !== 'all') {
      // Dynamic status filter (e.g. 'starred' / 'learning' / 'mastered' / 'new'): preserve order & keep index valid
      const allowedIds = new Set(computedList.map(i => i.id));
      setFilteredDeck(prev => {
        const remaining = prev.filter(i => allowedIds.has(i.id));
        const existingIds = new Set(remaining.map(i => i.id));
        const added = computedList.filter(i => !existingIds.has(i.id));
        const merged = [...remaining, ...added];
        setCurrentIndex(idx => (merged.length === 0 ? 0 : Math.min(idx, merged.length - 1)));
        return merged;
      });
    }
  }, [computedList, selectedTopic, selectedDay, selectedType, selectedStatus, items.length]);

  const currentCard = filteredDeck[currentIndex] || null;

  // Speak word when card changes if user explicitly enabled autoPlayAudio
  useEffect(() => {
    if (currentCard && autoPlayAudio && !isFlipped) {
      speech.speak(currentCard.word);
    }
  }, [currentIndex, isFlipped, autoPlayAudio, currentCard]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev < filteredDeck.length - 1) {
        setIsFlipped(false);
        return prev + 1;
      }
      return prev;
    });
  }, [filteredDeck.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev > 0) {
        setIsFlipped(false);
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const markMasteryAndAdvance = useCallback((status: 'learning' | 'mastered') => {
    if (!currentCard) return;
    onSetMastery(currentCard.id, status);
    setIsFlipped(false);

    // If current status filter will remove this card from the deck, stay at current index so the next card slides in without skipping
    const willBeRemoved =
      selectedStatus === 'new' ||
      (selectedStatus === 'learning' && status !== 'learning') ||
      (selectedStatus === 'mastered' && status !== 'mastered');

    if (!willBeRemoved) {
      handleNext();
    }
  }, [currentCard, onSetMastery, selectedStatus, handleNext]);

  // Keyboard navigation & study shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (activeNoteWord) return;
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;

    if (e.code === 'ArrowDown' || e.code === 'Space') {
      e.preventDefault();
      setIsFlipped(prev => !prev);
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      markMasteryAndAdvance('learning');
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      markMasteryAndAdvance('mastered');
    }
  }, [activeNoteWord, markMasteryAndAdvance]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleShuffle = () => {
    const shuffled = [...filteredDeck].sort(() => Math.random() - 0.5);
    setFilteredDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const resetFilters = () => {
    setSelectedTopic('all');
    setSelectedDay('all');
    setSelectedType('all');
    setSelectedStatus('all');
  };

  const currentCustomNote = currentCard
    ? customHighlights.find(h => normalizeHighlightKey(h.text) === normalizeHighlightKey(currentCard.word))?.note
    : undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Comprehensive Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold text-sm">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Bộ Lọc Flashcard</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
              {filteredDeck.length} thẻ
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setAutoPlayAudio(!autoPlayAudio)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                autoPlayAudio 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-medium' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {autoPlayAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Tự động phát âm: {autoPlayAudio ? 'Bật' : 'Tắt'}</span>
            </button>

            <button
              type="button"
              onClick={handleShuffle}
              disabled={filteredDeck.length <= 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Xáo trộn thứ tự từ"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Xáo trộn thẻ</span>
            </button>

            {(selectedTopic !== 'all' || selectedDay !== 'all' || selectedType !== 'all' || selectedStatus !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đặt lại tất cả bộ lọc"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Selectors Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Topic */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Chủ Đề</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value as TopicId | 'all')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-emerald-500"
            >
              <option value="all">Tất cả 2 chủ đề ({topicCounts.all})</option>
              <option value="environment">Topic 1: Environment ({topicCounts.environment})</option>
              <option value="education">Topic 2: Education ({topicCounts.education})</option>
            </select>
          </div>

          {/* Day */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Ngày Học</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as DayKey)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-emerald-500"
            >
              <option value="all">Tất cả các ngày</option>
              <option value="mon">Thứ Hai (MON)</option>
              <option value="tue">Thứ Ba (TUE)</option>
              <option value="wed">Thứ Tư (WED)</option>
              <option value="thu">Thứ Năm (THU)</option>
              <option value="fri">Thứ Sáu (FRI)</option>
              <option value="sat">Thứ Bảy (SAT)</option>
              <option value="sun">Chủ Nhật (SUN)</option>
              <option value="synthesis">Từ tổng hợp & Collocations</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Loại Từ / Bảng</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as WordType)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-emerald-500"
            >
              <option value="all">Tất cả bảng</option>
              <option value="adj_adv">Bảng 1: Tính từ & Trạng từ</option>
              <option value="noun_verb">Bảng 2: Danh từ & Động từ</option>
              <option value="synthesis">Bảng Tổng hợp collocations</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Trạng Thái Học</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-emerald-500"
            >
              <option value="all">Tất cả từ</option>
              <option value="new">Chưa học</option>
              <option value="starred">Đã gắn sao ★</option>
              <option value="learning">Đang học 🔄</option>
              <option value="mastered">Đã thuộc lòng ✔</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Flashcard Container */}
      {filteredDeck.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Không tìm thấy từ vựng nào phù hợp với bộ lọc đã chọn.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card Meta & Counter */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Thẻ {currentIndex + 1} / {filteredDeck.length}
              </span>
              <span>·</span>
              <span className="capitalize">{currentCard?.dayLabel}</span>
              <span>·</span>
              <span className="text-slate-400 dark:text-slate-500">{currentCard?.tableTitle}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
                Phím tắt: <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-amber-600 dark:text-amber-400">←</kbd> Chưa thuộc · <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-200">↓</kbd> Lật thẻ · <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">→</kbd> Đã thuộc
              </span>
              {currentCard && (
                <button
                  type="button"
                  onClick={() => onToggleStar(currentCard.id)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    starredIds.includes(currentCard.id)
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-500 border-amber-200 dark:border-amber-800'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-amber-400'
                  }`}
                  title="Đánh dấu từ quan trọng"
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              )}
            </div>
          </div>

          {/* 3D Flip Card */}
          <div
            data-vocab-id={currentCard?.id}
            onClick={() => {
              if (window.getSelection()?.toString().trim()) return;
              setIsFlipped(prev => !prev);
            }}
            style={{ perspective: '1200px' }}
            className="relative w-full h-[440px] md:h-[490px] cursor-pointer select-text"
          >
            <div
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
              className="relative w-full h-full transition-transform duration-500"
            >
              {/* FRONT SIDE */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(0deg)',
                  zIndex: isFlipped ? 1 : 20
                }}
                className={`absolute inset-0 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between p-6 md:p-8 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors ${
                  isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded uppercase select-none ${
                    currentCard?.topic === 'environment'
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  }`}>
                    {currentCard?.topic === 'environment' ? 'Environment' : 'Education'}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentCard) speech.speak(currentCard.word);
                    }}
                    className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-full transition-colors select-none"
                    title="Nghe phát âm chuẩn"
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                </div>

                <div className="text-center space-y-3 px-2">
                  <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight break-words">
                    <HighlightableText text={currentCard?.word} highlights={customHighlights} />
                  </h2>
                  {currentCard?.phonetic && (
                    <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-mono tracking-wide">
                      {currentCard.phonetic}
                    </p>
                  )}
                  {currentCard?.pos && (
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      ({currentCard.pos})
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3 select-none">
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                    <RotateCw className="w-3.5 h-3.5" /> Bấm vào thẻ để lật xem nghĩa, đồng/trái nghĩa & ví dụ
                  </span>
                  <span>Nhấn ↓ hoặc Space</span>
                </div>
              </div>

              {/* BACK SIDE */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  zIndex: isFlipped ? 20 : 1
                }}
                className={`absolute inset-0 bg-slate-900 flashcard-back-pastel text-slate-100 rounded-3xl border border-slate-800 dark:border-slate-800 shadow-sm flex flex-col justify-between p-5 md:p-7 ${
                  isFlipped ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 pb-3 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-emerald-400 font-bold text-lg truncate">
                      <HighlightableText text={currentCard?.word} highlights={customHighlights} />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentCard) speech.speak(currentCard.word);
                      }}
                      className="text-slate-400 hover:text-emerald-400 p-1 select-none shrink-0"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentCard) setActiveNoteWord(currentCard);
                    }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors select-none shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{wordNotes[currentCard?.id || ''] ? 'Sửa ghi chú' : 'Thêm ghi chú'}</span>
                  </button>
                </div>

                {/* Meanings & Context (scrollable cleanly from top without clipping) */}
                <div className="flex-1 overflow-y-auto py-3.5 pr-1 space-y-3.5 text-left">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
                      Nghĩa tiếng Việt
                    </span>
                    <p className="text-lg md:text-xl font-bold text-white leading-snug">
                      <HighlightableText text={currentCard?.vietnamese} highlights={customHighlights} />
                    </p>
                  </div>

                  {/* Synonyms & Antonyms */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-800/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 dark:border-slate-700">
                      <span className="text-sky-300 font-semibold block mb-1.5">
                        ✔ Đồng nghĩa (Synonyms):
                      </span>
                      {currentCard?.synonyms && currentCard.synonyms.length > 0 ? (
                        <div className="space-y-1.5">
                          {currentCard.synonyms.map((s, idx) => {
                            const parts = s.split('=').map(p => p.trim());
                            return (
                              <div key={idx} className="flex items-start gap-1 flex-wrap">
                                <AudioWord
                                  text={parts[0]}
                                  variant="synonym"
                                  size="sm"
                                  className="!text-sky-300 hover:!text-sky-100"
                                  highlights={customHighlights}
                                />
                                {parts[1] && (
                                  <span className="text-slate-300">
                                    = <HighlightableText text={parts[1]} highlights={customHighlights} />
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Không có trong bảng này</span>
                      )}
                    </div>

                    <div className="bg-slate-800/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 dark:border-slate-700">
                      <span className="text-rose-300 font-semibold block mb-1.5">
                        ✖ Trái nghĩa (Antonyms):
                      </span>
                      {currentCard?.antonyms && currentCard.antonyms.length > 0 ? (
                        <div className="space-y-1.5">
                          {currentCard.antonyms.map((a, idx) => {
                            const parts = a.split('=').map(p => p.trim());
                            return (
                              <div key={idx} className="flex items-start gap-1 flex-wrap">
                                <AudioWord
                                  text={parts[0]}
                                  variant="antonym"
                                  size="sm"
                                  className="!text-rose-300 hover:!text-rose-100"
                                  highlights={customHighlights}
                                />
                                {parts[1] && (
                                  <span className="text-slate-300">
                                    = <HighlightableText text={parts[1]} highlights={customHighlights} />
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Không có từ trái nghĩa trong bảng này</span>
                      )}
                    </div>
                  </div>

                  {/* Example */}
                  {currentCard?.example && (
                    <div className="bg-slate-800/60 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 dark:border-slate-700 text-xs">
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speech.speak(currentCard.example!);
                          }}
                          className="text-slate-400 hover:text-emerald-400 p-0.5 mt-0.5 select-none shrink-0"
                          title="Nghe câu ví dụ"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <div>
                          <p className="text-slate-100 italic font-medium leading-relaxed">
                            "<HighlightableText text={currentCard.example} highlights={customHighlights} />"
                          </p>
                          {currentCard.exampleMeaning && (
                            <p className="text-slate-400 text-[11px] mt-1">
                              <HighlightableText text={currentCard.exampleMeaning} highlights={customHighlights} />
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Custom Note Previews (from RichNoteStation and/or Quick Selection Note) */}
                  {currentCustomNote && (
                    <div className="p-2.5 bg-amber-950/50 rounded-lg border border-amber-700/60 text-xs text-amber-200">
                      <span className="font-semibold text-amber-400 block text-[10px] uppercase">Ghi chú highlight:</span>
                      <div className="mt-0.5">{currentCustomNote}</div>
                    </div>
                  )}

                  {currentCard && wordNotes[currentCard.id] && (
                    <div className="p-2.5 bg-amber-950/40 rounded-lg border border-amber-800/50 text-xs text-amber-200">
                      <span className="font-semibold text-amber-400 block text-[10px] uppercase">Ghi chú của bạn:</span>
                      <div 
                        className="mt-0.5 text-slate-300"
                        dangerouslySetInnerHTML={{ __html: wordNotes[currentCard.id] }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3 shrink-0 select-none">
                  <span className="flex items-center gap-1 text-slate-400">
                    <RotateCw className="w-3.5 h-3.5" /> Bấm vào thẻ hoặc nhấn ↓ / Space để lật lại mặt trước
                  </span>
                  <span>↓ / Space</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Deck Bar: Prev, Mastery Buttons, Next */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm border transition-colors ${
                currentIndex === 0
                  ? 'text-slate-300 dark:text-slate-700 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                  : 'text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Thẻ trước</span>
            </button>

            {/* Quick Status Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => markMasteryAndAdvance('learning')}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                title="Đánh dấu cần ôn thêm và chuyển tiếp (Phím ←)"
              >
                <XCircle className="w-4 h-4" />
                <span>Chưa thuộc</span>
                <kbd className="hidden sm:inline-block ml-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded bg-amber-100/80 dark:bg-amber-900/70 border border-amber-300/70 dark:border-amber-700">←</kbd>
              </button>

              <button
                type="button"
                onClick={() => markMasteryAndAdvance('mastered')}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                title="Đánh dấu đã thuộc và chuyển tiếp (Phím →)"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã thuộc</span>
                <kbd className="hidden sm:inline-block ml-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded bg-emerald-100/80 dark:bg-emerald-900/70 border border-emerald-300/70 dark:border-emerald-700">→</kbd>
              </button>
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= filteredDeck.length - 1}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm border transition-colors ${
                currentIndex >= filteredDeck.length - 1
                  ? 'text-slate-300 dark:text-slate-700 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                  : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 cursor-pointer'
              }`}
            >
              <span>Thẻ tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Note modal if triggered */}
      {activeNoteWord && (
        <RichNoteStation
          isModal
          title={`Ghi chú Flashcard: ${activeNoteWord.word}`}
          wordContext={activeNoteWord}
          initialContent={wordNotes[activeNoteWord.id] || ''}
          onSave={(html) => onSaveWordNote(activeNoteWord.id, html)}
          onClose={() => setActiveNoteWord(null)}
        />
      )}
    </div>
  );
};
