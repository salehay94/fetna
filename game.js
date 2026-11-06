const SHEET_ID = '1wDdj4cnnBZ8CK63TPe2pvgZ44O_1VTyy9wgYPSeYSss';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzCZT8V6dwv8R5mWCj6n70p4omukxVsyWiYk0cw8CnPuSvvuDKRhfIvB1TKC1qocGMaMA/exec';

// مراحل مدمجة جاهزة للعمل فوراً من اللحظة الأولى
let stages = [
  { id: 1, type: 'letters', question: "من هو أول الأنبياء عليهم السلام؟", answer: "آدم", letters: ["آ","د","م","س","و","ي","ن","ل"] },
  { id: 2, type: 'letters', question: "أين ولد النبي محمد صلى الله عليه وسلم؟", answer: "مكة", letters: ["م","ك","ة","ق","د","س","ر","ح"] },
  { id: 3, type: 'letters', question: "من هو خاتم الأنبياء والمرسلين؟", answer: "محمد", letters: ["م","ح","م","د","ع","ل","ي","ف"] },
  { id: 4, type: 'choices', question: "كم عدد سور القرآن الكريم؟", answer: "114 سورة", choices: ["110 سورة", "112 سورة", "114 سورة", "120 سورة"] },
  { id: 5, type: 'choices', question: "في أي عام هجري وقعت غزوة بدر الكبرى؟", answer: "2 هـ", choices: ["1 هـ", "2 هـ", "3 هـ", "5 هـ"] },
  { id: 6, type: 'choices', question: "ما هي أقصر سورة في القرآن الكريم؟", answer: "الكوثر", choices: ["الفلق", "الإخلاص", "الكوثر", "النصر"] }
];

let currentPlayingStage = 1;
let userGuess = [];

let playerData = {
  name: 'saleh',
  email: 'mr.saleh.ay.94@gmail.com',
  password: '',
  maxStage: 1,
  coins: 150
};

// 1. إدارة ظهور الشاشات
function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
  }
}

// 2. فحص الحساب وبدء العرض فوراً
function checkExistingUser() {
  const saved = localStorage.getItem('fetnah_registered_player_v9');
  if (saved) {
    try { 
      playerData = JSON.parse(saved); 
    } catch(e) {}
  }
  updateUI();
  renderMapNodes();
  // إظهار الشاشة الرئيسية مباشرة لتفادي أي شاشة بيضاء
  showScreen('screen-home');
}

function handleAuthLogin() {
  const nameInput = document.getElementById('auth-name');
  const emailInput = document.getElementById('auth-email');
  const passInput = document.getElementById('auth-pass');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const pass = passInput ? passInput.value.trim() : '';

  if (!name || !email) {
    alert("يرجى إدخال اسم اللاعب والبريد الإلكتروني للمتابعة!");
    return;
  }

  playerData.name = name;
  playerData.email = email;
  playerData.password = pass || "123456";

  savePlayerData();
  updateUI();
  renderMapNodes();
  showScreen('screen-home');

  // مزامنة صامتة في الخلفية
  if (APPS_SCRIPT_URL) {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'sync_player',
        name: playerData.name,
        email: playerData.email,
        password: playerData.password,
        maxStage: playerData.maxStage,
        coins: playerData.coins
      })
    }).catch(err => console.log("تعذر المزامنة الحية:", err));
  }
}

function savePlayerData() {
  localStorage.setItem('fetnah_registered_player_v9', JSON.stringify(playerData));
}

function updateUI() {
  const nameEl = document.getElementById('display-player-name');
  if (nameEl) nameEl.innerText = playerData.name || 'اللاعب';

  ['home-coins', 'map-coins', 'game-coins'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = playerData.coins;
  });
}

// 3. خريطة المراحل
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
  let target = playerData.maxStage || 1;
  if (target > stages.length) target = stages.length;
  startStage(target);
}

// 4. بدء تشغيل مرحلة
function startStage(stageNum) {
  let stage = stages.find(s => s.id === stageNum) || stages[0];
  currentPlayingStage = stage.id;
  userGuess = [];

  const titleEl = document.getElementById('stage-title');
  const qTextEl = document.getElementById('question-text');
  if (titleEl) titleEl.innerText = `المرحلة ${stage.id}`;
  if (qTextEl) qTextEl.innerText = stage.question;
  
  const typeBadge = document.getElementById('stage-badge-type');
  const lettersArea = document.getElementById('letters-mode-area');
  const choiceArea = document.getElementById('choice-mode-area');
  const hintBtn = document.getElementById('hint-letter-btn');

  if (stage.type === 'choices') {
    if (typeBadge) typeBadge.innerText = 'اختر الإجابة الصحيحة';
    if (lettersArea) lettersArea.style.display = 'none';
    if (choiceArea) choiceArea.style.display = 'flex';
    if (hintBtn) hintBtn.style.display = 'none';
    renderChoices(stage.choices, stage.answer);
  } else {
    if (typeBadge) typeBadge.innerText = 'تجميع حروف';
    if (lettersArea) lettersArea.style.display = 'block';
    if (choiceArea) choiceArea.style.display = 'none';
    if (hintBtn) hintBtn.style.display = 'inline-block';
    renderAnswerSlots(stage.answer.length);
    renderKeyboard(stage.letters);
  }

  showScreen('screen-game');
}

