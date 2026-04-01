/* ============================================
   Magic Multiples Maze — Game Engine v2
   With challenge mechanics, hearts, maze path
   ============================================ */

class MagicMazeGame {
  constructor() {
    const params = new URLSearchParams(window.location.search);
    this.table = parseInt(params.get('table')) || 3;
    this.difficultyKey = params.get('difficulty') || 'easy';
    this.diffSettings = GAME_DATA.difficulty[this.difficultyKey];

    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.hearts = 3;
    this.maxHearts = 3;
    this.attemptsOnCurrent = 0;
    this.isAnimating = false;
    this.correctAnswers = 0;
    this.firstTryCorrect = 0;
    this.timerValue = 0;
    this.timerInterval = null;
    this.hintTimer = null;
    this.particles = null;

    this.init();
  }

  init() {
    this.particles = new ParticleSystem('particleCanvas');
    this.questions = GAME_DATA.generateQuestions(this.table, this.difficultyKey);
    this.setupDOM();
    this.createMazePath();
    this.loadQuestion();
  }

  setupDOM() {
    this.dom = {
      scoreValue: document.getElementById('scoreValue'),
      levelLabel: document.getElementById('levelLabel'),
      questionNum: document.getElementById('questionNum'),
      numA: document.getElementById('numA'),
      numB: document.getElementById('numB'),
      answerDisplay: document.getElementById('answerDisplay'),
      choicesArea: document.getElementById('choicesArea'),
      visualHint: document.getElementById('visualHint'),
      zekiSpeech: document.getElementById('zekiSpeech'),
      progressFill: document.getElementById('progressFill'),
      progressText: document.getElementById('progressText'),
      feedbackBanner: document.getElementById('feedbackBanner'),
      gameMain: document.getElementById('gameMain'),
      backBtn: document.getElementById('backBtn'),
      mazePath: document.getElementById('mazePath'),
      heartsContainer: document.getElementById('heartsContainer'),
      timerContainer: document.getElementById('timerContainer'),
      timerFill: document.getElementById('timerFill'),
      timerText: document.getElementById('timerText'),
    };

    const tableInfo = GAME_DATA.tables[this.table];
    this.dom.levelLabel.textContent = `${tableInfo.name} - ${this.diffSettings.name}`;
    this.dom.backBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
    this.renderHearts();
    this.updateProgress();
  }

  renderHearts() {
    this.dom.heartsContainer.innerHTML = '';
    for (let i = 0; i < this.maxHearts; i++) {
      const heart = document.createElement('span');
      heart.className = `heart-icon ${i < this.hearts ? 'alive' : 'dead'}`;
      heart.textContent = i < this.hearts ? '❤️' : '🖤';
      heart.id = `heart-${i}`;
      this.dom.heartsContainer.appendChild(heart);
    }
  }

  createMazePath() {
    this.dom.mazePath.innerHTML = '';
    const total = this.questions.length;
    for (let i = 0; i < total; i++) {
      const node = document.createElement('div');
      node.className = 'maze-node upcoming';
      node.id = `maze-node-${i}`;
      const inner = document.createElement('div');
      inner.className = 'maze-node-inner';
      inner.textContent = i + 1;
      node.appendChild(inner);
      this.dom.mazePath.appendChild(node);
      if (i < total - 1) {
        const conn = document.createElement('div');
        conn.className = 'maze-connector upcoming';
        conn.id = `maze-conn-${i}`;
        this.dom.mazePath.appendChild(conn);
      }
    }
    // Castle
    const lastConn = document.createElement('div');
    lastConn.className = 'maze-connector upcoming';
    lastConn.id = `maze-conn-${total - 1}`;
    this.dom.mazePath.appendChild(lastConn);
    const castle = document.createElement('div');
    castle.className = 'maze-node maze-castle upcoming';
    castle.id = 'maze-castle';
    castle.innerHTML = '<div class="maze-node-inner">🏰</div>';
    this.dom.mazePath.appendChild(castle);
    this.updateMazePath();
  }

