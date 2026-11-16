import { VocabItem, TopicId, DayKey, WordType, QuizQuestion } from '../types/vocab';
import { ENVIRONMENT_VOCAB } from './environmentVocab';
import { EDUCATION_VOCAB } from './educationVocab';

export const ALL_VOCAB: VocabItem[] = [
  ...ENVIRONMENT_VOCAB,
  ...EDUCATION_VOCAB
];

export const TOPIC_INFO = {
  environment: {
    id: 'environment' as TopicId,
    title: 'Topic 1: Environment',
    subtitle: 'Môi Trường & Sinh Thái Học',
    tagline: '1 Week Vocabulary Notebook',
    pdfUrl: '/assets/aistudio/Topic_1_Environment_Vocabulary__1__ee81f834.pdf',
    totalWords: ENVIRONMENT_VOCAB.length,
    themeColor: 'teal',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  education: {
    id: 'education' as TopicId,
    title: 'Topic 2: Education',
    subtitle: 'Giáo Dục & Phát Triển Trí Tuệ',
    tagline: '2-Week Vocabulary Notebook',
    pdfUrl: '/assets/aistudio/Topic_2_Education_Vocabulary_f174bd69.pdf',
    totalWords: EDUCATION_VOCAB.length,
    themeColor: 'indigo',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  }
};

export const DAY_TABS: { key: DayKey; label: string; short: string }[] = [
  { key: 'all', label: 'Tất cả các ngày', short: 'All' },
  { key: 'mon', label: 'MON (Thứ Hai)', short: 'Thứ 2' },
  { key: 'tue', label: 'TUE (Thứ Ba)', short: 'Thứ 3' },
  { key: 'wed', label: 'WED (Thứ Tư)', short: 'Thứ 4' },
  { key: 'thu', label: 'THU (Thứ Năm)', short: 'Thứ 5' },
  { key: 'fri', label: 'FRI (Thứ Sáu)', short: 'Thứ 6' },
  { key: 'sat', label: 'SAT (Thứ Bảy)', short: 'Thứ 7' },
  { key: 'sun', label: 'SUN (Chủ Nhật)', short: 'Chủ Nhật' },
  { key: 'synthesis', label: 'Từ tổng hợp & Cụm từ', short: 'Tổng hợp' },
];

export function filterVocab(params: {
  topic?: TopicId | 'all';
  day?: DayKey;
  wordType?: WordType;
  query?: string;
  starredIds?: string[];
  masteryMap?: Record<string, 'new' | 'learning' | 'mastered'>;
  statusFilter?: 'all' | 'starred' | 'learning' | 'mastered';
}): VocabItem[] {
  const { topic = 'all', day = 'all', wordType = 'all', query = '', starredIds = [], masteryMap = {}, statusFilter = 'all' } = params;

  return ALL_VOCAB.filter(item => {
    // Topic filter
    if (topic !== 'all' && item.topic !== topic) return false;

    // Day filter
    if (day !== 'all' && item.day !== day) return false;

    // Word type filter
    if (wordType === 'adj_adv' && item.tableType !== 'table1') return false;
    if (wordType === 'noun_verb' && item.tableType !== 'table2') return false;
    if (wordType === 'synthesis' && item.tableType !== 'synthesis') return false;

    // Status filter
    if (statusFilter === 'starred' && !starredIds.includes(item.id)) return false;
    if (statusFilter === 'learning' && masteryMap[item.id] !== 'learning') return false;
    if (statusFilter === 'mastered' && masteryMap[item.id] !== 'mastered') return false;

    // Search query
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const matchWord = item.word.toLowerCase().includes(q);
      const matchVietnamese = item.vietnamese.toLowerCase().includes(q);
      const matchSynonym = item.synonyms.some(s => s.toLowerCase().includes(q));
      const matchAntonym = item.antonyms.some(a => a.toLowerCase().includes(q));
      const matchExample = item.example?.toLowerCase().includes(q);
      if (!matchWord && !matchVietnamese && !matchSynonym && !matchAntonym && !matchExample) {
        return false;
      }
    }

    return true;
  });
}

