import './style.css';
import { curriculumData } from './data/curriculum.js';
import { cheatsheetData } from './data/cheatsheet.js';
import { phrasesData } from './data/phrases.js';
import { quizQuestions } from './data/quizzes.js';
import { roleplayScenarios } from './data/roleplay.js';
import { immigrationData } from './data/immigration.js';
import { dailyLessonsData } from './data/dailyLessons.js';
import { pocketCardsData } from './data/pocketCards.js';
import { radioChapters } from './data/radioChapters.js';
import { currencyData, numberChartData, countersData, checkoutPhrasesData, numberQuizPool } from './data/numbers.js';
import { convertNumberToJapanese } from './utils/numberConverter.js';
import { initSpeech, speakJapanese } from './utils/speech.js';
import { storage } from './utils/storage.js';

// Available Tab IDs for Hash-based Page Routing
const VALID_TABS = [
  'daily-program',
  'immigration',
  'numbers',
  'cheatsheet',
  'flashcards',
  'test',
  'roleplay',
  'pocket',
  'radio',
];

// Parse current URL hash (e.g., "#/roleplay?scenario=rp-konbini&mode=quiz")
function parseHashRoute() {
  const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
  if (!rawHash) {
    return { tab: 'daily-program', params: {} };
  }
  const [tabPart, queryPart] = rawHash.split('?');
  const tab = VALID_TABS.includes(tabPart) ? tabPart : 'daily-program';
  const params = {};
  if (queryPart) {
    const usp = new URLSearchParams(queryPart);
    usp.forEach((value, key) => {
      params[key] = value;
    });
  }
  return { tab, params };
}

// Update URL hash without causing full page reload
function updateUrlHash(tab, params = null) {
  let hashStr = `#/${tab}`;
  if (params && Object.keys(params).length > 0) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        usp.set(k, v);
      }
    }
    const qs = usp.toString();
    if (qs) hashStr += `?${qs}`;
  }
  if (window.location.hash !== hashStr) {
    window.location.hash = hashStr;
  }
}

const initialRoute = parseHashRoute();

// Application State
const state = {
  currentTab: initialRoute.tab,
  selectedDayId: initialRoute.params.day || 'D-8',
  programViewMode: 'lesson', // 'lesson' or 'roadmap'
  // Flashcard & Vocabulary State
  flashcardCategory: 'all',
  flashcardViewMode: initialRoute.params.mode === 'quiz' ? 'quiz' : 'grid', // 'grid' or 'quiz'
  flashcardOnlyUnmastered: false,
  flashcardIsShuffled: false,
  flashcardShuffledList: null,
  flashcardRevealReverse: false,
  activeFlashcardIndex: 0,
  isFlashcardModalOpen: false,
  isFlashcardRevealed: false,

  // Flashcards Dynamic Quiz State
  fcQuizQuestions: [],
  fcQuizIndex: 0,
  fcQuizAnswers: {}, // key: question index => selected option index
  fcQuizFinished: false,

  masteredPhrases: new Set(storage.getMasteredPhrases()),
  checklist: storage.getChecklist(),
  audioSpeed: storage.getAudioSpeed(),

  // Comprehensive Quiz State
  quizQuestionsList: [...quizQuestions],
  quizIndex: 0,
  quizUserAnswers: {}, // key: question index => selected option index
  quizFinished: false,

  // Roleplay State & Quiz Mode
  activeRoleplayId: initialRoute.params.scenario || roleplayScenarios[0].id,
  roleplayStepIndex: 0,
  roleplayLogs: [],
  roleplayViewMode: initialRoute.params.mode === 'quiz' ? 'quiz' : 'chat', // 'chat' or 'quiz'
  rpQuizStepIndex: 0,
  rpQuizAnswers: {}, // key: step index => { selectedIndex, isBest }
  rpQuizFinished: false,

  // Immigration Simulation State
  immStepIndex: 0,
  immLogs: [],
  immSelectedChoice: null,

  // Daily Studio Mini Quiz State
  miniQuizAnswers: storage.getMiniQuizAnswers(), // key: `${dayId}_${qIdx}` => selected option index

  // Pocket Card Fullscreen View State
  pocketCategory: 'all',
  activePocketIndex: 0,
  isPocketModalOpen: false,
  isPocketFlipped: false,

  // Numbers & Currency Master State
  numbersSubTab: initialRoute.params.sub || 'currency', // 'currency', 'chart', 'counters', 'calculator', 'quiz'
  calcInputNumber: 1500,
  numQuizList: [...numberQuizPool],
  numQuizIndex: 0,
  numQuizAnswers: {}, // key: question index => selected option index
  numQuizFinished: false,

  // Radio State
  radioCurrentChapterId: initialRoute.params.chapter || 'ch01',
  radioSpeed: storage.getRadioSpeed(),
};

// Initialize Speech System
initSpeech();

