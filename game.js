// معرف ملف جوجل شيت الخاص بلعبة فطنة
const SHEET_ID = '1wDdj4cnnBZ8CK63TPe2pvgZ44O_1VTyy9wgYPSeYSss';

// روابط الجلب المباشرة من كل تبويب داخل الشيت
const URL_LETTERS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=المراحل`;
const URL_CROSS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=كلمات_متقاطعة`;
const URL_PASS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=كلمة_السر`;

// بيانات المراحل
let stages = [];
let crossStages = [];
let passStages = [];

let currentPlayingStage = 1;
let userGuess = [];

// هيكل حساب اللاعب الكامل
let playerData = {
  name: '',
  email: '',
  password: '',
  maxStage: 1,
  coins: 150
};

// 1. التحقق من وجود حساب مسجل مسبقاً
function checkExistingUser() {
  const saved = localStorage.getItem('fetnah_registered_player');
  if (saved) {
    playerData = JSON.parse(saved);
    updateUI();
    showScreen('screen-home');
  } else {
    showScreen('screen-auth');
  }
}

// 2. تسجيل حساب جديد / تسجيل دخول
function loginUser() {
  const nameInput = document.getElementById('player-name-input');
  const name = nameInput ? nameInput.value.trim() : '';

  if (!name) {
    alert("يرجى إدخال اسم اللاعب للمتابعة!");
    return;
  }

  // إنشاء وتثبيت الحساب
  playerData.name = name;
  if (!playerData.maxStage) playerData.maxStage = 1;
  if (!playerData.coins) playerData.coins = 150;

  savePlayerData();
  updateUI();
  showScreen('screen-home');
}

function savePlayerData() {
  localStorage.setItem('fetnah_registered_player', JSON.stringify(playerData));
}

function updateUI() {
  const nameLabel = document.getElementById('display-player-name');
  if (nameLabel) nameLabel.innerText = playerData.name;

  const hCoins = document.getElementById('home-coins');
  const mCoins = document.getElementById('map-coins');
  const gCoins = document.getElementById('game-coins');

  if (hCoins) hCoins.innerText = playerData.coins;
  if (mCoins) mCoins.innerText = playerData.coins;
  if (gCoins) gCoins.innerText = playerData.coins;
}

// 3. جلب الأسئلة والمراحل من جوجل درايف مباشرة
async function fetchSheetData(url) {
  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(text.substring(47).slice(0, -2));
  return json.table.rows;
}

async function loadAllStages() {
  try {
    // جلب نمط تجميع الحروف (المراحل)
    const rowsLetters = await fetchSheetData(URL_LETTERS);
    stages = [];
    rowsLetters.forEach(r => {
      const c = r.c;
      if (c && c[0] && !isNaN(c[0].v)) {
        const id = parseInt(c[0].v);
        const qText = c[1] ? c[1].v : (c[2] ? c[2].v : '');
        const ans = c[2] && isNaN(c[2].v) ? String(c[2].v).trim() : (c[3] ? String(c[3].v).trim() : '');
        const rawLetters = c[3] && String(c[3].v).includes(',') ? String(c[3].v) : (c[4] ? String(c[4].v) : '');
        const lettersList = rawLetters ? rawLetters.split(',').map(s => s.trim()) : ans.split('');

        stages.push({ id, question: qText, answer: ans, letters: lettersList });
      }
    });

    console.log("تم تحميل مراحل تجميع الحروف من درايف:", stages.length);
    renderMapNodes();
  } catch (err) {
    console.error("جاري استخدام المراحل المحلية لتأمين الاستمرارية:", err);
    // مراحل احتياطية في حال تعثر الاتصال
    stages = [
      { id: 1, question: "من هو أول الأنبياء عليهم السلام؟", answer: "آدم", letters: ["آ","د","م","س","و","ي","ن","ل"] },
      { id: 2, question: "أين ولد النبي محمد صلى الله عليه وسلم؟", answer: "مكة", letters: ["م","ك","ة","ق","د","س","ر","ح"] },
      { id: 3, question: "من هو خاتم الأنبياء والمرسلين؟", answer: "محمد", letters: ["م","ح","م","د","ع","ل","ي","ف"] }
    ];
    renderMapNodes();
  }
}

// 4. خريطة المراحل والقفل
function renderMapNodes() {
  const container = document.getElementById('map-container');
  if (!container) return;
  container.innerHTML = '';

  stages.forEach(st => {
    const node = document.createElement('div');
    node.innerText = st.id;

    if (st.id < playerData.maxStage) {
      // مرحلة منتهية سابقاً: مسموح إعادتها فقط
      node.className = 'stage-node completed';
      node.title = "مرحلة مكتملة (اضغط للإعادة)";
      node.onclick = () => startStage(st.id);
    } else if (st.id === playerData.maxStage) {
      // المرحلة الحالية المفتوحة
      node.className = 'stage-node current';
      node.onclick = () => startStage(st.id);
    } else {
      // مرحلة مقفولة
      node.className = 'stage-node locked';
      node.innerText = '🔒';
      node.onclick = () => alert("هذه المرحلة مغلقة حتى تجتاز المراحل السابقة!");
    }

    container.appendChild(node);
  });
}

function continueCurrentStage() {
  startStage(playerData.maxStage);
}

function startStage(stageNum) {
  currentPlayingStage = stageNum;
  const stage = stages.find(s => s.id === stageNum);
  if (!stage) {
    alert("المرحلة غير متوفرة بعد في الشيت!");
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
  const stage = stages.find(s => s.id === currentPlayingStage);
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

// المساعدات: كشف حرف (خصم 20 عملة)
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

// المساعدات: تخطي سؤال (خصم 50 عملة)
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

// 5. إيقاف الشراء الوهمي نهائياً
function openStore() {
  alert("متجر شحن العملات قيد التجهيز للربط مع بوابات الدفع الرسمية، ولا يمكن إضافة رصيد وهمي حالياً.");
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

window.onload = () => {
  checkExistingUser();
  loadAllStages();
};
