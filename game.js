// نقرأ الصفحة الأولى من الشيت مباشرة بدون تسميات عبر gid=0
const SHEET_ID = '1wDdj4cnnBZ8CK63TPe2pvgZ44O_1VTyy9wgYPSeYSss';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=0`;

let stages = [];
let currentPlayingStage = 1;
let userGuess = [];

let playerData = {
  name: 'saleh',
  maxStage: 1,
  coins: 150
};

// فحص الحساب
function checkExistingUser() {
  const saved = localStorage.getItem('fetnah_game_player_v4');
  if (saved) {
    try { playerData = JSON.parse(saved); } catch(e) {}
  }
  updateUI();
  renderMapNodes();
  showScreen('screen-home');
}

function loginUser() {
  const nameInput = document.getElementById('player-name-input');
  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) return alert("يرجى إدخال اسمك!");
  playerData.name = name;
  savePlayerData();
  updateUI();
  renderMapNodes();
  showScreen('screen-home');
}

function savePlayerData() {
  localStorage.setItem('fetnah_game_player_v4', JSON.stringify(playerData));
}

function updateUI() {
  const nameEl = document.getElementById('display-player-name');
  if (nameEl) nameEl.innerText = playerData.name || 'اللاعب';
  ['home-coins', 'map-coins', 'game-coins'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = playerData.coins;
  });
}

// قراءة بيانات الشيت وقراءة كل الأنماط
async function loadStagesFromSheet() {
  try {
    const res = await fetch(SHEET_URL);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows;

    const parsed = [];
    rows.forEach(r => {
      const c = r.c;
      // تجاهل صفوف الترويسة والإحصائيات
      if (c && c[0] && !isNaN(c[0].v)) {
        const id = parseInt(c[0].v);
        const type = c[1] ? String(c[1].v).trim() : 'تجميع حروف';
        const qText = c[2] ? String(c[2].v).trim() : '';
        const ans = c[3] ? String(c[3].v).trim() : '';
        const rawAux = c[4] ? String(c[4].v).trim() : '';

        // إذا كان السؤال اختيار من متعدد
        if (type.includes('خيار') || type.includes('خيارات')) {
          const choices = rawAux.split(',').map(s => s.trim());
          parsed.push({ id, type: 'choices', question: qText, answer: ans, choices });
        } else {
          // نمط تجميع الحروف العادي
          const letters = rawAux.includes(',') ? rawAux.split(',').map(s => s.trim()) : ans.split('');
          parsed.push({ id, type: 'letters', question: qText, answer: ans, letters });
        }
      }
    });

    if (parsed.length > 0) {
      stages = parsed;
      console.log("تم تحميل المراحل بنجاح من الشيت:", stages.length);
      renderMapNodes();
    }
  } catch (e) {
    console.error("فشل قراءة الشيت:", e);
  }
}

// خريطة المراحل
function renderMapNodes() {
  const container = document.getElementById('map-container');
  if (!container) return;
  container.innerHTML = '';

  stages.forEach(st => {
    const node = document.createElement('div');
    node.innerText = st.id;

    if (st.id < playerData.maxStage) {
      node.className = 'stage-node completed';
      node.title = "مرحلة مكتملة - اضغط للإعادة";
      node.onclick = () => startStage(st.id);
    } else if (st.id === playerData.maxStage) {
      node.className = 'stage-node current';
      node.onclick = () => startStage(st.id);
    } else {
      node.className = 'stage-node locked';
      node.innerText = '🔒';
      node.onclick = () => alert("المرحلة مقفولة! أنجز المراحل السابقة أولاً.");
    }

    container.appendChild(node);
  });
}

function continueCurrentStage() {
  startStage(playerData.maxStage);
}

// بدء المرحلة وتشغيل الواجهة المناسبة لنوعها
function startStage(stageNum) {
  currentPlayingStage = stageNum;
  const stage = stages.find(s => s.id === stageNum) || stages[0];
  if (!stage) return alert("المرحلة غير متوفرة بعد في الشيت!");

  document.getElementById('stage-title').innerText = `المرحلة ${stage.id}`;
  document.getElementById('question-text').innerText = stage.question;
  
  const typeBadge = document.getElementById('stage-badge-type');
  const lettersArea = document.getElementById('letters-mode-area');
  const choiceArea = document.getElementById('choice-mode-area');
  const hintBtn = document.getElementById('hint-letter-btn');

  if (stage.type === 'choices') {
    // تشغيل نمط الـ 4 خيارات
    typeBadge.innerText = 'اختر الإجابة الصحيحة';
    lettersArea.style.display = 'none';
    choiceArea.style.display = 'flex';
    hintBtn.style.display = 'none'; // إخفاء كشف الحرف في نمط الخيارات

    renderChoices(stage.choices, stage.answer);
  } else {
    // تشغيل نمط تجميع الحروف
    typeBadge.innerText = 'تجميع حروف';
    lettersArea.style.display = 'block';
    choiceArea.style.display = 'none';
    hintBtn.style.display = 'inline-block';

    userGuess = [];
    renderAnswerSlots(stage.answer.length);
    renderKeyboard(stage.letters);
  }

  showScreen('screen-game');
}

// عرض الخيارات الأربعة
function renderChoices(choices, correctAnswer) {
  const container = document.getElementById('choice-mode-area');
  container.innerHTML = '';

  choices.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = opt;
    btn.onclick = () => handleChoiceSelect(opt, correctAnswer, btn);
    container.appendChild(btn);
  });
}

function handleChoiceSelect(selected, correct, btn) {
  if (selected === correct) {
    btn.classList.add('correct');
    setTimeout(() => {
      alert("إجابة صحيحة ممتاز! 🎉");
      onStagePassed();
    }, 200);
  } else {
    btn.classList.add('wrong');
    setTimeout(() => {
      alert("إجابة خاطئة! حاول مرة أخرى.");
      btn.classList.remove('wrong');
    }, 200);
  }
}

// تجميع الحروف
function renderAnswerSlots(count) {
  const container = document.getElementById('answer-boxes');
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const slot = document.createElement('div');
    slot.className = 'char-slot';
    container.appendChild(slot);
  }
}

function renderKeyboard(letters) {
  const container = document.getElementById('letters-keyboard');
  container.innerHTML = '';
  const shuffled = [...letters].sort(() => 0.5 - Math.random());
  shuffled.forEach(char => {
    const btn = document.createElement('button');
    btn.className = 'key-btn';
    btn.innerText = char;
    btn.onclick = () => selectLetter(char, btn);
    container.appendChild(btn);
  });
}

function selectLetter(char, btn) {
  const stage = stages.find(s => s.id === currentPlayingStage);
  if (userGuess.length >= stage.answer.length) return;

  userGuess.push({ char, btn });
  btn.style.visibility = 'hidden';
  updateSlots();

  if (userGuess.length === stage.answer.length) {
    const word = userGuess.map(i => i.char).join('');
    if (word === stage.answer) {
      setTimeout(() => {
        alert("أحسنت! إجابة صحيحة 🎉");
        onStagePassed();
      }, 200);
    } else {
      setTimeout(() => {
        alert("إجابة غير صحيحة، حاول مجدداً!");
        resetGuess();
      }, 200);
    }
  }
}

function onStagePassed() {
  if (currentPlayingStage === playerData.maxStage) {
    playerData.maxStage++;
    playerData.coins += 15;
    savePlayerData();
    updateUI();
    renderMapNodes();
  }

  if (currentPlayingStage < stages.length) {
    startStage(currentPlayingStage + 1);
  } else {
    alert("تبارك الله! ختمت جميع المراحل المتوفرة حالياً في الشيت.");
    showScreen('screen-map');
  }
}

function updateSlots() {
  const slots = document.querySelectorAll('.char-slot');
  slots.forEach((s, i) => {
    s.innerText = userGuess[i] ? userGuess[i].char : '';
  });
}

function resetGuess() {
  userGuess.forEach(i => { if (i.btn) i.btn.style.visibility = 'visible'; });
  userGuess = [];
  updateSlots();
}

// المساعدات
function useHintRevealLetter() {
  if (playerData.coins < 20) return alert("تحتاج 20 🪙 على الأقل!");
  const stage = stages.find(s => s.id === currentPlayingStage);
  if (stage.type !== 'letters') return;

  const curLen = userGuess.length;
  if (curLen < stage.answer.length) {
    const correctChar = stage.answer[curLen];
    playerData.coins -= 20;
    savePlayerData();
    updateUI();

    const keyBtns = document.querySelectorAll('.key-btn');
    for (let btn of keyBtns) {
      if (btn.innerText === correctChar && btn.style.visibility !== 'hidden') {
        selectLetter(correctChar, btn);
        break;
      }
    }
  }
}

function useHintSkipStage() {
  if (playerData.coins < 50) return alert("تحتاج 50 🪙 على الأقل لتخطي المرحلة!");
  if (confirm("هل تريد إنفاق 50 🪙 وتخطي هذا السؤال؟")) {
    playerData.coins -= 50;
    savePlayerData();
    updateUI();
    onStagePassed();
  }
}

function openStore() {
  alert("متجر النقاط قيد التجهيز للدفع الإلكتروني الرسمي.");
}

function closeStore() {
  const m = document.getElementById('store-modal');
  if (m) m.style.display = 'none';
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}

window.onload = () => {
  checkExistingUser();
  loadStagesFromSheet();
};