// Show temporary toast message
function showToast(message) {
  const existing = document.querySelector('.toast-msg');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

// App Shell Render
function renderApp() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app-container">
      <header class="app-header">
        <div class="header-top">
          <div class="logo-group">
            <span class="logo-badge">🗻</span>
            <div class="header-title-wrap">
              <h1>JP Study R1</h1>
              <p>도쿄·가와구치코 초밀착 속성 회화 과외</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="speed-toggle-btn" id="btn-audio-speed" title="발음 재생 속도 조절">
              음성 속도: <strong>${state.audioSpeed}x</strong>
            </button>
            <button class="speed-toggle-btn" id="btn-open-backup" title="학습 데이터 백업 및 복원">
              💾 <strong>데이터 백업/복원</strong>
            </button>
          </div>
        </div>

        <div class="trip-summary-banner">
          <div class="trip-route">
            <span>🛫 인천공항</span>
            <span>➔</span>
            <span>나리타</span>
            <span>➔</span>
            <span>가와구치코 (2박)</span>
            <span>➔</span>
            <span>우에노 (1박)</span>
          </div>
          <span class="trip-days-badge">3박 4일 코스</span>
        </div>
      </header>

      <nav class="nav-tabs" id="nav-tabs">
        <button class="tab-btn ${state.currentTab === 'daily-program' ? 'active' : ''}" data-tab="daily-program">
          📚 데일리 학습 프로그램
        </button>
        <button class="tab-btn ${state.currentTab === 'radio' ? 'active' : ''}" data-tab="radio">
          📻 미나 라디오
        </button>
        <button class="tab-btn ${state.currentTab === 'immigration' ? 'active' : ''}" data-tab="immigration">
          ✈️ 공항 입출국심사
        </button>
        <button class="tab-btn ${state.currentTab === 'numbers' ? 'active' : ''}" data-tab="numbers">
          🔢 숫자 & 엔화 마스터
        </button>
        <button class="tab-btn ${state.currentTab === 'cheatsheet' ? 'active' : ''}" data-tab="cheatsheet">
          ⚡ 1초 치트시트
        </button>
        <button class="tab-btn ${state.currentTab === 'flashcards' ? 'active' : ''}" data-tab="flashcards">
          🗂️ 플래시 암기장
        </button>
        <button class="tab-btn ${state.currentTab === 'test' ? 'active' : ''}" data-tab="test">
          📝 종합 실전 테스트
        </button>
        <button class="tab-btn ${state.currentTab === 'roleplay' ? 'active' : ''}" data-tab="roleplay">
          🎭 롤플레잉
        </button>
        <button class="tab-btn ${state.currentTab === 'pocket' ? 'active' : ''}" data-tab="pocket">
          🎒 여행자 포켓 카드
        </button>
      </nav>

      <main class="app-content" id="app-content">
        <!-- Content Area -->
      </main>

      <footer class="app-footer">
        <p>JP Study R1 • 100% Public Open-Source Project • 개인정보 비저장 & 안전 설계</p>
        <div class="footer-links">
          <a href="https://github.com/naturalkei/jp-study-r1" target="_blank" rel="noopener noreferrer" class="footer-link">GitHub Repository</a>
          <span>•</span>
          <a href="#" id="link-backup-restore" class="footer-link">데이터 백업/복원</a>
          <span>•</span>
          <a href="#" id="link-reset-progress" class="footer-link">학습 진도 초기화</a>
        </div>
      </footer>
    </div>
  `;

  attachHeaderEvents();
  renderCurrentTab();
}

function switchTab(targetTab, updateHash = true, params = null) {
  if (!VALID_TABS.includes(targetTab)) {
    targetTab = 'daily-program';
  }
  closePocketModal();
  closeFlashcardModal();
  state.currentTab = targetTab;

  document.querySelectorAll('.tab-btn').forEach((b) => {
    if (b.getAttribute('data-tab') === targetTab) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  if (updateHash) {
    updateUrlHash(targetTab, params);
  }

  renderCurrentTab();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let isHashListenerAttached = false;

function attachHeaderEvents() {
  document.getElementById('nav-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    const targetTab = btn.getAttribute('data-tab');
    if (targetTab && targetTab !== state.currentTab) {
      switchTab(targetTab);
    }
  });

  // Attach global hashchange listener once
  if (!isHashListenerAttached) {
    isHashListenerAttached = true;
    window.addEventListener('hashchange', () => {
      const route = parseHashRoute();
      if (route.tab !== state.currentTab) {
        if (route.tab === 'roleplay') {
          if (route.params.scenario) state.activeRoleplayId = route.params.scenario;
          if (route.params.mode) state.roleplayViewMode = route.params.mode;
        } else if (route.tab === 'daily-program' && route.params.day) {
          state.selectedDayId = route.params.day;
        } else if (route.tab === 'numbers' && route.params.sub) {
          state.numbersSubTab = route.params.sub;
        } else if (route.tab === 'flashcards' && route.params.mode) {
          state.flashcardViewMode = route.params.mode;
        }
        switchTab(route.tab, false);
      } else {
        let needsRender = false;
        if (route.tab === 'roleplay') {
          if (route.params.scenario && route.params.scenario !== state.activeRoleplayId) {
            state.activeRoleplayId = route.params.scenario;
            state.roleplayStepIndex = 0;
            state.roleplayLogs = [];
            state.rpQuizStepIndex = 0;
            state.rpQuizAnswers = {};
            state.rpQuizFinished = false;
            needsRender = true;
          }
          if (route.params.mode && route.params.mode !== state.roleplayViewMode) {
            state.roleplayViewMode = route.params.mode;
            needsRender = true;
          }
        }
        if (needsRender) {
          renderCurrentTab();
        }
      }
    });
  }

  document.getElementById('btn-audio-speed').addEventListener('click', () => {
    state.audioSpeed = state.audioSpeed === 0.85 ? 1.0 : 0.85;
    storage.setAudioSpeed(state.audioSpeed);
    document.getElementById('btn-audio-speed').innerHTML = `음성 속도: <strong>${state.audioSpeed}x</strong>`;
    showToast(`일본어 음성 재생 속도: ${state.audioSpeed}x (${state.audioSpeed === 0.85 ? '학습용 느리게' : '보통 속도'})`);
  });

  document.getElementById('btn-open-backup')?.addEventListener('click', () => {
    openBackupModal();
  });

  document.getElementById('link-backup-restore')?.addEventListener('click', (e) => {
    e.preventDefault();
    openBackupModal();
  });

  document.getElementById('link-reset-progress').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('학습 체크리스트와 암기장 완료 상태를 모두 초기화하시겠습니까?')) {
      storage.resetAll();
      state.masteredPhrases = new Set();
      state.checklist = {};
      state.miniQuizAnswers = {};
      state.audioSpeed = 0.85;
      const speedBtn = document.getElementById('btn-audio-speed');
      if (speedBtn) {
        speedBtn.innerHTML = `음성 속도: <strong>${state.audioSpeed}x</strong>`;
      }
      renderCurrentTab();
      showToast('학습 진도가 초기화되었습니다.');
    }
  });
}

function renderCurrentTab() {
  const container = document.getElementById('app-content');
  if (!container) return;

  switch (state.currentTab) {
    case 'daily-program':
      renderDailyProgram(container);
      break;
    case 'radio':
      renderRadio(container);
      break;
    case 'immigration':
      renderImmigrationClinic(container);
      break;
    case 'numbers':
      renderNumbers(container);
      break;
    case 'cheatsheet':
      renderCheatsheet(container);
      break;
    case 'flashcards':
      renderFlashcards(container);
      break;
    case 'test':
      renderTest(container);
      break;
    case 'roleplay':
      renderRoleplay(container);
      break;
    case 'pocket':
      renderPocket(container);
      break;
    default:
      renderDailyProgram(container);
  }
}

// ---------------------------------------------------------------------------
// 1. Daily Learning Program (데일리 학습 프로그램 - 교재 & 로드맵)
// ---------------------------------------------------------------------------
function renderDailyProgram(container) {
  const currentDay = curriculumData.find((d) => d.id === state.selectedDayId) || curriculumData[0];
  const currentIndex = curriculumData.findIndex((d) => d.id === currentDay.id);
  const currentLesson = dailyLessonsData[currentDay.id] || { focus: '', lecture: [] };

  // Calculate overall completion
  let totalTasks = 0;
  let doneTasks = 0;
  curriculumData.forEach((day) => {
    ['morning', 'lunch', 'night'].forEach((phase) => {
      day.routine[phase].forEach((_, idx) => {
        totalTasks++;
        const key = `${day.id}_${phase}_${idx}`;
        if (state.checklist[key]) doneTasks++;
      });
    });
  });
  const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Calculate current day completion
  let dayTotalTasks = 0;
  let dayDoneTasks = 0;
  ['morning', 'lunch', 'night'].forEach((phase) => {
    currentDay.routine[phase].forEach((_, idx) => {
      dayTotalTasks++;
      const key = `${currentDay.id}_${phase}_${idx}`;
      if (state.checklist[key]) dayDoneTasks++;
    });
  });
  const dayProgress = dayTotalTasks > 0 ? Math.round((dayDoneTasks / dayTotalTasks) * 100) : 0;

  let html = `
    <!-- View Mode Switcher -->
    <div class="view-mode-switcher">
      <button class="view-mode-btn ${state.programViewMode === 'lesson' ? 'active' : ''}" data-mode="lesson">
        📖 일자별 교재 학습 (${currentDay.id})
      </button>
      <button class="view-mode-btn ${state.programViewMode === 'roadmap' ? 'active' : ''}" data-mode="roadmap">
        📊 전체 마일스톤 로드맵
      </button>
    </div>
  `;

  if (state.programViewMode === 'roadmap') {
    // -----------------------------------------------------------------------
    // ROADMAP MODE: 전체 커리큘럼 로드맵 & 마일스톤 테이블
    // -----------------------------------------------------------------------
    html += `
      <!-- Overall Progress Card -->
      <div class="content-card" style="background: linear-gradient(to right, #ffffff, #f8fafc); border-left: 4px solid var(--color-primary);">
        <div class="card-header" style="margin-bottom: 8px;">
          <h2 class="card-title">📍 D-8 ~ D-Day 마일스톤 전체 달성률</h2>
          <span class="card-badge">${doneTasks} / ${totalTasks} 완료 (${overallProgress}%)</span>
        </div>
        <div style="background: #e2e8f0; height: 8px; border-radius: 9999px; overflow: hidden; margin-top: 6px;">
          <div style="background: var(--color-primary); height: 100%; width: ${overallProgress}%; transition: width 0.3s ease;"></div>
        </div>
      </div>

      <!-- 30-Minute Routine Guide Card -->
      <div class="content-card">
        <div class="card-header">
          <h3 class="card-title">⏰ 왕초보 30분 데일리 실천 공부법</h3>
          <span class="card-badge">3-Step Routine</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 14px;">
          문법 책을 파고드는 대신, 하루 세 번 10분씩 1초 패턴 반사신경을 기르는 속성 커리큘럼입니다.
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
          <div style="background: var(--color-surface-muted); padding: 14px; border-radius: 8px; border-top: 3px solid #f59e0b;">
            <div style="font-weight: 700; color: #b45309; font-size: 0.88rem; margin-bottom: 4px;">🌅 아침 기상 / 출근 (10분)</div>
            <div style="font-size: 0.82rem; color: var(--color-text-muted);">당일 핵심 1초 패턴 5개 소리 내어 10회 말하기 (TTS 발음 청취)</div>
          </div>
          <div style="background: var(--color-surface-muted); padding: 14px; border-radius: 8px; border-top: 3px solid #3b82f6;">
            <div style="font-weight: 700; color: #1d4ed8; font-size: 0.88rem; margin-bottom: 4px;">🍱 점심 식사 후 (10분)</div>
            <div style="font-size: 0.82rem; color: var(--color-text-muted);">엔화 계산기 소리 듣기 & 오늘의 미니 퀴즈 풀기 (목표: 80점)</div>
          </div>
          <div style="background: var(--color-surface-muted); padding: 14px; border-radius: 8px; border-top: 3px solid #10b981;">
            <div style="font-weight: 700; color: #047857; font-size: 0.88rem; margin-bottom: 4px;">🌙 퇴근 / 취침 전 (10분)</div>
            <div style="font-size: 0.82rem; color: var(--color-text-muted);">당일 롤플레잉 티키타카 대화 훈련 & 체크리스트 완료 확인</div>
          </div>
        </div>
      </div>

      <!-- Roadmap Table -->
      <div class="content-card">
        <div class="card-header">
          <h3 class="card-title">📅 D-8 ~ D-Day 커리큘럼 마일스톤 테이블</h3>
          <span class="card-badge">터치하여 해당 일자 학습</span>
        </div>
        <div class="roadmap-table-wrap">
          <table class="roadmap-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>단계</th>
                <th>학습 테마</th>
                <th>핵심 목표 & 실전 미션</th>
                <th>바로가기</th>
              </tr>
            </thead>
            <tbody>
              ${curriculumData
                .map(
                  (d) => `
                <tr>
                  <td><strong style="color: var(--color-primary);">${d.id}</strong></td>
                  <td>${d.date}</td>
                  <td><strong>${d.title}</strong></td>
                  <td style="font-size: 0.82rem;">${d.subtitle || d.description}</td>
                  <td>
                    <button class="speed-toggle-btn jump-to-day-btn" data-dayid="${d.id}" style="padding: 4px 10px; font-size: 0.76rem;">
                      학습하기 👉
                    </button>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else {
    // -----------------------------------------------------------------------
    // LESSON MODE: 일자별 교재 학습 (상세 교재 본문 + 단어 + 퀴즈)
    // -----------------------------------------------------------------------
    html += `
      <!-- Day Selection Rail -->
      <div class="day-selector-rail">
        ${curriculumData
          .map((d) => {
            const isSelected = d.id === currentDay.id;
            return `
            <button class="day-rail-btn ${isSelected ? 'active' : ''}" data-dayid="${d.id}">
              <span class="rail-id">${d.id}</span>
              <span class="rail-sub">${d.date}</span>
            </button>
          `;
          })
          .join('')}
      </div>

      <!-- Day Hero Banner -->
      <div class="day-page-hero">
        <div class="day-page-hero-top">
          <span class="day-page-badge">${currentDay.badge}</span>
          <span style="font-size: 0.8rem; font-weight: 700; opacity: 0.95;">진도율: ${dayDoneTasks}/${dayTotalTasks} (${dayProgress}%)</span>
        </div>
        <h2 class="day-page-title">${currentDay.id} • ${currentDay.title}</h2>
        <p style="font-size: 0.95rem; font-weight: 600; opacity: 0.95; margin-bottom: 6px;">👉 ${currentDay.subtitle || ''}</p>
        <p class="day-page-sub">${currentDay.description}</p>
      </div>

      <!-- Section 1: In-depth Textbook Lecture Topics -->
      ${
        currentLesson.lecture && currentLesson.lecture.length > 0
          ? `
        <div class="lecture-card">
          <div class="card-header" style="margin-bottom: 12px;">
            <h3 class="card-title">📖 오늘의 속성 핵심 교재 강의 & 비법</h3>
            <span class="card-badge">교재 본문</span>
          </div>
          <p style="font-size: 0.84rem; color: var(--color-text-muted); margin-bottom: 14px;">
            💡 <strong>포커스:</strong> ${currentLesson.focus}
          </p>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${currentLesson.lecture
              .map(
                (item) => `
              <div class="lecture-topic-block">
                <div class="lecture-topic-title">${item.topic}</div>
                <div class="lecture-topic-body">${item.content.trim()}</div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      <!-- Section 2: Key Phrases Booster -->
      <div class="content-card">
        <div class="card-header">
          <h3 class="card-title">🔑 오늘 꼭 챙길 핵심 문장 부스터</h3>
          <span class="card-badge">원터치 오디오</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${currentDay.keyPhrases
            .map(
              (p) => `
            <div style="background: #ffffff; border: 1px solid var(--color-border); border-radius: 10px; padding: 14px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; transition: all 0.2s ease;">
              <div style="flex: 1;">
                <div style="font-family: var(--font-jp); font-weight: 700; font-size: 1.15rem; color: var(--color-text-main); margin-bottom: 2px;">
                  ${p.jp}
                </div>
                <div style="font-size: 0.8rem; color: var(--color-text-subtle); margin-bottom: 4px;">
                  ${p.furigana || ''}
                </div>
                <div style="font-size: 0.92rem; font-weight: 700; color: var(--color-primary); margin-bottom: 4px;">
                  ${p.pronounce}
                </div>
                <div style="font-size: 0.88rem; font-weight: 600; color: var(--color-text-main); margin-bottom: 2px;">
                  👉 ${p.ko}
                </div>
                ${p.en ? `
                <div style="font-size: 0.82rem; font-weight: 600; color: #2563eb; margin-bottom: 6px;">
                  🇺🇸 ${p.en}
                </div>
                ` : ''}
                <div style="font-size: 0.78rem; color: var(--color-text-muted); background: var(--color-surface-muted); padding: 4px 8px; border-radius: 4px; display: inline-block;">
                  💡 ${p.note}
                </div>
              </div>
              <button class="audio-btn" data-audio="${p.audio}" title="발음 듣기">🔊</button>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Section 3: Today's Dialogue Simulation -->
      ${
        currentDay.dialogue
          ? `
        <div class="content-card">
          <div class="card-header">
            <h3 class="card-title">💬 오늘의 실전 대화 시뮬레이션</h3>
            <span class="card-badge">${currentDay.dialogue.title}</span>
          </div>
          <div class="daily-dialogue-box">
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${currentDay.dialogue.lines
                .map(
                  (line) => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--color-surface-muted); padding: 10px 14px; border-radius: 8px;">
                  <div>
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-primary); margin-bottom: 2px;">[${line.speaker}]</div>
                    <div style="font-family: var(--font-jp); font-weight: 700; font-size: 1rem; color: var(--color-text-main);">${line.jp}</div>
                    <div style="font-size: 0.82rem; font-weight: 600; color: var(--color-primary);">${line.pron}</div>
                    <div style="font-size: 0.8rem; color: var(--color-text-muted);">👉 ${line.ko}</div>
                    ${line.en ? `<div style="font-size: 0.78rem; font-weight: 600; color: #2563eb; margin-top: 2px;">🇺🇸 ${line.en}</div>` : ''}
                  </div>
                  <button class="audio-btn" data-audio="${line.jp}">🔊</button>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      `
          : ''
      }

      <!-- Section 4: 3-Step Daily Routine Checklist -->
      <div class="content-card">
        <div class="card-header">
          <h3 class="card-title">⏰ 오늘의 30분 실천 체크리스트</h3>
          <span class="card-badge">터치하여 완료 체크</span>
        </div>
        <div class="routine-section">
          <div class="routine-phase">
            <div class="phase-label">☀️ 아침 루틴 (10분 발음 체화)</div>
            <ul class="routine-list">
              ${currentDay.routine.morning
                .map((t, idx) => {
                  const key = `${currentDay.id}_morning_${idx}`;
                  const isChecked = !!state.checklist[key];
                  return `
                  <li class="routine-item ${isChecked ? 'done' : ''}" data-key="${key}">
                    <input type="checkbox" class="routine-checkbox" ${isChecked ? 'checked' : ''} />
                    <span>${t}</span>
                  </li>
                `;
                })
                .join('')}
            </ul>
          </div>

          <div class="routine-phase">
            <div class="phase-label">🍱 점심 루틴 (10분 단어 & 미니 퀴즈)</div>
            <ul class="routine-list">
              ${currentDay.routine.lunch
                .map((t, idx) => {
                  const key = `${currentDay.id}_lunch_${idx}`;
                  const isChecked = !!state.checklist[key];
                  return `
                  <li class="routine-item ${isChecked ? 'done' : ''}" data-key="${key}">
                    <input type="checkbox" class="routine-checkbox" ${isChecked ? 'checked' : ''} />
                    <span>${t}</span>
                  </li>
                `;
                })
                .join('')}
            </ul>
          </div>

          <div class="routine-phase">
            <div class="phase-label">🌙 저녁 루틴 (10분 롤플레잉 & 복습)</div>
            <ul class="routine-list">
              ${currentDay.routine.night
                .map((t, idx) => {
                  const key = `${currentDay.id}_night_${idx}`;
                  const isChecked = !!state.checklist[key];
                  return `
                  <li class="routine-item ${isChecked ? 'done' : ''}" data-key="${key}">
                    <input type="checkbox" class="routine-checkbox" ${isChecked ? 'checked' : ''} />
                    <span>${t}</span>
                  </li>
                `;
                })
                .join('')}
            </ul>
          </div>
        </div>
      </div>

      <!-- Section 5: Daily Mini Quiz -->
      ${
        currentDay.miniQuiz && currentDay.miniQuiz.length > 0
          ? `
        <div class="content-card">
          <div class="card-header">
            <h3 class="card-title">📝 오늘의 1분 확인 미니 퀴즈</h3>
            <span class="card-badge">학습 점검</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${currentDay.miniQuiz
              .map((q, qIdx) => {
                const quizKey = `${currentDay.id}_${qIdx}`;
                const answeredIdx = state.miniQuizAnswers[quizKey];
                const isAnswered = answeredIdx !== undefined;

                return `
                <div style="border: 1px solid var(--color-border); border-radius: 10px; padding: 16px; background: #ffffff;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--color-text-main);">Q${qIdx + 1}. ${q.question}</h4>
                    ${q.audio ? `<button class="audio-btn" data-audio="${q.audio}" style="width: 28px; height: 28px; font-size: 12px;">🔊</button>` : ''}
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${q.options
                      .map((opt, optIdx) => {
                        let btnClass = '';
                        if (isAnswered) {
                          if (optIdx === q.answer) btnClass = 'correct';
                          else if (optIdx === answeredIdx) btnClass = 'wrong';
                        }
                        return `
                        <button class="quiz-option-btn ${btnClass} daily-mini-opt" data-dayid="${currentDay.id}" data-qidx="${qIdx}" data-optidx="${optIdx}" ${isAnswered ? 'disabled' : ''}>
                          <span>${optIdx + 1}. ${opt}</span>
                          ${isAnswered && optIdx === q.answer ? '<span>✅</span>' : ''}
                        </button>
                      `;
                      })
                      .join('')}
                  </div>
                  ${
                    isAnswered
                      ? `
                    <div style="margin-top: 10px; font-size: 0.82rem; color: var(--color-text-muted); background: var(--color-surface-muted); padding: 8px 10px; border-radius: 6px;">
                      💡 <strong>해설:</strong> ${q.explanation}
                    </div>
                  `
                      : ''
                  }
                </div>
              `;
              })
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      <!-- Daily Navigation Bar (이전 날 / 다음 날) -->
      <div class="daily-nav-bar">
        ${
          currentIndex > 0
            ? `<button class="daily-nav-btn" id="btn-prev-day">
                👈 이전 날 (${curriculumData[currentIndex - 1].id})
              </button>`
            : `<div style="visibility: hidden;"></div>`
        }
        ${
          currentIndex < curriculumData.length - 1
            ? `<button class="daily-nav-btn" id="btn-next-day" style="background: var(--color-primary); color: white; border-color: var(--color-primary);">
                다음 날 (${curriculumData[currentIndex + 1].id}) 👉
              </button>`
            : `<div style="visibility: hidden;"></div>`
        }
      </div>
    `;
  }

  container.innerHTML = html;

  // View Mode Switcher Click
  container.querySelectorAll('.view-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.programViewMode = btn.getAttribute('data-mode');
      renderDailyProgram(container);
    });
  });

  // Jump to Day button (from Roadmap Table)
  container.querySelectorAll('.jump-to-day-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedDayId = btn.getAttribute('data-dayid');
      state.programViewMode = 'lesson';
      updateUrlHash('daily-program', { day: state.selectedDayId });
      renderDailyProgram(container);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Rail Button Click
  container.querySelectorAll('.day-rail-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedDayId = btn.getAttribute('data-dayid');
      updateUrlHash('daily-program', { day: state.selectedDayId });
      renderDailyProgram(container);
    });
  });

  // Routine Checklist Toggle
  container.querySelectorAll('.routine-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      const checkbox = item.querySelector('.routine-checkbox');
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
      }
      const key = item.getAttribute('data-key');
      state.checklist[key] = checkbox.checked;
      storage.setChecklist(state.checklist);
      renderDailyProgram(container);
    });
  });

  // Audio Buttons
  container.querySelectorAll('.audio-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
    });
  });

  // Mini Quiz Answer Click
  container.querySelectorAll('.daily-mini-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dayId = btn.getAttribute('data-dayid');
      const qIdx = parseInt(btn.getAttribute('data-qidx'), 10);
      const optIdx = parseInt(btn.getAttribute('data-optidx'), 10);
      const quizKey = `${dayId}_${qIdx}`;

      if (state.miniQuizAnswers[quizKey] !== undefined) return;
      state.miniQuizAnswers[quizKey] = optIdx;
      storage.setMiniQuizAnswers(state.miniQuizAnswers);

      const q = currentDay.miniQuiz[qIdx];
      if (optIdx === q.answer) {
        showToast('정답입니다! 🎉');
      } else {
        showToast('틀렸습니다. 해설을 확인해보세요!');
      }
      renderDailyProgram(container);
    });
  });

  // Prev / Next Navigation
  const prevBtn = document.getElementById('btn-prev-day');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        state.selectedDayId = curriculumData[currentIndex - 1].id;
        updateUrlHash('daily-program', { day: state.selectedDayId });
        renderDailyProgram(container);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  const nextBtn = document.getElementById('btn-next-day');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentIndex < curriculumData.length - 1) {
        state.selectedDayId = curriculumData[currentIndex + 1].id;
        updateUrlHash('daily-program', { day: state.selectedDayId });
        renderDailyProgram(container);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 2. Immigration & Customs Clinic Tab (공항 입출국심사 특강)
// ---------------------------------------------------------------------------
function renderImmigrationClinic(container) {
  let html = `
    <!-- Clinic Header -->
    <div class="content-card" style="background: linear-gradient(135deg, #1e3a8a, #0f172a); color: white; border: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span class="day-page-badge">공항 프리패스 특강</span>
        <span style="font-size: 0.8rem; opacity: 0.9;">나리타 공항 입국 & 귀국 대비</span>
      </div>
      <h2 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 8px;">${immigrationData.overview.title}</h2>
      <p style="font-size: 0.88rem; opacity: 0.9; margin-bottom: 12px;">${immigrationData.overview.description}</p>
      <div style="background: rgba(255, 255, 255, 0.15); padding: 8px 12px; border-radius: 8px; font-size: 0.82rem;">
        💡 <strong>${immigrationData.overview.passRule}</strong>
      </div>
    </div>

    <!-- Section 1 & 2 & 3 Inspection QA Guides -->
    ${immigrationData.sections
      .map(
        (sec) => `
      <div class="immigration-card">
        <div class="card-header" style="margin-bottom: 8px;">
          <h3 class="card-title">${sec.title}</h3>
          <span class="card-badge">${sec.badge}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 14px;">${sec.description}</p>

        <!-- Machine Guidance (Audio) -->
        <div style="margin-bottom: 16px;">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-primary); margin-bottom: 8px;">
            📢 기계 및 심사관 음성 안내 (귀로 익히기)
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${sec.machineGuidance
              .map(
                (m) => `
              <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid var(--color-border); border-radius: 8px; padding: 10px 12px;">
                <div>
                  <div style="font-family: var(--font-jp); font-weight: 700; font-size: 0.92rem; color: var(--color-text-main);">${m.jp}</div>
                  <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">${m.pron}</div>
                  <div style="font-size: 0.78rem; color: var(--color-text-muted);">${m.ko}</div>
                  ${m.en ? `<div style="font-size: 0.76rem; font-weight: 600; color: #2563eb; margin-top: 2px;">🇺🇸 ${m.en}</div>` : ''}
                </div>
                <button class="audio-btn" data-audio="${m.audio}">🔊</button>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- QA Pairs -->
        <div>
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-accent); margin-bottom: 8px;">
            💬 심사관의 핵심 질문 & 0.1초 모범 답변
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${sec.qaPairs
              .map(
                (qa) => `
              <div class="qa-item-wrap">
                <div class="qa-q-row">
                  <div>
                    <div style="font-size: 0.72rem; font-weight: 700; color: var(--color-accent); margin-bottom: 2px;">[심사관 질문]</div>
                    <div class="qa-q-text">${qa.q_jp}</div>
                    <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted);">${qa.q_pron} • ${qa.q_ko}</div>
                    ${qa.q_en ? `<div style="font-size: 0.78rem; font-weight: 600; color: #2563eb; margin-top: 2px;">🇺🇸 Q: ${qa.q_en}</div>` : ''}
                  </div>
                  <button class="audio-btn" data-audio="${qa.audio_q}">🔊</button>
                </div>
                <div class="qa-a-row">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-size: 0.72rem; font-weight: 700; color: var(--color-primary); margin-bottom: 2px;">[나의 0.1초 답변]</div>
                      <div class="qa-a-text">${qa.a_jp}</div>
                      <div style="font-size: 0.82rem; font-weight: 600; color: var(--color-primary);">${qa.a_pron} • ${qa.a_ko}</div>
                      ${qa.a_en ? `<div style="font-size: 0.8rem; font-weight: 600; color: #1d4ed8; margin-top: 2px;">🇺🇸 A: ${qa.a_en}</div>` : ''}
                    </div>
                    <button class="audio-btn" data-audio="${qa.audio_a}">🔊</button>
                  </div>
                  <div class="qa-tip-badge">💡 <strong>Tip:</strong> ${qa.tip}</div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `
      )
      .join('')}

    <!-- Interactive Immigration Simulation Dialogue -->
    <div class="content-card">
      <div class="card-header">
        <h3 class="card-title">🛂 실전 입국심사대 시뮬레이션 게임</h3>
        <button class="speed-toggle-btn" id="btn-reset-imm-sim">처음부터</button>
      </div>
      <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 16px;">
        심사관의 질문에 알맞은 답변을 선택해보세요! (틀린 답변을 고르면 심사가 길어집니다)
      </p>

      <div class="chat-window">
        ${state.immLogs
          .map(
            (log) => `
          <div class="chat-bubble ${log.speaker}">
            <div class="chat-bubble-speaker">${log.speaker === 'staff' ? '입국심사관' : '나'}</div>
            <div class="chat-jp-text">${log.text}</div>
            <div class="chat-ko-sub">${log.ko}</div>
            ${log.en ? `<div style="font-size: 0.76rem; font-weight: 600; color: #2563eb; margin-top: 2px;">🇺🇸 ${log.en}</div>` : ''}
          </div>
        `
          )
          .join('')}

        ${
          state.immStepIndex < immigrationData.dialogueSimulation.length
            ? `
          <div class="chat-bubble staff">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <div class="chat-bubble-speaker">입국심사관</div>
              <button class="audio-btn" data-audio="${immigrationData.dialogueSimulation[state.immStepIndex].officer}" style="width: 26px; height: 26px; font-size: 12px;">🔊</button>
            </div>
            <div class="chat-jp-text">${immigrationData.dialogueSimulation[state.immStepIndex].officer}</div>
            <div style="font-size: 0.8rem; color: var(--color-primary); font-weight: 600;">${immigrationData.dialogueSimulation[state.immStepIndex].officerPron}</div>
            <div class="chat-ko-sub">${immigrationData.dialogueSimulation[state.immStepIndex].officerKo}</div>
            ${immigrationData.dialogueSimulation[state.immStepIndex].officerEn ? `<div style="font-size: 0.78rem; font-weight: 600; color: #2563eb; margin-top: 2px;">🇺🇸 ${immigrationData.dialogueSimulation[state.immStepIndex].officerEn}</div>` : ''}
          </div>
        `
            : `
          <div style="text-align: center; padding: 20px; background: var(--color-success-light); border-radius: var(--radius-md); border: 1px solid var(--color-success);">
            <div style="font-size: 40px; margin-bottom: 6px;">🎉 🇯🇵</div>
            <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--color-success); margin-bottom: 4px;">입국 심사 통과!</h4>
            <p style="font-size: 0.85rem; color: var(--color-text-main);">
              심사관이 도장을 쾅 찍어주었습니다! 이제 수하물을 찾고 가와구치코로 출발할 준비가 완료되었습니다.
            </p>
          </div>
        `
        }
      </div>

      <!-- Choice Options -->
      ${
        state.immStepIndex < immigrationData.dialogueSimulation.length
          ? `
        <div style="margin-top: 16px; border-top: 1px solid var(--color-border); padding-top: 14px;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--color-text-muted); margin-bottom: 8px;">
            선택지를 터치하여 답변하세요:
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${immigrationData.dialogueSimulation[state.immStepIndex].options
              .map(
                (opt, optIdx) => `
              <button class="quiz-option-btn imm-choice-btn" data-idx="${optIdx}">
                <div>
                  <div style="font-family: var(--font-jp); font-weight: 700; font-size: 0.95rem;">${opt.text}</div>
                  <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">${opt.pron}</div>
                  <div style="font-size: 0.78rem; color: var(--color-text-muted);">${opt.ko}</div>
                  ${opt.en ? `<div style="font-size: 0.76rem; font-weight: 600; color: #2563eb; margin-top: 2px;">🇺🇸 ${opt.en}</div>` : ''}
                </div>
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;

  container.innerHTML = html;

  // Audio Play
  container.querySelectorAll('.audio-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
    });
  });

  // Reset Simulation
  const resetBtn = document.getElementById('btn-reset-imm-sim');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.immStepIndex = 0;
      state.immLogs = [];
      renderImmigrationClinic(container);
    });
  }

  // Simulation Choice Click
  container.querySelectorAll('.imm-choice-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const currentStep = immigrationData.dialogueSimulation[state.immStepIndex];
      const chosen = currentStep.options[idx];

      // Append officer text to logs
      state.immLogs.push({
        speaker: 'staff',
        text: currentStep.officer,
        ko: currentStep.officerKo,
      });

      // Append user text to logs
      state.immLogs.push({
        speaker: 'user',
        text: chosen.text,
        ko: chosen.ko,
      });

      speakJapanese(chosen.text, state.audioSpeed);
      showToast(chosen.feedback);

      state.immStepIndex++;
      renderImmigrationClinic(container);
    });
  });
}

