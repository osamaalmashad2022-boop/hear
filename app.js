/* ============================================
   Magic Multiples Maze — Main Page Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let selectedTable = null;
  let selectedDifficulty = null;

  // Elements
  const tableCards = document.querySelectorAll('.table-card');
  const difficultyBtns = document.querySelectorAll('.difficulty-btn');
  const startBtn = document.getElementById('startBtn');
  const instructionsBtn = document.getElementById('instructionsBtn');
  const instructionsOverlay = document.getElementById('instructionsOverlay');
  const closeInstructionsBtn = document.getElementById('closeInstructions');

  // Floating symbols
  createFloatingSymbols();

  // Table selection
  tableCards.forEach(card => {
    card.addEventListener('click', () => {
      tableCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedTable = parseInt(card.dataset.table);
      checkReady();
      // Ripple effect
      createRipple(card);
    });
  });

  // Difficulty selection
  difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      difficultyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDifficulty = btn.dataset.difficulty;
      checkReady();
      createRipple(btn);
    });
  });

  // Start button
  startBtn.addEventListener('click', () => {
    if (!selectedTable || !selectedDifficulty) return;
    // Navigate to game
    const params = new URLSearchParams({
      table: selectedTable,
      difficulty: selectedDifficulty,
    });
    window.location.href = `game.html?${params.toString()}`;
  });

  // Instructions
  if (instructionsBtn && instructionsOverlay) {
    instructionsBtn.addEventListener('click', () => {
      instructionsOverlay.classList.add('active');
    });
    closeInstructionsBtn.addEventListener('click', () => {
      instructionsOverlay.classList.remove('active');
    });
    instructionsOverlay.addEventListener('click', (e) => {
      if (e.target === instructionsOverlay) {
        instructionsOverlay.classList.remove('active');
      }
    });
  }

  function checkReady() {
    if (selectedTable && selectedDifficulty) {
      startBtn.classList.add('ready');
      startBtn.disabled = false;
    }
  }

  function createRipple(el) {
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: 20px; height: 20px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      transform: scale(0);
      animation: ripple 0.6s ease-out forwards;
      pointer-events: none;
      top: 50%; left: 50%;
      margin-top: -10px; margin-left: -10px;
    `;
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  function createFloatingSymbols() {
    const container = document.querySelector('.floating-symbols');
    if (!container) return;
    const symbols = ['×', '=', '÷', '+', '−', '2', '3', '4', '5', '6', '7', '8', '9', '✨', '💎', '⭐'];

    for (let i = 0; i < 20; i++) {
      const sym = document.createElement('div');
      sym.className = 'floating-symbol';
      sym.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      sym.style.left = Math.random() * 100 + '%';
      sym.style.fontSize = (Math.random() * 1.5 + 0.8) + 'rem';
      sym.style.animationDuration = (Math.random() * 15 + 10) + 's';
      sym.style.animationDelay = (Math.random() * 10) + 's';
      container.appendChild(sym);
    }
  }

  // Entrance animations with stagger
  const animElements = document.querySelectorAll('[data-animate]');
  animElements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    setTimeout(() => {
      el.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 150 * i + 200);
  });
});