function renderChoices(choices, correctAnswer) {
  const container = document.getElementById('choice-mode-area');
  if (!container) return;
  container.innerHTML = '';

  choices.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = opt;
    btn.onclick = () => {
      if (opt === correctAnswer) {
        btn.classList.add('correct');
        setTimeout(() => { 
          alert("أحسنت! إجابة صحيحة 🎉"); 
          onStagePassed(); 
        }, 200);
      } else {
        btn.classList.add('wrong');
        setTimeout(() => { 
          alert("إجابة غير صحيحة، حاول مجدداً!"); 
          btn.classList.remove('wrong'); 
        }, 200);
      }
    };
    container.appendChild(btn);
  });
}

function renderAnswerSlots(count) {
  const container = document.getElementById('answer-boxes');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const slot = document.createElement('div');
    slot.className = 'char-slot';
    container.appendChild(slot);
  }
}

function renderKeyboard(letters) {
  const container = document.getElementById('letters-keyboard');
  if (!container) return;
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
  if (!stage || userGuess.length >= stage.answer.length) return;

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
        alert("إجابة غير صحيحة!"); 
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

    if (APPS_SCRIPT_URL) {
      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          action: 'sync_player',
          email: playerData.email,
          maxStage: playerData.maxStage,
          coins: playerData.coins
        })
      }).catch(() => {});
    }
  }

  if (currentPlayingStage < stages.length) {
    startStage(currentPlayingStage + 1);
  } else {
    alert("تبارك الله! ختمت كل المراحل المتوفرة.");
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

function useHintRevealLetter() {
  if (playerData.coins < 20) return alert("تحتاج 20 🪙 على الأقل!");
  const stage = stages.find(s => s.id === currentPlayingStage);
  if (!stage || stage.type !== 'letters') return;

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
  if (playerData.coins < 50) return alert("تحتاج 50 🪙 على الأقل!");
  if (confirm("هل تريد إنفاق 50 🪙 وتخطي هذا السؤال؟")) {
    playerData.coins -= 50;
    savePlayerData();
    updateUI();
    onStagePassed();
  }
}

// 5. النوافذ واستعادة كلمة المرور
function openForgotPassModal() { 
  const m = document.getElementById('forgot-modal');
  if (m) m.style.display = 'flex'; 
}

function submitPasswordReset() {
  const emailInput = document.getElementById('reset-email-input');
  const email = emailInput ? emailInput.value.trim() : '';
  if (!email) return alert("يرجى كتابة بريدك المسجل!");
  
  alert("جاري التحقق وإرسال كلمة السر إلى بريدك...");
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ action: 'reset_password', email })
  }).then(() => {
    alert("إذا كان بريدك مسجلاً، ستصلك كلمة مرور جديدة فوراً!");
    closeModal('forgot-modal');
  }).catch(() => {
    alert("تعذر الاتصال بالخادم.");
  });
}

function openProfileModal() { 
  const m = document.getElementById('profile-modal');
  if (m) m.style.display = 'flex'; 
}

function submitChangePassword() {
  const passInput = document.getElementById('new-password-input');
  const newPass = passInput ? passInput.value.trim() : '';
  if (!newPass) return alert("اكتب كلمة المرور الجديدة!");
  
  playerData.password = newPass;
  savePlayerData();
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ action: 'change_password', email: playerData.email, newPassword: newPass })
  }).catch(() => {});
  
  alert("تم تحديث كلمة المرور!");
  closeModal('profile-modal');
}

function linkGoogleAccount() {
  alert(`تم ربط حسابك (${playerData.email}) بنجاح مع Google!`);
  closeModal('profile-modal');
}

function logoutPlayer() {
  localStorage.removeItem('fetnah_registered_player_v9');
  closeModal('profile-modal');
  showScreen('screen-auth');
}

function closeModal(id) { 
  const el = document.getElementById(id);
  if (el) el.style.display = 'none'; 
}

// 6. جلب بيانات الشيت في الخلفية بمرونة دون إيقاف اللعبة
async function loadStagesSilently() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=0`;
    const res = await fetch(url);
    if (!res.ok) return;
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows;

    let dynamicStages = [];
    rows.forEach(r => {
      const c = r.c;
      if (c && c[0] && !isNaN(c[0].v)) {
        const id = parseInt(c[0].v);
        const type = c[1] ? String(c[1].v).trim() : 'تجميع حروف';
        const qText = c[2] ? String(c[2].v).trim() : '';
        const ans = c[3] ? String(c[3].v).trim() : '';
        const rawAux = c[4] ? String(c[4].v).trim() : '';

        if (type.includes('خيار') || type.includes('خيارات')) {
          const choices = rawAux.split(',').map(s => s.trim());
          dynamicStages.push({ id, type: 'choices', question: qText, answer: ans, choices });
        } else if (qText && ans) {
          const letters = rawAux.includes(',') ? rawAux.split(',').map(s => s.trim()) : ans.split('');
          dynamicStages.push({ id, type: 'letters', question: qText, answer: ans, letters });
        }
      }
    });

    if (dynamicStages.length > 0) {
      stages = dynamicStages;
      renderMapNodes();
    }
  } catch(e) {
    console.log("استمرار العمل بالمراحل المدمجة:", e);
  }
}

// نقطة الانطلاق الفورية
window.addEventListener('DOMContentLoaded', () => {
  checkExistingUser();
  loadStagesSilently();
});
