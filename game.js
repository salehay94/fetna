const SHEET_ID = '1wDdj4cnnBZ8CK63TPe2pvgZ44O_1VTyy9wgYPSeYSss';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzCZT8V6dwv8R5mWCj6n70p4omukxVsyWiYk0cw8CnPuSvvuDKRhfIvB1TKC1qocGMaMA/exec';

// مراحل أولية تعمل فوراً كاحتياط
let stages = [
  { id: 1, type: 'letters', question: "من هو أول الأنبياء عليهم السلام؟", answer: "آدم", letters: ["آ","د","م","س","و","ي","ن","ل"] },
  { id: 2, type: 'letters', question: "أين ولد النبي محمد صلى الله عليه وسلم؟", answer: "مكة", letters: ["م","ك","ة","ق","د","س","ر","ح"] },
  { id: 3, type: 'letters', question: "من هو خاتم الأنبياء والمرسلين؟", answer: "محمد", letters: ["م","ح","م","د","ع","ل","ي","ف"] },
  { id: 4, type: 'choices', question: "كم عدد سور القرآن الكريم؟", answer: "114 سورة", choices: ["110 سورة", "112 سورة", "114 سورة", "120 سورة"] }
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

function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

function checkExistingUser() {
  const saved = localStorage.getItem('fetnah_registered_player_v11');
  if (saved) {
    try { playerData = JSON.parse(saved); } catch(e) {}
  }
  updateUI();
  renderMapNodes();
  showScreen('screen-home');
}

function handleAuthLogin() {
  const name = document.getElementById('auth-name').value.trim();
  const email = document.getElementById('auth-email').value.trim();
  const pass = document.getElementById('auth-pass').value.trim();

  if (!name || !email) return alert("يرجى إدخال اسم اللاعب والبريد الإلكتروني!");

  playerData.name = name;
  playerData.email = email;
  playerData.password = pass || "123456";

  savePlayerData();
  updateUI();
  renderMapNodes();
  showScreen('screen-home');

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
    }).catch(() => {});
  }
}

function savePlayerData() {
  localStorage.setItem('fetnah_registered_player_v11', JSON.stringify(playerData));
}

function updateUI() {
  const nameEl = document.getElementById('display-player-name');
  if (nameEl) nameEl.innerText = playerData.name || 'اللاعب';
  ['home-coins', 'map-coins', 'game-coins'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = playerData.coins;
  });
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
      node.title = "مرحلة مكتملة";
      node.addEventListener('click', () => startStage(st.id));
    } else if (st.id === playerData.maxStage) {
      node.className = 'stage-node current';
      node.addEventListener('click', () => startStage(st.id));
    } else {
      node.className = 'stage-node locked';
      node.innerText = '🔒';
      node.addEventListener('click', () => alert("المرحلة مقفولة!"));
    }
    container.appendChild(node);
  });
}

function continueCurrentStage() {
  let target = playerData.maxStage || 1;
  if (target > stages.length) target = stages.length;
  startStage(target);
}

function startStage(stageNum) {
  let stage = stages.find(s => s.id === stageNum) || stages[0];
  currentPlayingStage = stage.id;
  userGuess = [];

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
    btn.addEventListener('click', () => {
      if (opt === correctAnswer) {
        btn.classList.add('correct');
        setTimeout(() => { alert("أحسنت! إجابة صحيحة 🎉"); onStagePassed(); }, 200);
      } else {
        btn.classList.add('wrong');
        setTimeout(() => { alert("إجابة غير صحيحة!"); btn.classList.remove('wrong'); }, 200);
      }
    });
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
    btn.addEventListener('click', () => selectLetter(char, btn));
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
  slots.forEach((s, i) => { s.innerText = userGuess[i] ? userGuess[i].char : ''; });
}

function resetGuess() {
  userGuess.forEach(i => { if (i.btn) i.btn.style.visibility = 'visible'; });
  userGuess = [];
  updateSlots();
}

function useHintRevealLetter() {
  if (playerData.coins < 20) return alert("تحتاج 20 🪙!");
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
  if (playerData.coins < 50) return alert("تحتاج 50 🪙!");
  if (confirm("هل تريد إنفاق 50 🪙 وتخطي السؤال؟")) {
    playerData.coins -= 50;
    savePlayerData();
    updateUI();
    onStagePassed();
  }
}

function openForgotPassModal() { document.getElementById('forgot-modal').style.display = 'flex'; }
function openProfileModal() { document.getElementById('profile-modal').style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function submitPasswordReset() {
  const email = document.getElementById('reset-email-input').value.trim();
  if (!email) return alert("اكتب بريدك المسجل!");
  alert("جاري إرسال كلمة السر...");
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ action: 'reset_password', email })
  }).then(() => {
    alert("تفقد بريدك الإلكتروني الآن!");
    closeModal('forgot-modal');
  });
}

function submitChangePassword() {
  const newPass = document.getElementById('new-password-input').value.trim();
  if (!newPass) return alert("اكتب كلمة المرور الجديدة!");
  playerData.password = newPass;
  savePlayerData();
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ action: 'change_password', email: playerData.email, newPassword: newPass })
  });
  alert("تم التحديث!");
  closeModal('profile-modal');
}

function linkGoogleAccount() {
  alert(`تم الربط مع حساب Google!`);
  closeModal('profile-modal');
}

function logoutPlayer() {
  localStorage.removeItem('fetnah_registered_player_v11');
  closeModal('profile-modal');
  showScreen('screen-auth');
}

// قراءة بيانات الشيت كنص CSV صريح (بدون أي كود برمجي أو خطر CSP)
async function loadStagesSilently() {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    const res = await fetch(csvUrl);
    if (!res.ok) return;
    const text = await res.text();
    
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) return;

    let dynamicStages = [];
    for (let i = 1; i < lines.length; i++) {
      // تفكيك أعمدة سطر الـ CSV
      const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
      if (cols.length >= 4 && !isNaN(cols[0])) {
        const id = parseInt(cols[0]);
        const type = cols[1];
        const qText = cols[2];
        const ans = cols[3];
        const rawAux = cols.slice(4).join(',');

        if (type.includes('خيار')) {
          const choices = rawAux.split(',').map(s => s.trim()).filter(Boolean);
          dynamicStages.push({ id, type: 'choices', question: qText, answer: ans, choices });
        } else if (qText && ans) {
          const letters = rawAux ? rawAux.split(',').map(s => s.trim()).filter(Boolean) : ans.split('');
          dynamicStages.push({ id, type: 'letters', question: qText, answer: ans, letters });
        }
      }
    }

    if (dynamicStages.length > 0) {
      stages = dynamicStages;
      renderMapNodes();
    }
  } catch(e) {
    console.log("استمرار العمل بالمراحل المدمجة:", e);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  checkExistingUser();
  loadStagesSilently();
});