// ---------------------------------------------------------------------------
// 2.5 Numbers & Currency Master Tab (숫자 & 엔화 마스터)
// ---------------------------------------------------------------------------
function renderNumbers(container) {
  const subTabs = [
    { id: 'currency', label: '💴 엔화 & 화폐 도감' },
    { id: 'chart', label: '🔢 숫자 & 변칙 발음' },
    { id: 'counters', label: '🏷️ 개수·인원·잔 세기' },
    { id: 'calculator', label: '🧮 엔화 계산기 & 청해기' },
    { id: 'quiz', label: '🎯 실전 청해 & 퀴즈' },
  ];

  let subContentHtml = '';

  if (state.numbersSubTab === 'currency') {
    subContentHtml = `
      <!-- Coins Section -->
      <div style="margin-bottom: 28px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
          🪙 일본 동전 6종 도감 & 실전 팁 (1円 ~ 500円)
        </h3>
        <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 14px;">
          일본은 동전 사용 빈도가 매우 높습니다. 각 동전의 특징과 사용처를 파악해 계산대에서 빠르게 꺼내보세요!
        </p>
        <div class="currency-grid">
          ${currencyData.coins
            .map(
              (c) => `
            <div class="currency-card">
              <div>
                <div class="currency-header">
                  <div class="currency-value">
                    <span>${c.kanji}</span>
                    <span class="currency-reading">(${c.reading})</span>
                  </div>
                  <button class="audio-btn" data-audio="${c.audio}" title="발음 듣기">🔊</button>
                </div>
                <div style="font-size: 0.78rem; color: #2563eb; font-weight: 600; margin-bottom: 6px;">🇺🇸 ${c.en}</div>
                <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
                  <span class="card-badge" style="background: #f1f5f9; color: #475569; font-size: 0.72rem;">${c.badge}</span>
                  <span class="card-badge" style="background: #f8fafc; color: #64748b; font-size: 0.72rem;">${c.material}</span>
                </div>
                <p class="currency-desc">${c.desc}</p>
              </div>
              <div class="currency-tip">
                <strong>💡 여행 팁:</strong> ${c.tip}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Bills Section -->
      <div style="margin-bottom: 28px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
          💴 일본 지폐 4종 도감 & 실전 팁 (1,000円 ~ 10,000円)
        </h3>
        <div class="currency-grid">
          ${currencyData.bills
            .map(
              (b) => `
            <div class="currency-card">
              <div>
                <div class="currency-header">
                  <div class="currency-value">
                    <span>${b.kanji}</span>
                    <span class="currency-reading">(${b.reading})</span>
                  </div>
                  <button class="audio-btn" data-audio="${b.audio}" title="발음 듣기">🔊</button>
                </div>
                <div style="font-size: 0.78rem; color: #2563eb; font-weight: 600; margin-bottom: 6px;">🇺🇸 ${b.en}</div>
                <div style="display: flex; gap: 6px; margin-bottom: 8px;">
                  <span class="card-badge" style="background: #fef2f2; color: #b91c1c; font-size: 0.72rem;">${b.badge}</span>
                </div>
                <div style="font-size: 0.76rem; color: #64748b; margin-bottom: 6px;">👤 도안 인물: ${b.portrait}</div>
                <p class="currency-desc">${b.desc}</p>
              </div>
              <div class="currency-tip">
                <strong>💡 여행 팁:</strong> ${b.tip}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Checkout Phrases Section -->
      <div style="margin-bottom: 28px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
          🏪 계산대에서 직원이 자주 쓰는 핵심 멘트 6선
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px;">
          ${checkoutPhrasesData
            .map(
              (p) => `
            <div style="background: #ffffff; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px; box-shadow: var(--shadow-sm);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                <span class="card-badge" style="background: #eff6ff; color: #1d4ed8; font-size: 0.72rem; font-weight: 700;">${p.situation}</span>
                <button class="audio-btn" data-audio="${p.audio}" title="발음 듣기">🔊</button>
              </div>
              <div style="font-size: 1.05rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 2px;">${p.jp}</div>
              <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 4px;">${p.hira}</div>
              <div style="font-size: 0.88rem; font-weight: 700; color: var(--color-primary); margin-bottom: 3px;">👉 ${p.pron}</div>
              <div style="font-size: 0.82rem; color: var(--color-text-muted); font-weight: 600;">${p.ko}</div>
              <div style="font-size: 0.76rem; color: #2563eb; font-weight: 500; margin-top: 2px;">🇺🇸 ${p.en}</div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Practical Travel Tips -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
        ${currencyData.travelTips
          .map(
            (t) => `
          <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: var(--radius-md); padding: 16px;">
            <div style="font-size: 0.92rem; font-weight: 800; color: #92400e; margin-bottom: 6px;">${t.title}</div>
            <p style="font-size: 0.84rem; color: #78350f; line-height: 1.55; margin: 0;">${t.desc}</p>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  } else if (state.numbersSubTab === 'chart') {
    subContentHtml = `
      <!-- Sound Changes Warning Clinic -->
      <div class="sound-clinic-card" style="border-left: 4px solid var(--color-primary);">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--color-primary); margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
          🚨 한국인이 가장 많이 틀리는 3대 숫자 변칙 발음 클리닉
        </h3>
        <p style="font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.55;">
          일본어 숫자는 특정 단위에서 발음이 부드러워지거나(탁음) 끊어지는(촉음) 음편(音便) 현상이 일어납니다.<br />
          아래의 <strong>300, 600, 800, 3,000, 8,000, 10,000</strong>만 확실히 잡으면 일본의 모든 숫자가 해결됩니다!
        </p>

        ${numberChartData.soundChanges
          .map(
            (sc) => `
          <div style="margin-top: 18px; padding-top: 14px; border-top: 1px dashed var(--color-border);">
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 4px;">
              📌 ${sc.type}
            </div>
            <div style="font-size: 0.78rem; color: #0284c7; font-weight: 600; margin-bottom: 10px;">${sc.memo}</div>
            <div class="sound-clinic-grid">
              ${sc.items
                .map(
                  (item) => `
                <div class="sound-item-box">
                  <div class="sound-item-left">
                    <div class="sound-item-num">${item.num} <span style="font-size: 0.95rem; color: var(--color-text-muted);">(${item.kanji})</span></div>
                    <div class="sound-item-pron">${item.pron} <span style="font-size: 0.8rem; color: #64748b;">(${item.hira})</span></div>
                    <div class="sound-item-rule">${item.rule}</div>
                    <div style="font-size: 0.72rem; color: #2563eb;">🇺🇸 ${item.en}</div>
                  </div>
                  <button class="audio-btn" data-audio="${item.audio}" title="발음 듣기">🔊</button>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
          )
          .join('')}
      </div>

      <!-- Basic 1 to 10 Numbers -->
      <div style="background: #ffffff; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-sm);">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
          🔢 기본 숫자 1부터 10까지 (一 ~ 十)
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
          ${numberChartData.basic1to10
            .map(
              (n) => `
            <div style="background: var(--color-surface-muted); border-radius: var(--radius-sm); padding: 12px; text-align: center;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 1.3rem; font-weight: 900; color: var(--color-text-main);">${n.num}</span>
                <button class="audio-btn" data-audio="${n.audio}" title="발음 듣기" style="width: 24px; height: 24px; font-size: 11px;">🔊</button>
              </div>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-primary);">${n.kanji}</div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #0f172a;">${n.pron}</div>
              <div style="font-size: 0.75rem; color: #64748b;">${n.hira}</div>
              ${n.note ? `<div style="font-size: 0.7rem; color: #d97706; font-weight: 600; margin-top: 2px;">${n.note}</div>` : ''}
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  } else if (state.numbersSubTab === 'counters') {
    subContentHtml = `
      <!-- Items Counter (하나 ~ 열 개) -->
      <div style="background: #ffffff; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-sm); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 4px;">
              📦 물건/음식 개수 세기 (ひとつ ~ とお)
            </h3>
            <p style="font-size: 0.84rem; color: var(--color-text-muted);">
              식당에서 메뉴를 가리키며 "이거 2개 주세요: 「これ、二つお願いします (코레, 후타츠 오네가이시마스)」" 할 때 필수입니다.
            </p>
          </div>
        </div>
        <div class="counters-grid">
          ${countersData.items
            .map(
              (item) => `
            <div class="counter-card">
              <div>
                <div style="font-size: 1.1rem; font-weight: 800; color: var(--color-text-main);">${item.name} <span style="color: var(--color-primary);">(${item.kanji})</span></div>
                <div style="font-size: 0.9rem; font-weight: 700; color: #0f172a;">${item.pron} <span style="font-size: 0.78rem; color: #64748b;">(${item.hira})</span></div>
                <div style="font-size: 0.74rem; color: #2563eb; margin-top: 2px;">🇺🇸 ${item.en}</div>
              </div>
              <button class="audio-btn" data-audio="${item.audio}" title="발음 듣기">🔊</button>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- People Counter (인원수) -->
      <div style="background: #ffffff; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-sm); margin-bottom: 24px;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 4px;">
          👥 식당 인원수 세기 (ひとり ~ ごにん)
        </h3>
        <p style="font-size: 0.84rem; color: var(--color-text-muted); margin-bottom: 14px;">
          식당 문을 열고 들어설 때 직원이 「何名様ですか？ (몇 분이세요?)」라고 물으면 손가락과 함께 아래와 같이 답하세요.
        </p>
        <div class="counters-grid">
          ${countersData.people
            .map(
              (p) => `
            <div class="counter-card" style="align-items: flex-start;">
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 1.1rem; font-weight: 800; color: var(--color-text-main);">${p.name} <span style="color: var(--color-primary);">(${p.kanji})</span></span>
                  <button class="audio-btn" data-audio="${p.audio}" title="발음 듣기">🔊</button>
                </div>
                <div style="font-size: 0.92rem; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${p.pron} <span style="font-size: 0.78rem; color: #64748b;">(${p.hira})</span></div>
                <div style="font-size: 0.76rem; color: #2563eb; margin-bottom: 6px;">🇺🇸 ${p.en}</div>
                <div style="font-size: 0.76rem; color: #0284c7; background: #f0f9ff; padding: 4px 8px; border-radius: 4px; font-weight: 600;">💡 ${p.tip}</div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Drinks Counter (음료/생맥주 잔) -->
      <div style="background: #ffffff; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-sm);">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 4px;">
          🍺 음료 & 생맥주 잔 세기 (いっぱい ~ よんはい)
        </h3>
        <p style="font-size: 0.84rem; color: var(--color-text-muted); margin-bottom: 14px;">
          이자카야에서 「とりあえず生ビール二杯お願いします (우선 생맥주 2잔 주세요!)」 처럼 잔 단위 주문 시 사용합니다.
        </p>
        <div class="counters-grid">
          ${countersData.drinks
            .map(
              (d) => `
            <div class="counter-card" style="align-items: flex-start;">
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 1.1rem; font-weight: 800; color: var(--color-text-main);">${d.name} <span style="color: var(--color-primary);">(${d.kanji})</span></span>
                  <button class="audio-btn" data-audio="${d.audio}" title="발음 듣기">🔊</button>
                </div>
                <div style="font-size: 0.92rem; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${d.pron} <span style="font-size: 0.78rem; color: #64748b;">(${d.hira})</span></div>
                <div style="font-size: 0.76rem; color: #2563eb; margin-bottom: 6px;">🇺🇸 ${d.en}</div>
                <div style="font-size: 0.76rem; color: #0284c7; background: #f0f9ff; padding: 4px 8px; border-radius: 4px; font-weight: 600;">💡 ${d.tip}</div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  } else if (state.numbersSubTab === 'calculator') {
    const converted = convertNumberToJapanese(state.calcInputNumber);
    const change5000 = Math.max(0, 5000 - state.calcInputNumber);
    const change10000 = Math.max(0, 10000 - state.calcInputNumber);
    const convChange5000 = convertNumberToJapanese(change5000);
    const convChange10000 = convertNumberToJapanese(change10000);

    subContentHtml = `
      <div class="calc-card">
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 4px;">
            🧮 실전 엔화 금액 변환기 & TTS 청해기
          </h3>
          <p style="font-size: 0.85rem; color: var(--color-text-muted);">
            숫자를 입력하거나 퀵 버튼을 누르면 일본어 한자/히라가나/한글 발음으로 변환되고, <strong>점원 멘트 음성</strong>으로 즉시 들려줍니다!
          </p>
        </div>

        <!-- Input & Clear Row -->
        <div class="calc-input-box">
          <input type="number" id="calc-input" class="calc-number-input" value="${state.calcInputNumber}" min="0" max="99999999" placeholder="엔화 금액 입력 (예: 3850)" />
          <button id="calc-btn-clear" class="calc-btn-clear">지우기 ⌫</button>
        </div>

        <!-- Quick Presets -->
        <div class="calc-presets-row">
          <span style="font-size: 0.78rem; color: #64748b; font-weight: 700; align-self: center;">여행 추천:</span>
          <button class="calc-preset-chip" data-val="150">150円 (자판기)</button>
          <button class="calc-preset-chip" data-val="298">298円 (삼각김밥/도시락)</button>
          <button class="calc-preset-chip" data-val="500">500円 (원코인 런치)</button>
          <button class="calc-preset-chip" data-val="980">980円 (라멘 한 그릇)</button>
          <button class="calc-preset-chip" data-val="1250">1,250円 (식당 정식)</button>
          <button class="calc-preset-chip" data-val="3850">3,850円 (이자카야 2인)</button>
          <button class="calc-preset-chip" data-val="8800">8,800円 (쇼핑/면세)</button>
          <button class="calc-preset-chip" data-val="10000">10,000円 (만엔 지폐)</button>
        </div>

        <!-- Step Increment Buttons -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px;">
          <span style="font-size: 0.78rem; color: #64748b; font-weight: 700; align-self: center;">빠른 추가:</span>
          <button class="calc-step-btn" data-step="100" style="padding: 4px 10px; font-size: 0.78rem; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; font-weight: 600;">+100円</button>
          <button class="calc-step-btn" data-step="500" style="padding: 4px 10px; font-size: 0.78rem; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; font-weight: 600;">+500円</button>
          <button class="calc-step-btn" data-step="1000" style="padding: 4px 10px; font-size: 0.78rem; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; font-weight: 600;">+1,000円</button>
          <button class="calc-step-btn" data-step="5000" style="padding: 4px 10px; font-size: 0.78rem; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; font-weight: 600;">+5,000円</button>
          <button class="calc-step-btn" data-step="10000" style="padding: 4px 10px; font-size: 0.78rem; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; font-weight: 600;">+10,000円</button>
        </div>

        <!-- Converter Result Display Box -->
        <div class="calc-display-box">
          <div class="calc-display-yen">${converted.formatted} 円</div>
          <div class="calc-display-kanji">${converted.kanjiYen}</div>
          <div class="calc-display-hira">${converted.hiraganaYen}</div>
          <div class="calc-display-pron">👉 ${converted.koreanYen}</div>
          <div class="calc-display-en">🇺🇸 ${converted.englishYen}</div>
        </div>

        <!-- Action Speech Buttons -->
        <div class="calc-actions-row">
          <button class="calc-speak-btn" id="calc-speak-clerk" data-audio="合計で${converted.kanji}円になります">
            <span>🔊</span> <span>점원 멘트: "합계 ${converted.formatted}엔입니다"</span>
          </button>
          <button class="calc-speak-btn secondary" id="calc-speak-single" data-audio="${converted.kanji}円">
            <span>🔊</span> <span>금액만 듣기: "${converted.koreanYen}"</span>
          </button>
        </div>

        <!-- Change Calculation Simulation -->
        ${state.calcInputNumber > 0 && state.calcInputNumber <= 10000 ? `
          <div style="margin-top: 10px;">
            <div style="font-size: 0.88rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 8px;">
              💴 지폐 지불 시 거스름돈(お釣り) 미리보기 시뮬레이션
            </div>
            <div class="change-sim-grid">
              ${state.calcInputNumber <= 5000 ? `
                <div class="change-sim-item">
                  <div class="change-sim-label">5,000円 지폐 지불 시 거스름돈:</div>
                  <div class="change-sim-val">${change5000.toLocaleString()} 円 <span style="font-size: 0.82rem; font-weight: 600; color: #64748b;">(${convChange5000.kanjiYen})</span></div>
                  <div class="change-sim-pron">👉 ${convChange5000.koreanYen}</div>
                </div>
              ` : ''}
              <div class="change-sim-item">
                <div class="change-sim-label">10,000円 지폐 지불 시 거스름돈:</div>
                <div class="change-sim-val">${change10000.toLocaleString()} 円 <span style="font-size: 0.82rem; font-weight: 600; color: #64748b;">(${convChange10000.kanjiYen})</span></div>
                <div class="change-sim-pron">👉 ${convChange10000.koreanYen}</div>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  } else if (state.numbersSubTab === 'quiz') {
    const totalNumQuestions = state.numQuizList.length;
    const numScore = state.numQuizList.reduce((acc, q, idx) => {
      return acc + (state.numQuizAnswers[idx] === q.answer ? 1 : 0);
    }, 0);

    if (state.numQuizFinished) {
      const percentage = Math.round((numScore / totalNumQuestions) * 100);
      let grade = '🥉 복습 추천';
      let msg = '숫자 변칙 발음과 계산대 멘트를 한 번 더 복습해보세요!';
      if (percentage === 100) {
        grade = '👑 엔화 청해 마스터';
        msg = '완벽합니다! 일본 현지 어떤 편의점이나 식당 계산대에서도 100% 프리패스할 수 있습니다!';
      } else if (percentage >= 80) {
        grade = '🥇 현지 계산대 우등생';
        msg = '훌륭합니다! 대부분의 실전 계산대 가격을 막힘없이 알아들을 수 있습니다!';
      } else if (percentage >= 60) {
        grade = '🥈 실전 여행 통과 레벨';
        msg = '좋습니다! 800엔/3,000엔 등 변칙 발음만 몇 개 더 주의하면 완벽합니다!';
      }

      subContentHtml = `
        <div class="num-quiz-card" style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 3.5rem; margin-bottom: 12px;">🎉</div>
          <h3 style="font-size: 1.5rem; font-weight: 900; color: var(--color-text-main); margin-bottom: 6px;">
            퀴즈 완료! ${grade}
          </h3>
          <p style="font-size: 0.95rem; color: var(--color-text-muted); margin-bottom: 20px;">
            ${msg}
          </p>
          <div style="background: #f8fafc; border: 2px solid var(--color-border); border-radius: var(--radius-md); padding: 20px; max-width: 360px; margin: 0 auto 24px auto;">
            <div style="font-size: 0.85rem; color: #64748b; font-weight: 600; margin-bottom: 4px;">최종 점수</div>
            <div style="font-size: 2.4rem; font-weight: 900; color: var(--color-primary);">${numScore} / ${totalNumQuestions}</div>
            <div style="font-size: 0.9rem; font-weight: 700; color: #0f172a;">정답률: ${percentage}%</div>
          </div>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button id="btn-num-quiz-restart" class="quiz-ctrl-btn" style="padding: 12px 24px; font-size: 0.95rem;">
              <span>🔄</span> <span>처음부터 다시 풀기</span>
            </button>
            <button id="btn-num-quiz-shuffle-restart" class="quiz-ctrl-btn" style="padding: 12px 24px; font-size: 0.95rem; background: #eff6ff; border-color: #93c5fd; color: #1d4ed8;">
              <span>🔀</span> <span>문제 셔플 후 다시 풀기</span>
            </button>
          </div>
        </div>
      `;
    } else {
      const q = state.numQuizList[state.numQuizIndex];
      const userAns = state.numQuizAnswers[state.numQuizIndex];
      const isAns = userAns !== undefined;
      const isListening = q.type === 'listening';
      const typeLabel = isListening ? '🎧 계산대 청해' : (q.type === 'sound_change' ? '🎯 변칙 발음' : '🍜 식당 인원/주문');

      subContentHtml = `
        <div class="num-quiz-card">
          <!-- Quiz Toolbar with Shuffle, Reset, and Progress -->
          <div class="quiz-toolbar">
            <div class="quiz-meta-left">
              <span class="num-quiz-type-badge">${typeLabel}</span>
              <span style="font-weight: 800; font-size: 0.92rem; color: var(--color-text-main);">
                문제 ${state.numQuizIndex + 1} / ${totalNumQuestions}
              </span>
            </div>
            <div class="quiz-toolbar-actions">
              <button class="quiz-ctrl-btn" id="btn-num-quiz-shuffle" title="문제 무작위 셔플">
                <span>🔀</span> <span>셔플</span>
              </button>
              <button class="quiz-ctrl-btn" id="btn-num-quiz-reset" title="처음부터 다시 풀기">
                <span>🔄</span> <span>초기화</span>
              </button>
            </div>
          </div>

          <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 16px; line-height: 1.45;">
            ${q.title}
          </h3>

          ${isListening ? `
            <div class="num-quiz-listen-box">
              <button class="num-big-listen-btn" id="num-quiz-listen-btn" data-audio="${q.audio}">
                <span>🔊</span> <span>점원 목소리 듣기 (탭하여 재생)</span>
              </button>
              <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 10px;">
                귀로만 듣고 아래 보기에서 올바른 금액을 선택하세요!
              </div>
            </div>
          ` : `
            <div style="margin-bottom: 16px; text-align: center;">
              <button class="audio-btn" data-audio="${q.audio}" title="음성 듣기" style="width: 44px; height: 44px; font-size: 20px;">🔊</button>
            </div>
          `}

          <!-- Options -->
          <div class="num-quiz-options">
            ${q.options
              .map((opt, oIdx) => {
                let stateClass = '';
                if (isAns) {
                  if (oIdx === q.answer) {
                    stateClass = 'correct';
                  } else if (oIdx === userAns) {
                    stateClass = 'incorrect';
                  }
                }
                return `
                  <button class="num-quiz-opt-btn ${stateClass}" data-oidx="${oIdx}" ${isAns ? 'disabled' : ''}>
                    <span>${oIdx + 1}. ${opt}</span>
                    ${isAns && oIdx === q.answer ? '<span>✅</span>' : ''}
                    ${isAns && oIdx !== q.answer && oIdx === userAns ? '<span>❌</span>' : ''}
                  </button>
                `;
              })
              .join('')}
          </div>

          <!-- Feedback & Explanation (revealed upon answering) -->
          ${isAns ? `
            <div class="num-quiz-feedback-box">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 1rem; font-weight: 800; color: ${userAns === q.answer ? '#059669' : '#dc2626'};">
                  ${userAns === q.answer ? '✅ 정답입니다!' : '❌ 아쉽습니다! 오답입니다.'}
                </span>
                <button class="audio-btn" data-audio="${q.audio}" title="음성 다시 듣기">🔊 다시 듣기</button>
              </div>
              <div style="font-size: 0.95rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 2px;">
                🇯🇵 ${q.scriptJp}
              </div>
              <div style="font-size: 0.85rem; color: var(--color-primary); font-weight: 600; margin-bottom: 6px;">
                👉 ${q.scriptPron} (${q.scriptKo})
              </div>
              <div style="font-size: 0.82rem; color: #475569; line-height: 1.5; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
                💡 ${q.explanation}
              </div>
            </div>
          ` : ''}

          <!-- Bottom Navigation Buttons (이전 문제 / 다음 문제) -->
          <div class="quiz-nav-row">
            <button class="quiz-nav-btn prev" id="btn-num-quiz-prev" ${state.numQuizIndex === 0 ? 'disabled' : ''}>
              <span>⬅️</span> <span>이전 문제</span>
            </button>
            ${
              isAns
                ? `
              <button class="quiz-nav-btn next" id="btn-num-quiz-next">
                <span>${state.numQuizIndex + 1 < totalNumQuestions ? '다음 문제 ➡️' : '결과 확인하기 🏁'}</span>
              </button>
            `
                : `
              <button class="quiz-nav-btn next" style="background: #94a3b8; border-color: #94a3b8; cursor: not-allowed;" disabled>
                <span>정답을 선택하세요</span>
              </button>
            `
            }
          </div>
        </div>
      `;
    }
  }

  let html = `
    <!-- Master Header -->
    <div class="content-card">
      <div class="card-header" style="margin-bottom: 8px;">
        <h2 class="card-title">🔢 숫자 & 엔화 마스터 (화폐·변칙발음·계산대 청해)</h2>
        <span class="card-badge" style="background: #eff6ff; color: #1d4ed8; font-weight: 700;">실전 청해 & 퀴즈 완비</span>
      </div>
      <p style="font-size: 0.88rem; color: var(--color-text-muted); line-height: 1.55;">
        동전 6종과 지폐 4종 도감, <strong>300·600·800·3,000·8,000 변칙 발음 클리닉</strong>, 식당 개수/인원수 세기,
        실시간 금액 변환기 및 <strong>점원 계산대 청해 퀴즈</strong>까지 완벽하게 마스터하세요!
      </p>
    </div>

    <!-- Sub-tab Navigation Bar -->
    <div class="num-subtab-bar">
      ${subTabs
        .map(
          (t) => `
        <button class="num-subtab-btn ${state.numbersSubTab === t.id ? 'active' : ''}" data-sub="${t.id}">
          ${t.label}
        </button>
      `
        )
        .join('')}
    </div>

    <!-- Sub-tab Content Area -->
    <div id="numbers-sub-content">
      ${subContentHtml}
    </div>
  `;

  container.innerHTML = html;

  // Event Listeners:
  // Sub-tab switching
  container.querySelectorAll('.num-subtab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sub = btn.getAttribute('data-sub');
      if (sub && sub !== state.numbersSubTab) {
        state.numbersSubTab = sub;
        updateUrlHash('numbers', { sub: state.numbersSubTab });
        renderNumbers(container);
      }
    });
  });

  // Audio Buttons
  container.querySelectorAll('.audio-btn, #num-quiz-listen-btn, #calc-speak-clerk, #calc-speak-single').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-audio');
      if (text) {
        speakJapanese(text, state.audioSpeed);
        showToast('🔊 재생 중...');
      }
    });
  });

  // Calculator Sub-tab Events
  if (state.numbersSubTab === 'calculator') {
    const calcInput = container.querySelector('#calc-input');
    if (calcInput) {
      calcInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        state.calcInputNumber = isNaN(val) ? 0 : val;
        renderNumbers(container);
        const updatedInput = container.querySelector('#calc-input');
        if (updatedInput) {
          updatedInput.focus();
        }
      });
    }

    const clearBtn = container.querySelector('#calc-btn-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.calcInputNumber = 0;
        renderNumbers(container);
      });
    }

    container.querySelectorAll('.calc-preset-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const val = parseInt(chip.getAttribute('data-val'), 10);
        state.calcInputNumber = val;
        renderNumbers(container);
      });
    });

    container.querySelectorAll('.calc-step-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.getAttribute('data-step'), 10);
        state.calcInputNumber = (state.calcInputNumber || 0) + step;
        renderNumbers(container);
      });
    });
  }

  // Quiz Sub-tab Events
  if (state.numbersSubTab === 'quiz') {
    if (!state.numQuizFinished) {
      container.querySelectorAll('.num-quiz-opt-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (state.numQuizAnswers[state.numQuizIndex] !== undefined) return;
          const oIdx = parseInt(btn.getAttribute('data-oidx'), 10);
          state.numQuizAnswers[state.numQuizIndex] = oIdx;
          const q = state.numQuizList[state.numQuizIndex];
          if (oIdx === q.answer) {
            showToast('🎉 정답입니다!');
          } else {
            showToast('아쉽습니다! 정답 해설을 확인하세요.');
          }
          renderNumbers(container);
        });
      });

      const prevBtn = container.querySelector('#btn-num-quiz-prev');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (state.numQuizIndex > 0) {
            state.numQuizIndex--;
            renderNumbers(container);
          }
        });
      }

      const nextBtn = container.querySelector('#btn-num-quiz-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (state.numQuizIndex + 1 < state.numQuizList.length) {
            state.numQuizIndex++;
            renderNumbers(container);
          } else {
            state.numQuizFinished = true;
            renderNumbers(container);
          }
        });
      }

      const shuffleBtn = container.querySelector('#btn-num-quiz-shuffle');
      if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
          state.numQuizList = shuffleArray(numberQuizPool);
          state.numQuizIndex = 0;
          state.numQuizAnswers = {};
          state.numQuizFinished = false;
          showToast('🔀 문제 순서가 무작위로 섞였습니다!');
          renderNumbers(container);
        });
      }

      const resetBtn = container.querySelector('#btn-num-quiz-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          state.numQuizIndex = 0;
          state.numQuizAnswers = {};
          state.numQuizFinished = false;
          showToast('퀴즈가 처음부터 초기화되었습니다.');
          renderNumbers(container);
        });
      }
    } else {
      const restartBtn = container.querySelector('#btn-num-quiz-restart');
      if (restartBtn) {
        restartBtn.addEventListener('click', () => {
          state.numQuizIndex = 0;
          state.numQuizAnswers = {};
          state.numQuizFinished = false;
          renderNumbers(container);
        });
      }

      const shuffleRestartBtn = container.querySelector('#btn-num-quiz-shuffle-restart');
      if (shuffleRestartBtn) {
        shuffleRestartBtn.addEventListener('click', () => {
          state.numQuizList = shuffleArray(numberQuizPool);
          state.numQuizIndex = 0;
          state.numQuizAnswers = {};
          state.numQuizFinished = false;
          showToast('🔀 문제가 무작위로 셔플되었습니다!');
          renderNumbers(container);
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Cheat Sheet Tab
// ---------------------------------------------------------------------------
function renderCheatsheet(container) {
  let html = `
    <!-- Magic Words -->
    <div class="content-card">
      <div class="card-header">
        <h2 class="card-title">⭐️ 왕초보 3대 마법 단어 (0.5초 반응)</h2>
        <span class="card-badge">생존 1순위</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 16px;">
        복잡한 문장보다 아래 3단어가 훨씬 강력합니다. 소리 아이콘을 눌러 억양을 입에 익히세요!
      </p>
      <div class="magic-grid">
        ${cheatsheetData.magicWords
          .map(
            (w) => `
          <div class="magic-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <span class="magic-jp">${w.jp}</span>
                <button class="audio-btn" data-audio="${w.audio}" title="발음 듣기">🔊</button>
              </div>
              <div class="magic-pronounce">${w.pronounce}</div>
              <div class="magic-ko">${w.ko}</div>
              ${w.en ? `<div style="font-size: 0.8rem; font-weight: 600; color: #2563eb; margin-top: 2px;">🇺🇸 ${w.en}</div>` : ''}
            </div>
            <div class="magic-tip">💡 ${w.tip}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <!-- 5 Formulas -->
    <div class="content-card">
      <div class="card-header">
        <h2 class="card-title">🔑 5대 만능 조립 공식</h2>
        <span class="card-badge">패턴 회화</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 16px;">
        단어만 쏙 갈아 끼우면 요청, 질문, 계산이 끝납니다.
      </p>
      ${cheatsheetData.formulas
        .map(
          (f) => `
        <div class="formula-block">
          <div class="formula-header">
            <span class="formula-pattern">${f.pattern}</span>
            <div style="text-align: right;">
              <div class="formula-meaning">${f.meaning}</div>
              ${f.meaningEn ? `<div style="font-size: 0.78rem; font-weight: 600; color: #2563eb;">🇺🇸 ${f.meaningEn}</div>` : ''}
            </div>
          </div>
          <ul class="formula-examples">
            ${f.examples
              .map(
                (ex) => `
              <li class="formula-ex-item">
                <div class="formula-ex-text">
                  <span class="formula-ex-jp">${ex.jp}</span>
                  <span class="formula-ex-sub">${ex.pronounce} • ${ex.ko} ${ex.en ? `<span style="color: #2563eb; font-weight: 600;">• 🇺🇸 ${ex.en}</span>` : ''}</span>
                </div>
                <button class="audio-btn" data-audio="${ex.jp}">🔊</button>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      `
        )
        .join('')}
    </div>

    <!-- Currency & Numbers -->
    <div class="content-card">
      <div class="card-header">
        <h2 class="card-title">💴 엔화 & 가격 즉각 듣기</h2>
        <span class="card-badge">터치하여 발음 확인</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 14px;">
        계산대 직원이 부르는 금액을 귀로 바로 알아들을 수 있도록 소리를 들어보세요!
      </p>
      <div class="money-grid">
        ${cheatsheetData.money
          .map(
            (m) => `
          <div class="money-btn" data-audio="${m.jp}">
            <span class="amt">${m.amount.toLocaleString()}엔</span>
            <span class="pron">${m.pronounce}</span>
            <span class="krw">${m.krw}</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <!-- Situations Quick Guide -->
    <div class="content-card">
      <div class="card-header">
        <h2 class="card-title">🎯 현지 상황별 질문 & 답변 대응</h2>
      </div>
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${cheatsheetData.situations
          .map(
            (s) => `
          <div style="border: 1px solid var(--color-border); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
              <span>${s.title}</span>
              <span class="card-badge">${s.badge}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${s.items
                .map(
                  (item) => `
                <div style="background: var(--color-surface-muted); padding: 10px 12px; border-radius: 8px; font-size: 0.85rem;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                    <div>
                      <div style="color: var(--color-accent); font-weight: 700; margin-bottom: 2px;">${item.q}</div>
                      ${item.q_en ? `<div style="color: #2563eb; font-size: 0.76rem; font-weight: 500; margin-bottom: 3px;">🇺🇸 ${item.q_en}</div>` : ''}
                    </div>
                    ${item.audio_q ? `<button class="audio-btn" data-audio="${item.audio_q}" title="질문 발음 듣기" style="width: 26px; height: 26px; font-size: 11px; flex-shrink: 0;">🔊</button>` : ''}
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1;">
                    <div>
                      <div style="color: var(--color-primary); font-weight: 700;">👉 ${item.a}</div>
                      ${item.a_en ? `<div style="color: #1d4ed8; font-size: 0.76rem; font-weight: 600; margin-top: 2px;">🇺🇸 ${item.a_en}</div>` : ''}
                    </div>
                    ${item.audio_a ? `<button class="audio-btn" data-audio="${item.audio_a}" title="답변 발음 듣기" style="width: 26px; height: 26px; font-size: 11px; flex-shrink: 0;">🔊</button>` : ''}
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;

  container.innerHTML = html;

  container.querySelectorAll('.audio-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
    });
  });

  container.querySelectorAll('.money-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
    });
  });
}

// ---------------------------------------------------------------------------
// Utility: Array Shuffler
// ---------------------------------------------------------------------------
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// 4. Flashcards & Vocabulary Master Tab (단어장, 풀스크린 뷰, 퀴즈 프로그램)
// ---------------------------------------------------------------------------

function getFilteredFlashcards() {
  let list = phrasesData;
  if (state.flashcardCategory !== 'all') {
    list = list.filter((p) => p.category === state.flashcardCategory);
  }
  if (state.flashcardOnlyUnmastered) {
    list = list.filter((p) => !state.masteredPhrases.has(p.id));
  }
  if (state.flashcardIsShuffled) {
    if (!state.flashcardShuffledList || state.flashcardShuffledList.length === 0) {
      state.flashcardShuffledList = shuffleArray(phrasesData);
    }
    const idSet = new Set(list.map((p) => p.id));
    return state.flashcardShuffledList.filter((p) => idSet.has(p.id));
  }
  return list;
}

function generateFlashcardQuiz(count = 10, category = 'all') {
  let pool = phrasesData;
  if (category !== 'all') {
    const catPool = phrasesData.filter((p) => p.category === category);
    if (catPool.length >= 4) pool = catPool;
  }
  const selected = shuffleArray(pool).slice(0, count);
  const allPhrases = phrasesData;

  return selected.map((target, qIdx) => {
    const types = ['jp_to_ko', 'ko_to_jp', 'listening'];
    const qType = types[qIdx % types.length];

    let questionTitle = '';
    let promptMain = '';
    let promptSub = '';
    let promptAudio = target.audio;
    let correctAnswer = '';
    let distractors = [];

    if (qType === 'jp_to_ko') {
      questionTitle = '다음 일본어의 올바른 한국어 뜻은?';
      promptMain = target.jp;
      promptSub = `${target.furigana} • ${target.pronounce}`;
      correctAnswer = target.ko;
      const otherKos = allPhrases.filter((p) => p.ko !== target.ko).map((p) => p.ko);
      distractors = shuffleArray([...new Set(otherKos)]).slice(0, 3);
    } else if (qType === 'ko_to_jp') {
      questionTitle = '다음 한국어 뜻에 해당하는 일본어 표현은?';
      promptMain = target.ko;
      promptSub = target.note ? `💡 ${target.note}` : (target.en ? `🇺🇸 ${target.en}` : '');
      promptAudio = null;
      correctAnswer = `${target.jp} (${target.pronounce})`;
      const otherJps = allPhrases.filter((p) => p.id !== target.id).map((p) => `${p.jp} (${p.pronounce})`);
      distractors = shuffleArray([...new Set(otherJps)]).slice(0, 3);
    } else {
      questionTitle = '🔊 발음을 듣고 어떤 의미인지 맞혀보세요!';
      promptMain = '🎧 원어민 발음 청해';
      promptSub = '위 스피커 버튼을 눌러 발음을 듣고 올바른 단어를 고르세요.';
      correctAnswer = `${target.ko} [${target.jp}]`;
      const otherPairs = allPhrases.filter((p) => p.id !== target.id).map((p) => `${p.ko} [${p.jp}]`);
      distractors = shuffleArray([...new Set(otherPairs)]).slice(0, 3);
    }

    const options = shuffleArray([correctAnswer, ...distractors]);
    const answerIndex = options.indexOf(correctAnswer);

    return {
      id: target.id,
      qType,
      target,
      questionTitle,
      promptMain,
      promptSub,
      promptAudio,
      options,
      answerIndex,
    };
  });
}

function renderFlashcards(container) {
  if (state.flashcardViewMode === 'quiz') {
    renderFlashcardQuiz(container);
    return;
  }

  const filteredPhrases = getFilteredFlashcards();
  const totalCount = phrasesData.length;
  const masteredCount = phrasesData.filter((p) => state.masteredPhrases.has(p.id)).length;
  const unmasteredCount = totalCount - masteredCount;

  let html = `
    <div class="content-card" style="margin-bottom: 14px;">
      <div class="card-header" style="margin-bottom: 8px;">
        <h2 class="card-title">🗂️ 상황별 실전 암기장</h2>
        <span class="card-badge">외운 카드: ${masteredCount} / ${totalCount}</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--color-text-muted);">
        카드를 클릭하면 <strong>1장씩 풀스크린으로 크게 넘겨보며</strong> 암기할 수 있습니다. 셔플 및 단어 퀴즈도 제공됩니다.
      </p>
    </div>

    <!-- Filter Categories -->
    <div class="filter-tabs">
      <button class="filter-btn ${state.flashcardCategory === 'all' ? 'active' : ''}" data-cat="all">전체 (${phrasesData.length})</button>
      <button class="filter-btn ${state.flashcardCategory === 'immigration' ? 'active' : ''}" data-cat="immigration">✈️ 입출국 & 세관</button>
      <button class="filter-btn ${state.flashcardCategory === 'transit' ? 'active' : ''}" data-cat="transit">🛫 공항 & 교통</button>
      <button class="filter-btn ${state.flashcardCategory === 'hotel' ? 'active' : ''}" data-cat="hotel">🏨 호텔 & 숙소</button>
      <button class="filter-btn ${state.flashcardCategory === 'food' ? 'active' : ''}" data-cat="food">🍜 식당 & 맛집</button>
      <button class="filter-btn ${state.flashcardCategory === 'shopping' ? 'active' : ''}" data-cat="shopping">🛍️ 쇼핑 & 편의점</button>
      <button class="filter-btn ${state.flashcardCategory === 'emergency' ? 'active' : ''}" data-cat="emergency">🚨 응급 & 긴급</button>
    </div>

    <!-- Study Toolbar -->
    <div class="fc-toolbar">
      <div class="fc-toolbar-top">
        <div class="fc-mode-toggle-group">
          <button class="fc-mode-pill ${state.flashcardViewMode === 'grid' ? 'active' : ''}" data-mode="grid">
            🗂️ 카드 목록 (${filteredPhrases.length}개)
          </button>
          <button class="fc-mode-pill ${state.flashcardViewMode === 'quiz' ? 'active' : ''}" data-mode="quiz">
            ✍️ 단어 퀴즈 풀기
          </button>
        </div>

        <div class="fc-actions-row">
          <button class="fc-action-btn primary" id="btn-open-fc-fullscreen">
            <span>📱</span> <strong>1장씩 크게 외우기</strong>
          </button>
          <button class="fc-action-btn ${state.flashcardIsShuffled ? 'active' : ''}" id="btn-fc-shuffle">
            <span>🔀</span> <span>${state.flashcardIsShuffled ? '셔플 해제 (원래 순서)' : '랜덤 셔플'}</span>
          </button>
          <button class="fc-action-btn ${state.flashcardOnlyUnmastered ? 'active' : ''}" id="btn-fc-unmastered">
            <span>${state.flashcardOnlyUnmastered ? '✅ 전체 카드 보기' : '⬜ 외울 카드만 보기 (' + unmasteredCount + '개 남음)'}</span>
          </button>
          <button class="fc-action-btn ${state.flashcardRevealReverse ? 'active' : ''}" id="btn-fc-reverse">
            <span>🔄</span> <span>${state.flashcardRevealReverse ? '🇯🇵 일본어 앞면' : '🇰🇷 뜻 앞면'}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="cards-container">
      ${
        filteredPhrases.length === 0
          ? `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: #ffffff; border-radius: var(--radius-md); border: 1px dashed var(--color-border);">
          <div style="font-size: 32px; margin-bottom: 8px;">🎉</div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 6px;">현재 조건에 해당하는 카드가 없습니다!</div>
          <div style="font-size: 0.84rem; color: var(--color-text-muted); margin-bottom: 16px;">모든 단어를 외웠거나 필터를 변경해 보세요.</div>
          <button class="speed-toggle-btn" id="btn-reset-fc-filter">전체 카드 보기</button>
        </div>
      `
          : filteredPhrases
              .map((p, index) => {
                const isMastered = state.masteredPhrases.has(p.id);
                return `
          <div class="flashcard ${isMastered ? 'is-mastered' : ''}" id="card-${p.id}" data-fc-idx="${index}">
            <div class="flashcard-header">
              <span class="flashcard-category">${p.categoryName} • ${p.tag}</span>
              <button class="audio-btn" data-audio="${p.audio}">🔊</button>
            </div>
            <div class="flashcard-main">
              ${
                state.flashcardRevealReverse
                  ? `
                <div class="flashcard-ko" style="font-size: 1.15rem; font-weight: 800; color: var(--color-accent); margin-bottom: 4px;">${p.ko}</div>
                ${p.en ? `<div class="flashcard-en">🇺🇸 ${p.en}</div>` : ''}
                <div class="flashcard-note" style="margin-top: 6px;">💡 ${p.note}</div>
              `
                  : `
                <div class="flashcard-jp">${p.jp}</div>
                <div class="flashcard-furigana">${p.furigana}</div>
                <div class="flashcard-pronounce">${p.pronounce}</div>
                <div class="flashcard-ko">${p.ko}</div>
                ${p.en ? `<div class="flashcard-en">🇺🇸 ${p.en}</div>` : ''}
                <div class="flashcard-note">💡 ${p.note}</div>
              `
              }
            </div>
            <div class="flashcard-click-hint">
              <span>🔍</span> <span>터치하여 1장씩 풀스크린 암기</span>
            </div>
            <div class="flashcard-footer" style="margin-top: 10px;">
              <span style="font-size: 0.72rem; color: var(--color-text-subtle);">${isMastered ? '암기 완료' : '학습 중'}</span>
              <button class="mastered-btn ${isMastered ? 'active' : ''}" data-id="${p.id}">
                ${isMastered ? '외웠어요 🌟' : '외우기 체크 ⬜'}
              </button>
            </div>
          </div>
        `;
              })
              .join('')
      }
    </div>
  `;

  container.innerHTML = html;

  // Mode Toggle
  container.querySelectorAll('.fc-mode-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      state.flashcardViewMode = mode;
      if (mode === 'quiz') {
        state.fcQuizQuestions = generateFlashcardQuiz(10, state.flashcardCategory);
        state.fcQuizIndex = 0;
        state.fcQuizAnswers = {};
        state.fcQuizFinished = false;
      }
      updateUrlHash('flashcards', { mode: state.flashcardViewMode });
      renderFlashcards(container);
    });
  });

  // Action Buttons
  document.getElementById('btn-open-fc-fullscreen')?.addEventListener('click', () => {
    openFlashcardModal(0);
  });

  document.getElementById('btn-fc-shuffle')?.addEventListener('click', () => {
    state.flashcardIsShuffled = !state.flashcardIsShuffled;
    if (state.flashcardIsShuffled) {
      state.flashcardShuffledList = shuffleArray(phrasesData);
      showToast('🔀 단어 카드 순서를 랜덤하게 섞었습니다!');
    } else {
      state.flashcardShuffledList = null;
      showToast('🔄 원래 순서로 정렬했습니다.');
    }
    renderFlashcards(container);
  });

  document.getElementById('btn-fc-unmastered')?.addEventListener('click', () => {
    state.flashcardOnlyUnmastered = !state.flashcardOnlyUnmastered;
    showToast(state.flashcardOnlyUnmastered ? '⬜ 미완료 단어만 표시합니다.' : '✅ 모든 단어를 표시합니다.');
    renderFlashcards(container);
  });

  document.getElementById('btn-fc-reverse')?.addEventListener('click', () => {
    state.flashcardRevealReverse = !state.flashcardRevealReverse;
    showToast(state.flashcardRevealReverse ? '🇰🇷 한국어 뜻 먼저 보기 모드' : '🇯🇵 일본어 앞면 모드');
    renderFlashcards(container);
  });

  document.getElementById('btn-reset-fc-filter')?.addEventListener('click', () => {
    state.flashcardOnlyUnmastered = false;
    state.flashcardCategory = 'all';
    renderFlashcards(container);
  });

  // Category filter
  container.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.flashcardCategory = btn.getAttribute('data-cat');
      renderFlashcards(container);
    });
  });

  // Mastered button toggle
  container.querySelectorAll('.mastered-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const updated = storage.toggleMasteredPhrase(id);
      state.masteredPhrases = new Set(updated);
      renderFlashcards(container);
    });
  });

  // Audio button click
  container.querySelectorAll('.audio-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
    });
  });

  // Card click -> Open Fullscreen Modal
  container.querySelectorAll('.flashcard').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.audio-btn') || e.target.closest('.mastered-btn')) return;
      const idx = parseInt(card.getAttribute('data-fc-idx'), 10);
      openFlashcardModal(idx);
    });
  });
}

function renderFlashcardQuiz(container) {
  if (!state.fcQuizQuestions || state.fcQuizQuestions.length === 0) {
    state.fcQuizQuestions = generateFlashcardQuiz(10, state.flashcardCategory);
    state.fcQuizIndex = 0;
    state.fcQuizAnswers = {};
    state.fcQuizFinished = false;
  }

  const totalQ = state.fcQuizQuestions.length;
  const correctCount = state.fcQuizQuestions.reduce((acc, q, idx) => {
    return acc + (state.fcQuizAnswers[idx] === q.answerIndex ? 1 : 0);
  }, 0);

  if (state.fcQuizFinished) {
    const percentage = Math.round((correctCount / totalQ) * 100);
    const html = `
      <div class="fc-quiz-container">
        <!-- Result Card -->
        <div class="fc-quiz-result-card">
          <div style="font-size: 48px; margin-bottom: 12px;">
            ${percentage >= 90 ? '🏆' : percentage >= 70 ? '🌟' : '💪'}
          </div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 6px;">
            단어장 퀴즈 완료!
          </h2>
          <div style="font-size: 1.85rem; font-weight: 800; color: var(--color-primary); margin-bottom: 8px;">
            ${correctCount} / ${totalQ} <span style="font-size: 1.15rem; color: var(--color-text-muted);">(${percentage}점)</span>
          </div>
          <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 24px;">
            ${
              percentage === 100
                ? '대단해요! 출제된 단어를 100% 완벽하게 마스터하셨습니다.'
                : percentage >= 70
                ? '멋집니다! 여행 현장에서 바로바로 소통하실 수 있습니다.'
                : '틀린 단어들을 다시 한 번 복습하고 재도전해보세요!'
            }
          </p>

          <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
            <button class="quiz-next-btn" id="btn-fc-quiz-new" style="max-width: 200px;">
              🔀 새로운 10문제 도전
            </button>
            <button class="speed-toggle-btn" id="btn-fc-quiz-retry" style="padding: 10px 18px; font-size: 0.88rem;">
              🔄 이번 문제 다시 풀기
            </button>
            <button class="speed-toggle-btn" id="btn-fc-quiz-back" style="padding: 10px 18px; font-size: 0.88rem;">
              🗂️ 단어장으로 돌아가기
            </button>
          </div>
        </div>

        <!-- Question Review List -->
        <div class="content-card">
          <div class="card-header" style="margin-bottom: 14px;">
            <h3 class="card-title">📝 전체 문제 오답노트 & 정답 확인</h3>
            <span class="card-badge">${correctCount} / ${totalQ} 정답</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${state.fcQuizQuestions
              .map((q, idx) => {
                const userAns = state.fcQuizAnswers[idx];
                const isCorrect = userAns === q.answerIndex;
                return `
                <div style="padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid ${isCorrect ? '#a7f3d0' : '#fecdd3'}; background: ${isCorrect ? '#f0fdf4' : '#fff1f2'};">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 0.78rem; font-weight: 700; color: ${isCorrect ? '#059669' : '#e11d48'};">
                      문제 ${idx + 1}. ${isCorrect ? '✓ 정답' : '✕ 오답'}
                    </span>
                    <button class="audio-btn" data-audio="${q.target.audio}" style="width: 26px; height: 26px; font-size: 11px;">🔊</button>
                  </div>
                  <div style="font-family: var(--font-jp); font-weight: 700; font-size: 1.05rem; margin-bottom: 2px;">${q.target.jp} (${q.target.pronounce})</div>
                  <div style="font-size: 0.82rem; color: var(--color-text-main); margin-bottom: 2px;">뜻: <strong>${q.target.ko}</strong></div>
                  ${!isCorrect ? `<div style="font-size: 0.76rem; color: #991b1b;">내가 고른 답: ${userAns !== undefined ? q.options[userAns] : '미선택'}</div>` : ''}
                </div>
              `;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    document.getElementById('btn-fc-quiz-new')?.addEventListener('click', () => {
      state.fcQuizQuestions = generateFlashcardQuiz(10, state.flashcardCategory);
      state.fcQuizIndex = 0;
      state.fcQuizAnswers = {};
      state.fcQuizFinished = false;
      renderFlashcards(container);
    });

    document.getElementById('btn-fc-quiz-retry')?.addEventListener('click', () => {
      state.fcQuizIndex = 0;
      state.fcQuizAnswers = {};
      state.fcQuizFinished = false;
      renderFlashcards(container);
    });

    document.getElementById('btn-fc-quiz-back')?.addEventListener('click', () => {
      state.flashcardViewMode = 'grid';
      updateUrlHash('flashcards', { mode: 'grid' });
      renderFlashcards(container);
    });

    container.querySelectorAll('.audio-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.getAttribute('data-audio');
        if (text) speakJapanese(text, state.audioSpeed);
      });
    });

    return;
  }

  // Active Quiz View
  const currentQ = state.fcQuizQuestions[state.fcQuizIndex];
  const chosenOpt = state.fcQuizAnswers[state.fcQuizIndex];
  const isAnswered = chosenOpt !== undefined;
  const progressPercent = Math.round(((state.fcQuizIndex + 1) / totalQ) * 100);

  const typeLabel =
    currentQ.qType === 'jp_to_ko'
      ? '🇯🇵 일본어 ➔ 🇰🇷 한국어 뜻'
      : currentQ.qType === 'ko_to_jp'
      ? '🇰🇷 한국어 뜻 ➔ 🇯🇵 일본어 표현'
      : '🎧 원어민 발음 청해 퀴즈';

  const html = `
    <div class="fc-quiz-container">
      <!-- Quiz Header Card -->
      <div class="fc-quiz-header-card">
        <div class="fc-quiz-header-top">
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="speed-toggle-btn" id="btn-fc-quiz-to-grid">
              ⬅️ 단어 목록
            </button>
            <span class="fc-quiz-counter">문제 ${state.fcQuizIndex + 1} / ${totalQ}</span>
          </div>
          <span class="fc-quiz-score-badge">현재 정답: ${correctCount}개</span>
        </div>
        <div class="fc-quiz-progress-track">
          <div class="fc-quiz-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
      </div>

      <!-- Question Card -->
      <div class="fc-quiz-question-card">
        <span class="fc-quiz-type-tag">${typeLabel}</span>
        <div class="fc-quiz-title">${currentQ.questionTitle}</div>

        <div class="fc-quiz-prompt-main">${currentQ.promptMain}</div>
        ${currentQ.promptSub ? `<div class="fc-quiz-prompt-sub">${currentQ.promptSub}</div>` : ''}

        ${
          currentQ.promptAudio
            ? `
          <div style="margin: 12px 0 16px;">
            <button class="fc-modal-speaker-btn" id="btn-fc-quiz-audio" style="margin: 0 auto;">
              <span>🔊</span> <span>발음 다시 듣기</span>
            </button>
          </div>
        `
            : ''
        }

        <!-- 4 Multiple Choice Options -->
        <div class="fc-quiz-options-list">
          ${currentQ.options
            .map((opt, optIdx) => {
              let optClass = 'fc-quiz-option-btn';
              if (isAnswered) {
                if (optIdx === currentQ.answerIndex) {
                  optClass += ' correct';
                } else if (optIdx === chosenOpt) {
                  optClass += ' incorrect';
                }
              }
              return `
              <button class="${optClass}" data-opt-idx="${optIdx}" ${isAnswered ? 'disabled' : ''}>
                <span>${opt}</span>
                ${
                  isAnswered && optIdx === currentQ.answerIndex
                    ? '<span>✓ 정답</span>'
                    : isAnswered && optIdx === chosenOpt
                    ? '<span>✕ 오답</span>'
                    : ''
                }
              </button>
            `;
            })
            .join('')}
        </div>

        <!-- Explanation Feedback Box -->
        ${
          isAnswered
            ? `
          <div class="fc-quiz-feedback-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="color: ${chosenOpt === currentQ.answerIndex ? '#059669' : '#e11d48'}; font-size: 0.95rem;">
                ${chosenOpt === currentQ.answerIndex ? '🎉 정답입니다!' : '⚠️ 틀렸습니다! 정답을 확인하세요.'}
              </strong>
              <button class="audio-btn" data-audio="${currentQ.target.audio}">🔊</button>
            </div>
            <div style="font-family: var(--font-jp); font-weight: 700; font-size: 1.1rem; color: var(--color-text-main); margin-bottom: 3px;">
              ${currentQ.target.jp} (${currentQ.target.furigana})
            </div>
            <div style="font-size: 0.86rem; color: var(--color-primary); font-weight: 600; margin-bottom: 2px;">
              발음: ${currentQ.target.pronounce}
            </div>
            <div style="font-size: 0.88rem; color: var(--color-text-main); font-weight: 700; margin-bottom: 4px;">
              의미: ${currentQ.target.ko}
            </div>
            ${currentQ.target.note ? `<div style="font-size: 0.8rem; color: var(--color-text-muted);">💡 ${currentQ.target.note}</div>` : ''}
          </div>
        `
            : ''
        }
      </div>

      <!-- Navigation Row -->
      <div class="fc-quiz-nav-row">
        <div style="display: flex; gap: 8px;">
          <button class="speed-toggle-btn" id="btn-fc-quiz-shuffle" title="새로운 10문제로 출제">
            🔀 문제 셔플
          </button>
          ${
            state.fcQuizIndex > 0
              ? `
            <button class="speed-toggle-btn" id="btn-fc-quiz-prev">
              ⬅️ 이전 문제
            </button>
          `
              : ''
          }
        </div>

        <div>
          ${
            isAnswered
              ? `
            <button class="quiz-next-btn" id="btn-fc-quiz-next">
              ${state.fcQuizIndex + 1 < totalQ ? '다음 문제 ➡️' : '결과 확인하기 🏁'}
            </button>
          `
              : `
            <button class="quiz-next-btn" style="background: #94a3b8; border-color: #94a3b8; cursor: not-allowed;" disabled>
              보기를 선택하세요
            </button>
          `
          }
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Option Click
  container.querySelectorAll('.fc-quiz-option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const optIdx = parseInt(btn.getAttribute('data-opt-idx'), 10);
      state.fcQuizAnswers[state.fcQuizIndex] = optIdx;

      if (optIdx === currentQ.answerIndex) {
        showToast('정답입니다! 🎉');
      } else {
        showToast('틀렸습니다. 해설을 확인하세요!');
      }

      if (currentQ.promptAudio) {
        speakJapanese(currentQ.target.audio, state.audioSpeed);
      }

      renderFlashcardQuiz(container);
    });
  });

  // Audio prompt click
  document.getElementById('btn-fc-quiz-audio')?.addEventListener('click', () => {
    if (currentQ.promptAudio) {
      speakJapanese(currentQ.promptAudio, state.audioSpeed);
      showToast('🔊 재생 중...');
    }
  });

  container.querySelectorAll('.audio-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
    });
  });

  // Navigation handlers
  document.getElementById('btn-fc-quiz-prev')?.addEventListener('click', () => {
    if (state.fcQuizIndex > 0) {
      state.fcQuizIndex--;
      renderFlashcardQuiz(container);
    }
  });

  document.getElementById('btn-fc-quiz-next')?.addEventListener('click', () => {
    if (state.fcQuizIndex + 1 < totalQ) {
      state.fcQuizIndex++;
      renderFlashcardQuiz(container);
    } else {
      state.fcQuizFinished = true;
      renderFlashcardQuiz(container);
    }
  });

  document.getElementById('btn-fc-quiz-shuffle')?.addEventListener('click', () => {
    state.fcQuizQuestions = generateFlashcardQuiz(10, state.flashcardCategory);
    state.fcQuizIndex = 0;
    state.fcQuizAnswers = {};
    state.fcQuizFinished = false;
    showToast('🔀 새로운 10문제가 출제되었습니다!');
    renderFlashcardQuiz(container);
  });

  document.getElementById('btn-fc-quiz-to-grid')?.addEventListener('click', () => {
    state.flashcardViewMode = 'grid';
    updateUrlHash('flashcards', { mode: 'grid' });
    renderFlashcards(container);
  });
}

// ---------------------------------------------------------------------------
// 4.1 Flashcards Fullscreen Single-Card Modal Layer
// ---------------------------------------------------------------------------
let isFlashcardModalInitialized = false;

function setupFlashcardModalDOM() {
  if (document.getElementById('flashcard-fullscreen-modal')) return;

  const modalHtml = `
    <div id="flashcard-fullscreen-modal" class="fc-modal-overlay" role="dialog" aria-modal="true" aria-label="단어장 1장씩 크게보기">
      <div class="fc-modal-container" id="fc-modal-container">
        <!-- Top Action Bar -->
        <div class="fc-modal-header">
          <div class="fc-modal-badge-group">
            <span class="card-badge" id="fc-modal-tag" style="background: var(--color-surface-muted); color: var(--color-text-main); font-weight: 800;"></span>
            <span class="fc-modal-counter" id="fc-modal-counter">1 / 49</span>
          </div>
          <div class="fc-modal-header-actions">
            <button class="fc-modal-action-pill" id="fc-modal-btn-master" title="암기 완료 상태 변경 (단축키: M)">
              <span id="fc-modal-master-icon">⬜</span> <span id="fc-modal-master-text">외우기 체크</span>
            </button>
            <button class="fc-modal-action-pill" id="fc-modal-btn-shuffle" title="순서 섞기">
              🔀 셔플
            </button>
            <button class="fc-modal-close-btn" id="fc-modal-btn-close" title="닫기 (ESC)">✕</button>
          </div>
        </div>

        <!-- Center Interactive Flippable/Reveal Body -->
        <div class="fc-modal-body">
          <div class="fc-modal-card-display" id="fc-modal-card-display" title="터치하여 뜻 보기 / 가리기 (단축키: Space)">
            <!-- Front Prompt Content -->
            <div id="fc-modal-front-area"></div>

            <!-- Audio button -->
            <div class="fc-modal-audio-btn-row">
              <button class="fc-modal-speaker-btn" id="fc-modal-btn-speak">
                <span>🔊</span> <span>원어민 발음 듣기</span>
              </button>
            </div>

            <!-- Reveal Section -->
            <div class="fc-modal-reveal-box">
              <div class="fc-modal-reveal-trigger" id="fc-modal-reveal-trigger">
                <span>💡</span> <span id="fc-modal-trigger-text">터치하여 한국어 뜻 확인하기</span>
              </div>
              <div class="fc-modal-meaning-revealed" id="fc-modal-revealed-box" style="display: none;"></div>
            </div>
          </div>
        </div>

        <!-- Bottom Navigation Footer -->
        <div class="fc-modal-footer">
          <button class="fc-modal-nav-btn" id="fc-modal-btn-prev">
            <span>◀</span> <span>이전 단어</span>
          </button>
          <span class="fc-modal-hint-text">스페이스바: 뜻보기 | ◀ ▶ 또는 스와이프</span>
          <button class="fc-modal-nav-btn" id="fc-modal-btn-next">
            <span>다음 단어</span> <span>▶</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  attachFlashcardModalEvents();
  isFlashcardModalInitialized = true;
}

function updateFlashcardModalContent() {
  const list = getFilteredFlashcards();
  if (list.length === 0) {
    closeFlashcardModal();
    return;
  }

  if (state.activeFlashcardIndex < 0) state.activeFlashcardIndex = 0;
  if (state.activeFlashcardIndex >= list.length) state.activeFlashcardIndex = list.length - 1;

  const card = list[state.activeFlashcardIndex];
  const isMastered = state.masteredPhrases.has(card.id);

  // Tag & Counter
  const tagElem = document.getElementById('fc-modal-tag');
  const counterElem = document.getElementById('fc-modal-counter');
  if (tagElem) tagElem.textContent = `${card.categoryName} • ${card.tag}`;
  if (counterElem) counterElem.textContent = `${state.activeFlashcardIndex + 1} / ${list.length}`;

  // Master Button
  const masterBtn = document.getElementById('fc-modal-btn-master');
  const masterIcon = document.getElementById('fc-modal-master-icon');
  const masterText = document.getElementById('fc-modal-master-text');
  if (masterBtn && masterIcon && masterText) {
    masterBtn.classList.toggle('mastered', isMastered);
    masterIcon.textContent = isMastered ? '⭐' : '⬜';
    masterText.textContent = isMastered ? '외웠어요' : '외우기 체크';
  }

  // Front Area & Revealed Box
  const frontArea = document.getElementById('fc-modal-front-area');
  const triggerText = document.getElementById('fc-modal-trigger-text');
  const revealedBox = document.getElementById('fc-modal-revealed-box');

  if (frontArea && triggerText && revealedBox) {
    if (!state.flashcardRevealReverse) {
      // Normal Mode: Japanese Front
      frontArea.innerHTML = `
        <div class="fc-modal-jp-text">${card.jp}</div>
        <div class="fc-modal-furigana-text">${card.furigana}</div>
        <div class="fc-modal-pron-text">${card.pronounce}</div>
        ${card.en ? `<div class="fc-modal-en-text">🇺🇸 ${card.en}</div>` : ''}
      `;

      triggerText.textContent = state.isFlashcardRevealed ? '터치하여 뜻 가리기' : '터치하여 한국어 뜻 확인하기';
      revealedBox.innerHTML = `
        <div class="fc-modal-ko-meaning">${card.ko}</div>
        <div class="fc-modal-note">💡 ${card.note}</div>
      `;
    } else {
      // Reverse Mode: Korean Meaning Front
      frontArea.innerHTML = `
        <div class="fc-modal-ko-meaning" style="font-size: 1.8rem; margin-bottom: 8px;">${card.ko}</div>
        ${card.en ? `<div class="fc-modal-en-text">🇺🇸 ${card.en}</div>` : ''}
      `;

      triggerText.textContent = state.isFlashcardRevealed ? '터치하여 일본어 가리기' : '터치하여 일본어 표현 & 발음 확인';
      revealedBox.innerHTML = `
        <div class="fc-modal-jp-text" style="font-size: 1.5rem; margin-top: 4px;">${card.jp}</div>
        <div class="fc-modal-furigana-text">${card.furigana}</div>
        <div class="fc-modal-pron-text">${card.pronounce}</div>
        <div class="fc-modal-note">💡 ${card.note}</div>
      `;
    }

    revealedBox.style.display = state.isFlashcardRevealed ? 'block' : 'none';
  }

  // Prev / Next button states
  const prevBtn = document.getElementById('fc-modal-btn-prev');
  const nextBtn = document.getElementById('fc-modal-btn-next');
  if (prevBtn) prevBtn.disabled = state.activeFlashcardIndex === 0;
  if (nextBtn) nextBtn.disabled = state.activeFlashcardIndex >= list.length - 1;
}

function openFlashcardModal(index = 0) {
  setupFlashcardModalDOM();
  const list = getFilteredFlashcards();
  if (list.length === 0) {
    showToast('외울 카드가 없습니다.');
    return;
  }
  state.activeFlashcardIndex = Math.max(0, Math.min(index, list.length - 1));
  state.isFlashcardRevealed = false;
  state.isFlashcardModalOpen = true;

  updateFlashcardModalContent();

  const modal = document.getElementById('flashcard-fullscreen-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeFlashcardModal() {
  const modal = document.getElementById('flashcard-fullscreen-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  state.isFlashcardModalOpen = false;
}

function navigateFlashcardModal(delta) {
  const list = getFilteredFlashcards();
  const newIndex = state.activeFlashcardIndex + delta;
  if (newIndex >= 0 && newIndex < list.length) {
    state.activeFlashcardIndex = newIndex;
    state.isFlashcardRevealed = false;
    updateFlashcardModalContent();
  }
}

function attachFlashcardModalEvents() {
  const modal = document.getElementById('flashcard-fullscreen-modal');
  const container = document.getElementById('fc-modal-container');
  if (!modal || !container) return;

  // Backdrop click & Close button
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeFlashcardModal();
  });
  document.getElementById('fc-modal-btn-close')?.addEventListener('click', closeFlashcardModal);

  // Card click to toggle reveal
  document.getElementById('fc-modal-card-display')?.addEventListener('click', (e) => {
    if (e.target.closest('#fc-modal-btn-speak')) return;
    state.isFlashcardRevealed = !state.isFlashcardRevealed;
    updateFlashcardModalContent();
  });

  // Audio button
  document.getElementById('fc-modal-btn-speak')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const list = getFilteredFlashcards();
    const card = list[state.activeFlashcardIndex];
    if (card) {
      speakJapanese(card.audio, state.audioSpeed);
      showToast('🔊 발음 재생 중...');
    }
  });

  // Master toggle button
  document.getElementById('fc-modal-btn-master')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const list = getFilteredFlashcards();
    const card = list[state.activeFlashcardIndex];
    if (card) {
      const updated = storage.toggleMasteredPhrase(card.id);
      state.masteredPhrases = new Set(updated);
      showToast(state.masteredPhrases.has(card.id) ? '⭐ 외운 단어로 등록되었습니다!' : '⬜ 외우기 체크가 해제되었습니다.');
      updateFlashcardModalContent();
      renderCurrentTab();
    }
  });

  // Shuffle button inside modal
  document.getElementById('fc-modal-btn-shuffle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.flashcardIsShuffled = true;
    state.flashcardShuffledList = shuffleArray(phrasesData);
    state.activeFlashcardIndex = 0;
    state.isFlashcardRevealed = false;
    showToast('🔀 단어를 랜덤하게 섞었습니다!');
    updateFlashcardModalContent();
    renderCurrentTab();
  });

  // Navigation buttons
  document.getElementById('fc-modal-btn-prev')?.addEventListener('click', () => navigateFlashcardModal(-1));
  document.getElementById('fc-modal-btn-next')?.addEventListener('click', () => navigateFlashcardModal(1));

  // Touch swipe support on modal container
  let touchStartX = 0;
  let touchStartY = 0;

  container.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: true }
  );

  container.addEventListener(
    'touchend',
    (e) => {
      const diffX = e.changedTouches[0].screenX - touchStartX;
      const diffY = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(diffX) > 45 && Math.abs(diffY) < 60) {
        if (diffX < 0) {
          navigateFlashcardModal(1); // Swipe left -> Next
        } else {
          navigateFlashcardModal(-1); // Swipe right -> Prev
        }
      }
    },
    { passive: true }
  );
}

// Global keydown listener for flashcard modal
window.addEventListener('keydown', (e) => {
  if (!state.isFlashcardModalOpen) return;
  if (e.key === 'Escape') {
    closeFlashcardModal();
  } else if (e.key === 'ArrowLeft') {
    navigateFlashcardModal(-1);
  } else if (e.key === 'ArrowRight') {
    navigateFlashcardModal(1);
  } else if (e.key === ' ') {
    e.preventDefault();
    state.isFlashcardRevealed = !state.isFlashcardRevealed;
    updateFlashcardModalContent();
  } else if (e.key === 'm' || e.key === 'M') {
    const list = getFilteredFlashcards();
    const card = list[state.activeFlashcardIndex];
    if (card) {
      const updated = storage.toggleMasteredPhrase(card.id);
      state.masteredPhrases = new Set(updated);
      showToast(state.masteredPhrases.has(card.id) ? '⭐ 외운 단어로 등록되었습니다!' : '⬜ 외우기 체크가 해제되었습니다.');
      updateFlashcardModalContent();
      renderCurrentTab();
    }
  } else if (e.key === 's' || e.key === 'S') {
    const list = getFilteredFlashcards();
    const card = list[state.activeFlashcardIndex];
    if (card) {
      speakJapanese(card.audio, state.audioSpeed);
      showToast('🔊 발음 재생 중...');
    }
  }
});

// ---------------------------------------------------------------------------
// 5. Comprehensive Daily Test Tab
// ---------------------------------------------------------------------------

function getComprehensiveQuizScore() {
  let score = 0;
  state.quizQuestionsList.forEach((q, idx) => {
    const chosen = state.quizUserAnswers[idx];
    if (chosen !== undefined && q.options[chosen] && q.options[chosen].isCorrect) {
      score++;
    }
  });
  return score;
}

function renderTest(container) {
  const totalQuestions = state.quizQuestionsList.length;

  if (state.quizFinished) {
    const score = getComprehensiveQuizScore();
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= 80;

    let html = `
      <div class="quiz-box" style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 54px; margin-bottom: 12px;">${passed ? '🎉' : '💪'}</div>
        <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 8px; color: var(--color-text-main);">
          ${passed ? '축하합니다! 테스트 통과!' : '조금만 더 복습해 볼까요?'}
        </h2>
        <p style="font-size: 1rem; color: var(--color-text-muted); margin-bottom: 24px;">
          최종 점수: <strong style="color: var(--color-primary); font-size: 1.4rem;">${score} / ${totalQuestions}</strong> (${percentage}점)
        </p>

        <div style="display: inline-block; background: var(--color-surface-muted); padding: 16px 24px; border-radius: 12px; margin-bottom: 24px; text-align: left; max-width: 400px; width: 100%;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 6px;">
            ${passed ? '🏆 실전 준비 마스터 배지 획득!' : '💡 추천 학습 액션'}
          </div>
          <div style="font-size: 0.8rem; color: var(--color-text-muted);">
            ${passed ? '공항 입출국부터 가와구치코, 우에노까지 기본 회화를 완벽히 숙지하셨습니다!' : '일자별 학습실과 1초 치트시트를 10분간 다시 훑어본 후 재도전해보세요!'}
          </div>
        </div>

        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <button class="quiz-ctrl-btn" id="btn-restart-quiz" style="padding: 12px 24px; font-size: 0.95rem;">
            <span>🔄</span> <span>처음부터 다시 보기</span>
          </button>
          <button class="quiz-ctrl-btn" id="btn-shuffle-restart-quiz" style="padding: 12px 24px; font-size: 0.95rem; background: #eff6ff; border-color: #93c5fd; color: #1d4ed8;">
            <span>🔀</span> <span>문제 셔플 후 다시 풀기</span>
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    document.getElementById('btn-restart-quiz').addEventListener('click', () => {
      state.quizIndex = 0;
      state.quizUserAnswers = {};
      state.quizFinished = false;
      renderTest(container);
    });

    document.getElementById('btn-shuffle-restart-quiz').addEventListener('click', () => {
      state.quizQuestionsList = shuffleArray(quizQuestions);
      state.quizIndex = 0;
      state.quizUserAnswers = {};
      state.quizFinished = false;
      showToast('🔀 문제가 무작위로 셔플되었습니다!');
      renderTest(container);
    });
    return;
  }

  const currentQ = state.quizQuestionsList[state.quizIndex];
  const userChosenIdx = state.quizUserAnswers[state.quizIndex];
  const isAnswered = userChosenIdx !== undefined;

  let html = `
    <div class="quiz-box">
      <!-- Quiz Toolbar with Shuffle, Reset, and Progress -->
      <div class="quiz-toolbar">
        <div class="quiz-meta-left">
          <span class="card-badge">${currentQ.category}</span>
          <span style="font-weight: 800; font-size: 0.92rem; color: var(--color-text-main);">
            문제 ${state.quizIndex + 1} / ${totalQuestions}
          </span>
        </div>
        <div class="quiz-toolbar-actions">
          <button class="quiz-ctrl-btn" id="btn-quiz-shuffle" title="문제 무작위 셔플">
            <span>🔀</span> <span>셔플</span>
          </button>
          <button class="quiz-ctrl-btn" id="btn-quiz-reset" title="처음부터 다시 풀기">
            <span>🔄</span> <span>초기화</span>
          </button>
        </div>
      </div>

      <div class="quiz-scenario">
        <strong>현지 상황:</strong> ${currentQ.scenario}
      </div>

      <div class="quiz-question-wrap">
        <h3 class="quiz-question-text">${currentQ.question}</h3>
        ${currentQ.audio ? `<button class="audio-btn" data-audio="${currentQ.audio}" title="일본어 발음 듣기">🔊</button>` : ''}
      </div>

      <div class="quiz-options">
        ${currentQ.options
          .map((opt, idx) => {
            let stateClass = '';
            if (isAnswered) {
              if (opt.isCorrect) stateClass = 'correct';
              else if (userChosenIdx === idx) stateClass = 'wrong';
            }
            return `
            <button class="quiz-option-btn ${stateClass}" data-idx="${idx}" ${isAnswered ? 'disabled' : ''}>
              <span>${idx + 1}. ${opt.text}</span>
              ${isAnswered && opt.isCorrect ? '<span>✅</span>' : ''}
              ${isAnswered && !opt.isCorrect && userChosenIdx === idx ? '<span>❌</span>' : ''}
            </button>
          `;
          })
          .join('')}
      </div>

      ${
        isAnswered
          ? `
        <div class="quiz-explanation">
          <strong>해설:</strong> ${currentQ.explanation}
        </div>
      `
          : ''
      }

      <!-- Bottom Navigation Buttons (이전 문제 / 다음 문제) -->
      <div class="quiz-nav-row">
        <button class="quiz-nav-btn prev" id="btn-prev-question" ${state.quizIndex === 0 ? 'disabled' : ''}>
          <span>⬅️</span> <span>이전 문제</span>
        </button>
        ${
          isAnswered
            ? `
          <button class="quiz-nav-btn next" id="btn-next-question">
            <span>${state.quizIndex + 1 < totalQuestions ? '다음 문제 ➡️' : '결과 확인하기 🏁'}</span>
          </button>
        `
            : `
          <button class="quiz-nav-btn next" style="background: #94a3b8; border-color: #94a3b8; cursor: not-allowed;" title="보기를 먼저 선택해 주세요" disabled>
            <span>정답을 선택하세요</span>
          </button>
        `
        }
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Options Click
  container.querySelectorAll('.quiz-option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.quizUserAnswers[state.quizIndex] !== undefined) return;
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      state.quizUserAnswers[state.quizIndex] = idx;

      if (currentQ.options[idx].isCorrect) {
        showToast('정답입니다! 🎉');
      } else {
        showToast('아쉽네요! 해설을 확인해보세요.');
      }
      renderTest(container);
    });
  });

  // Audio Play
  const audioBtn = container.querySelector('.audio-btn');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const text = audioBtn.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
    });
  }

  // Prev Question
  const prevBtn = document.getElementById('btn-prev-question');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.quizIndex > 0) {
        state.quizIndex--;
        renderTest(container);
      }
    });
  }

  // Next Question
  const nextBtn = document.getElementById('btn-next-question');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (state.quizIndex + 1 < totalQuestions) {
        state.quizIndex++;
        renderTest(container);
      } else {
        state.quizFinished = true;
        const finalScore = getComprehensiveQuizScore();
        storage.saveQuizResult(finalScore, totalQuestions);
        renderTest(container);
      }
    });
  }

  // Shuffle Questions
  const shuffleBtn = document.getElementById('btn-quiz-shuffle');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      state.quizQuestionsList = shuffleArray(quizQuestions);
      state.quizIndex = 0;
      state.quizUserAnswers = {};
      state.quizFinished = false;
      showToast('🔀 문제 순서가 무작위로 섞였습니다!');
      renderTest(container);
    });
  }

  // Reset Test
  const resetBtn = document.getElementById('btn-quiz-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.quizIndex = 0;
      state.quizUserAnswers = {};
      state.quizFinished = false;
      showToast('테스트가 처음부터 초기화되었습니다.');
      renderTest(container);
    });
  }
}

