import './style.css';
import { curriculumData } from './data/curriculum.js';
import { cheatsheetData } from './data/cheatsheet.js';
import { phrasesData } from './data/phrases.js';
import { quizQuestions } from './data/quizzes.js';
import { roleplayScenarios } from './data/roleplay.js';
import { initSpeech, speakJapanese } from './utils/speech.js';
import { storage } from './utils/storage.js';

// Application State
const state = {
  currentTab: 'milestones',
  flashcardCategory: 'all',
  masteredPhrases: new Set(storage.getMasteredPhrases()),
  checklist: storage.getChecklist(),
  audioSpeed: storage.getAudioSpeed(),
  // Quiz state
  quizIndex: 0,
  quizScore: 0,
  selectedAnswer: null,
  quizFinished: false,
  // Roleplay state
  activeRoleplayId: roleplayScenarios[0].id,
  roleplayStepIndex: 0,
  roleplayLogs: [],
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
              <p>도쿄·관광지 초밀착 속성 회화 과외</p>
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
            <span>관광지 (2박)</span>
            <span>➔</span>
            <span>우에노 (1박)</span>
          </div>
          <span class="trip-days-badge">3박 4일 코스</span>
        </div>
      </header>

      <nav class="nav-tabs" id="nav-tabs">
        <button class="tab-btn ${state.currentTab === 'milestones' ? 'active' : ''}" data-tab="milestones">
          📅 데일리 마일스톤
        </button>
        <button class="tab-btn ${state.currentTab === 'cheatsheet' ? 'active' : ''}" data-tab="cheatsheet">
          ⚡ 1초 치트시트
        </button>
        <button class="tab-btn ${state.currentTab === 'flashcards' ? 'active' : ''}" data-tab="flashcards">
          🗂️ 플래시 암기장
        </button>
        <button class="tab-btn ${state.currentTab === 'test' ? 'active' : ''}" data-tab="test">
          📝 실전 데일리 테스트
        </button>
        <button class="tab-btn ${state.currentTab === 'roleplay' ? 'active' : ''}" data-tab="roleplay">
          🎭 롤플레잉 시뮬레이션
        </button>
        <button class="tab-btn ${state.currentTab === 'pocket' ? 'active' : ''}" data-tab="pocket">
          🎒 여행자 포켓 카드
        </button>
      </nav>

      <main class="app-content" id="app-content">
        <!-- Tab Content dynamically injected here -->
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
  // Tab click
  document.getElementById('nav-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    const targetTab = btn.getAttribute('data-tab');
    if (targetTab && targetTab !== state.currentTab) {
      state.currentTab = targetTab;
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderCurrentTab();
    }
  });

  // Audio speed toggle
  document.getElementById('btn-audio-speed').addEventListener('click', () => {
    state.audioSpeed = state.audioSpeed === 0.85 ? 1.0 : 0.85;
    storage.setAudioSpeed(state.audioSpeed);
    document.getElementById('btn-audio-speed').innerHTML = `음성 속도: <strong>${state.audioSpeed}x</strong>`;
    showToast(`일본어 음성 재생 속도: ${state.audioSpeed}x (${state.audioSpeed === 0.85 ? '학습용 느리게' : '보통 속도'})`);
  });

  // Reset Progress
  document.getElementById('link-reset-progress').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('학습 체크리스트와 암기장 완료 상태를 모두 초기화하시겠습니까?')) {
      localStorage.clear();
      state.masteredPhrases = new Set();
      state.checklist = {};
      renderCurrentTab();
      showToast('학습 진도가 초기화되었습니다.');
    }
  });
}

function renderCurrentTab() {
  const container = document.getElementById('app-content');
  if (!container) return;

  switch (state.currentTab) {
    case 'milestones':
      renderMilestones(container);
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
      renderMilestones(container);
  }
}