  updateMazePath() {
    const total = this.questions.length;
    for (let i = 0; i < total; i++) {
      const node = document.getElementById(`maze-node-${i}`);
      const conn = document.getElementById(`maze-conn-${i}`);
      // Remove old avatar
      const oldAv = node.querySelector('.maze-avatar');
      if (oldAv) oldAv.remove();

      if (i < this.currentIndex) {
        node.className = 'maze-node completed';
        if (conn) conn.className = 'maze-connector completed';
      } else if (i === this.currentIndex) {
        node.className = 'maze-node current';
        if (conn) conn.className = 'maze-connector upcoming';
        const avatar = document.createElement('div');
        avatar.className = 'maze-avatar';
        avatar.textContent = '👧🏻';
        node.appendChild(avatar);
      } else {
        node.className = 'maze-node upcoming';
        if (conn) conn.className = 'maze-connector upcoming';
      }
    }
    const castle = document.getElementById('maze-castle');
    castle.className = this.currentIndex >= total ? 'maze-node maze-castle completed' : 'maze-node maze-castle upcoming';

    // Scroll current into view
    const cur = document.getElementById(`maze-node-${Math.min(this.currentIndex, total - 1)}`);
    if (cur) cur.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  loadQuestion() {
    if (this.currentIndex >= this.questions.length) {
      this.showLevelComplete();
      return;
    }
    const q = this.questions[this.currentIndex];
    this.attemptsOnCurrent = 0;
    this.isAnimating = false;

    this.dom.numA.textContent = q.displayA;
    this.dom.numB.textContent = q.displayB;
    this.dom.answerDisplay.innerHTML = '<span class="question-mark">❓</span>';
    this.dom.questionNum.textContent = `${this.currentIndex + 1} / ${this.questions.length}`;

    // Visual hint for easy/medium
    if (this.diffSettings.showGroups) {
      this.createVisualHint(q);
    } else {
      this.dom.visualHint.innerHTML = '';
      this.dom.visualHint.classList.add('hidden');
    }

    this.showChoices(q);
    this.updateZeki('🎯 اختر الإجابة الصحيحة!');

    // Timer for hard mode
    if (this.diffSettings.timeBonus) {
      this.startTimer();
    } else {
      this.dom.timerContainer.classList.add('hidden');
    }

    this.updateMazePath();
    this.updateProgress();

    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => {
      if (!this.isAnimating) this.updateZeki(GAME_DATA.getRandomMessage('hint'));
    }, 8000);
  }

  createVisualHint(q) {
    this.dom.visualHint.classList.remove('hidden');
    this.dom.visualHint.innerHTML = '';

    const label = document.createElement('p');
    label.className = 'visual-hint-label';
    label.textContent = `💡 ${q.displayA} × ${q.displayB} = ${q.groups} مجموعات × ${q.perGroup} في كل مجموعة`;
    this.dom.visualHint.appendChild(label);

    const groupsContainer = document.createElement('div');
    groupsContainer.className = 'visual-hint-groups';
    for (let g = 0; g < Math.min(q.groups, 6); g++) {
      const group = document.createElement('div');
      group.className = 'visual-hint-group';
      for (let j = 0; j < Math.min(q.perGroup, 10); j++) {
        const gem = document.createElement('div');
        gem.className = 'visual-hint-gem';
        group.appendChild(gem);
      }
      const gl = document.createElement('div');
      gl.className = 'visual-hint-group-label';
      gl.textContent = q.perGroup;
      group.appendChild(gl);
      groupsContainer.appendChild(group);
    }
    this.dom.visualHint.appendChild(groupsContainer);
  }