// ---------------------------------------------------------------------------
// 6. Roleplay Tab (실전 대화 시뮬레이션 & 롤플레잉 퀴즈)
// ---------------------------------------------------------------------------
function renderRoleplay(container) {
  const currentScenario = roleplayScenarios.find((s) => s.id === state.activeRoleplayId) || roleplayScenarios[0];

  let html = `
    <!-- Scenario Selection (Wrap-safe, never clipped) -->
    <div class="scenario-pill-wrap" style="margin-bottom: 14px;">
      ${roleplayScenarios
        .map(
          (sc) => `
        <button class="scenario-pill-btn ${sc.id === currentScenario.id ? 'active' : ''}" data-scid="${sc.id}">
          <span>${sc.title}</span>
        </button>
      `
        )
        .join('')}
    </div>

    <!-- Mode Switcher Bar -->
    <div class="rp-mode-bar">
      <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-main); display: flex; align-items: center; gap: 6px;">
        <span>📍 ${currentScenario.location}</span>
      </div>
      <div class="rp-mode-toggle-group">
        <button class="rp-mode-pill ${state.roleplayViewMode === 'chat' ? 'active' : ''}" data-mode="chat">
          💬 실전 대화 시뮬레이션
        </button>
        <button class="rp-mode-pill ${state.roleplayViewMode === 'quiz' ? 'active' : ''}" data-mode="quiz">
          🎯 롤플레잉 퀴즈 모드
        </button>
      </div>
    </div>
  `;

  if (state.roleplayViewMode === 'quiz') {
    html += renderRoleplayQuizHtml(currentScenario);
  } else {
    html += renderRoleplayChatHtml(currentScenario);
  }

  container.innerHTML = html;

  // Scenario Switcher Buttons
  container.querySelectorAll('.scenario-pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeRoleplayId = btn.getAttribute('data-scid');
      state.roleplayStepIndex = 0;
      state.roleplayLogs = [];
      state.rpQuizStepIndex = 0;
      state.rpQuizAnswers = {};
      state.rpQuizFinished = false;
      updateUrlHash('roleplay', { scenario: state.activeRoleplayId, mode: state.roleplayViewMode });
      renderRoleplay(container);
    });
  });

  // Mode Switcher Buttons
  container.querySelectorAll('.rp-mode-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const newMode = btn.getAttribute('data-mode');
      if (newMode !== state.roleplayViewMode) {
        state.roleplayViewMode = newMode;
        updateUrlHash('roleplay', { scenario: state.activeRoleplayId, mode: state.roleplayViewMode });
        renderRoleplay(container);
      }
    });
  });

  // Audio Playback
  container.querySelectorAll('.audio-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
    });
  });

  if (state.roleplayViewMode === 'quiz') {
    attachRoleplayQuizEvents(container, currentScenario);
  } else {
    attachRoleplayChatEvents(container, currentScenario);
  }
}