const escapeRegExp = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Find a regex matching any variant of target.word inside target.example
 * (handles '/', '(v)'/'(on)' tags, '= ...', curly apostrophes, and common inflections).
 */
export function findExampleBlankRegex(word: string, example?: string): RegExp | null {
  if (!example || !example.trim()) return null;

  const baseNoEq = word.split('=')[0].trim();
  const rawParts = baseNoEq.split('/').map(p => p.trim()).filter(Boolean);
  const candidates = new Set<string>();

  for (const part of rawParts) {
    const noParens = part.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
    if (part.length >= 2) candidates.add(part);
    if (noParens.length >= 2) candidates.add(noParens);
  }

  // Try longest candidate first so full phrases replace cleanly before shorter sub-words
  const sorted = Array.from(candidates).sort((a, b) => b.length - a.length);
  for (const candidate of sorted) {
    const patternBody = escapeRegExp(candidate).replace(/['’]/g, "['’]");
    const regex = new RegExp(`\\b${patternBody}(?:s|es|ed|d|ing|er|ers|ly)?\\b`, 'gi');
    if (regex.test(example)) {
      regex.lastIndex = 0;
      return regex;
    }
  }

  return null;
}

export function isWordEligibleForQuestionTypes(
  item: VocabItem,
  questionTypes: ('meaning' | 'synonym' | 'antonym' | 'fill_blank')[]
): boolean {
  if (questionTypes.includes('meaning') && item.vietnamese?.trim()) return true;
  if (questionTypes.includes('synonym') && item.synonyms.length > 0) return true;
  if (questionTypes.includes('antonym') && item.antonyms.length > 0) return true;
  if (questionTypes.includes('fill_blank') && findExampleBlankRegex(item.word, item.example)) return true;
  return false;
}

/**
 * Generate diverse multiple choice quiz questions based on selected filters
 */
export function generateQuizQuestions(
  pool: VocabItem[],
  count: number = 10,
  questionTypes: ('meaning' | 'synonym' | 'antonym' | 'fill_blank')[] = ['meaning', 'synonym', 'antonym', 'fill_blank']
): QuizQuestion[] {
  const eligiblePool = pool.filter(w => isWordEligibleForQuestionTypes(w, questionTypes));
  if (eligiblePool.length === 0) return [];

  // Shuffle candidate words
  const shuffled = [...eligiblePool].sort(() => Math.random() - 0.5);
  const targetCount = Math.min(count, shuffled.length);
  const questions: QuizQuestion[] = [];

  for (let i = 0; i < shuffled.length && questions.length < targetCount; i++) {
    const target = shuffled[i];

    // Determine strictly matching selected question types for this item
    const eligibleTypes: ('meaning' | 'synonym' | 'antonym' | 'fill_blank')[] = [];
    if (questionTypes.includes('meaning') && target.vietnamese?.trim()) eligibleTypes.push('meaning');
    if (questionTypes.includes('synonym') && target.synonyms.length > 0) eligibleTypes.push('synonym');
    if (questionTypes.includes('antonym') && target.antonyms.length > 0) eligibleTypes.push('antonym');
    const blankRegex = findExampleBlankRegex(target.word, target.example);
    if (questionTypes.includes('fill_blank') && blankRegex) eligibleTypes.push('fill_blank');

    if (eligibleTypes.length === 0) continue;

    const chosenType = eligibleTypes[Math.floor(Math.random() * eligibleTypes.length)];

    // Prefer distractors from the filtered pool first, then same topic in ALL_VOCAB, then all remaining words
    const poolOthers = pool.filter(w => w.id !== target.id).sort(() => Math.random() - 0.5);
    const sameTopicGlobal = ALL_VOCAB.filter(
      w => w.id !== target.id && w.topic === target.topic && !poolOthers.some(p => p.id === w.id)
    ).sort(() => Math.random() - 0.5);
    const otherTopicGlobal = ALL_VOCAB.filter(
      w => w.id !== target.id && w.topic !== target.topic && !poolOthers.some(p => p.id === w.id)
    ).sort(() => Math.random() - 0.5);
    const distractorSource = [...poolOthers, ...sameTopicGlobal, ...otherTopicGlobal];

    let prompt = '';
    let correctText = '';
    const distractors: string[] = [];

    if (chosenType === 'meaning') {
      prompt = `Nghĩa tiếng Việt chính xác của từ/cụm từ "${target.word}" là gì?`;
      correctText = target.vietnamese;
      for (const other of distractorSource) {
        if (other.vietnamese !== correctText && !distractors.includes(other.vietnamese)) {
          distractors.push(other.vietnamese);
          if (distractors.length >= 3) break;
        }
      }
    } else if (chosenType === 'synonym') {
      prompt = `Từ / cụm từ nào sau đây ĐỒNG NGHĨA (Synonym) với "${target.word}"?`;
      const rawSyn = target.synonyms[Math.floor(Math.random() * target.synonyms.length)];
      correctText = rawSyn.split('=')[0].trim();
      const targetSynCores = new Set(target.synonyms.map(s => s.split('=')[0].trim().toLowerCase()));

      for (const other of distractorSource) {
        for (const s of other.synonyms) {
          const synCore = s.split('=')[0].trim();
          if (
            synCore &&
            !targetSynCores.has(synCore.toLowerCase()) &&
            synCore.toLowerCase() !== correctText.toLowerCase() &&
            !distractors.some(d => d.toLowerCase() === synCore.toLowerCase())
          ) {
            distractors.push(synCore);
            break;
          }
        }
        if (distractors.length >= 3) break;
      }
    } else if (chosenType === 'antonym') {
      prompt = `Từ / cụm từ nào sau đây TRÁI NGHĨA (Antonym) với "${target.word}"?`;
      const rawAnt = target.antonyms[Math.floor(Math.random() * target.antonyms.length)];
      correctText = rawAnt.split('=')[0].trim();
      const targetAntCores = new Set(target.antonyms.map(a => a.split('=')[0].trim().toLowerCase()));
      const targetSynCores = new Set(target.synonyms.map(s => s.split('=')[0].trim().toLowerCase()));

      for (const other of distractorSource) {
        for (const a of other.antonyms) {
          const antCore = a.split('=')[0].trim();
          if (
            antCore &&
            !targetAntCores.has(antCore.toLowerCase()) &&
            !targetSynCores.has(antCore.toLowerCase()) &&
            antCore.toLowerCase() !== correctText.toLowerCase() &&
            !distractors.some(d => d.toLowerCase() === antCore.toLowerCase())
          ) {
            distractors.push(antCore);
            break;
          }
        }
        if (distractors.length >= 3) break;
      }
    } else if (chosenType === 'fill_blank' && blankRegex && target.example) {
      const blanked = target.example.replace(blankRegex, '_______');
      prompt = `Chọn từ thích hợp điền vào chỗ trống:\n"${blanked}"`;
      correctText = target.word.split('=')[0].trim();
      for (const other of distractorSource) {
        const cleanOther = other.word.split('=')[0].trim();
        if (cleanOther.toLowerCase() !== correctText.toLowerCase() && !distractors.includes(cleanOther)) {
          distractors.push(cleanOther);
          if (distractors.length >= 3) break;
        }
      }
    }

    if (!correctText || distractors.length < 3) continue;

    const optionsRaw = [
      { text: correctText, isCorrect: true },
      { text: distractors[0], isCorrect: false },
      { text: distractors[1], isCorrect: false },
      { text: distractors[2], isCorrect: false },
    ];

    // Shuffle options
    const options = optionsRaw.sort(() => Math.random() - 0.5);
    const correctIndex = options.findIndex(o => o.isCorrect);

    questions.push({
      id: `q-${target.id}-${i}-${chosenType}`,
      type: chosenType,
      questionPrompt: prompt,
      targetWord: target,
      options,
      correctIndex
    });
  }

  return questions;
}

