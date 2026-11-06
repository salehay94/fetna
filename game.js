// مصفوفة المراحل الأساسية العشرة لتعمل اللعبة فوراً حتى بدون انتظار اتصال
const defaultStages = [
  { id: 1, question: "من هو أول الأنبياء عليهم السلام؟", answer: "آدم", letters: ["آ", "د", "م", "س", "و", "ي", "ن", "ل"] },
  { id: 2, question: "أين ولد النبي محمد صلى الله عليه وسلم؟", answer: "مكة", letters: ["م", "ك", "ة", "ق", "د", "س", "ر", "ح"] },
  { id: 3, question: "من هو خاتم الأنبياء والمرسلين؟", answer: "محمد", letters: ["م", "ح", "م", "د", "ع", "ل", "ي", "ف"] },
  { id: 4, question: "ما هي أول قبلة للمسلمين؟", answer: "القدس", letters: ["ا", "ل", "ق", "د", "س", "م", "ك", "ة"] },
  { id: 5, question: "ما هي أطول سورة في القرآن الكريم؟", answer: "البقرة", letters: ["ا", "ل", "ب", "ق", "ر", "ة", "ع", "م"] },
  { id: 6, question: "من هو كليم الله من الرسل؟", answer: "موسى", letters: ["م", "و", "س", "ى", "ع", "ي", "س", "ا"] },
  { id: 7, question: "الصحابي الملقب بسيف الله المسلول", answer: "خالد", letters: ["خ", "ا", "ل", "د", "ع", "م", "ر", "س"] },
  { id: 8, question: "ما هو الشهر الذي فرض فيه الصيام؟", answer: "رمضان", letters: ["ر", "م", "ض", "ا", "ن", "ش", "ع", "ب"] },
  { id: 9, question: "كم عدد أركان الإسلام؟", answer: "خمسة", letters: ["خ", "م", "س", "ة", "س", "ت", "ة", "س"] },
  { id: 10, question: "ما هي السورة التي تسمى عروس القرآن؟", answer: "الرحمن", letters: ["ا", "ل", "ر", "ح", "م", "ن", "ي", "س"] }
];

let stages = [...defaultStages];
let currentPlayingStage = 1;
let userGuess = [];
let pendingPurchase = null;

let playerData = {
  name: '',
  maxUnlockedStage: 1,
  coins: 150
};

// فحص وجود الحساب
function checkExistingUser() {
  const saved = localStorage.getItem('fetnah_player_v2');
  if (saved) {
    playerData = JSON.parse(saved);
    updateCoinDisplays();
    document.getElementById('display-player-name').innerText = playerData.name;
    renderMapNodes();
    showScreen('screen-home');
  } else {
    showScreen('screen-auth');
  }
}

function loginUser() {
  const input = document.getElementById('player-name-input');
  const name = input.value.trim();
  if (!name) {
    alert("يرجى إدخال اسمك للبدء!");
    return;
  }
  playerData.name = name;
  savePlayerData();
  updateCoinDisplays();
  document.getElementById('display-player-name').innerText = playerData.name;
  renderMapNodes();
  showScreen('screen-home');
}

function savePlayerData() {
  localStorage.setItem('fetnah_player_v2', JSON.stringify(playerData));
}

function updateCoinDisplays() {
  document.getElementById('home-coins').innerText = playerData.coins;
  document.getElementById('map-coins').innerText = playerData.coins;
  document.getElementById('game-coins').innerText = playerData.coins;
}