// 6-A. Roleplay Chat Mode HTML
function renderRoleplayChatHtml(currentScenario) {
  const currentStep = currentScenario.steps[state.roleplayStepIndex];
  const isScenarioCompleted = state.roleplayStepIndex >= currentScenario.steps.length;

  return `
    <div class="content-card">
      <div class="card-header">
        <div>
          <h2 class="card-title">${currentScenario.title}</h2>
          <p style="font-size: 0.82rem; color: var(--color-text-muted); margin-top: 2px;">📍 ${currentScenario.location}</p>
        </div>
        <button class="speed-toggle-btn" id="btn-reset-scenario">처음부터 다시</button>
      </div>

      <!-- Dialogue Chat Window -->
      <div class="chat-window" id="chat-window">
        ${state.roleplayLogs
          .map(
            (log) => `
          <div class="chat-bubble ${log.speaker}">
            <div class="chat-bubble-speaker">${log.speaker === 'staff' ? currentScenario.character : '나'}</div>
            <div class="chat-jp-text">${log.jp}</div>
            <div class="chat-ko-sub">${log.meaning}</div>
          </div>
        `
          )
          .join('')}

        ${
          !isScenarioCompleted && currentStep
            ? `
          <div class="chat-bubble staff">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <div class="chat-bubble-speaker">${currentScenario.character}</div>
              <button class="audio-btn" data-audio="${currentStep.message}" style="width: 26px; height: 26px; font-size: 12px;">🔊</button>
            </div>
            <div class="chat-jp-text">${currentStep.message}</div>
            <div style="font-size: 0.8rem; color: var(--color-primary); font-weight: 600; margin-bottom: 2px;">${currentStep.pronounce}</div>
            <div class="chat-ko-sub">${currentStep.meaning}</div>
          </div>
        `
            : ''
        }
      </div>

      <!-- Response Choices -->
      ${
        !isScenarioCompleted && currentStep
          ? `
        <div style="margin-top: 18px; border-top: 1px solid var(--color-border); padding-top: 16px;">
          <div style="font-size: 0.84rem; font-weight: 700; color: var(--color-text-muted); margin-bottom: 10px;">
            💬 어떻게 대답할까요? (선택지를 터치하세요)
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${currentStep.options
              .map(
                (opt, idx) => `
              <button class="quiz-option-btn roleplay-choice-btn" data-idx="${idx}">
                <div style="width: 100%;">
                  <div style="font-family: var(--font-jp); font-weight: 700; color: var(--color-text-main); font-size: 0.98rem; margin-bottom: 3px; word-break: keep-all; line-height: 1.4;">${opt.text}</div>
                  <div style="font-size: 0.82rem; font-weight: 600; color: var(--color-primary); margin-bottom: 2px;">${opt.pronounce}</div>
                  <div style="font-size: 0.78rem; color: var(--color-text-muted);">${opt.meaning}</div>
                </div>
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : `
        <div style="text-align: center; padding: 24px; background: var(--color-surface-muted); border-radius: var(--radius-md);">
          <div style="font-size: 40px; margin-bottom: 8px;">🎉</div>
          <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 6px;">시나리오 대화 완수!</h3>
          <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 16px;">
            실제 현장에서도 위 패턴대로 자신 있게 소통하실 수 있습니다!
          </p>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="speed-toggle-btn" id="btn-chat-to-quiz">
              🎯 퀴즈 모드로 실력 테스트
            </button>
            <button class="quiz-next-btn" id="btn-next-scenario" style="max-width: 200px; margin: 0;">
              다른 시나리오 도전 👉
            </button>
          </div>
        </div>
      `
      }
    </div>
  `;
}

function attachRoleplayChatEvents(container, currentScenario) {
  const currentStep = currentScenario.steps[state.roleplayStepIndex];

  const resetBtn = document.getElementById('btn-reset-scenario');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.roleplayStepIndex = 0;
      state.roleplayLogs = [];
      renderRoleplay(container);
    });
  }

  container.querySelectorAll('.roleplay-choice-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const chosen = currentStep.options[idx];

      state.roleplayLogs.push({
        speaker: 'staff',
        jp: currentStep.message,
        meaning: currentStep.meaning,
      });

      state.roleplayLogs.push({
        speaker: 'user',
        jp: chosen.text,
        meaning: chosen.meaning,
      });

      speakJapanese(chosen.text, state.audioSpeed);
      showToast(chosen.feedback);
      state.roleplayStepIndex++;
      if (state.roleplayStepIndex >= currentScenario.steps.length) {
        storage.markRoleplayDone(currentScenario.id);
      }
      renderRoleplay(container);
    });
  });

  const nextScenarioBtn = document.getElementById('btn-next-scenario');
  if (nextScenarioBtn) {
    nextScenarioBtn.addEventListener('click', () => {
      const currentIndex = roleplayScenarios.findIndex((s) => s.id === state.activeRoleplayId);
      const nextIndex = (currentIndex + 1) % roleplayScenarios.length;
      state.activeRoleplayId = roleplayScenarios[nextIndex].id;
      state.roleplayStepIndex = 0;
      state.roleplayLogs = [];
      updateUrlHash('roleplay', { scenario: state.activeRoleplayId, mode: 'chat' });
      renderRoleplay(container);
    });
  }

  const toQuizBtn = document.getElementById('btn-chat-to-quiz');
  if (toQuizBtn) {
    toQuizBtn.addEventListener('click', () => {
      state.roleplayViewMode = 'quiz';
      state.rpQuizStepIndex = 0;
      state.rpQuizAnswers = {};
      state.rpQuizFinished = false;
      updateUrlHash('roleplay', { scenario: state.activeRoleplayId, mode: 'quiz' });
      renderRoleplay(container);
    });
  }
}

