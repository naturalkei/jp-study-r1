// Local storage persistence utility for study progress, checklist, and data backup/restore

const STORAGE_KEYS = {
  CHECKLIST: 'jp_study_checklist_v1',
  MASTERED_PHRASES: 'jp_study_mastered_phrases_v1',
  QUIZ_HISTORY: 'jp_study_quiz_history_v1',
  ROLEPLAY_DONE: 'jp_study_roleplay_done_v1',
  AUDIO_SPEED: 'jp_study_audio_speed_v1',
  MINI_QUIZ: 'jp_study_mini_quiz_v1',
  RADIO_PROGRESS: 'jp_study_radio_progress_v1',
  RADIO_SPEED: 'jp_study_radio_speed_v1',
  RADIO_REPEAT_MODE: 'jp_study_radio_repeat_mode_v1',
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

  getMiniQuizAnswers() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MINI_QUIZ);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  setMiniQuizAnswers(answers) {
    try {
      localStorage.setItem(STORAGE_KEYS.MINI_QUIZ, JSON.stringify(answers));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  },

  // Export all localStorage data into a clean JSON object
  exportData() {
    const checklist = this.getChecklist();
    const masteredPhrases = this.getMasteredPhrases();
    const quizHistory = this.getQuizHistory();
    const roleplayDone = this.getRoleplayDone();
    const miniQuizAnswers = this.getMiniQuizAnswers();
    const audioSpeed = this.getAudioSpeed();

    return {
      appName: 'jp-study-r1',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      summary: {
        checklistItemsCount: Object.values(checklist).filter(Boolean).length,
        masteredPhrasesCount: masteredPhrases.length,
        quizHistoryCount: quizHistory.length,
        roleplayDoneCount: roleplayDone.length,
        miniQuizCount: Object.keys(miniQuizAnswers).length,
      },
      data: {
        checklist,
        masteredPhrases,
        quizHistory,
        roleplayDone,
        miniQuizAnswers,
        audioSpeed,
      },
    };
  },

  // Import and validate JSON backup data into localStorage
  importData(backup) {
    if (!backup || typeof backup !== 'object') {
      throw new Error('유효하지 않은 백업 데이터입니다 (JSON 형식이 아님).');
    }

    const payload = backup.data || backup; // Support both wrapped and flat backup formats

    let importedCount = 0;

    if (payload.checklist && typeof payload.checklist === 'object') {
      this.setChecklist(payload.checklist);
      importedCount++;
    }

    if (Array.isArray(payload.masteredPhrases)) {
      try {
        localStorage.setItem(STORAGE_KEYS.MASTERED_PHRASES, JSON.stringify(payload.masteredPhrases));
        importedCount++;
      } catch (e) {
        console.warn(e);
      }
    }

    if (Array.isArray(payload.quizHistory)) {
      try {
        localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(payload.quizHistory));
        importedCount++;
      } catch (e) {
        console.warn(e);
      }
    }

    if (Array.isArray(payload.roleplayDone)) {
      try {
        localStorage.setItem(STORAGE_KEYS.ROLEPLAY_DONE, JSON.stringify(payload.roleplayDone));
        importedCount++;
      } catch (e) {
        console.warn(e);
      }
    }

    if (payload.miniQuizAnswers && typeof payload.miniQuizAnswers === 'object') {
      this.setMiniQuizAnswers(payload.miniQuizAnswers);
      importedCount++;
    }

    if (payload.audioSpeed) {
      this.setAudioSpeed(payload.audioSpeed);
      importedCount++;
    }

    if (importedCount === 0) {
      throw new Error('복원할 수 있는 유효한 학습 데이터 항목을 찾지 못했습니다.');
    }

    return true;
  },

  getRadioProgress(chapterId) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RADIO_PROGRESS);
      const progress = data ? JSON.parse(data) : {};
      return progress[chapterId] || { currentTime: 0, duration: 0 };
    } catch {
      return { currentTime: 0, duration: 0 };
    }
  },

  setRadioProgress(chapterId, currentTime, duration) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RADIO_PROGRESS);
      const progress = data ? JSON.parse(data) : {};
      progress[chapterId] = { currentTime, duration };
      localStorage.setItem(STORAGE_KEYS.RADIO_PROGRESS, JSON.stringify(progress));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  },

  getRadioSpeed() {
    try {
      const speed = localStorage.getItem(STORAGE_KEYS.RADIO_SPEED);
      return speed ? parseFloat(speed) : 1.0;
    } catch {
      return 1.0;
    }
  },

  setRadioSpeed(speed) {
    try {
      localStorage.setItem(STORAGE_KEYS.RADIO_SPEED, speed.toString());
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  },

  getRadioRepeatMode() {
    try {
      const mode = localStorage.getItem(STORAGE_KEYS.RADIO_REPEAT_MODE);
      if (mode === 'one' || mode === 'all' || mode === 'off') return mode;
      return 'off';
    } catch {
      return 'off';
    }
  },

  setRadioRepeatMode(mode) {
    try {
      localStorage.setItem(STORAGE_KEYS.RADIO_REPEAT_MODE, mode);
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  },

  resetAll() {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Storage reset error:', e);
    }
  },
};
