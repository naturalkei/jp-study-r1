import './style.css';
import { curriculumData } from './data/curriculum.js';
import { cheatsheetData } from './data/cheatsheet.js';
import { phrasesData } from './data/phrases.js';
import { quizQuestions } from './data/quizzes.js';
import { roleplayScenarios } from './data/roleplay.js';
import { immigrationData } from './data/immigration.js';
import { dailyLessonsData } from './data/dailyLessons.js';
import { pocketCardsData } from './data/pocketCards.js';
import { initSpeech, speakJapanese } from './utils/speech.js';
import { storage } from './utils/storage.js';

// Application State
const state = {
  currentTab: 'daily-program',
  selectedDayId: 'D-8',
  programViewMode: 'lesson', // 'lesson' or 'roadmap'
  flashcardCategory: 'all',
  masteredPhrases: new Set(storage.getMasteredPhrases()),
  checklist: storage.getChecklist(),
  audioSpeed: storage.getAudioSpeed(),

  // Comprehensive Quiz State
  quizIndex: 0,
  quizScore: 0,
  selectedAnswer: null,
  quizFinished: false,

  // Roleplay State
  activeRoleplayId: roleplayScenarios[0].id,
  roleplayStepIndex: 0,
  roleplayLogs: [],

  // Immigration Simulation State
  immStepIndex: 0,
  immLogs: [],
  immSelectedChoice: null,

  // Daily Studio Mini Quiz State
  miniQuizAnswers: {}, // key: `${dayId}_${qIdx}` => selected option index

  // Pocket Card Fullscreen View State
  pocketCategory: 'all',
  activePocketIndex: 0,
  isPocketModalOpen: false,
  isPocketFlipped: false,
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
        <button class="tab-btn ${state.currentTab === 'immigration' ? 'active' : ''}" data-tab="immigration">
          ✈️ 공항 입출국심사
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
          <a href="#" id="link-reset-progress" class="footer-link">학습 진도 초기화</a>
        </div>
      </footer>
    </div>
  `;

  attachHeaderEvents();
  renderCurrentTab();
}

function attachHeaderEvents() {
  document.getElementById('nav-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    const targetTab = btn.getAttribute('data-tab');
    if (targetTab && targetTab !== state.currentTab) {
      closePocketModal();
      state.currentTab = targetTab;
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderCurrentTab();
    }
  });

  document.getElementById('btn-audio-speed').addEventListener('click', () => {
    state.audioSpeed = state.audioSpeed === 0.85 ? 1.0 : 0.85;
    storage.setAudioSpeed(state.audioSpeed);
    document.getElementById('btn-audio-speed').innerHTML = `음성 속도: <strong>${state.audioSpeed}x</strong>`;
    showToast(`일본어 음성 재생 속도: ${state.audioSpeed}x (${state.audioSpeed === 0.85 ? '학습용 느리게' : '보통 속도'})`);
  });

  document.getElementById('link-reset-progress').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('학습 체크리스트와 암기장 완료 상태를 모두 초기화하시겠습니까?')) {
      localStorage.clear();
      state.masteredPhrases = new Set();
      state.checklist = {};
      state.miniQuizAnswers = {};
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
    case 'immigration':
      renderImmigrationClinic(container);
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
        <button class="daily-nav-btn" id="btn-prev-day" ${currentIndex === 0 ? 'disabled' : ''}>
          👈 이전 날 (${currentIndex > 0 ? curriculumData[currentIndex - 1].id : ''})
        </button>
        <button class="daily-nav-btn" id="btn-next-day" ${currentIndex >= curriculumData.length - 1 ? 'disabled' : ''} style="background: var(--color-primary); color: white; border-color: var(--color-primary);">
          다음 날 (${currentIndex < curriculumData.length - 1 ? curriculumData[currentIndex + 1].id : '완료'}) 👉
        </button>
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
      renderDailyProgram(container);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Rail Button Click
  container.querySelectorAll('.day-rail-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedDayId = btn.getAttribute('data-dayid');
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
                <div style="background: var(--color-surface-muted); padding: 8px 12px; border-radius: 6px; font-size: 0.85rem;">
                  <div style="color: var(--color-accent); font-weight: 600; margin-bottom: 2px;">${item.q}</div>
                  ${item.q_en ? `<div style="color: #2563eb; font-size: 0.76rem; font-weight: 500; margin-bottom: 3px;">🇺🇸 ${item.q_en}</div>` : ''}
                  <div style="color: var(--color-primary); font-weight: 700;">👉 ${item.a}</div>
                  ${item.a_en ? `<div style="color: #1d4ed8; font-size: 0.76rem; font-weight: 600; margin-top: 2px;">🇺🇸 ${item.a_en}</div>` : ''}
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
// 4. Flashcards Tab
// ---------------------------------------------------------------------------
function renderFlashcards(container) {
  const filteredPhrases = phrasesData.filter((p) => {
    if (state.flashcardCategory === 'all') return true;
    return p.category === state.flashcardCategory;
  });

  const masteredCount = phrasesData.filter((p) => state.masteredPhrases.has(p.id)).length;

  let html = `
    <div class="content-card" style="margin-bottom: 14px;">
      <div class="card-header" style="margin-bottom: 8px;">
        <h2 class="card-title">🗂️ 상황별 실전 암기장</h2>
        <span class="card-badge">외운 카드: ${masteredCount} / ${phrasesData.length}</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--color-text-muted);">
        카드를 읽고 발음을 들어본 뒤, 완벽히 외워진 카드는 <strong>"외웠어요 🌟"</strong> 버튼을 눌러 체크하세요.
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

    <div class="cards-container">
      ${filteredPhrases
        .map((p) => {
          const isMastered = state.masteredPhrases.has(p.id);
          return `
          <div class="flashcard ${isMastered ? 'is-mastered' : ''}" id="card-${p.id}">
            <div class="flashcard-header">
              <span class="flashcard-category">${p.categoryName} • ${p.tag}</span>
              <button class="audio-btn" data-audio="${p.audio}">🔊</button>
            </div>
            <div class="flashcard-main">
              <div class="flashcard-jp">${p.jp}</div>
              <div class="flashcard-furigana">${p.furigana}</div>
              <div class="flashcard-pronounce">${p.pronounce}</div>
              <div class="flashcard-ko">${p.ko}</div>
              ${p.en ? `<div class="flashcard-en">🇺🇸 ${p.en}</div>` : ''}
              <div class="flashcard-note">💡 ${p.note}</div>
            </div>
            <div class="flashcard-footer">
              <span style="font-size: 0.72rem; color: var(--color-text-subtle);">${isMastered ? '암기 완료' : '학습 중'}</span>
              <button class="mastered-btn ${isMastered ? 'active' : ''}" data-id="${p.id}">
                ${isMastered ? '외웠어요 🌟' : '외우기 체크 ⬜'}
              </button>
            </div>
          </div>
        `;
        })
        .join('')}
    </div>
  `;

  container.innerHTML = html;

  container.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.flashcardCategory = btn.getAttribute('data-cat');
      renderFlashcards(container);
    });
  });

  container.querySelectorAll('.mastered-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const updated = storage.toggleMasteredPhrase(id);
      state.masteredPhrases = new Set(updated);
      renderFlashcards(container);
    });
  });

  container.querySelectorAll('.audio-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
    });
  });
}

// ---------------------------------------------------------------------------
// 5. Comprehensive Daily Test Tab
// ---------------------------------------------------------------------------
function renderTest(container) {
  if (state.quizFinished) {
    const percentage = Math.round((state.quizScore / quizQuestions.length) * 100);
    const passed = percentage >= 80;

    let html = `
      <div class="quiz-box" style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 54px; margin-bottom: 12px;">${passed ? '🎉' : '💪'}</div>
        <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 8px; color: var(--color-text-main);">
          ${passed ? '축하합니다! 테스트 통과!' : '조금만 더 복습해 볼까요?'}
        </h2>
        <p style="font-size: 1rem; color: var(--color-text-muted); margin-bottom: 24px;">
          최종 점수: <strong style="color: var(--color-primary); font-size: 1.4rem;">${state.quizScore} / ${quizQuestions.length}</strong> (${percentage}점)
        </p>

        <div style="display: inline-block; background: var(--color-surface-muted); padding: 16px 24px; border-radius: 12px; margin-bottom: 24px; text-align: left; max-width: 400px; width: 100%;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 6px;">
            ${passed ? '🏆 실전 준비 마스터 배지 획득!' : '💡 추천 학습 액션'}
          </div>
          <div style="font-size: 0.8rem; color: var(--color-text-muted);">
            ${passed ? '공항 입출국부터 가와구치코, 우에노까지 기본 회화를 완벽히 숙지하셨습니다!' : '일자별 학습실과 1초 치트시트를 10분간 다시 훑어본 후 재도전해보세요!'}
          </div>
        </div>

        <div>
          <button class="quiz-next-btn" id="btn-restart-quiz" style="max-width: 240px; margin: 0 auto;">
            🔄 다시 테스트 보기
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;
    document.getElementById('btn-restart-quiz').addEventListener('click', () => {
      state.quizIndex = 0;
      state.quizScore = 0;
      state.selectedAnswer = null;
      state.quizFinished = false;
      renderTest(container);
    });
    return;
  }

  const currentQ = quizQuestions[state.quizIndex];
  const isAnswered = state.selectedAnswer !== null;

  let html = `
    <div class="quiz-box">
      <div class="quiz-meta">
        <span class="card-badge">${currentQ.category}</span>
        <span style="font-weight: 700;">문제 ${state.quizIndex + 1} / ${quizQuestions.length}</span>
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
              else if (state.selectedAnswer === idx) stateClass = 'wrong';
            }
            return `
            <button class="quiz-option-btn ${stateClass}" data-idx="${idx}" ${isAnswered ? 'disabled' : ''}>
              <span>${idx + 1}. ${opt.text}</span>
              ${isAnswered && opt.isCorrect ? '<span>✅</span>' : ''}
              ${isAnswered && !opt.isCorrect && state.selectedAnswer === idx ? '<span>❌</span>' : ''}
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
        <button class="quiz-next-btn" id="btn-next-question">
          ${state.quizIndex + 1 < quizQuestions.length ? '다음 문제로 👉' : '결과 확인하기 🏁'}
        </button>
      `
          : ''
      }
    </div>
  `;

  container.innerHTML = html;

  container.querySelectorAll('.quiz-option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.selectedAnswer !== null) return;
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      state.selectedAnswer = idx;

      if (currentQ.options[idx].isCorrect) {
        state.quizScore++;
        showToast('정답입니다! 🎉');
      } else {
        showToast('아쉽네요! 해설을 확인해보세요.');
      }
      renderTest(container);
    });
  });

  const audioBtn = container.querySelector('.audio-btn');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const text = audioBtn.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
    });
  }

  const nextBtn = document.getElementById('btn-next-question');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (state.quizIndex + 1 < quizQuestions.length) {
        state.quizIndex++;
        state.selectedAnswer = null;
        renderTest(container);
      } else {
        state.quizFinished = true;
        storage.saveQuizResult(state.quizScore, quizQuestions.length);
        renderTest(container);
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 6. Roleplay Tab
// ---------------------------------------------------------------------------
function renderRoleplay(container) {
  const currentScenario = roleplayScenarios.find((s) => s.id === state.activeRoleplayId) || roleplayScenarios[0];
  const currentStep = currentScenario.steps[state.roleplayStepIndex];
  const isScenarioCompleted = state.roleplayStepIndex >= currentScenario.steps.length;

  let html = `
    <!-- Scenario Selection (Wrap-safe, never clipped) -->
    <div class="scenario-pill-wrap" style="margin-bottom: 20px;">
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
          <button class="quiz-next-btn" id="btn-next-scenario" style="max-width: 200px; margin: 0 auto;">
            다른 시나리오 도전 👉
          </button>
        </div>
      `
      }
    </div>
  `;

  container.innerHTML = html;

  container.querySelectorAll('.scenario-pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeRoleplayId = btn.getAttribute('data-scid');
      state.roleplayStepIndex = 0;
      state.roleplayLogs = [];
      renderRoleplay(container);
    });
  });

  const resetBtn = document.getElementById('btn-reset-scenario');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.roleplayStepIndex = 0;
      state.roleplayLogs = [];
      renderRoleplay(container);
    });
  }

  container.querySelectorAll('.audio-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
    });
  });

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
      renderRoleplay(container);
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
              <div class="pocket-card-actions">
                <button class="pocket-card-expand-btn" data-idx="${idx}" title="점원 제시용 크게보기">
                  <span>🔍</span> 크게보기
                </button>
                <button class="audio-btn" data-audio="${p.jp}" title="음성 재생">🔊</button>
              </div>
            </div>
            <div class="pocket-jp-big">${p.jp}</div>
            <div class="pocket-pron-sub">${p.pron}</div>
            <div class="pocket-ko-label">👉 ${p.ko}</div>
            ${p.en ? `<div class="pocket-en-label">🇺🇸 ${p.en}</div>` : ''}
          </div>
          <div class="pocket-card-footer-tip">
            <span>💡 ${p.context}</span>
            <span style="color: var(--color-primary); font-weight: 700;">📱 전면 제시</span>
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

  // Expand button click -> Open Fullscreen Modal
  container.querySelectorAll('.pocket-card-expand-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
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

// Start application
renderApp();
