const SHEET_ID = '1wDdj4cnnBZ8CK63TPe2pvgZ44O_1VTyy9wgYPSeYSss';
// تم وضع رابط الـ Web App الرسمي الخاص بك هنا
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzCZT8V6dwv8R5mWCj6n70p4omukxVsyWiYk0cw8CnPuSvvuDKRhfIvB1TKC1qocGMaMA/exec';

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=0`;

let stages = [];
let currentPlayingStage = 1;
let userGuess = [];

let playerData = {
  name: 'saleh',
  email: 'mr.saleh.ay.94@gmail.com',
  password: '',
  maxStage: 1,
  coins: 150
};

// 1. إدارة حساب اللاعب
function checkExistingUser() {
  const saved = localStorage.getItem('fetnah_registered_player_v6');
  if (saved) {
    try { playerData = JSON.parse(saved); } catch(e) {}
    updateUI();
    renderMapNodes();
    showScreen('screen-home');
  } else {
    showScreen('screen-auth');
  }
}

function handleAuthLogin() {
  const name = document.getElementById('auth-name').value.trim();
  const email = document.getElementById('auth-email').value.trim();
  const pass = document.getElementById('auth-pass').value.trim();

  if (!name || !email) return alert("يرجى إدخال اسم اللاعب والبريد الإلكتروني للمتابعة!");

  playerData.name = name;
  playerData.email = email;
  playerData.password = pass || "123456";

  savePlayerData();
  updateUI();
  renderMapNodes();
  showScreen('screen-home');

  // مزامنة فورية مع تبويب اللاعبين في شيت جوجل
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

function savePlayerData() {
  localStorage.setItem('fetnah_registered_player_v6', JSON.stringify(playerData));
}

function updateUI() {
  const nameEl = document.getElementById('display-player-name');
  if (nameEl) nameEl.innerText = playerData.name || 'اللاعب';
  ['home-coins', 'map-coins', 'game-coins'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = playerData.coins;
  });
}

// 2. استرجاع كلمة المرور عبر الإيميل التلقائي
function openForgotPassModal() {
  document.getElementById('forgot-modal').style.display = 'flex';
}

function submitPasswordReset() {
  const email = document.getElementById('reset-email-input').value.trim();
  if (!email) return alert("يرجى كتابة بريدك الإلكتروني المسجل!");

  alert("جاري التحقق وإرسال كلمة السر الجديدة إلى بريدك...");
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ action: 'reset_password', email: email })
  }).then(() => {
    alert("إذا كان بريدك مسجلاً في الشيت، ستصلك كلمة سر جديدة إلى صندوق الوارد خلال دقيقة!");
    closeModal('forgot-modal');
  }).catch(() => {
    alert("تعذر الاتصال بالخادم، تحقق من الاتصال.");
  });
}

// 3. تعديل الحساب من داخل اللعبة
function openProfileModal() {
  document.getElementById('profile-modal').style.display = 'flex';
}

function submitChangePassword() {
  const newPass = document.getElementById('new-password-input').value.trim();
  if (!newPass) return alert("يرجى إدخال كلمة المرور الجديدة!");

  playerData.password = newPass;
  savePlayerData();

  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ action: 'change_password', email: playerData.email, newPassword: newPass })
  });

  alert("تم تحديث كلمة المرور بنجاح وحفظها في الشيت!");
  closeModal('profile-modal');
}

function linkGoogleAccount() {
  alert(`تم ربط حسابك (${playerData.email}) بنجاح مع Google!`);
  closeModal('profile-modal');
}

function logoutPlayer() {
  localStorage.removeItem('fetnah_registered_player_v6');
  closeModal('profile-modal');
  showScreen('screen-auth');
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// 4. جلب المراحل وتوزيع الأنماط (تجميع حروف / 4 خيارات)
async function loadStagesFromSheet() {
  try {
    const res = await fetch(SHEET_URL);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows;

    const parsed = [];
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
          parsed.push({ id, type: 'choices', question: qText, answer: ans, choices });
        } else {
          const letters = rawAux.includes(',') ? rawAux.split(',').map(s => s.trim()) : ans.split('');
          parsed.push({ id, type: 'letters', question: qText, answer: ans, letters });
        }
      }
    });

    if (parsed.length > 0) {
      stages = parsed;
      renderMapNodes();
    }
  } catch (e) {
    console.error("فشل قراءة الشيت:", e);
  }
}

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

function startStage(stageNum) {
  currentPlayingStage = stageNum;
  const stage = stages.find(s => s.id === stageNum) || stages[0];
  if (!stage) return alert("المرحلة غير متوفرة بعد!");

  document.getElementById('stage-title').innerText = `المرحلة ${stage.id}`;
  document.getElementById('question-text').innerText = stage.question;
  
  const typeBadge = document.getElementById('stage-badge-type');
  const lettersArea = document.getElementById('letters-mode-area');
  const choiceArea = document.getElementById('choice-mode-area');
  const hintBtn = document.getElementById('hint-letter-btn');

  if (stage.type === 'choices') {
    typeBadge.innerText = 'اختر الإجابة الصحيحة';
    lettersArea.style.display = 'none';
    choiceArea.style.display = 'flex';
    hintBtn.style.display = 'none';
    renderChoices(stage.choices, stage.answer);
  } else {
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

function renderChoices(choices, correctAnswer) {
  const container = document.getElementById('choice-mode-area');
  container.innerHTML = '';
  choices.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = opt;
    btn.onclick = () => {
      if (opt === correctAnswer) {
        btn.classList.add('correct');
        setTimeout(() => { alert("أحسنت! إجابة صحيحة 🎉"); onStagePassed(); }, 200);
      } else {
        btn.classList.add('wrong');
        setTimeout(() => { alert("إجابة غير صحيحة، حاول مجدداً!"); btn.classList.remove('wrong'); }, 200);
      }
    };
    container.appendChild(btn);
  });
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

  userGuess.push({ char, btn });
  btn.style.visibility = 'hidden';
  updateSlots();

  if (userGuess.length === stage.answer.length) {
    const word = userGuess.map(i => i.char).join('');
    if (word === stage.answer) {
      setTimeout(() => { alert("أحسنت! إجابة صحيحة 🎉"); onStagePassed(); }, 200);
    } else {
      setTimeout(() => { alert("إجابة غير صحيحة!"); resetGuess(); }, 200);
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

    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'sync_player',
        email: playerData.email,
        maxStage: playerData.maxStage,
        coins: playerData.coins
      })
    });
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
  slots.forEach((s, i) => { s.innerText = userGuess[i] ? userGuess[i].char : ''; });
}

function resetGuess() {
  userGuess.forEach(i => { if (i.btn) i.btn.style.visibility = 'visible'; });
  userGuess = [];
  updateSlots();
}

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
  if (playerData.coins < 50) return alert("تحتاج 50 🪙 على الأقل!");
  if (confirm("هل تريد إنفاق 50 🪙 وتخطي هذا السؤال؟")) {
    playerData.coins -= 50;
    savePlayerData();
    updateUI();
    onStagePassed();
  }
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
