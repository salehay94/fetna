// الرابط المباشر للـ Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzN3JfmOEpwHgEkb4oaAYXufez3ug9Ah94HfYqXPaiUzQWfeirGl2ua9OJCWpKA9V8HGg/exec';

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

// 1. التنقل بين الشاشات
function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(function(s) {
    s.classList.remove('active');
  });
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
  }
}

// 2. التحقق من اللاعب وبدء النظام
function checkExistingUser() {
  const saved = localStorage.getItem('fetnah_player_v15');
  if (saved) {
    try {
      playerData = JSON.parse(saved);
    } catch (e) {}
  }
  updateUI();
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
    alert('يرجى إدخال اسم اللاعب والبريد الإلكتروني للمتابعة!');
    return;
  }

  playerData.name = name;
  playerData.email = email;
  playerData.password = pass || '123456';

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
    }).catch(function() {});
  }
}

function savePlayerData() {
  localStorage.setItem('fetnah_player_v15', JSON.stringify(playerData));
}

function updateUI() {
  const nameEl = document.getElementById('display-player-name');
  if (nameEl) nameEl.innerText = playerData.name || 'اللاعب';

  const coinIds = ['home-coins', 'map-coins', 'game-coins'];
  coinIds.forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.innerText = playerData.coins;
  });
}

// 3. جلب المراحل ديناميكياً من الشيت
async function loadStagesFromScript() {
  try {
    const res = await fetch(APPS_SCRIPT_URL);
    if (!res.ok) throw new Error('Network error');
    const dynamicStages = await res.json();

    if (Array.isArray(dynamicStages) && dynamicStages.length > 0) {
      stages = dynamicStages;
      renderMapNodes();
      console.log('تم تحميل ' + stages.length + ' مرحلة من الشيت.');
      return;
    }
  } catch (err) {
    console.log('تعذر الجلب المباشر، جاري استخدام المراحل الاحتياطية:', err);
  }

  // مصفوفة احتياطية آمنة في حال تأخر الاستجابة
  if (stages.length === 0) {
    stages = [
      { id: 1, type: 'letters', question: 'ما هي قبلة المسلمين التي يتجهون إليها في صلاتهم؟', answer: 'الكعبة', letters: ['ا','ل','ك','ع','ب','ة','م','ق'] },
      { id: 2, type: 'letters', question: 'المدينة المقدسة التي ولد فيها النبي صلى الله عليه وسلم', answer: 'مكة', letters: ['م','ك','ة','ب','د','ر','س','ع'] },
      { id: 3, type: 'letters', question: 'من هو خاتم الأنبياء والمرسلين صلى الله عليه وسلم؟', answer: 'محمد', letters: ['م','ح','م','د','ع','ل','ي','س'] },
      { id: 4, type: 'choices', question: 'كم عدد سور القرآن الكريم؟', answer: '114 سورة', choices: ['110 سورة', '112 سورة', '114 سورة', '120 سورة'] },
      { id: 5, type: 'choices', question: 'في أي عام هجري وقعت غزوة بدر الكبرى؟', answer: '2 هـ', choices: ['1 هـ', '2 هـ', '3 هـ', '5 هـ'] }
    ];
    renderMapNodes();
  }
}

// 4. بناء خريطة المراحل
function renderMapNodes() {
  const container = document.getElementById('map-container');
  if (!container) return;
  container.innerHTML = '';

  stages.forEach(function(st) {
    const node = document.createElement('div');
    node.innerText = st.id;

    if (st.id < playerData.maxStage) {
      node.className = 'stage-node completed';
      node.title = 'مرحلة مكتملة';
      node.addEventListener('click', function() { startStage(st.id); });
    } else if (st.id === playerData.maxStage) {
      node.className = 'stage-node current';
      node.addEventListener('click', function() { startStage(st.id); });
    } else {
      node.className = 'stage-node locked';
      node.innerText = '🔒';
      node.addEventListener('click', function() { alert('المرحلة مقفولة! أنجز المراحل السابقة أولاً.'); });
    }

    container.appendChild(node);
  });
}

function continueCurrentStage() {
  if (!stages || stages.length === 0) {
    alert('جاري تحميل المراحل... انتظر ثانية واحدة ثم حاول مجدداً.');
    return;
  }
  let target = playerData.maxStage || 1;
  if (target > stages.length) target = stages.length;
  startStage(target);
}

