import { UserHighlight } from '../types/vocab';

const STARRED_KEY = 'ielts_starred_words_v1';
const MASTERY_KEY = 'ielts_mastery_map_v1';
const WORD_NOTES_KEY = 'ielts_word_notes_v1';
const MASTER_NOTEBOOK_KEY = 'ielts_master_notebook_v1';
const HIGHLIGHTS_KEY = 'ielts_highlights_v1';
const AUDIO_SETTINGS_KEY = 'ielts_audio_settings_v1';

export interface CustomTextHighlight {
  text: string;
  bgColor: string;
  textColor: string;
  isBold?: boolean;
  isUnderline?: boolean;
  isItalic?: boolean;
  note?: string;
  vocabId?: string;
  subParts?: string[];
}

export function normalizeHighlightKey(text: string): string {
  return text.replace(/[\u00a0\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

export const storage = {
  getStarred(): string[] {
    try {
      const data = localStorage.getItem(STARRED_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setStarred(ids: string[]): void {
    try {
      localStorage.setItem(STARRED_KEY, JSON.stringify(ids));
    } catch (e) {
      console.error(e);
    }
  },

  toggleStarred(id: string): string[] {
    const list = this.getStarred();
    const updated = list.includes(id) ? list.filter(item => item !== id) : [...list, id];
    this.setStarred(updated);
    return updated;
  },

  getMastery(): Record<string, 'new' | 'learning' | 'mastered'> {
    try {
      const data = localStorage.getItem(MASTERY_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  setMastery(id: string, status: 'new' | 'learning' | 'mastered'): Record<string, 'new' | 'learning' | 'mastered'> {
    const current = this.getMastery();
    current[id] = status;
    try {
      localStorage.setItem(MASTERY_KEY, JSON.stringify(current));
    } catch (e) {
      console.error(e);
    }
    return { ...current };
  },

  getWordNotes(): Record<string, string> {
    try {
      const data = localStorage.getItem(WORD_NOTES_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  saveWordNote(id: string, contentHtml: string): Record<string, string> {
    const current = this.getWordNotes();
    if (!contentHtml.trim() || contentHtml === '<p><br></p>') {
      delete current[id];
    } else {
      current[id] = contentHtml;
    }
    try {
      localStorage.setItem(WORD_NOTES_KEY, JSON.stringify(current));
    } catch (e) {
      console.error(e);
    }
    return { ...current };
  },

  getMasterNotebook(): string {
    return localStorage.getItem(MASTER_NOTEBOOK_KEY) || '<h3>Sổ Tay Từ Vựng & Ghi Chú Cá Nhân</h3><p>Ghi lại cấu trúc câu hay, collocations cần nhớ và phân biệt từ dễ nhầm lẫn tại đây.</p>';
  },

  saveMasterNotebook(html: string): void {
    try {
      localStorage.setItem(MASTER_NOTEBOOK_KEY, html);
    } catch (e) {
      console.error(e);
    }
  },

  getHighlights(): Record<string, UserHighlight> {
    try {
      const data = localStorage.getItem(HIGHLIGHTS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  saveHighlight(id: string, highlight: Partial<UserHighlight> | null): Record<string, UserHighlight> {
    const current = this.getHighlights();
    if (!highlight) {
      delete current[id];
    } else {
      current[id] = {
        wordId: id,
        color: highlight.color ?? current[id]?.color ?? '#fef08a',
        isUnderline: highlight.isUnderline ?? current[id]?.isUnderline ?? false,
        isBold: highlight.isBold ?? current[id]?.isBold ?? false,
        textColor: highlight.textColor ?? current[id]?.textColor ?? undefined,
      };
    }
    try {
      localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(current));
    } catch (e) {
      console.error(e);
    }
    return { ...current };
  },

  getAudioSettings(): { voice: 'en-US' | 'en-GB'; rate: number; autoPlayOnFlip: boolean } {
    try {
      const data = localStorage.getItem(AUDIO_SETTINGS_KEY);
      return data ? JSON.parse(data) : { voice: 'en-US', rate: 0.9, autoPlayOnFlip: false };
    } catch {
      return { voice: 'en-US', rate: 0.9, autoPlayOnFlip: false };
    }
  },

  saveAudioSettings(settings: { voice: 'en-US' | 'en-GB'; rate: number; autoPlayOnFlip: boolean }): void {
    try {
      localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  },

  getCustomHighlights(): CustomTextHighlight[] {
    try {
      const data = localStorage.getItem('ielts_custom_highlights_v1');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCustomHighlight(item: CustomTextHighlight): CustomTextHighlight[] {
    const list = this.getCustomHighlights();
    const cleanText = item.text.replace(/[\u00a0\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return list;
    const key = normalizeHighlightKey(cleanText);
    const filtered = list.filter(h => normalizeHighlightKey(h.text) !== key);
    const existing = list.find(h => normalizeHighlightKey(h.text) === key);
    const nextItem: CustomTextHighlight = existing
      ? {
          ...existing,
          ...item,
          text: cleanText,
          note: item.note !== undefined ? item.note : existing.note,
          vocabId: item.vocabId || existing.vocabId,
          subParts: item.subParts || existing.subParts
        }
      : { ...item, text: cleanText };
    const updated = [...filtered, nextItem];
    try {
      localStorage.setItem('ielts_custom_highlights_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    return updated;
  },

  removeCustomHighlight(text: string): CustomTextHighlight[] {
    const list = this.getCustomHighlights();
    const key = normalizeHighlightKey(text);
    const updated = list.filter(h => normalizeHighlightKey(h.text) !== key);
    try {
      localStorage.setItem('ielts_custom_highlights_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    return updated;
  },

  clearCustomHighlights(): void {
    try {
      localStorage.removeItem('ielts_custom_highlights_v1');
    } catch (e) {
      console.error(e);
    }
  },

  /**
   * Resets all study progress: mastery states, stars, word notes, highlights, notebook, custom highlights
   */
  resetProgress(): void {
    try {
      localStorage.removeItem(STARRED_KEY);
      localStorage.removeItem(MASTERY_KEY);
      localStorage.removeItem(WORD_NOTES_KEY);
      localStorage.removeItem(MASTER_NOTEBOOK_KEY);
      localStorage.removeItem(HIGHLIGHTS_KEY);
      localStorage.removeItem('ielts_custom_highlights_v1');
      localStorage.removeItem('ielts_mascot_exp');
      localStorage.removeItem('ielts_quiz_history');
    } catch (e) {
      console.error(e);
    }
  },

  /**
   * Resets everything back to factory initial state (progress + theme settings + layout + masks)
   */
  resetAll(): void {
    try {
      this.resetProgress();
      localStorage.removeItem('ielts_theme');
      localStorage.removeItem('ielts_theme_skin');
      localStorage.removeItem('ielts_layout');
      localStorage.removeItem('ielts_mask_state');
      localStorage.removeItem(AUDIO_SETTINGS_KEY);
      localStorage.removeItem('ielts_mascot_settings');
    } catch (e) {
      console.error(e);
    }
  }
};
