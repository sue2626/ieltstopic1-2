export type TopicId = 'environment' | 'education';
export type DayKey = 'all' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' | 'synthesis';
export type WordType = 'all' | 'adj_adv' | 'noun_verb' | 'synthesis';
export type MasteryStatus = 'new' | 'learning' | 'mastered';

export interface VocabItem {
  id: string;
  topic: TopicId;
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' | 'synthesis';
  dayLabel: string;
  tableType: 'table1' | 'table2' | 'synthesis';
  tableTitle: string;
  word: string;
  phonetic?: string;
  pos?: string; // Part of speech (e.g., 'adj', 'adv', 'noun', 'verb', 'phrase')
  vietnamese: string;
  synonyms: string[];
  synonymRaw?: string;
  antonyms: string[];
  antonymRaw?: string;
  example?: string;
  exampleMeaning?: string;
  note?: string;
}

export interface UserNote {
  wordId: string;
  contentHtml: string;
  updatedAt: number;
}

export interface UserHighlight {
  wordId: string;
  color: string; // e.g. '#fef08a' (yellow), '#bbf7d0' (green), '#fbcfe8' (pink), '#bae6fd' (blue)
  isUnderline?: boolean;
  isBold?: boolean;
  textColor?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'meaning' | 'synonym' | 'antonym' | 'fill_blank';
  questionPrompt: string;
  targetWord: VocabItem;
  options: {
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
  correctIndex: number;
}

export interface StudyMaskState {
  word: boolean;           // Che cột / ô từ tiếng Anh
  meaning: boolean;        // Che cột / ô nghĩa tiếng Việt
  synonymAntonym: boolean; // Che cột / ô từ đồng nghĩa & trái nghĩa
  example: boolean;        // Che cột / ô câu ví dụ
}