// 6-B. Roleplay Quiz Mode HTML & Events
function renderRoleplayQuizHtml(currentScenario) {
  const totalSteps = currentScenario.steps.length;
  const correctCount = Object.values(state.rpQuizAnswers).filter((ans) => ans.isBest).length;
  const isFinished = state.rpQuizFinished;

  if (isFinished) {
    const scorePct = Math.round((correctCount / totalSteps) * 100);
    let evaluationMsg = '';
    if (scorePct === 100) {
      evaluationMsg = `🏆 완벽 대응 (100점)! ${currentScenario.location} 현장에서도 원어민과 망설임 없이 소통할 수 있습니다.`;
    } else if (scorePct >= 50) {
      evaluationMsg = `👏 훌륭합니다! 대부분의 실전 상황을 매끄럽게 통과했습니다. 아래 오답 및 모범 답변 팁을 확인해 보세요.`;
    } else {
      evaluationMsg = `💪 상황별 뉘앙스를 익히면 훨씬 자연스러워집니다! 아래 전체 대화 복습을 확인하고 다시 도전해 보세요.`;
    }

    return `
      <div class="rp-quiz-container">
        <div class="rp-quiz-result-card">
          <div style="font-size: 46px; margin-bottom: 6px;">${scorePct === 100 ? '🎉' : '📝'}</div>
          <h2 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 4px;">${currentScenario.title}</h2>
          <p style="font-size: 0.85rem; color: var(--color-text-muted);">롤플레잉 퀴즈 결과 리포트</p>

          <div class="rp-quiz-score-badge">
            ${correctCount} / ${totalSteps} 정답 (${scorePct}점)
          </div>

          <p style="font-size: 0.92rem; line-height: 1.5; color: var(--color-text-main); max-width: 500px; margin: 0 auto 20px;">
            ${evaluationMsg}
          </p>

          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button class="quiz-next-btn" id="btn-rp-quiz-retry" style="margin: 0;">
              🔄 이 시나리오 다시 풀기
            </button>
            <button class="quiz-next-btn" id="btn-rp-quiz-next-sc" style="margin: 0; background: #2563eb; color: #fff;">
              👉 다음 시나리오 퀴즈 도전
            </button>
            <button class="speed-toggle-btn" id="btn-rp-quiz-to-chat">
              💬 대화 시뮬레이션으로 전환
            </button>
          </div>

          <!-- Full Dialogue Recap -->
          <div class="rp-review-list">
            <h3 style="font-size: 1rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
              <span>📖</span> <span>전체 대화 흐름 & 모범 답변 해설</span>
            </h3>

            ${currentScenario.steps
              .map((step, sIdx) => {
                const userAns = state.rpQuizAnswers[sIdx];
                const bestOpt = step.options.find((o) => o.isBest) || step.options[0];
                const userChosenOpt = userAns ? step.options[userAns.selectedIndex] : null;
                const isCorrect = userAns ? userAns.isBest : false;

                return `
                <div class="rp-review-item">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 0.78rem; font-weight: 800; color: var(--color-primary); background: #eff6ff; padding: 2px 8px; border-radius: var(--radius-sm);">
                      상황 ${sIdx + 1}
                    </span>
                    <span style="font-size: 0.8rem; font-weight: 700; color: ${isCorrect ? '#16a34a' : '#dc2626'};">
                      ${isCorrect ? '✅ 정답' : '❌ 오답'}
                    </span>
                  </div>

                  <!-- Clerk Prompt -->
                  <div style="margin-bottom: 10px;">
                    <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); display: flex; align-items: center; justify-content: space-between;">
                      <span>👤 ${currentScenario.character}</span>
                      <button class="audio-btn" data-audio="${step.message}" style="width: 24px; height: 24px; font-size: 11px;">🔊</button>
                    </div>
                    <div style="font-family: var(--font-jp); font-weight: 700; font-size: 0.96rem; color: var(--color-text-main); margin: 2px 0;">${step.message}</div>
                    <div style="font-size: 0.8rem; color: var(--color-primary);">${step.pronounce}</div>
                    <div style="font-size: 0.78rem; color: var(--color-text-muted);">${step.meaning}</div>
                  </div>

                  <!-- Best Answer -->
                  <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-sm); padding: 10px; margin-bottom: 8px;">
                    <div style="font-size: 0.78rem; font-weight: 800; color: #065f46; display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                      <span>💡 모범 답변 (Best Answer)</span>
                      <button class="audio-btn" data-audio="${bestOpt.text}" style="width: 24px; height: 24px; font-size: 11px; background: #ffffff;">🔊</button>
                    </div>
                    <div style="font-family: var(--font-jp); font-weight: 700; font-size: 0.94rem; color: #064e3b;">${bestOpt.text}</div>
                    <div style="font-size: 0.8rem; color: #047857; margin: 2px 0;">${bestOpt.pronounce}</div>
                    <div style="font-size: 0.78rem; color: #065f46;">${bestOpt.meaning}</div>
                    <div style="font-size: 0.76rem; color: #047857; margin-top: 6px; border-top: 1px dashed #a7f3d0; padding-top: 4px;">📌 <strong>상황 팁:</strong> ${bestOpt.feedback}</div>
                  </div>

                  <!-- If user was wrong, show chosen option feedback -->
                  ${
                    !isCorrect && userChosenOpt
                      ? `
                    <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: var(--radius-sm); padding: 8px 10px; font-size: 0.78rem; color: #991b1b;">
                      <strong>⚠️ 내가 선택한 답:</strong> ${userChosenOpt.text} (${userChosenOpt.meaning})<br>
                      <span>👉 ${userChosenOpt.feedback}</span>
                    </div>
                  `
                      : ''
                  }
                </div>
              `;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Active Question Step
  const currentStep = currentScenario.steps[state.rpQuizStepIndex];
  const currentAnswer = state.rpQuizAnswers[state.rpQuizStepIndex];
  const hasAnswered = currentAnswer !== undefined;

  return `
    <div class="rp-quiz-container">
      <!-- Status Bar Card -->
      <div class="rp-quiz-header-card" style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.8rem; font-weight: 800; background: #eff6ff; color: var(--color-primary); padding: 4px 10px; border-radius: var(--radius-sm); border: 1px solid var(--color-primary-subtle);">
            단계 ${state.rpQuizStepIndex + 1} / ${totalSteps}
          </span>
          <span style="font-size: 0.82rem; font-weight: 700; color: var(--color-text-muted);">
            현재 정답: <strong style="color: #16a34a;">${correctCount}개</strong>
          </span>
        </div>
        <button class="speed-toggle-btn" id="btn-rp-quiz-reset-all">처음부터</button>
      </div>

      <!-- Prompt Question Card -->
      <div class="rp-quiz-prompt-card">
        <div class="rp-quiz-prompt-banner">
          <span>🗣️</span> <span>상황 ${state.rpQuizStepIndex + 1} • ${currentScenario.character}의 말</span>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-size: 0.82rem; font-weight: 700; color: var(--color-text-muted);">
              👤 ${currentScenario.character}
            </div>
            <button class="audio-btn" data-audio="${currentStep.message}" style="width: 28px; height: 28px; font-size: 13px;">🔊</button>
          </div>
          <div style="font-family: var(--font-jp); font-size: 1.15rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 6px; line-height: 1.45;">
            ${currentStep.message}
          </div>
          <div style="font-size: 0.88rem; font-weight: 600; color: var(--color-primary); margin-bottom: 4px;">
            ${currentStep.pronounce}
          </div>
          <div style="font-size: 0.84rem; color: var(--color-text-muted);">
            ${currentStep.meaning}
          </div>
        </div>

        <div style="font-size: 0.88rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 10px;">
          🎯 상대방의 말에 가장 자연스러운 모범 답변(Best Answer)을 선택하세요:
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${currentStep.options
            .map((opt, optIdx) => {
              let btnClass = 'rp-quiz-option-btn';
              let badgeHtml = '';

              if (hasAnswered) {
                if (opt.isBest) {
                  btnClass += ' correct';
                  badgeHtml = `<span style="font-size: 0.75rem; font-weight: 800; color: #065f46; background: #a7f3d0; padding: 2px 8px; border-radius: 999px;">✅ Best Choice</span>`;
                } else if (currentAnswer.selectedIndex === optIdx) {
                  btnClass += ' incorrect';
                  badgeHtml = `<span style="font-size: 0.75rem; font-weight: 800; color: #991b1b; background: #fecdd3; padding: 2px 8px; border-radius: 999px;">❌ 내 선택</span>`;
                }
              }

              return `
              <button class="${btnClass}" data-optidx="${optIdx}" ${hasAnswered ? 'disabled' : ''}>
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 4px;">
                  <span style="font-size: 0.8rem; font-weight: 800; color: var(--color-text-muted);">선택지 ${optIdx + 1}</span>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    ${badgeHtml}
                    <span class="audio-btn" data-audio="${opt.text}" style="width: 24px; height: 24px; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 50%; background: #f1f5f9;">🔊</span>
                  </div>
                </div>
                <div style="font-family: var(--font-jp); font-size: 1.05rem; font-weight: 700; color: var(--color-text-main); line-height: 1.4; margin-bottom: 3px;">
                  ${opt.text}
                </div>
                <div style="font-size: 0.84rem; font-weight: 600; color: var(--color-primary); margin-bottom: 2px;">
                  ${opt.pronounce}
                </div>
                <div style="font-size: 0.8rem; color: var(--color-text-muted);">
                  ${opt.meaning}
                </div>
              </button>
            `;
            })
            .join('')}
        </div>

        <!-- Instant Feedback Box -->
        ${
          hasAnswered
            ? `
          <div class="rp-quiz-feedback-box ${currentAnswer.isBest ? 'correct' : 'incorrect'}">
            <div style="font-weight: 800; font-size: 0.92rem; margin-bottom: 4px;">
              ${currentAnswer.isBest ? '🎉 정답입니다! (모범 답변)' : '⚠️ 아쉬운 선택입니다! (오답 피드백)'}
            </div>
            <div style="font-size: 0.85rem; line-height: 1.45;">
              ${currentStep.options[currentAnswer.selectedIndex].feedback}
            </div>
            ${
              !currentAnswer.isBest
                ? `
              <div style="font-size: 0.82rem; margin-top: 8px; border-top: 1px dashed #fecdd3; padding-top: 6px; font-weight: 600;">
                💡 <strong>추천 모범 답변:</strong> ${currentStep.options.find((o) => o.isBest)?.text} (${currentStep.options.find((o) => o.isBest)?.meaning})
              </div>
            `
                : ''
            }
          </div>
        `
            : ''
        }

        <!-- Bottom Navigation -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; gap: 10px;">
          ${
            state.rpQuizStepIndex > 0
              ? `<button class="speed-toggle-btn" id="btn-rp-quiz-prev">◀ 이전 단계</button>`
              : `<div></div>`
          }

          ${
            hasAnswered
              ? state.rpQuizStepIndex < totalSteps - 1
                ? `<button class="quiz-next-btn" id="btn-rp-quiz-next" style="margin: 0;">다음 단계로 ▶</button>`
                : `<button class="quiz-next-btn" id="btn-rp-quiz-finish" style="margin: 0; background: #16a34a; color: #fff;">결과 보기 🎉</button>`
              : ''
          }
        </div>
      </div>
    </div>
  `;
}

function attachRoleplayQuizEvents(container, currentScenario) {
  const totalSteps = currentScenario.steps.length;
  const currentStep = currentScenario.steps[state.rpQuizStepIndex];

  // Option selection
  container.querySelectorAll('.rp-quiz-option-btn:not(:disabled)').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      // Avoid firing if the user clicked the audio speaker
      if (e.target.closest('.audio-btn')) return;

      const optIdx = parseInt(btn.getAttribute('data-optidx'), 10);
      const chosen = currentStep.options[optIdx];

      state.rpQuizAnswers[state.rpQuizStepIndex] = {
        selectedIndex: optIdx,
        isBest: chosen.isBest,
      };

      speakJapanese(chosen.text, state.audioSpeed);
      renderRoleplay(container);
    });
  });

  // Next Step button
  const nextBtn = document.getElementById('btn-rp-quiz-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (state.rpQuizStepIndex < totalSteps - 1) {
        state.rpQuizStepIndex++;
        renderRoleplay(container);
      }
    });
  }

  // Prev Step button
  const prevBtn = document.getElementById('btn-rp-quiz-prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.rpQuizStepIndex > 0) {
        state.rpQuizStepIndex--;
        renderRoleplay(container);
      }
    });
  }

  // Finish button
  const finishBtn = document.getElementById('btn-rp-quiz-finish');
  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      state.rpQuizFinished = true;
      storage.markRoleplayDone(currentScenario.id);
      renderRoleplay(container);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Reset all
  const resetAllBtn = document.getElementById('btn-rp-quiz-reset-all');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      state.rpQuizStepIndex = 0;
      state.rpQuizAnswers = {};
      state.rpQuizFinished = false;
      renderRoleplay(container);
    });
  }

  // Retry button (from result card)
  const retryBtn = document.getElementById('btn-rp-quiz-retry');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      state.rpQuizStepIndex = 0;
      state.rpQuizAnswers = {};
      state.rpQuizFinished = false;
      renderRoleplay(container);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Next Scenario button (from result card)
  const nextScenarioBtn = document.getElementById('btn-rp-quiz-next-sc');
  if (nextScenarioBtn) {
    nextScenarioBtn.addEventListener('click', () => {
      const currentIndex = roleplayScenarios.findIndex((s) => s.id === state.activeRoleplayId);
      const nextIndex = (currentIndex + 1) % roleplayScenarios.length;
      state.activeRoleplayId = roleplayScenarios[nextIndex].id;
      state.rpQuizStepIndex = 0;
      state.rpQuizAnswers = {};
      state.rpQuizFinished = false;
      updateUrlHash('roleplay', { scenario: state.activeRoleplayId, mode: 'quiz' });
      renderRoleplay(container);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Switch to chat button (from result card)
  const toChatBtn = document.getElementById('btn-rp-quiz-to-chat');
  if (toChatBtn) {
    toChatBtn.addEventListener('click', () => {
      state.roleplayViewMode = 'chat';
      state.roleplayStepIndex = 0;
      state.roleplayLogs = [];
      updateUrlHash('roleplay', { scenario: state.activeRoleplayId, mode: 'chat' });
      renderRoleplay(container);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}


// ---------------------------------------------------------------------------
// 7. Pocket Mode Tab & Fullscreen Large View Layer
// ---------------------------------------------------------------------------
let isPocketModalInitialized = false;

function setupPocketModalDOM() {
  if (document.getElementById('pocket-fullscreen-modal')) return;

  const modalHtml = `
    <div id="pocket-fullscreen-modal" class="pocket-modal-overlay" role="dialog" aria-modal="true" aria-label="점원 제시용 포켓 카드 크게보기">
      <div class="pocket-modal-container" id="pocket-modal-container">
        <!-- Top Action Bar -->
        <div class="pocket-modal-header">
          <div class="pocket-modal-badge-group">
            <span class="card-badge" id="pocket-modal-tag" style="background: var(--color-surface-muted); color: var(--color-text-main); font-weight: 800;"></span>
            <span class="pocket-modal-counter" id="pocket-modal-counter">1 / 16</span>
          </div>
          <div class="pocket-modal-header-actions">
            <button class="pocket-flip-btn" id="pocket-btn-flip" title="맞은편 점원 방향 180도 회전">
              <span>🔄</span> <span id="pocket-flip-text">180° 회전</span>
            </button>
            <button class="pocket-modal-close-btn" id="pocket-btn-close" title="닫기 (ESC)">✕</button>
          </div>
        </div>

        <!-- Scrollable Card View (Rotatable via .is-flipped) -->
        <div class="pocket-modal-card-scroll">
          <div class="pocket-modal-card-body" id="pocket-modal-body">
            <div class="pocket-modal-clerk-banner" id="pocket-clerk-banner">
              <span id="pocket-clerk-msg">🇯🇵 店員さん、これをお願いします！</span>
            </div>
            <div class="pocket-modal-jp" id="pocket-modal-jp"></div>
            <div class="pocket-modal-pron" id="pocket-modal-pron"></div>
            <div class="pocket-modal-ko" id="pocket-modal-ko"></div>
            <div class="pocket-modal-en" id="pocket-modal-en"></div>
            <div class="pocket-modal-context" id="pocket-modal-context"></div>
          </div>
        </div>

        <!-- Audio Action Toolbar -->
        <div class="pocket-modal-audio-row">
          <button class="pocket-modal-speaker-btn" id="pocket-btn-speak">
            <span>🔊</span> <span>점원에게 큰 소리로 들려주기</span>
          </button>
          <div class="pocket-speed-selector-row">
            <span>재생 속도:</span>
            <button class="pocket-modal-speed-pill" id="pocket-speed-085" data-speed="0.85">0.85x 보통</button>
            <button class="pocket-modal-speed-pill" id="pocket-speed-100" data-speed="1.0">1.0x 실전</button>
          </div>
        </div>

        <!-- Bottom Navigation Controls -->
        <div class="pocket-modal-footer">
          <button class="pocket-modal-nav-btn" id="pocket-btn-prev">
            <span>◀</span> <span>이전 카드</span>
          </button>
          <span class="pocket-modal-hint-text">키보드 ◀ ▶ 또는 화면 스와이프</span>
          <button class="pocket-modal-nav-btn" id="pocket-btn-next">
            <span>다음 카드</span> <span>▶</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Attach persistent modal event listeners
  const modalOverlay = document.getElementById('pocket-fullscreen-modal');
  const modalContainer = document.getElementById('pocket-modal-container');
  const closeBtn = document.getElementById('pocket-btn-close');
  const flipBtn = document.getElementById('pocket-btn-flip');
  const speakBtn = document.getElementById('pocket-btn-speak');
  const prevBtn = document.getElementById('pocket-btn-prev');
  const nextBtn = document.getElementById('pocket-btn-next');
  const speed085Btn = document.getElementById('pocket-speed-085');
  const speed100Btn = document.getElementById('pocket-speed-100');

  // Close when clicking backdrop
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closePocketModal();
    }
  });

  closeBtn.addEventListener('click', () => {
    closePocketModal();
  });

  // 180-degree flip for clerk facing
  flipBtn.addEventListener('click', () => {
    state.isPocketFlipped = !state.isPocketFlipped;
    const body = document.getElementById('pocket-modal-body');
    const flipText = document.getElementById('pocket-flip-text');
    if (body) body.classList.toggle('is-flipped', state.isPocketFlipped);
    flipBtn.classList.toggle('active', state.isPocketFlipped);
    if (flipText) flipText.textContent = state.isPocketFlipped ? '원래대로' : '180° 회전';
  });

  // Speak current card
  speakBtn.addEventListener('click', () => {
    const filtered = getFilteredPocketCards();
    const card = filtered[state.activePocketIndex];
    if (card) {
      speakJapanese(card.jp, state.audioSpeed);
      showToast('🔊 큰 소리로 재생 중...');
    }
  });

  // Speed controls
  function setSpeed(speed) {
    state.audioSpeed = speed;
    storage.setAudioSpeed(speed);
    speed085Btn.classList.toggle('active', speed === 0.85);
    speed100Btn.classList.toggle('active', speed === 1.0);
    const mainSpeedBtn = document.getElementById('btn-audio-speed');
    if (mainSpeedBtn) mainSpeedBtn.innerHTML = `음성 속도: <strong>${speed}x</strong>`;
  }

  speed085Btn.addEventListener('click', () => setSpeed(0.85));
  speed100Btn.addEventListener('click', () => setSpeed(1.0));

  // Navigation
  prevBtn.addEventListener('click', () => navigatePocketModal(-1));
  nextBtn.addEventListener('click', () => navigatePocketModal(1));

  // Touch swipe support on modal container
  let touchStartX = 0;
  let touchStartY = 0;

  modalContainer.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: true }
  );

  modalContainer.addEventListener(
    'touchend',
    (e) => {
      const diffX = e.changedTouches[0].screenX - touchStartX;
      const diffY = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(diffX) > 45 && Math.abs(diffY) < 60) {
        if (diffX < 0) {
          navigatePocketModal(1); // Swipe left -> Next
        } else {
          navigatePocketModal(-1); // Swipe right -> Prev
        }
      }
    },
    { passive: true }
  );

  // Keyboard navigation
  if (!isPocketModalInitialized) {
    window.addEventListener('keydown', (e) => {
      if (!state.isPocketModalOpen) return;
      if (e.key === 'Escape') {
        closePocketModal();
      } else if (e.key === 'ArrowLeft') {
        navigatePocketModal(-1);
      } else if (e.key === 'ArrowRight') {
        navigatePocketModal(1);
      }
    });
    isPocketModalInitialized = true;
  }
}

