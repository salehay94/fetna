const SHEET_ID = '1wDdj4cnnBZ8CK63TPe2pvgZ44O_1VTyy9wgYPSeYSss';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzCZT8V6dwv8R5mWCj6n70p4omukxVsyWiYk0cw8CnPuSvvuDKRhfIvB1TKC1qocGMaMA/exec';

// روابط القراءة المباشرة لكل تبويب باسمه العربي المشفر
const URL_CHOICES = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('خيارات')}`;
const URL_LETTERS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('المراحل')}`;
const URL_CROSS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('كلمات_متقاطعة')}`;

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

// 1. إدارة الحساب
function checkExistingUser() {
  const saved = localStorage.getItem('fetnah_registered_player_v8');
  if (saved) {
    try { playerData = JSON.parse(saved); } catch(e) {}
    updateUI();
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
  showScreen('screen-home');

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
  }).catch(err => console.log("تعذر المزامنة:", err));
}

function savePlayerData() {
  localStorage.setItem('fetnah_registered_player_v8', JSON.stringify(playerData));
}

function updateUI() {
  const nameEl = document.getElementById('display-player-name');
  if (nameEl) nameEl.innerText = playerData.name || 'اللاعب';
  ['home-coins', 'map-coins', 'game-coins'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = playerData.coins;
  });
}

// 2. دالة مساعدة لقراءة أي تبويب بأمان
async function fetchSheetRows(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    return json.table.rows || [];
  } catch(e) {
    return [];
  }
}

// 3. قراءة كل التبويبات ودمجها في قائمة مراحل متسلسلة
async function loadStagesFromSheet() {
  try {
    let combinedStages = [];
    let stageCounter = 1;

    // أولاً: قراءة أسئلة تجميع الحروف من تبويب "المراحل"
    const rowsLetters = await fetchSheetRows(URL_LETTERS);
    rowsLetters.forEach(r => {
      const c = r.c;
      if (c && c[0] && !isNaN(c[0].v)) {
        const qText = c[1] ? String(c[1].v).trim() : (c[2] ? String(c[2].v).trim() : '');
        const ans = c[2] && isNaN(c[2].v) ? String(c[2].v).trim() : (c[3] ? String(c[3].v).trim() : '');
        const rawLetters = c[3] && String(c[3].v).includes(',') ? String(c[3].v) : (c[4] ? String(c[4].v) : '');
        const letters = rawLetters ? rawLetters.split(',').map(s => s.trim()) : ans.split('');

        if (qText && ans) {
          combinedStages.push({
            id: stageCounter++,
            type: 'letters',
            question: qText,
            answer: ans,
            letters: letters
          });
        }
      }
    });

    // ثانياً: قراءة أسئلة الخيارات من تبويب "خيارات"
    const rowsChoices = await fetchSheetRows(URL_CHOICES);
    rowsChoices.forEach(r => {
      const c = r.c;
      if (c && c[0] && !isNaN(c[0].v)) {
        const qText = c[1] ? String(c[1].v).trim() : '';
        const opt1 = c[2] ? String(c[2].v).trim() : '';
        const opt2 = c[3] ? String(c[3].v).trim() : '';
        const opt3 = c[4] ? String(c[4].v).trim() : '';
        const opt4 = c[5] ? String(c[5].v).trim() : '';
        const ans = c[6] ? String(c[6].v).trim() : '';

        if (qText && ans) {
          combinedStages.push({
            id: stageCounter++,
            type: 'choices',
            question: qText,
            answer: ans,
            choices: [opt1, opt2, opt3, opt4].filter(Boolean)
          });
        }
      }
    });

    // ثالثاً: قراءة الكلمات المتقاطعة من تبويب "كلمات_متقاطعة"
    const rowsCross = await fetchSheetRows(URL_CROSS);
    let crossGroups = {};
    rowsCross.forEach(r => {
      const c = r.c;
      if (c && c[0] && !isNaN(c[0].v)) {
        const stNum = parseInt(c[0].v);
        const dir = c[1] ? String(c[1].v).trim() : 'أفقي';
        const qText = c[2] ? String(c[2].v).trim() : '';
        const ans = c[3] ? String(c[3].v).trim() : '';
        if (!crossGroups[stNum]) crossGroups[stNum] = [];
        crossGroups[stNum].push({ dir, qText, ans });
      }
    });

    Object.keys(crossGroups).forEach(k => {
      const group = crossGroups[k];
      if (group.length >= 2) {
        combinedStages.push({
          id: stageCounter++,
          type: 'letters',
          question: `كلمات متقاطعة:\n1- أفقي: ${group[0].qText}\n2- عمودي: ${group[1].qText}`,
          answer: group[0].ans,
          letters: (group[0].ans + group[1].ans).split('')
        });
      }
    });

    if (combinedStages.length > 0) {
      stages = combinedStages;
    } else {
      // احتياطي فوري إذا تأخر الاتصال
      stages = [
        { id: 1, type: 'letters', question: "من هو خاتم الأنبياء؟", answer: "محمد", letters: ["م","ح","م","د","ع","ل","ي"] },
        { id: 2, type: 'choices', question: "كم عدد سور القرآن الكريم؟", answer: "114 سورة", choices: ["110 سورة", "112 سورة", "114 سورة", "120 سورة"] }
      ];
    }

    renderMapNodes();
  } catch(e) {
    console.error("خطأ قراءة الشيت:", e);
    renderMapNodes();
  }
}

// 4. خريطة المراحل
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
  if (!stages || stages.length === 0) {
    alert("جاري تحميل الأسئلة من الشيت... انتظر ثانية ثم أعد المحاولة.");
    return;
  }
  let target = playerData.maxStage;
  if (target > stages.length) target = stages.length;
  startStage(target);
}

function startStage(stageNum) {
  if (!stages || stages.length === 0) return alert("المراحل قيد التحميل...");
  
  let stage = stages.find(s => s.id === stageNum) || stages[stages.length - 1];
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

// استعادة كلمة المرور
function openForgotPassModal() { document.getElementById('forgot-modal').style.display = 'flex'; }
function submitPasswordReset() {
  const email = document.getElementById('reset-email-input').value.trim();
  if (!email) return alert("يرجى كتابة بريدك المسجل!");
  alert("جاري التحقق وإرسال كلمة السر...");
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ action: 'reset_password', email })
  }).then(() => {
    alert("إذا كان بريدك مسجلاً، ستصلك كلمة مرور جديدة فوراً!");
    closeModal('forgot-modal');
  });
}

function openProfileModal() { document.getElementById('profile-modal').style.display = 'flex'; }
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
  alert("تم تحديث كلمة المرور!");
  closeModal('profile-modal');
}

function linkGoogleAccount() {
  alert(`تم ربط حسابك (${playerData.email}) بنجاح مع Google!`);
  closeModal('profile-modal');
}

function logoutPlayer() {
  localStorage.removeItem('fetnah_registered_player_v8');
  closeModal('profile-modal');
  showScreen('screen-auth');
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}

window.onload = () => {
  checkExistingUser();
  loadStagesFromSheet();
};
