// Local storage persistence utility for study progress and checklist

const STORAGE_KEYS = {
  CHECKLIST: 'jp_study_checklist_v1',
  MASTERED_PHRASES: 'jp_study_mastered_phrases_v1',
  QUIZ_HISTORY: 'jp_study_quiz_history_v1',
  ROLEPLAY_DONE: 'jp_study_roleplay_done_v1',
  AUDIO_SPEED: 'jp_study_audio_speed_v1',
};

export const storage = {
  getChecklist() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHECKLIST);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  setChecklist(checklist) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(checklist));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  },

  getMasteredPhrases() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MASTERED_PHRASES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  toggleMasteredPhrase(id) {
    const list = this.getMasteredPhrases();
    const index = list.indexOf(id);
    let updated;
    if (index >= 0) {
      updated = list.filter((item) => item !== id);
    } else {
      updated = [...list, id];
    }
    try {
      localStorage.setItem(STORAGE_KEYS.MASTERED_PHRASES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
    return updated;
  },

  getQuizHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveQuizResult(score, total) {
    const history = this.getQuizHistory();
    const newEntry = {
      score,
      total,
      percentage: Math.round((score / total) * 100),
      date: new Date().toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    const updated = [newEntry, ...history.slice(0, 9)];
    try {
      localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
    return updated;
  },

  getRoleplayDone() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROLEPLAY_DONE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  markRoleplayDone(scenarioId) {
    const list = this.getRoleplayDone();
    if (!list.includes(scenarioId)) {
      const updated = [...list, scenarioId];
      try {
        localStorage.setItem(STORAGE_KEYS.ROLEPLAY_DONE, JSON.stringify(updated));
      } catch (e) {
        console.warn('Storage save error:', e);
      }
      return updated;
    }
    return list;
  },

  getAudioSpeed() {
    try {
      const speed = localStorage.getItem(STORAGE_KEYS.AUDIO_SPEED);
      return speed ? parseFloat(speed) : 0.85;
    } catch {
      return 0.85;
    }
  },

  setAudioSpeed(speed) {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIO_SPEED, speed.toString());
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  },
};
