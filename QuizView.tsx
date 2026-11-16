import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Award, 
  ArrowRight, 
  Filter, 
  Volume2, 
  Play, 
  BookOpen
} from 'lucide-react';
import { VocabItem, TopicId, DayKey, WordType, QuizQuestion } from '../types/vocab';
import { generateQuizQuestions, isWordEligibleForQuestionTypes } from '../data/allVocab';
import { speech } from '../utils/speech';
import { CustomTextHighlight } from '../utils/storage';
import { AudioWord } from './AudioWord';
import { HighlightableText } from './HighlightableText';

interface QuizViewProps {
  allVocab: VocabItem[];
  starredIds: string[];
  masteryMap: Record<string, 'new' | 'learning' | 'mastered'>;
  customHighlights?: CustomTextHighlight[];
  onSelectWordDetail: (item: VocabItem) => void;
  onSetMastery: (id: string, status: 'new' | 'learning' | 'mastered') => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  allVocab,
  starredIds,
  masteryMap,
  customHighlights = [],
  onSelectWordDetail,
  onSetMastery
}) => {
  // Quiz Setup Filter Options
  const [quizTopic, setQuizTopic] = useState<TopicId | 'all'>('all');
  const [quizDay, setQuizDay] = useState<DayKey>('all');
  const [quizWordType, setQuizWordType] = useState<WordType>('all');
  const [quizTypes, setQuizTypes] = useState<('meaning' | 'synonym' | 'antonym' | 'fill_blank')[]>([
    'meaning', 'synonym', 'antonym', 'fill_blank'
  ]);
  const [quizLength, setQuizLength] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<'all' | 'starred' | 'learning' | 'not_mastered'>('all');

  // Active Quiz State
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [answersHistory, setAnswersHistory] = useState<{
    question: QuizQuestion;
    userChoice: number;
    isCorrect: boolean;
  }[]>([]);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [filterError, setFilterError] = useState<string | null>(null);

  const topicCounts = useMemo(() => ({
    all: allVocab.length,
    environment: allVocab.filter(v => v.topic === 'environment').length,
    education: allVocab.filter(v => v.topic === 'education').length,
  }), [allVocab]);

  const filteredPool = useMemo(() => {
    let pool = allVocab;
    if (quizTopic !== 'all') {
      pool = pool.filter(i => i.topic === quizTopic);
    }
    if (quizDay !== 'all') {
      pool = pool.filter(i => i.day === quizDay);
    }
    if (quizWordType === 'adj_adv') {
      pool = pool.filter(i => i.tableType === 'table1');
    } else if (quizWordType === 'noun_verb') {
      pool = pool.filter(i => i.tableType === 'table2');
    } else if (quizWordType === 'synthesis') {
      pool = pool.filter(i => i.tableType === 'synthesis');
    }

    if (statusFilter === 'starred') {
      pool = pool.filter(i => starredIds.includes(i.id));
    } else if (statusFilter === 'learning') {
      pool = pool.filter(i => masteryMap[i.id] === 'learning');
    } else if (statusFilter === 'not_mastered') {
      pool = pool.filter(i => masteryMap[i.id] !== 'mastered');
    }
    return pool;
  }, [allVocab, quizTopic, quizDay, quizWordType, statusFilter, starredIds, masteryMap]);

  const eligiblePool = useMemo(() => {
    return filteredPool.filter(w => isWordEligibleForQuestionTypes(w, quizTypes));
  }, [filteredPool, quizTypes]);

  const startQuiz = () => {
    setFilterError(null);

    if (filteredPool.length === 0) {
      setFilterError('Không có từ vựng nào thỏa mãn bộ lọc đã chọn. Vui lòng mở rộng điều kiện lọc!');
      return;
    }

    if (eligiblePool.length === 0) {
      setFilterError('Các từ trong bộ lọc này chưa có dạng câu hỏi bạn chọn (ví dụ một số cụm từ không có từ trái nghĩa). Hãy chọn thêm dạng câu hỏi khác!');
      return;
    }

    const requestedCount = quizLength === 9999 ? eligiblePool.length : quizLength;
    const generated = generateQuizQuestions(filteredPool, requestedCount, quizTypes);
    if (generated.length === 0) {
      setFilterError('Không đủ dữ liệu để tạo câu hỏi. Vui lòng chọn thêm dạng câu hỏi hoặc mở rộng bộ lọc!');
      return;
    }

    setQuestions(generated);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScore(0);
    setAnswersHistory([]);
    setQuizCompleted(false);
    setQuizStarted(true);
  };

  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;

    setSelectedOption(idx);
    setHasAnswered(true);

    const currentQ = questions[currentQIndex];
    const isCorrect = idx === currentQ.correctIndex;

    if (isCorrect) {
      setScore(prev => prev + 1);
      onSetMastery(currentQ.targetWord.id, 'mastered');
    } else {
      onSetMastery(currentQ.targetWord.id, 'learning');
    }

    setAnswersHistory(prev => [
      ...prev,
      { question: currentQ, userChoice: idx, isCorrect }
    ]);
  };

  const handleNextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const toggleType = (t: 'meaning' | 'synonym' | 'antonym' | 'fill_blank') => {
    setFilterError(null);
    if (quizTypes.includes(t)) {
      if (quizTypes.length > 1) {
        setQuizTypes(quizTypes.filter(x => x !== t));
      }
    } else {
      setQuizTypes([...quizTypes, t]);
    }
  };

  // 1. SETUP SCREEN
  if (!quizStarted) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Thiết Lập Trắc Nghiệm Thông Minh</h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Tự do tùy biến bộ lọc chủ đề, ngày học, loại từ và dạng câu hỏi để ôn luyện trọn vẹn toàn bộ từ vựng.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* 1. Topic Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                1. Chọn Chủ Đề (Topic)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'all', title: 'Cả 2 Chủ Đề', desc: `Môi trường + Giáo dục (${topicCounts.all} từ)` },
                  { id: 'environment', title: 'Topic 1: Environment', desc: `${topicCounts.environment} từ vựng chuẩn` },
                  { id: 'education', title: 'Topic 2: Education', desc: `${topicCounts.education} từ vựng chuẩn` },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setQuizTopic(item.id as any);
                      setFilterError(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      quizTopic === item.id
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/80'
                    }`}
                  >
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">{item.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Day & Word Type Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                  2. Lọc Theo Ngày Học (Day)
                </label>
                <select
                  value={quizDay}
                  onChange={(e) => {
                    setQuizDay(e.target.value as any);
                    setFilterError(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-emerald-500"
                >
                  <option value="all">Tất cả các ngày (Thứ 2 → CN & Tổng hợp)</option>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                  3. Loại Từ / Bảng
                </label>
                <select
                  value={quizWordType}
                  onChange={(e) => {
                    setQuizWordType(e.target.value as WordType);
                    setFilterError(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-emerald-500"
                >
                  <option value="all">Tất cả bảng</option>
                  <option value="adj_adv">Bảng 1: Tính từ & Trạng từ</option>
                  <option value="noun_verb">Bảng 2: Danh từ & Động từ</option>
                  <option value="synthesis">Bảng Tổng hợp collocations</option>
                </select>
              </div>
            </div>

            {/* 4. Question Types Multi-select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                4. Dạng Câu Hỏi Trắc Nghiệm
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'meaning', label: 'Hỏi nghĩa tiếng Việt', desc: 'Từ tiếng Anh ➔ Nghĩa tiếng Việt (100% từ)' },
                  { key: 'synonym', label: 'Tìm từ đồng nghĩa (Synonym)', desc: 'Tìm từ tương đồng chuẩn PDF (100% từ)' },
                  { key: 'antonym', label: 'Tìm từ trái nghĩa (Antonym)', desc: 'Tìm từ đối lập chuẩn PDF (242+ từ)' },
                  { key: 'fill_blank', label: 'Điền từ vào câu ví dụ', desc: 'Đoán từ vào chỗ trống ngữ cảnh (100% từ)' },
                ].map(item => {
                  const isChecked = quizTypes.includes(item.key as any);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleType(item.key as any)}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 accent-emerald-600"
                      />
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">{item.label}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Question Count & Priority Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Số lượng câu hỏi
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[5, 10, 15, 20, 9999].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuizLength(cnt)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        quizLength === cnt
                          ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cnt === 9999 ? `Tất cả (${eligiblePool.length})` : `${cnt} câu`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Lọc theo trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setFilterError(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-emerald-500"
                >
                  <option value="all">Tất cả từ vựng</option>
                  <option value="starred">Chỉ các từ đã gắn sao ★ ({starredIds.length} từ)</option>
                  <option value="not_mastered">Chỉ các từ chưa thuộc</option>
                  <option value="learning">Chỉ các từ đang học 🔄</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live pool count summary */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2">
            <span>
              Bộ lọc hiện tại khớp <strong>{filteredPool.length} từ</strong> ({eligiblePool.length} từ hợp lệ với dạng bài đã chọn).
            </span>
          </div>

          {filterError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-medium text-rose-700 dark:text-rose-300">
              {filterError}
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={startQuiz}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Bắt Đầu Làm Bài Trắc Nghiệm</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. QUIZ FINISHED SUMMARY
  if (quizCompleted) {
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-6">
          <div className="inline-flex p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full">
            <Award className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Hoàn Thành Bài Trắc Nghiệm!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Bạn đã hoàn thành {questions.length} câu hỏi theo bộ lọc đã chọn.
            </p>
          </div>

          {/* Score Counter Card */}
          <div className="max-w-xs mx-auto p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {score} / {questions.length}
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Độ chính xác: {percentage}%
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={startQuiz}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold text-xs md:text-sm rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại bài này</span>
            </button>

            <button
              type="button"
              onClick={() => setQuizStarted(false)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs md:text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Filter className="w-4 h-4" />
              <span>Tùy chỉnh bài trắc nghiệm khác</span>
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Xem lại chi tiết từng câu hỏi ({answersHistory.length})</span>
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
            {answersHistory.map((item, idx) => (
              <div key={idx} data-vocab-id={item.question.targetWord.id} className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      Câu {idx + 1}: <HighlightableText text={item.question.targetWord.word} highlights={customHighlights} />
                    </span>
                    <button
                      type="button"
                      onClick={() => speech.speak(item.question.targetWord.word)}
                      className="text-slate-400 hover:text-emerald-600 p-0.5 select-none"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    {item.question.targetWord.dayLabel}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line pl-7">
                  <HighlightableText text={item.question.questionPrompt} highlights={customHighlights} />
                </p>

                <div className="pl-7 space-y-1 text-xs">
                  <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                    ✓ Đáp án đúng: <HighlightableText text={item.question.options[item.question.correctIndex]?.text} highlights={customHighlights} />
                  </div>
                  {!item.isCorrect && (
                    <div className="text-rose-600 dark:text-rose-400">
                      ✗ Bạn đã chọn: <HighlightableText text={item.question.options[item.userChoice]?.text} highlights={customHighlights} />
                    </div>
                  )}

                  {/* Word Quick Reference in review */}
                  <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <div>
                      <b>Nghĩa:</b> <HighlightableText text={item.question.targetWord.vietnamese} highlights={customHighlights} />
                    </div>
                    {item.question.targetWord.synonyms.length > 0 && (
                      <div className="text-sky-800 dark:text-sky-300">
                        <b>Đồng nghĩa:</b> <HighlightableText text={item.question.targetWord.synonyms.join(', ')} highlights={customHighlights} />
                      </div>
                    )}
                    {item.question.targetWord.antonyms.length > 0 && (
                      <div className="text-rose-800 dark:text-rose-300">
                        <b>Trái nghĩa:</b> <HighlightableText text={item.question.targetWord.antonyms.join(', ')} highlights={customHighlights} />
                      </div>
                    )}
                    {item.question.targetWord.example && (
                      <div className="italic text-slate-600 dark:text-slate-400">
                        "<HighlightableText text={item.question.targetWord.example} highlights={customHighlights} />"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. ACTIVE QUIZ QUESTION SCREEN
  const currentQ = questions[currentQIndex];
  const targetWord = currentQ.targetWord;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top progress strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>Câu {currentQIndex + 1} / {questions.length}</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Điểm hiện tại: {score}</span>
          <button
            type="button"
            onClick={() => setQuizStarted(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
          >
            Dừng bài thi
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-300"
            style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div data-vocab-id={targetWord.id} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        {/* Word header & Audio */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                {currentQ.type === 'fill_blank' ? (
                  <span className="text-base md:text-lg text-emerald-700 dark:text-emerald-400 font-semibold">Điền từ vào ngữ cảnh</span>
                ) : (
                  <HighlightableText text={targetWord.word} highlights={customHighlights} />
                )}
              </span>
              {currentQ.type !== 'fill_blank' && (
                <button
                  type="button"
                  onClick={() => speech.speak(targetWord.word)}
                  className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors select-none cursor-pointer"
                  title="Nghe phát âm từ này"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              )}
            </div>
            {currentQ.type !== 'fill_blank' && targetWord.phonetic && (
              <span className="text-xs text-slate-400 font-mono">
                {targetWord.phonetic}
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              {targetWord.dayLabel}
            </span>
            <span className="text-[11px] text-slate-400">
              {targetWord.tableTitle}
            </span>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">
          <HighlightableText text={currentQ.questionPrompt} highlights={customHighlights} />
        </div>

        {/* 4 Selectable Options */}
        <div className="grid grid-cols-1 gap-2.5">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = opt.isCorrect;

            let optionStyle = 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800/80';

            if (hasAnswered) {
              if (isCorrect) {
                optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30 font-semibold';
              } else if (isSelected && !isCorrect) {
                optionStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/30';
              } else {
                optionStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={hasAnswered}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between text-sm transition-all cursor-pointer ${optionStyle}`}
              >
                <span className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>
                    <HighlightableText text={opt.text} highlights={customHighlights} />
                  </span>
                </span>

                {hasAnswered && (
                  <span className="shrink-0">
                    {isCorrect && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                    {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-600" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Explanation Card after answering */}
        {hasAnswered && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs leading-relaxed animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {selectedOption === currentQ.correctIndex ? 'Chính xác! 🎉' : 'Chưa chính xác!'}
              </span>
              <button
                type="button"
                onClick={() => onSelectWordDetail(targetWord)}
                className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
              >
                Xem chi tiết từ vựng ➔
              </button>
            </div>

            <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">• Nghĩa tiếng Việt:</span>{' '}
                <HighlightableText text={targetWord.vietnamese} highlights={customHighlights} />
              </div>

              {targetWord.synonyms.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sky-800 dark:text-sky-300">• Đồng nghĩa:</span>
                  {targetWord.synonyms.map((s, i) => {
                    const parts = s.split('=').map(p => p.trim());
                    return (
                      <span key={i} className="inline-flex items-center gap-1">
                        <AudioWord text={parts[0]} variant="synonym" size="sm" highlights={customHighlights} />
                        {parts[1] && (
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                            = <HighlightableText text={parts[1]} highlights={customHighlights} />
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}

              {targetWord.antonyms.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-rose-800 dark:text-rose-300">• Trái nghĩa:</span>
                  {targetWord.antonyms.map((a, i) => {
                    const parts = a.split('=').map(p => p.trim());
                    return (
                      <span key={i} className="inline-flex items-center gap-1">
                        <AudioWord text={parts[0]} variant="antonym" size="sm" highlights={customHighlights} />
                        {parts[1] && (
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                            = <HighlightableText text={parts[1]} highlights={customHighlights} />
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}

              {targetWord.example && (
                <div className="flex items-start gap-1 pt-1 italic text-slate-600 dark:text-slate-300">
                  <button
                    type="button"
                    onClick={() => speech.speak(targetWord.example!)}
                    className="p-0.5 text-slate-400 hover:text-emerald-600 select-none"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <span>
                    "<HighlightableText text={targetWord.example} highlights={customHighlights} />"
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Question Button */}
        {hasAnswered && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleNextQuestion}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <span>{currentQIndex === questions.length - 1 ? 'Xem Kết Quả' : 'Câu Tiếp Theo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
