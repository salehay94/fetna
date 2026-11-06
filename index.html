// معرف ملف جوجل شيت الخاص بلعبة فطنة
const SHEET_ID = '1wDdj4cnnBZ8CK63TPe2pvgZ44O_1VTyy9wgYPSeYSss';

// تشفير الأسماء العربية للروابط لضمان عدم توقف الطلب
const URL_LETTERS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('المراحل')}`;

// المراحل الافتراضية تعمل فوراً في كل الظروف حتى لو تأخر اتصال الشيت
const fallbackStages = [
  { id: 1, question: "من هو أول الأنبياء عليهم السلام؟", answer: "آدم", letters: ["آ","د","م","س","و","ي","ن","ل"] },
  { id: 2, question: "أين ولد النبي محمد صلى الله عليه وسلم؟", answer: "مكة", letters: ["م","ك","ة","ق","د","س","ر","ح"] },
  { id: 3, question: "من هو خاتم الأنبياء والمرسلين؟", answer: "محمد", letters: ["م","ح","م","د","ع","ل","ي","ف"] },
  { id: 4, question: "ما هي أول قبلة للمسلمين؟", answer: "القدس", letters: ["ا","ل","ق","د","س","م","ك","ة"] },
  { id: 5, question: "ما هي أطول سورة في القرآن الكريم؟", answer: "البقرة", letters: ["ا","ل","ب","ق","ر","ة","ع","م"] }
];

let stages = [...fallbackStages];
let currentPlayingStage = 1;
let userGuess = [];

let playerData = {
  name: 'saleh',
  maxStage: 1,
  coins: 150
};

// 1. فحص الحساب
function checkExistingUser() {
  const saved = localStorage.getItem('fetnah_live_player_v3');
  if (saved) {
    try {
      playerData = JSON.parse(saved);
    } catch(e) {}
  }
  updateUI();
  renderMapNodes();
  showScreen('screen-home');
}

function loginUser() {
  const nameInput = document.getElementById('player-name-input');
  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) {
    alert("يرجى إدخال اسم اللاعب للمتابعة!");
    return;
  }
  playerData.name = name;
  savePlayerData();
  updateUI();
  renderMapNodes();
  showScreen('screen-home');
}

function savePlayerData() {
  localStorage.setItem('fetnah_live_player_v3', JSON.stringify(playerData));
}

function updateUI() {
  const nameLabel = document.getElementById('display-player-name');
  if (nameLabel) nameLabel.innerText = playerData.name || 'اللاعب';

  const hCoins = document.getElementById('home-coins');
  const mCoins = document.getElementById('map-coins');
  const gCoins = document.getElementById('game-coins');

  if (hCoins) hCoins.innerText = playerData.coins;
  if (mCoins) mCoins.innerText = playerData.coins;
  if (gCoins) gCoins.innerText = playerData.coins;
}

// 2. قراءة جوجل شيت بدقة وأمان
async function loadAllStages() {
  try {
    const res = await fetch(URL_LETTERS);
    if (!res.ok) throw new Error("تعذر جلب الشيت");
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows;

    const loaded = [];
    rows.forEach(r => {
      const c = r.c;
      if (c && c[0] && !isNaN(c[0].v)) {
        const id = parseInt(c[0].v);
        // التوافق التلقائي مع ترتيب الأعمدة في الشيت
        const qText = c[2] ? c[2].v : (c[1] ? c[1].v : '');
        const ans = c[3] ? String(c[3].v).trim() : (c[2] ? String(c[2].v).trim() : '');
        const rawLetters = c[4] ? String(c[4].v) : (c[3] ? String(c[3].v) : '');
        const lettersList = rawLetters && String(rawLetters).includes(',') 
          ? rawLetters.split(',').map(s => s.trim()) 
          : ans.split('');

        if (id && qText && ans) {
          loaded.push({ id, question: qText, answer: ans, letters: lettersList });
        }
      }
    });

    if (loaded.length > 0) {
      stages = loaded;
      console.log("تم تحديث المراحل من الشيت بنجاح:", stages.length);
      renderMapNodes();
    }
  } catch (err) {
    console.warn("تنبيه: تم استخدام المراحل الجاهزة بنجاح لضمان استمرار اللعب:", err);
    stages = [...fallbackStages];
    renderMapNodes();
  }
}

// 3. رسم الخريطة مع حالات القفل والإعادة
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
      node.onclick = () => alert("هذه المرحلة مقفولة حتى تجتاز المراحل السابقة!");
    }

    container.appendChild(node);
  });
}

function continueCurrentStage() {
  startStage(playerData.maxStage);
}

function startStage(stageNum) {
  currentPlayingStage = stageNum;
  const stage = stages.find(s => s.id === stageNum) || stages[0];
  if (!stage) {
    alert("المرحلة غير متوفرة!");
    return;
  }

  userGuess = [];
  document.getElementById('stage-title').innerText = `المرحلة ${stage.id}`;
  document.getElementById('question-text').innerText = stage.question;

  renderAnswerSlots(stage.answer.length);
  renderKeyboard(stage.letters);
  showScreen('screen-game');
}

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
  const stage = stages.find(s => s.id === currentPlayingStage) || stages[0];
  if (userGuess.length >= stage.answer.length) return;

  userGuess.push({ char: char, btn: btn });
  btn.style.visibility = 'hidden';
  updateSlots();

  if (userGuess.length === stage.answer.length) {
    const word = userGuess.map(item => item.char).join('');
    if (word === stage.answer) {
      setTimeout(() => {
        alert("أحسنت! إجابة صحيحة 🎉");

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
          alert("تبارك الله! ختمت جميع المراحل المتوفرة.");
          showScreen('screen-map');
        }
      }, 250);
    } else {
      setTimeout(() => {
        alert("إجابة غير صحيحة، حاول مجدداً!");
        resetGuess();
      }, 250);
    }
  }
}

function updateSlots() {
  const slots = document.querySelectorAll('.char-slot');
  slots.forEach((s, i) => {
    s.innerText = userGuess[i] ? userGuess[i].char : '';
  });
}

function resetGuess() {
  userGuess.forEach(item => {
    if (item.btn) item.btn.style.visibility = 'visible';
  });
  userGuess = [];
  updateSlots();
}

function useHintRevealLetter() {
  const cost = 20;
  if (playerData.coins < cost) {
    alert("رصيدك لا يكفي! تحتاج 20 🪙 على الأقل.");
    return;
  }

  const stage = stages.find(s => s.id === currentPlayingStage);
  const curLen = userGuess.length;
  if (curLen < stage.answer.length) {
    const correctChar = stage.answer[curLen];
    playerData.coins -= cost;
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
  const cost = 50;
  if (playerData.coins < cost) {
    alert("رصيدك لا يكفي لتخطي المرحلة!");
    return;
  }

  if (confirm("هل تريد إنفاق 50 🪙 وتخطي هذا السؤال؟")) {
    playerData.coins -= cost;
    if (currentPlayingStage === playerData.maxStage) {
      playerData.maxStage++;
    }
    savePlayerData();
    updateUI();
    renderMapNodes();

    if (currentPlayingStage < stages.length) {
      startStage(currentPlayingStage + 1);
    } else {
      showScreen('screen-map');
    }
  }
}

function openStore() {
  alert("متجر الشحن قيد التجهيز للدفع الإلكتروني الرسمي، ولا يوجد شراء حالياً.");
}

function closeStore() {
  const modal = document.getElementById('store-modal');
  if (modal) modal.style.display = 'none';
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

// البدء
window.onload = () => {
  renderMapNodes();
  checkExistingUser();
  loadAllStages();
};