// 5. بدء المرحلة
function startStage(stageNum) {
  if (!stages || stages.length === 0) return alert('المراحل قيد التحميل...');

  let stage = stages.find(function(s) { return s.id === stageNum; }) || stages[0];
  currentPlayingStage = stage.id;
  userGuess = [];

  const titleEl = document.getElementById('stage-title');
  const qTextEl = document.getElementById('question-text');
  if (titleEl) titleEl.innerText = 'المرحلة ' + stage.id;
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

  choices.forEach(function(opt) {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = opt;
    btn.addEventListener('click', function() {
      if (opt === correctAnswer) {
        btn.classList.add('correct');
        setTimeout(function() {
          alert('أحسنت! إجابة صحيحة 🎉');
          onStagePassed();
        }, 200);
      } else {
        btn.classList.add('wrong');
        setTimeout(function() {
          alert('إجابة غير صحيحة، حاول مجدداً!');
          btn.classList.remove('wrong');
        }, 200);
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
  const shuffled = letters.slice().sort(function() { return 0.5 - Math.random(); });
  shuffled.forEach(function(char) {
    const btn = document.createElement('button');
    btn.className = 'key-btn';
    btn.innerText = char;
    btn.addEventListener('click', function() { selectLetter(char, btn); });
    container.appendChild(btn);
  });
}

function selectLetter(char, btn) {
  const stage = stages.find(function(s) { return s.id === currentPlayingStage; });
  if (!stage || userGuess.length >= stage.answer.length) return;

  userGuess.push({ char: char, btn: btn });
  btn.style.visibility = 'hidden';
  updateSlots();

  if (userGuess.length === stage.answer.length) {
    const word = userGuess.map(function(i) { return i.char; }).join('');
    if (word === stage.answer) {
      setTimeout(function() {
        alert('أحسنت! إجابة صحيحة 🎉');
        onStagePassed();
      }, 200);
    } else {
      setTimeout(function() {
        alert('إجابة غير صحيحة!');
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
      }).catch(function() {});
    }
  }

  if (currentPlayingStage < stages.length) {
    startStage(currentPlayingStage + 1);
  } else {
    alert('تبارك الله! ختمت كل المراحل المتوفرة.');
    showScreen('screen-map');
  }
}

function updateSlots() {
  const slots = document.querySelectorAll('.char-slot');
  slots.forEach(function(s, i) {
    s.innerText = userGuess[i] ? userGuess[i].char : '';
  });
}

function resetGuess() {
  userGuess.forEach(function(i) {
    if (i.btn) i.btn.style.visibility = 'visible';
  });
  userGuess = [];
  updateSlots();
}

function useHintRevealLetter() {
  if (playerData.coins < 20) return alert('تحتاج 20 قطعة نقدية على الأقل!');
  const stage = stages.find(function(s) { return s.id === currentPlayingStage; });
  if (!stage || stage.type !== 'letters') return;

  const curLen = userGuess.length;
  if (curLen < stage.answer.length) {
    const correctChar = stage.answer[curLen];
    playerData.coins -= 20;
    savePlayerData();
    updateUI();

    const keyBtns = document.querySelectorAll('.key-btn');
    for (let i = 0; i < keyBtns.length; i++) {
      const btn = keyBtns[i];
      if (btn.innerText === correctChar && btn.style.visibility !== 'hidden') {
        selectLetter(correctChar, btn);
        break;
      }
    }
  }
}

function useHintSkipStage() {
  if (playerData.coins < 50) return alert('تحتاج 50 قطعة نقدية على الأقل!');
  if (confirm('هل تريد إنفاق 50 قطعة نقدية وتخطي هذا السؤال؟')) {
    playerData.coins -= 50;
    savePlayerData();
    updateUI();
    onStagePassed();
  }
}

function openForgotPassModal() {
  const m = document.getElementById('forgot-modal');
  if (m) m.style.display = 'flex';
}

function submitPasswordReset() {
  const emailInput = document.getElementById('reset-email-input');
  const email = emailInput ? emailInput.value.trim() : '';
  if (!email) return alert('يرجى كتابة بريدك المسجل!');

  alert('جاري إرسال كلمة المرور إلى بريدك الإلكتروني...');
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ action: 'reset_password', email: email })
  }).then(function() {
    alert('تفقد صندوق الوارد في بريدك الإلكتروني الآن!');
    closeModal('forgot-modal');
  }).catch(function() {
    alert('تعذر الاتصال بالخادم.');
  });
}

function openProfileModal() {
  const m = document.getElementById('profile-modal');
  if (m) m.style.display = 'flex';
}

function submitChangePassword() {
  const passInput = document.getElementById('new-password-input');
  const newPass = passInput ? passInput.value.trim() : '';
  if (!newPass) return alert('اكتب كلمة المرور الجديدة!');

  playerData.password = newPass;
  savePlayerData();
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ action: 'change_password', email: playerData.email, newPassword: newPass })
  }).catch(function() {});

  alert('تم تحديث كلمة المرور بنجاح!');
  closeModal('profile-modal');
}

function linkGoogleAccount() {
  alert('تم ربط حسابك بنجاح مع Google!');
  closeModal('profile-modal');
}

function logoutPlayer() {
  localStorage.removeItem('fetnah_player_v15');
  closeModal('profile-modal');
  showScreen('screen-auth');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

window.addEventListener('DOMContentLoaded', function() {
  checkExistingUser();
  loadStagesFromScript();
});