  showChoices(q) {
    this.dom.choicesArea.innerHTML = '';
    q.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = 'answer-choice';
      btn.textContent = choice;
      btn.style.animation = `bounceIn 0.4s var(--ease-bounce) ${i * 0.08}s both`;
      btn.addEventListener('click', () => this.handleChoice(btn, choice));
      this.dom.choicesArea.appendChild(btn);
    });
  }

  handleChoice(btnEl, value) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    const q = this.questions[this.currentIndex];

    if (value === q.answer) {
      this.handleCorrect(btnEl);
    } else {
      this.handleWrong(btnEl);
    }
  }

  handleCorrect(btnEl) {
    const q = this.questions[this.currentIndex];
    this.stopTimer();
    this.correctAnswers++;

    // Points: more for first try
    let points = this.diffSettings.pointsPerQuestion;
    if (this.attemptsOnCurrent === 0) {
      this.firstTryCorrect++;
    } else {
      points = Math.max(5, Math.floor(points / (this.attemptsOnCurrent + 1)));
    }
    this.score += points;
    this.dom.scoreValue.textContent = this.score;

    // Visual feedback
    btnEl.classList.add('correct');
    this.dom.answerDisplay.innerHTML = `<span class="question-answer revealed">${q.answer}</span>`;

    this.showFeedback(`🎉 ${GAME_DATA.getRandomMessage('success')}`, 'success');
    this.updateZeki(`✅ أحسنت! ${q.displayA} × ${q.displayB} = ${q.answer}`);

    // Particles
    const rect = btnEl.getBoundingClientRect();
    this.particles.emitSuccess(rect.left + rect.width / 2, rect.top + rect.height / 2);

    // Disable all choices
    this.dom.choicesArea.querySelectorAll('.answer-choice').forEach(b => {
      b.style.pointerEvents = 'none';
    });

    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    setTimeout(() => {
      this.currentIndex++;
      this.isAnimating = false;
      this.loadQuestion();
    }, 1800);
  }

  handleWrong(btnEl) {
    this.attemptsOnCurrent++;

    // Visual error
    btnEl.classList.add('wrong');
    this.dom.gameMain.classList.add('screen-shake');
    setTimeout(() => this.dom.gameMain.classList.remove('screen-shake'), 400);

    // Error particles
    const rect = btnEl.getBoundingClientRect();
    this.particles.emitError(rect.left + rect.width / 2, rect.top + rect.height / 2);

    // Lose heart
    this.hearts--;
    this.renderHearts();
    const heartEl = document.getElementById(`heart-${this.hearts}`);
    if (heartEl) heartEl.style.animation = 'heartBreak 0.5s ease forwards';

    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    this.showFeedback(GAME_DATA.getRandomMessage('wrong'), 'error');

    // Smart hint from Zeki
    const q = this.questions[this.currentIndex];
    if (this.attemptsOnCurrent === 1) {
      this.updateZeki(`💡 تذكر: ${q.displayA} × ${q.displayB} يعني ${q.groups} مجموعات كل واحدة فيها ${q.perGroup}`);
    } else if (this.attemptsOnCurrent === 2) {
      this.updateZeki(`💡 الإجابة قريبة من ${q.answer - 2} أو ${q.answer + 2}... فكر مرة ثانية!`);
    } else {
      this.updateZeki(GAME_DATA.getRandomMessage('hint'));
    }

    // Game over check
    if (this.hearts <= 0) {
      setTimeout(() => this.gameOver(), 800);
      return;
    }

    // Disable wrong choice, allow retry
    setTimeout(() => {
      btnEl.disabled = true;
      btnEl.classList.remove('wrong');
      this.isAnimating = false;
    }, 600);
  }

  startTimer() {
    this.stopTimer();
    this.dom.timerContainer.classList.remove('hidden');
    this.timerValue = 15;
    this.dom.timerText.textContent = this.timerValue;
    this.dom.timerFill.style.width = '100%';
    this.dom.timerFill.classList.remove('danger');

    this.timerInterval = setInterval(() => {
      this.timerValue--;
      this.dom.timerText.textContent = Math.max(0, this.timerValue);
      this.dom.timerFill.style.width = `${(this.timerValue / 15) * 100}%`;
      if (this.timerValue <= 5) this.dom.timerFill.classList.add('danger');

      if (this.timerValue <= 0) {
        this.stopTimer();
        this.hearts--;
        this.renderHearts();
        this.showFeedback('⏰ انتهى الوقت!', 'error');
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

        if (this.hearts <= 0) {
          setTimeout(() => this.gameOver(), 800);
        } else {
          this.updateZeki('⏰ الوقت انتهى! حاول أسرع هذه المرة!');
          // Skip to next question
          setTimeout(() => {
            this.currentIndex++;
            this.isAnimating = false;
            this.loadQuestion();
          }, 1500);
        }
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  gameOver() {
    this.stopTimer();
    clearTimeout(this.hintTimer);

    const overlay = document.createElement('div');
    overlay.className = 'overlay active';
    overlay.innerHTML = `
      <div class="overlay-content game-over">
        <div class="game-over-icon">💔</div>
        <div class="game-over-title">انتهت المحاولات!</div>
        <p class="game-over-message">لا تقلق! كل بطل يحتاج للتمرين 💪<br>حاول مرة أخرى وستنجح!</p>
        <div class="level-complete-stats">
          <div class="level-stat">
            <span class="level-stat-label">✅ إجابات صحيحة</span>
            <span class="level-stat-value">${this.correctAnswers} / ${this.questions.length}</span>
          </div>
          <div class="level-stat">
            <span class="level-stat-label">💎 النتيجة</span>
            <span class="level-stat-value">${this.score}</span>
          </div>
          <div class="level-stat">
            <span class="level-stat-label">📍 وصلت إلى</span>
            <span class="level-stat-value">البوابة ${this.currentIndex + 1}</span>
          </div>
        </div>
        <div class="level-actions">
          <button class="btn btn-primary" id="retryBtn">🔄 حاول مرة أخرى</button>
          <button class="btn btn-gold" id="homeBtn">🏠 القائمة الرئيسية</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    this.particles.emitError(window.innerWidth / 2, window.innerHeight / 2);
    overlay.querySelector('#retryBtn').addEventListener('click', () => location.reload());
    overlay.querySelector('#homeBtn').addEventListener('click', () => { window.location.href = 'index.html'; });
  }

  showLevelComplete() {
    this.stopTimer();
    clearTimeout(this.hintTimer);
    const maxScore = this.questions.length * this.diffSettings.pointsPerQuestion;
    const stars = GAME_DATA.calculateStars(this.score, maxScore);

    const overlay = document.createElement('div');
    overlay.className = 'overlay active';
    overlay.innerHTML = `
      <div class="overlay-content level-complete">
        <div class="level-complete-title">🎊 ${GAME_DATA.getRandomMessage('levelComplete')}</div>
        <div class="stars-container">
          <span class="star ${stars >= 1 ? 'active' : ''}">⭐</span>
          <span class="star ${stars >= 2 ? 'active' : ''}">⭐</span>
          <span class="star ${stars >= 3 ? 'active' : ''}">⭐</span>
        </div>
        <div class="level-complete-stats">
          <div class="level-stat">
            <span class="level-stat-label">🎯 إجابات صحيحة</span>
            <span class="level-stat-value">${this.correctAnswers} / ${this.questions.length}</span>
          </div>
          <div class="level-stat">
            <span class="level-stat-label">⚡ من أول محاولة</span>
            <span class="level-stat-value">${this.firstTryCorrect} / ${this.questions.length}</span>
          </div>
          <div class="level-stat">
            <span class="level-stat-label">💎 النتيجة</span>
            <span class="level-stat-value">${this.score}</span>
          </div>
          <div class="level-stat">
            <span class="level-stat-label">❤️ القلوب المتبقية</span>
            <span class="level-stat-value">${this.hearts} / ${this.maxHearts}</span>
          </div>
        </div>
        <div class="level-actions">
          <button class="btn btn-primary" id="replayBtn">🔄 إعادة المستوى</button>
          <button class="btn btn-gold" id="homeBtn">🏠 القائمة الرئيسية</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    this.particles.emitCelebration();

    const starEls = overlay.querySelectorAll('.star.active');
    starEls.forEach((s, i) => {
      s.style.animation = `starPop 0.6s var(--ease-bounce) ${i * 0.3 + 0.5}s both`;
    });

    overlay.querySelector('#replayBtn').addEventListener('click', () => location.reload());
    overlay.querySelector('#homeBtn').addEventListener('click', () => { window.location.href = 'index.html'; });
  }

  showFeedback(message, type = 'success') {
    const b = this.dom.feedbackBanner;
    b.textContent = message;
    b.className = `feedback-banner ${type} show`;
    setTimeout(() => b.classList.remove('show'), 2000);
  }

  updateZeki(message) {
    this.dom.zekiSpeech.textContent = message;
    this.dom.zekiSpeech.style.animation = 'none';
    this.dom.zekiSpeech.offsetHeight;
    this.dom.zekiSpeech.style.animation = 'slideUp 0.4s var(--ease-out)';
  }

  updateProgress() {
    const total = this.questions.length;
    const pct = total > 0 ? (this.currentIndex / total) * 100 : 0;
    this.dom.progressFill.style.width = pct + '%';
    this.dom.progressText.textContent = `${this.currentIndex} / ${total}`;
  }
}

document.addEventListener('DOMContentLoaded', () => { new MagicMazeGame(); });