// رسم خريطة المراحل
function renderMapNodes() {
  const container = document.getElementById('map-container');
  if (!container) return;
  container.innerHTML = '';

  stages.forEach(st => {
    const node = document.createElement('div');
    node.innerText = st.id;

    if (st.id < playerData.maxUnlockedStage) {
      node.className = 'stage-node completed';
      node.title = "مرحلة مكتملة - اضغط للإعادة";
      node.onclick = () => startStage(st.id);
    } else if (st.id === playerData.maxUnlockedStage) {
      node.className = 'stage-node current';
      node.title = "المرحلة الحالية";
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
  startStage(playerData.maxUnlockedStage);
}

function startStage(stageNum) {
  currentPlayingStage = stageNum;
  const stage = stages.find(s => s.id === stageNum);
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
        
        if (currentPlayingStage === playerData.maxUnlockedStage) {
          playerData.maxUnlockedStage++;
          playerData.coins += 15;
          savePlayerData();
          updateCoinDisplays();
          renderMapNodes();
        }

        if (currentPlayingStage < stages.length) {
          startStage(currentPlayingStage + 1);
        } else {
          alert("تبارك الله! ختمت جميع المراحل.");
          showScreen('screen-map');
        }
      }, 250);
    } else {
      setTimeout(() => {
        alert("إجابة غير صحيحة! حاول مجدداً.");
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
    alert("رصيدك لا يكفي! افتح المتجر بالضغط على 🪙 لشحن النقاط.");
    return;
  }

  const stage = stages.find(s => s.id === currentPlayingStage);
  const currentLen = userGuess.length;
  if (currentLen < stage.answer.length) {
    const correctChar = stage.answer[currentLen];
    
    playerData.coins -= cost;
    savePlayerData();
    updateCoinDisplays();

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
    if (currentPlayingStage === playerData.maxUnlockedStage) {
      playerData.maxUnlockedStage++;
    }
    savePlayerData();
    updateCoinDisplays();
    renderMapNodes();

    if (currentPlayingStage < stages.length) {
      startStage(currentPlayingStage + 1);
    } else {
      showScreen('screen-map');
    }
  }
}

// المتجر ونافذة تأكيد الشراء
function openStore() {
  document.getElementById('store-modal').style.display = 'flex';
}

function closeStore() {
  document.getElementById('store-modal').style.display = 'none';
}

function askBuyConfirmation(coinsAmount, price) {
  pendingPurchase = { coinsAmount, price };
  document.getElementById('confirm-text').innerText = `هل تؤكد شراء باقة (${coinsAmount} نقطة) بسعر ${price} عبر Google Play؟`;
  document.getElementById('confirm-pay-btn').onclick = executeConfirmedPurchase;
  document.getElementById('confirm-modal').style.display = 'flex';
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').style.display = 'none';
  pendingPurchase = null;
}

function executeConfirmedPurchase() {
  if (!pendingPurchase) return;
  const { coinsAmount, price } = pendingPurchase;
  
  playerData.coins += coinsAmount;
  savePlayerData();
  updateCoinDisplays();
  
  closeConfirmModal();
  closeStore();
  alert(`تمت عملية الدفع بنجاح عبر Google (${price})! أُضيفت ${coinsAmount} نقطة إلى رصيدك 🎉`);
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

// محاولة قراءة الشيت في الخلفية وتحديث الأسئلة ديناميكياً
async function syncStagesFromSheet() {
  const SHEET_ID = '1wDdj4cnnBZ8CK63TPe2pvgZ44O_1VTyy9wgYPSeYSss';
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
  try {
    const res = await fetch(SHEET_URL);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows;

    const fetched = [];
    rows.forEach(r => {
      const c = r.c;
      if (c && c[0] && !isNaN(c[0].v)) {
        const stageNum = parseInt(c[0].v);
        const qText = c[2] ? c[2].v : '';
        const ans = c[3] ? String(c[3].v).trim() : '';
        const rawLetters = c[4] ? String(c[4].v) : '';
        const lettersList = rawLetters ? rawLetters.split(',').map(s => s.trim()) : ans.split('');

        fetched.push({
          id: stageNum,
          question: qText,
          answer: ans,
          letters: lettersList
        });
      }
    });
    if (fetched.length > 0) {
      stages = fetched;
      renderMapNodes();
    }
  } catch (err) {
    // يستمر بالاعتماد على defaultStages المدمجة بدون انقطاع
  }
}

window.onload = () => {
  renderMapNodes();
  checkExistingUser();
  syncStagesFromSheet();
};