// ---------------------------------------------------------------------------
// 1. Milestones Tab
// ---------------------------------------------------------------------------
function renderMilestones(container) {
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

  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  let html = `
    <div class="content-card" style="background: linear-gradient(to right, #ffffff, #f8fafc); border-left: 4px solid var(--color-primary);">
      <div class="card-header" style="margin-bottom: 8px;">
        <h2 class="card-title">📍 D-8 ~ D-Day 학습 마일스톤 달성률</h2>
        <span class="card-badge">${doneTasks} / ${totalTasks} 완료 (${progressPercent}%)</span>
      </div>
      <div style="background: #e2e8f0; height: 8px; border-radius: 9999px; overflow: hidden; margin-top: 6px;">
        <div style="background: var(--color-primary); height: 100%; width: ${progressPercent}%; transition: width 0.3s ease;"></div>
      </div>
    </div>
  `;

  html += curriculumData
    .map((day) => {
      return `
      <div class="milestone-day-card">
        <div class="milestone-header">
          <div class="day-badge-title">
            <span class="day-badge">${day.id}</span>
            <div>
              <h3 class="day-title">${day.title}</h3>
              <p class="day-date">${day.date} • ${day.badge}</p>
            </div>
          </div>
        </div>
        <p style="font-size: 0.88rem; color: var(--color-text-muted); margin-bottom: 14px;">${day.description}</p>

        <!-- 3-Step Daily Routine -->
        <div class="routine-section">
          <div class="routine-phase">
            <div class="phase-label">☀️ 아침 루틴 (10분 소리 내기)</div>
            <ul class="routine-list">
              ${day.routine.morning
                .map((task, idx) => {
                  const key = `${day.id}_morning_${idx}`;
                  const isChecked = !!state.checklist[key];
                  return `
                  <li class="routine-item ${isChecked ? 'done' : ''}" data-key="${key}">
                    <input type="checkbox" class="routine-checkbox" ${isChecked ? 'checked' : ''} />
                    <span>${task}</span>
                  </li>
                `;
                })
                .join('')}
            </ul>
          </div>

          <div class="routine-phase">
            <div class="phase-label">🍱 점심 루틴 (10분 퀴즈 & 단어)</div>
            <ul class="routine-list">
              ${day.routine.lunch
                .map((task, idx) => {
                  const key = `${day.id}_lunch_${idx}`;
                  const isChecked = !!state.checklist[key];
                  return `
                  <li class="routine-item ${isChecked ? 'done' : ''}" data-key="${key}">
                    <input type="checkbox" class="routine-checkbox" ${isChecked ? 'checked' : ''} />
                    <span>${task}</span>
                  </li>
                `;
                })
                .join('')}
            </ul>
          </div>

          <div class="routine-phase">
            <div class="phase-label">🌙 저녁 루틴 (10분 롤플레잉 & 복습)</div>
            <ul class="routine-list">
              ${day.routine.night
                .map((task, idx) => {
                  const key = `${day.id}_night_${idx}`;
                  const isChecked = !!state.checklist[key];
                  return `
                  <li class="routine-item ${isChecked ? 'done' : ''}" data-key="${key}">
                    <input type="checkbox" class="routine-checkbox" ${isChecked ? 'checked' : ''} />
                    <span>${task}</span>
                  </li>
                `;
                })
                .join('')}
            </ul>
          </div>
        </div>

        <!-- Key Phrases for the day -->
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--color-border);">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--color-text-muted); margin-bottom: 8px;">🔑 오늘 꼭 챙길 핵심 한마디</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${day.keyPhrases
              .map(
                (p) => `
              <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid var(--color-border); border-radius: 8px; padding: 8px 12px;">
                <div>
                  <div style="font-family: var(--font-jp); font-weight: 700; font-size: 0.95rem; color: var(--color-text-main);">${p.jp}</div>
                  <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">${p.pronounce} • <span style="color: var(--color-text-muted); font-weight: 400;">${p.ko}</span></div>
                </div>
                <button class="audio-btn" data-audio="${p.audio}" title="일본어 발음 듣기">🔊</button>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
    })
    .join('');

  container.innerHTML = html;

  // Events
  container.querySelectorAll('.routine-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      const checkbox = item.querySelector('.routine-checkbox');
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
      }
      const key = item.getAttribute('data-key');
      state.checklist[key] = checkbox.checked;
      storage.setChecklist(state.checklist);
      renderMilestones(container);
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
// 2. Cheat Sheet Tab
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
            <span class="formula-meaning">${f.meaning}</span>
          </div>
          <ul class="formula-examples">
            ${f.examples
              .map(
                (ex) => `
              <li class="formula-ex-item">
                <div class="formula-ex-text">
                  <span class="formula-ex-jp">${ex.jp}</span>
                  <span class="formula-ex-sub">${ex.pronounce} • ${ex.ko}</span>
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
                  <div style="color: var(--color-accent); font-weight: 600; margin-bottom: 3px;">${item.q}</div>
                  <div style="color: var(--color-primary); font-weight: 700;">👉 ${item.a}</div>
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
// 3. Flashcards Tab
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

  // Filter Buttons
  container.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.flashcardCategory = btn.getAttribute('data-cat');
      renderFlashcards(container);
    });
  });

  // Mastered Toggle
  container.querySelectorAll('.mastered-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const updated = storage.toggleMasteredPhrase(id);
      state.masteredPhrases = new Set(updated);
      renderFlashcards(container);
    });
  });

  // Audio Play
  container.querySelectorAll('.audio-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
    });
  });
}

// ---------------------------------------------------------------------------
// 4. Test (Daily Quiz) Tab
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
            ${passed ? '나리타 공항부터 관광지, 우에노까지 기본 회화를 완벽히 숙지하셨습니다!' : '1초 치트시트와 플래시 암기장을 10분간 다시 훑어본 후 재도전해보세요!'}
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

  // Option selection
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

  // Audio button
  const audioBtn = container.querySelector('.audio-btn');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const text = audioBtn.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
    });
  }

  // Next button
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
// 5. Roleplay Tab
// ---------------------------------------------------------------------------
function renderRoleplay(container) {
  const currentScenario = roleplayScenarios.find((s) => s.id === state.activeRoleplayId) || roleplayScenarios[0];
  const currentStep = currentScenario.steps[state.roleplayStepIndex];
  const isScenarioCompleted = state.roleplayStepIndex >= currentScenario.steps.length;

  let html = `
    <!-- Scenario Selection -->
    <div class="filter-tabs" style="margin-bottom: 16px;">
      ${roleplayScenarios
        .map(
          (sc) => `
        <button class="filter-btn ${sc.id === currentScenario.id ? 'active' : ''}" data-scid="${sc.id}">
          ${sc.title}
        </button>
      `
        )
        .join('')}
    </div>

    <div class="content-card">
      <div class="card-header">
        <div>
          <h2 class="card-title">${currentScenario.title}</h2>
          <p style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 2px;">📍 ${currentScenario.location}</p>
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
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--color-text-muted); margin-bottom: 10px;">
            💬 어떻게 대답할까요? (선택지를 터치하세요)
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${currentStep.options
              .map(
                (opt, idx) => `
              <button class="quiz-option-btn roleplay-choice-btn" data-idx="${idx}">
                <div>
                  <div style="font-family: var(--font-jp); font-weight: 700; color: var(--color-text-main); font-size: 0.95rem;">${opt.text}</div>
                  <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">${opt.pronounce}</div>
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

  // Scenario tabs
  container.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeRoleplayId = btn.getAttribute('data-scid');
      state.roleplayStepIndex = 0;
      state.roleplayLogs = [];
      renderRoleplay(container);
    });
  });

  // Reset scenario
  const resetBtn = document.getElementById('btn-reset-scenario');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.roleplayStepIndex = 0;
      state.roleplayLogs = [];
      renderRoleplay(container);
    });
  }

  // Audio Play
  container.querySelectorAll('.audio-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
    });
  });

  // Choice button click
  container.querySelectorAll('.roleplay-choice-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const chosen = currentStep.options[idx];

      // Add staff dialogue to logs
      state.roleplayLogs.push({
        speaker: 'staff',
        jp: currentStep.message,
        meaning: currentStep.meaning,
      });

      // Add user response to logs
      state.roleplayLogs.push({
        speaker: 'user',
        jp: chosen.text,
        meaning: chosen.meaning,
      });

      // Pronounce user phrase
      speakJapanese(chosen.text, state.audioSpeed);

      showToast(chosen.feedback);
      state.roleplayStepIndex++;
      renderRoleplay(container);
    });
  });

  // Next Scenario
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
// 6. Pocket Mode Tab (Show directly to Staff)
// ---------------------------------------------------------------------------
function renderPocket(container) {
  const essentialPocketPhrases = [
    {
      jp: '河口湖行きのバスのチケットを2枚ください',
      pron: '관광지 유키노 바스노 치켓토오 니마이 쿠다사이',
      ko: '관광지행 버스표 2장 주세요',
      tag: '공항 버스',
    },
    {
      jp: 'チェックイン前に荷物を預けることはできますか？',
      pron: '체크인 마에니 니모츠오 아즈케루 코토와 데키마스카?',
      ko: '체크인 전에 짐 좀 맡아주실 수 있나요?',
      tag: '호텔 프런트',
    },
    {
      jp: '名物ほうとうを2つとお冷をお願いします',
      pron: '메-부츠 호-토-오 후타츠토 오히야오 오네가이시마스',
      ko: '명물 호우토우 2개와 물 부탁합니다',
      tag: '후지산 맛집',
    },
    {
      jp: 'とりあえず生ビール2つお願いします！',
      pron: '토리아에즈 나마비-루 후타츠 오네가이시마스!',
      ko: '우선 생맥주 2잔 주세요!',
      tag: '이자카야',
    },
    {
      jp: 'お会計をお願いします。カードは使えますか？',
      pron: '오카이케이오 오네가이시마스. 카-도와 츠카에마스카?',
      ko: '계산서 부탁합니다. 카드 결제 되나요?',
      tag: '식당/계산',
    },
    {
      jp: '袋は大丈夫です',
      pron: '후쿠로와 다이죠-부데스',
      ko: '비닐봉투는 필요 없습니다 (괜찮습니다)',
      tag: '편의점',
    },
    {
      jp: '免税会計をお願いします',
      pron: '멘제- 카이케이오 오네가이시마스',
      ko: '면세(Tax-Free) 계산 부탁드립니다',
      tag: '쇼핑/돈키',
    },
    {
      jp: 'スパ（大浴場）は何時から何時までですか？',
      pron: '스파와 난지카라 난지마데데스카?',
      ko: '스파(대욕장)는 몇 시부터 몇 시까지인가요?',
      tag: '칸데오 호텔',
    },
    {
      jp: '成田空港までのスカイライナーを2枚お願いします',
      pron: '나리타 쿠-코-마데노 스카이라이나-오 니마이 오네가이시마스',
      ko: '나리타 공항행 스카이라이너 2장 부탁합니다',
      tag: '귀국/우에노',
    },
    {
      jp: 'トイレはどこですか？',
      pron: '토이레와 도코데스카?',
      ko: '화장실은 어디인가요?',
      tag: '긴급/공통',
    },
  ];

  let html = `
    <div class="content-card">
      <div class="card-header" style="margin-bottom: 8px;">
        <h2 class="card-title">🎒 점원에게 직접 보여주는 포켓 카드</h2>
        <span class="card-badge">현지 실전용</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--color-text-muted);">
        현지에서 발음이 헷갈리거나 시끄러운 식당에서는 <strong>화면을 점원에게 직접 보여주거나</strong> 소리 버튼을 누르세요!
      </p>
    </div>

    <div class="pocket-grid">
      ${essentialPocketPhrases
        .map(
          (p) => `
        <div class="pocket-card" data-audio="${p.jp}">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <span class="card-badge" style="background: var(--color-surface-muted); color: var(--color-text-muted);">${p.tag}</span>
              <button class="audio-btn" data-audio="${p.jp}">🔊</button>
            </div>
            <div class="pocket-jp-big">${p.jp}</div>
            <div class="pocket-pron-sub">${p.pron}</div>
          </div>
          <div class="pocket-ko-label">👉 ${p.ko}</div>
        </div>
      `
        )
        .join('')}
    </div>
  `;

  container.innerHTML = html;

  container.querySelectorAll('.pocket-card').forEach((card) => {
    card.addEventListener('click', () => {
      const text = card.getAttribute('data-audio');
      if (text) speakJapanese(text, state.audioSpeed);
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

// Start application
renderApp();
