/* ============================================
   Magic Multiples Maze — Levels & Data
   ============================================ */

const GAME_DATA = {
  // Encouragement messages
  encouragements: {
    success: [
      "رائع! 🌟 أحسنت!",
      "ممتاز! 💫 استمر!",
      "عظيم! ⭐ أنت بطل!",
      "مذهل! 🎉 هيا نكمل!",
      "برافو! 🏆 أنت نجم!",
      "خارق! 🚀 واصل!",
      "يا سلام! 💎 رائع جداً!",
      "هائل! ✨ أنت مبدع!",
    ],
    groupComplete: [
      "اكتملت مجموعة! ✅",
      "مجموعة كاملة! 💚",
      "أحسنت! مجموعة تمام! 🎯",
      "رائع! مجموعة جاهزة! 🌟",
    ],
    allComplete: [
      "🎉 ممتاز! الإجابة صحيحة!",
      "🏆 عبقري! حللت اللغز!",
      "⭐ رائع! فتحت البوابة!",
      "🌟 مذهل! أنت عالم رياضيات!",
    ],
    hint: [
      "💡 انظر للمجموعات واحسب الناتج!",
      "💡 كل مجموعة فيها نفس العدد!",
      "💡 اجمع عدد الأحجار في كل المجموعات!",
      "💡 فكر: كم مجموعة × كم في كل مجموعة؟",
      "💡 استبعد الإجابات البعيدة أولاً!",
    ],
    wrong: [
      "حاول مرة أخرى! 💪",
      "قريب! فكر مرة ثانية! 🤔",
      "لا بأس! جرب إجابة أخرى! 💡",
    ],
    levelComplete: [
      "🎊 أكملت المستوى! أنت رائع!",
      "🏅 مستوى كامل! هيا للتالي!",
      "🎉 ممتاز! أنهيت المستوى بنجاح!",
    ],
  },

  // Difficulty settings
  difficulty: {
    easy: {
      name: "سهل",
      emoji: "🟢",
      questionsCount: 5,
      maxMultiplier: 5,
      showGroups: true,
      showChoices: true,
      timeBonus: false,
      pointsPerQuestion: 20,
    },
    medium: {
      name: "متوسط",
      emoji: "🟡",
      questionsCount: 8,
      maxMultiplier: 9,
      showGroups: true,
      showChoices: true,
      timeBonus: false,
      pointsPerQuestion: 30,
    },
    hard: {
      name: "صعب",
      emoji: "🔴",
      questionsCount: 10,
      maxMultiplier: 12,
      showGroups: false,
      showChoices: true,
      timeBonus: true,
      pointsPerQuestion: 50,
    },
  },

  // Table display info
  tables: {
    2: { name: "جدول ٢", color: "#3b82f6", emoji: "2️⃣" },
    3: { name: "جدول ٣", color: "#8b5cf6", emoji: "3️⃣" },
    4: { name: "جدول ٤", color: "#22c55e", emoji: "4️⃣" },
    5: { name: "جدول ٥", color: "#f59e0b", emoji: "5️⃣" },
    6: { name: "جدول ٦", color: "#ef4444", emoji: "6️⃣" },
    7: { name: "جدول ٧", color: "#06b6d4", emoji: "7️⃣" },
    8: { name: "جدول ٨", color: "#ec4899", emoji: "8️⃣" },
    9: { name: "جدول ٩", color: "#f97316", emoji: "9️⃣" },
  },

  // Generate questions for a table and difficulty
  generateQuestions(table, difficulty) {
    const settings = this.difficulty[difficulty];
    const questions = [];
    const maxMult = Math.min(settings.maxMultiplier, 12);
    const multipliers = [];

    for (let i = 1; i <= maxMult; i++) {
      multipliers.push(i);
    }

    // Shuffle
    for (let i = multipliers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [multipliers[i], multipliers[j]] = [multipliers[j], multipliers[i]];
    }

    const count = Math.min(settings.questionsCount, multipliers.length);
    for (let i = 0; i < count; i++) {
      const mult = multipliers[i];
      const answer = table * mult;

      // For easy/medium: groups = min(table, mult), perGroup = max(table, mult)
      // Keep groups small for visual display (max 6)
      let groups, perGroup;
      if (table <= 6) {
        groups = table;
        perGroup = mult;
      } else if (mult <= 6) {
        groups = mult;
        perGroup = table;
      } else {
        groups = Math.min(table, mult, 4);
        perGroup = answer / groups;
      }

      // Generate wrong answers for choices
      const wrongAnswers = new Set();
      while (wrongAnswers.size < 3) {
        let wrong;
        const r = Math.random();
        if (r < 0.3) wrong = answer + Math.floor(Math.random() * 5) + 1;
        else if (r < 0.6) wrong = answer - Math.floor(Math.random() * 5) - 1;
        else wrong = table * (mult + (Math.random() > 0.5 ? 1 : -1));
        if (wrong > 0 && wrong !== answer && !wrongAnswers.has(wrong)) {
          wrongAnswers.add(Math.round(wrong));
        }
      }

      const choices = [answer, ...wrongAnswers];
      // Shuffle choices
      for (let k = choices.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [choices[k], choices[j]] = [choices[j], choices[k]];
      }

      questions.push({
        table,
        multiplier: mult,
        answer,
        groups: Math.round(groups),
        perGroup: Math.round(perGroup),
        displayA: table,
        displayB: mult,
        choices,
      });
    }

    return questions;
  },

  // Get random message
  getRandomMessage(category) {
    const msgs = this.encouragements[category];
    return msgs[Math.floor(Math.random() * msgs.length)];
  },

  // Calculate stars based on score percentage
  calculateStars(score, maxScore) {
    const pct = score / maxScore;
    if (pct >= 0.9) return 3;
    if (pct >= 0.7) return 2;
    if (pct >= 0.4) return 1;
    return 0;
  },
};