function getFilteredPocketCards() {
  if (state.pocketCategory === 'all') return pocketCardsData;
  return pocketCardsData.filter((c) => c.category === state.pocketCategory);
}

function updatePocketModalContent() {
  const filtered = getFilteredPocketCards();
  if (state.activePocketIndex < 0) state.activePocketIndex = 0;
  if (state.activePocketIndex >= filtered.length) state.activePocketIndex = filtered.length - 1;

  const card = filtered[state.activePocketIndex];
  if (!card) return;

  const tagElem = document.getElementById('pocket-modal-tag');
  const counterElem = document.getElementById('pocket-modal-counter');
  const clerkMsgElem = document.getElementById('pocket-clerk-msg');
  const jpElem = document.getElementById('pocket-modal-jp');
  const pronElem = document.getElementById('pocket-modal-pron');
  const koElem = document.getElementById('pocket-modal-ko');
  const enElem = document.getElementById('pocket-modal-en');
  const contextElem = document.getElementById('pocket-modal-context');
  const bodyElem = document.getElementById('pocket-modal-body');
  const flipBtn = document.getElementById('pocket-btn-flip');
  const flipText = document.getElementById('pocket-flip-text');
  const prevBtn = document.getElementById('pocket-btn-prev');
  const nextBtn = document.getElementById('pocket-btn-next');
  const speed085Btn = document.getElementById('pocket-speed-085');
  const speed100Btn = document.getElementById('pocket-speed-100');

  if (tagElem) tagElem.textContent = card.categoryName;
  if (counterElem) counterElem.textContent = `${state.activePocketIndex + 1} / ${filtered.length}`;
  if (clerkMsgElem) clerkMsgElem.textContent = card.clerkMsg || '🇯🇵 店員さん、これをお願いします！';
  if (jpElem) jpElem.textContent = card.jp;
  if (pronElem) pronElem.textContent = card.pron;
  if (koElem) koElem.textContent = `👉 ${card.ko}`;
  if (enElem) {
    enElem.textContent = card.en ? `🇺🇸 ${card.en}` : '';
    enElem.style.display = card.en ? 'block' : 'none';
  }
  if (contextElem) contextElem.innerHTML = `💡 <strong>사용 상황:</strong> ${card.context}`;

  // Reset flip on card switch
  if (bodyElem) bodyElem.classList.toggle('is-flipped', state.isPocketFlipped);
  if (flipBtn) flipBtn.classList.toggle('active', state.isPocketFlipped);
  if (flipText) flipText.textContent = state.isPocketFlipped ? '원래대로' : '180° 회전';

  // Update speed button active states
  if (speed085Btn) speed085Btn.classList.toggle('active', state.audioSpeed === 0.85);
  if (speed100Btn) speed100Btn.classList.toggle('active', state.audioSpeed === 1.0);

  // Update prev/next button states
  if (prevBtn) prevBtn.disabled = state.activePocketIndex === 0;
  if (nextBtn) nextBtn.disabled = state.activePocketIndex === filtered.length - 1;
}

function openPocketModal(index) {
  setupPocketModalDOM();
  state.activePocketIndex = index;
  state.isPocketFlipped = false;
  state.isPocketModalOpen = true;

  updatePocketModalContent();

  const modal = document.getElementById('pocket-fullscreen-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closePocketModal() {
  state.isPocketModalOpen = false;
  state.isPocketFlipped = false;
  const modal = document.getElementById('pocket-fullscreen-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function navigatePocketModal(direction) {
  const filtered = getFilteredPocketCards();
  const nextIdx = state.activePocketIndex + direction;
  if (nextIdx >= 0 && nextIdx < filtered.length) {
    state.activePocketIndex = nextIdx;
    state.isPocketFlipped = false;
    updatePocketModalContent();
  }
}

function renderPocket(container) {
  setupPocketModalDOM();

  const pocketCategories = [
    { id: 'all', name: '전체 보기', count: pocketCardsData.length },
    { id: 'transit', name: '✈️ 공항 & 이동', count: pocketCardsData.filter((c) => c.category === 'transit').length },
    { id: 'hotel', name: '🏨 호텔', count: pocketCardsData.filter((c) => c.category === 'hotel').length },
    { id: 'dining', name: '🍜 식당 & 이자카야', count: pocketCardsData.filter((c) => c.category === 'dining').length },
    { id: 'shopping', name: '🛍️ 쇼핑 & 편의점', count: pocketCardsData.filter((c) => c.category === 'shopping').length },
    { id: 'emergency', name: '🚨 긴급 & 기타', count: pocketCardsData.filter((c) => c.category === 'emergency').length },
  ];

  const filteredCards = getFilteredPocketCards();

  let html = `
    <div class="content-card">
      <div class="card-header" style="margin-bottom: 8px;">
        <h2 class="card-title">🎒 점원에게 직접 보여주는 포켓 카드</h2>
        <span class="card-badge" style="background: #eff6ff; color: #1d4ed8; font-weight: 700;">📱 풀스크린 크게보기 레이어 지원</span>
      </div>
      <p style="font-size: 0.88rem; color: var(--color-text-muted); line-height: 1.55;">
        현지에서 발음이 헷갈리거나 시끄러운 식당에서는 <strong>카드를 탭하여 풀스크린 크게보기 모달</strong>을 띄우세요!<br />
        대형 일본어 폰트, 맞은편 점원 방향 <strong>180° 화면 회전</strong>, 그리고 <strong>대형 스피커 TTS 음성</strong>을 바로 지원합니다.
      </p>
    </div>

    <!-- Category Filter Tabs -->
    <div class="pocket-filter-bar">
      ${pocketCategories
        .map(
          (cat) => `
        <button class="pocket-filter-pill ${state.pocketCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}">
          ${cat.name} (${cat.count})
        </button>
      `
        )
        .join('')}
    </div>

    <!-- Pocket Cards Grid -->
    <div class="pocket-grid">
      ${filteredCards
        .map(
          (p, idx) => `
        <div class="pocket-card" data-idx="${idx}" data-audio="${p.jp}">
          <div>
            <div class="pocket-card-top">
              <span class="card-badge" style="background: var(--color-surface-muted); color: var(--color-text-main); font-weight: 700;">${p.categoryName}</span>
              <button class="audio-btn" data-audio="${p.jp}" title="음성 재생">🔊</button>
            </div>
            <div class="pocket-jp-big">${p.jp}</div>
            <div class="pocket-pron-sub">${p.pron}</div>
            <div class="pocket-ko-label">👉 ${p.ko}</div>
            ${p.en ? `<div class="pocket-en-label">🇺🇸 ${p.en}</div>` : ''}
          </div>
          <div class="pocket-card-footer-tip">
            <span>💡 ${p.context}</span>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;

  container.innerHTML = html;

  // Category filter clicks
  container.querySelectorAll('.pocket-filter-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.pocketCategory = btn.getAttribute('data-cat');
      renderPocket(container);
    });
  });

  // Card click -> Open Fullscreen Modal
  container.querySelectorAll('.pocket-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      // If clicking audio button directly, let audio button handler handle it
      if (e.target.closest('.audio-btn')) return;
      const idx = parseInt(card.getAttribute('data-idx'), 10);
      openPocketModal(idx);
    });
  });

  // Audio button click -> Speak directly without opening modal
  container.querySelectorAll('.audio-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-audio');
      if (text) {
        speakJapanese(text, state.audioSpeed);
        showToast('🔊 재생 중...');
      }
    });
  });
}

// ---------------------------------------------------------------------------
// 8. LocalStorage Backup & Restore Modal Layer
// ---------------------------------------------------------------------------
let isBackupModalInitialized = false;

function setupBackupModalDOM() {
  if (document.getElementById('backup-modal')) return;

  const modalHtml = `
    <div id="backup-modal" class="backup-modal-overlay" role="dialog" aria-modal="true" aria-label="학습 데이터 백업 및 복원">
      <div class="backup-modal-container" id="backup-modal-container">
        <!-- Header -->
        <div class="backup-modal-header">
          <div class="backup-modal-title-wrap">
            <span class="backup-modal-icon">💾</span>
            <div>
              <h2 class="backup-modal-title">학습 데이터 백업 & 불러오기</h2>
              <p class="backup-modal-desc">브라우저에 저장된 학습 진도를 파일로 내보내거나 기기간 복원할 수 있습니다.</p>
            </div>
          </div>
          <button class="backup-modal-close-btn" id="backup-btn-close" title="닫기 (ESC)">✕</button>
        </div>

        <div class="backup-modal-body">
          <!-- Live Storage Status Card -->
          <div class="backup-card">
            <div class="backup-card-header">
              <span class="backup-section-tag">📊 현재 저장된 학습 현황</span>
              <span class="backup-timestamp" id="backup-current-time"></span>
            </div>
            <div class="backup-stats-grid" id="backup-stats-grid"></div>
          </div>

          <!-- Section 1: 내보내기 (Export) -->
          <div class="backup-card">
            <div class="backup-card-header">
              <span class="backup-section-tag">📤 데이터 내보내기 (백업)</span>
            </div>
            <p class="backup-guide-text">
              지금까지 완료한 체크리스트, 외운 암기 카드, 모의고사 성적을 JSON 파일로 저장하거나 클립보드에 복사해 안전하게 보관하세요.
            </p>
            <div class="backup-action-row">
              <button class="backup-action-btn primary" id="btn-export-download">
                📥 JSON 파일로 다운로드
              </button>
              <button class="backup-action-btn secondary" id="btn-export-clipboard">
                📋 클립보드에 JSON 복사
              </button>
            </div>
          </div>

          <!-- Section 2: 불러오기 (Import) -->
          <div class="backup-card">
            <div class="backup-card-header">
              <span class="backup-section-tag">📥 데이터 불러오기 (복원)</span>
            </div>
            <p class="backup-guide-text">
              다른 스마트폰이나 PC에서 백업했던 데이터를 불러와 이어서 학습할 수 있습니다.
            </p>

            <!-- Option A: File Upload -->
            <div class="backup-import-method">
              <div class="backup-method-label">방법 1. 백업 JSON 파일 업로드</div>
              <div class="backup-file-upload-wrap">
                <input type="file" id="backup-file-input" accept=".json,application/json" style="display: none;" />
                <button class="backup-action-btn secondary" id="btn-trigger-file-input">
                  📁 백업 파일 선택 (.json)
                </button>
                <span class="backup-file-name" id="backup-file-name">선택된 파일 없음</span>
              </div>
            </div>

            <!-- Option B: Text Paste -->
            <div class="backup-import-method">
              <div class="backup-method-label">방법 2. 복사한 JSON 텍스트 직접 붙여넣기</div>
              <textarea
                id="backup-paste-input"
                class="backup-textarea"
                rows="3"
                placeholder="클립보드에 복사한 백업 JSON 텍스트를 여기에 붙여넣으세요..."
              ></textarea>
              <div style="margin-top: 8px;">
                <button class="backup-action-btn warning" id="btn-import-paste">
                  🔄 붙여넣은 데이터로 복원하기
                </button>
              </div>
            </div>
          </div>

          <!-- Section 3: Reset Zone -->
          <div class="backup-card danger-zone">
            <div class="backup-card-header">
              <span class="backup-section-tag danger">⚠️ 데이터 전체 초기화</span>
            </div>
            <p class="backup-guide-text">
              이 브라우저에 저장된 모든 학습 데이터(체크리스트, 암기 카드, 테스트 기록)를 영구 삭제합니다.
            </p>
            <button class="backup-action-btn danger" id="btn-modal-reset-all">
              🗑️ 모든 학습 데이터 완전 초기화
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  attachBackupModalEvents();
  isBackupModalInitialized = true;
}

function updateBackupStats() {
  const exportPayload = storage.exportData();
  const summary = exportPayload.summary;
  const timeElem = document.getElementById('backup-current-time');
  if (timeElem) {
    timeElem.textContent = `기준: ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }

  const grid = document.getElementById('backup-stats-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="backup-stat-item">
        <span class="stat-icon">✅</span>
        <span class="stat-val">${summary.checklistItemsCount}개</span>
        <span class="stat-lbl">체크리스트 완료</span>
      </div>
      <div class="backup-stat-item">
        <span class="stat-icon">🗂️</span>
        <span class="stat-val">${summary.masteredPhrasesCount}개</span>
        <span class="stat-lbl">외운 암기 카드</span>
      </div>
      <div class="backup-stat-item">
        <span class="stat-icon">📝</span>
        <span class="stat-val">${summary.quizHistoryCount}회</span>
        <span class="stat-lbl">모의고사 응시</span>
      </div>
      <div class="backup-stat-item">
        <span class="stat-icon">🎭</span>
        <span class="stat-val">${summary.roleplayDoneCount}개</span>
        <span class="stat-lbl">롤플레잉 완료</span>
      </div>
      <div class="backup-stat-item">
        <span class="stat-icon">💡</span>
        <span class="stat-val">${summary.miniQuizCount}개</span>
        <span class="stat-lbl">미니퀴즈 풀이</span>
      </div>
    `;
  }
}

function openBackupModal() {
  setupBackupModalDOM();
  updateBackupStats();
  const modal = document.getElementById('backup-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeBackupModal() {
  const modal = document.getElementById('backup-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function executeImport(parsedJson) {
  try {
    storage.importData(parsedJson);
    state.checklist = storage.getChecklist();
    state.masteredPhrases = new Set(storage.getMasteredPhrases());
    state.miniQuizAnswers = storage.getMiniQuizAnswers();
    state.audioSpeed = storage.getAudioSpeed();

    const speedBtn = document.getElementById('btn-audio-speed');
    if (speedBtn) {
      speedBtn.innerHTML = `음성 속도: <strong>${state.audioSpeed}x</strong>`;
    }

    updateBackupStats();
    renderCurrentTab();
    showToast('🎉 학습 데이터가 성공적으로 복원되었습니다!');
  } catch (err) {
    alert(`복원 실패: ${err.message}`);
  }
}

function attachBackupModalEvents() {
  const modal = document.getElementById('backup-modal');
  if (!modal) return;

  // Close handlers
  document.getElementById('backup-btn-close')?.addEventListener('click', closeBackupModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeBackupModal();
  });

  // Export: Download
  document.getElementById('btn-export-download')?.addEventListener('click', () => {
    const data = storage.exportData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `jp-study-backup-${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`📁 ${filename} 다운로드 완료!`);
  });

  // Export: Clipboard
  document.getElementById('btn-export-clipboard')?.addEventListener('click', async () => {
    const data = storage.exportData();
    const jsonString = JSON.stringify(data, null, 2);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonString);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = jsonString;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('📋 백업 데이터가 클립보드에 복사되었습니다!');
    } catch (err) {
      console.error('Clipboard copy error:', err);
      showToast('클립보드 복사 실패. 다운로드 기능을 이용해주세요.');
    }
  });

  // Import: File Trigger & Handle
  const fileInput = document.getElementById('backup-file-input');
  const triggerBtn = document.getElementById('btn-trigger-file-input');
  if (triggerBtn && fileInput) {
    triggerBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const fileNameElem = document.getElementById('backup-file-name');
      if (fileNameElem) fileNameElem.textContent = file.name;

      if (!confirm(`선택한 파일 [${file.name}]의 데이터로 현재 학습 진도를 복원하시겠습니까? 기존 데이터는 덮어씌워집니다.`)) {
        fileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          executeImport(parsed);
        } catch (parseErr) {
          alert('파일을 읽거나 JSON을 파싱하는 중 오류가 발생했습니다: ' + parseErr.message);
        } finally {
          fileInput.value = '';
        }
      };
      reader.onerror = () => {
        alert('파일 읽기 오류가 발생했습니다.');
        fileInput.value = '';
      };
      reader.readAsText(file, 'utf-8');
    });
  }

  // Import: Paste
  document.getElementById('btn-import-paste')?.addEventListener('click', () => {
    const textarea = document.getElementById('backup-paste-input');
    const text = textarea ? textarea.value.trim() : '';
    if (!text) {
      alert('붙여넣을 JSON 데이터를 입력해주세요.');
      return;
    }

    if (!confirm('입력한 JSON 데이터로 현재 학습 진도를 복원하시겠습니까? 기존 데이터는 덮어씌워집니다.')) {
      return;
    }

    try {
      const parsed = JSON.parse(text);
      executeImport(parsed);
      textarea.value = '';
    } catch (parseErr) {
      alert('유효한 JSON 텍스트 형식이 아닙니다: ' + parseErr.message);
    }
  });

  // Reset from modal
  document.getElementById('btn-modal-reset-all')?.addEventListener('click', () => {
    if (confirm('정말로 모든 학습 진도와 설정을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      storage.resetAll();
      state.checklist = {};
      state.masteredPhrases = new Set();
      state.miniQuizAnswers = {};
      state.audioSpeed = 0.85;

      const speedBtn = document.getElementById('btn-audio-speed');
      if (speedBtn) {
        speedBtn.innerHTML = `음성 속도: <strong>${state.audioSpeed}x</strong>`;
      }

      updateBackupStats();
      renderCurrentTab();
      showToast('학습 데이터가 모두 초기화되었습니다.');
    }
  });
}

// ---------------------------------------------------------------------------
// 9. Radio (미나 라디오)
// ---------------------------------------------------------------------------
function renderRadio(container) {
  const currentChapter = radioChapters.find((ch) => ch.id === state.radioCurrentChapterId) || radioChapters[0];
  const currentIndex = radioChapters.findIndex((ch) => ch.id === currentChapter.id);
  const nextChapter = currentIndex < radioChapters.length - 1 ? radioChapters[currentIndex + 1] : null;

  const basePath = import.meta.env.BASE_URL || '/';
  const audioPath = currentChapter.audioFile ? `${basePath}audio/${currentChapter.audioFile}` : null;

  container.innerHTML = `
    <div class="radio-container">
      <div class="radio-header">
        <h2>📻 미나 라디오</h2>
        <p class="radio-subtitle">운전 중에도 듣는 일본어 오디오북</p>
      </div>

      <div class="radio-chapters-list">
        ${radioChapters.map((ch, idx) => `
          <div class="radio-chapter-card ${ch.id === currentChapter.id ? 'active' : ''} ${!ch.available ? 'unavailable' : ''}"
               data-chapter-id="${ch.id}">
            <div class="chapter-number">Ch ${ch.number}</div>
            <div class="chapter-content">
              <h3>${ch.title}</h3>
              <p class="chapter-subtitle">${ch.titleJa}</p>
              <p class="chapter-desc">${ch.description}</p>
              <div class="chapter-meta">
                <span class="chapter-duration">⏱️ ${ch.duration}</span>
                ${ch.topics.map(t => `<span class="chapter-topic">${t}</span>`).join('')}
              </div>
              ${!ch.available ? '<div class="chapter-coming-soon">준비 중</div>' : ''}
            </div>
          </div>
        `).join('')}
      </div>

      ${currentChapter.available ? `
        <div class="radio-player-section">
          <div class="player-header">
            <h3>Ch ${currentChapter.number}: ${currentChapter.title}</h3>
            <span class="player-duration">${currentChapter.duration}</span>
          </div>

          <div class="audio-player-container">
            <audio id="radio-audio" preload="metadata">
              <source src="${audioPath}" type="audio/mpeg">
            </audio>

            <div class="player-progress">
              <div class="progress-time" id="current-time">0:00</div>
              <input type="range" id="progress-bar" class="progress-bar" min="0" max="100" value="0" step="0.1">
              <div class="progress-time" id="total-time">0:00</div>
            </div>

            <div class="player-controls">
              <button class="control-btn skip-btn" id="btn-skip-back" title="15초 뒤로">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  <text x="12" y="15" text-anchor="middle" font-size="8" fill="currentColor">15</text>
                </svg>
              </button>

              <button class="control-btn play-btn" id="btn-play" title="재생/일시정지">
                <svg id="play-icon" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <svg id="pause-icon" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style="display:none;">
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                </svg>
              </button>

              <button class="control-btn skip-btn" id="btn-skip-forward" title="15초 앞으로">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  <text x="12" y="15" text-anchor="middle" font-size="8" fill="currentColor">15</text>
                </svg>
              </button>
            </div>

            <div class="player-options">
              <div class="speed-control">
                <label>재생 속도:</label>
                <button class="speed-option ${state.radioSpeed === 0.85 ? 'active' : ''}" data-speed="0.85">0.85x</button>
                <button class="speed-option ${state.radioSpeed === 1.0 ? 'active' : ''}" data-speed="1.0">1.0x</button>
                <button class="speed-option ${state.radioSpeed === 1.25 ? 'active' : ''}" data-speed="1.25">1.25x</button>
              </div>
            </div>
          </div>

          ${currentChapter.segments.length > 0 ? `
            <div class="chapter-segments">
              <h4>📑 세그먼트 (클릭하여 이동)</h4>
              <div class="segments-list">
                ${currentChapter.segments.map((seg) => `
                  <button class="segment-item" data-time="${seg.time}">
                    <span class="segment-time">${seg.time}</span>
                    <span class="segment-title">${seg.title}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${nextChapter && nextChapter.available ? `
            <div class="auto-advance-notice">
              ✨ 이 챕터가 끝나면 자동으로 다음 챕터(Ch ${nextChapter.number}: ${nextChapter.title})로 이동합니다
            </div>
          ` : ''}
        </div>
      ` : `
        <div class="radio-unavailable">
          <p>이 챕터는 아직 준비 중입니다.</p>
        </div>
      `}
    </div>
  `;

  if (currentChapter.available && audioPath) {
    attachRadioPlayerEvents(currentChapter, nextChapter);
  }

  document.querySelectorAll('.radio-chapter-card').forEach((card) => {
    card.addEventListener('click', () => {
      const chapterId = card.getAttribute('data-chapter-id');
      const chapter = radioChapters.find((ch) => ch.id === chapterId);
      if (chapter && chapter.available) {
        state.radioCurrentChapterId = chapterId;
        updateUrlHash('radio', { chapter: chapterId });
        renderCurrentTab();
      }
    });
  });
}

function attachRadioPlayerEvents(currentChapter, nextChapter) {
  const audio = document.getElementById('radio-audio');
  const playBtn = document.getElementById('btn-play');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const progressBar = document.getElementById('progress-bar');
  const currentTimeEl = document.getElementById('current-time');
  const totalTimeEl = document.getElementById('total-time');
  const skipBackBtn = document.getElementById('btn-skip-back');
  const skipForwardBtn = document.getElementById('btn-skip-forward');

  if (!audio) return;

  const savedProgress = storage.getRadioProgress(currentChapter.id);
  let isProgressRestored = false;

  audio.playbackRate = state.radioSpeed;

  audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
    progressBar.max = audio.duration;

    if (savedProgress.currentTime > 0 && savedProgress.currentTime < audio.duration - 5) {
      audio.currentTime = savedProgress.currentTime;
      isProgressRestored = true;
    }
  });

  audio.addEventListener('timeupdate', () => {
    if (!isNaN(audio.duration)) {
      currentTimeEl.textContent = formatTime(audio.currentTime);
      progressBar.value = audio.currentTime;

      if (audio.currentTime > 5 || isProgressRestored) {
        storage.setRadioProgress(currentChapter.id, audio.currentTime, audio.duration);
      }
    }
  });

  audio.addEventListener('ended', () => {
    storage.setRadioProgress(currentChapter.id, 0, audio.duration);

    if (nextChapter && nextChapter.available) {
      showToast(`다음 챕터로 이동: Ch ${nextChapter.number}`);
      setTimeout(() => {
        state.radioCurrentChapterId = nextChapter.id;
        updateUrlHash('radio', { chapter: nextChapter.id });
        renderCurrentTab();
      }, 1500);
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
    }
  });

  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      updateMediaSession(currentChapter, audio);
    } else {
      audio.pause();
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
    }
  });

  skipBackBtn.addEventListener('click', () => {
    audio.currentTime = Math.max(0, audio.currentTime - 15);
  });

  skipForwardBtn.addEventListener('click', () => {
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 15);
  });

  progressBar.addEventListener('input', (e) => {
    audio.currentTime = e.target.value;
  });

  document.querySelectorAll('.speed-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.getAttribute('data-speed'));
      state.radioSpeed = speed;
      audio.playbackRate = speed;
      storage.setRadioSpeed(speed);

      document.querySelectorAll('.speed-option').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      showToast(`재생 속도: ${speed}x`);
    });
  });

  document.querySelectorAll('.segment-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const timeStr = btn.getAttribute('data-time');
      const seconds = parseTimeToSeconds(timeStr);
      audio.currentTime = seconds;
      if (audio.paused) {
        audio.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        updateMediaSession(currentChapter, audio);
      }
    });
  });

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => {
      audio.play();
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audio.pause();
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
    });

    navigator.mediaSession.setActionHandler('seekbackward', () => {
      audio.currentTime = Math.max(0, audio.currentTime - 15);
    });

    navigator.mediaSession.setActionHandler('seekforward', () => {
      audio.currentTime = Math.min(audio.duration, audio.currentTime + 15);
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime) {
        audio.currentTime = details.seekTime;
      }
    });
  }
}

function updateMediaSession(chapter, audio) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `Ch ${chapter.number}: ${chapter.title}`,
      artist: '미나 (JP Study R1)',
      album: '미나 라디오',
    });

    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      playbackRate: audio.playbackRate,
      position: audio.currentTime,
    });
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseTimeToSeconds(timeStr) {
  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

// Global ESC key listener for modals
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const backupModal = document.getElementById('backup-modal');
    if (backupModal && backupModal.classList.contains('active')) {
      closeBackupModal();
    }
  }
});

// Start application
renderApp();

if (!window.location.hash) {
  updateUrlHash(state.currentTab);
}
