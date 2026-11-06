var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzN3JfmOEpwHgEkb4oaAYXufez3ug9Ah94HfYqXPaiUzQWfeirGl2ua9OJCWpKA9V8HGg/exec';

var stages = [];
var currentPlayingStage = 1;
var userGuess = [];

var playerData = {
  name: 'saleh',
  email: 'mr.saleh.ay.94@gmail.com',
  password: '',
  maxStage: 1,
  coins: 150
};

function showScreen(screenId) {
  var screens = document.querySelectorAll('.screen');
  for (var i = 0; i < screens.length; i++) {
    screens[i].classList.remove('active');
  }
  var target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
  }
}

function checkExistingUser() {
  var saved = localStorage.getItem('fetnah_v30');
  if (saved) {
    try {
      playerData = JSON.parse(saved);
    } catch (e) {}
  }
  updateUI();
  showScreen('screen-home');
}

function handleAuthLogin() {
  var nameInput = document.getElementById('auth-name');
  var emailInput = document.getElementById('auth-email');
  var passInput = document.getElementById('auth-pass');

  var name = nameInput ? nameInput.value.trim() : '';
  var email = emailInput ? emailInput.value.trim() : '';
  var pass = passInput ? passInput.value.trim() : '';

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
  localStorage.setItem('fetnah_v30', JSON.stringify(playerData));
}

function updateUI() {
  var nameEl = document.getElementById('display-player-name');
  if (nameEl) nameEl.innerText = playerData.name || 'اللاعب';

  var coinIds = ['home-coins', 'map-coins', 'game-coins'];
  for (var i = 0; i < coinIds.length; i++) {
    var el = document.getElementById(coinIds[i]);
    if (el) el.innerText = playerData.coins;
  }
}

async function loadStagesFromScript() {
  try {
    var res = await fetch(APPS_SCRIPT_URL);
    if (!res.ok) throw new Error('Network error');
    var dynamicStages = await res.json();

    if (Array.isArray(dynamicStages) && dynamicStages.length > 0) {
      stages = dynamicStages;
      renderMapNodes();
      console.log('تم تحميل المراحل بنجاح: ' + stages.length);
      return;
    }
  } catch (err) {
    console.log('جاري تشغيل المراحل الأساسية:', err);
  }

  if (stages.length === 0) {
    stages = [
      { id: 1, type: 'letters', question: 'ما هي قبلة المسلمين التي يتجهون إليها في صلاتهم؟', answer: 'الكعبة', letters: ['ا', 'ل', 'ك', 'ع', 'ب', 'ة', 'م', 'ق'] },
      { id: 2, type: 'letters', question: 'المدينة المقدسة التي ولد فيها النبي عليه الصلاة والسلام', answer: 'مكة', letters: ['م', 'ك', 'ة', 'ب', 'د', 'ر', 'س', 'ع'] },
      { id: 3, type: 'letters', question: 'من هو خاتم الأنبياء والمرسلين عليه الصلاة والسلام؟', answer: 'محمد', letters: ['م', 'ح', 'م', 'د', 'ع', 'ل', 'ي', 'س'] },
      { id: 4, type: 'choices', question: 'كم عدد سور القرآن الكريم؟', answer: '114 سورة', choices: ['110 سورة', '112 سورة', '114 سورة', '120 سورة'] },
      { id: 5, type: 'choices', question: 'في أي عام هجري وقعت غزوة بدر الكبرى؟', answer: '2 هـ', choices: ['1 هـ', '2 هـ', '3 هـ', '5 هـ'] }
    ];
    renderMapNodes();
  }
}

function renderMapNodes() {
  var container = document.getElementById('map-container');
  if (!container) return;
  container.innerHTML = '';

  stages.forEach(function(st) {
    var node = document.createElement('div');
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
    alert('جاري تجهيز المراحل... انتظر لحظة واحدة.');
    return;
  }
  var target = playerData.maxStage || 1;
  if (target > stages.length) target = stages.length;
  startStage(target);
}

function startStage(stageNum) {
  if (!stages || stages.length === 0) return alert('المراحل قيد التحميل...');

  var stage = stages.find(function(s) { return s.id === stageNum; }) || stages[0];
  currentPlayingStage = stage.id;
  userGuess = [];

  var titleEl = document.getElementById('stage-title');
  var qTextEl = document.getElementById('question-text');
  if (titleEl) titleEl.innerText = 'المرحلة ' + stage.id;
  if (qTextEl) qTextEl.innerText = stage.question;

  var typeBadge = document.getElementById('stage-badge-type');
  var lettersArea = document.getElementById('letters-mode-area');
  var choiceArea = document.getElementById('choice-mode-area');
  var hintBtn = document.getElementById('hint-letter-btn');

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
  var container = document.getElementById('choice-mode-area');
  if (!container) return;
  container.innerHTML = '';

  choices.forEach(function(opt) {
    var btn = document.createElement('button');
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
  var container = document.getElementById('answer-boxes');
  if (!container) return;
  container.innerHTML = '';
  for (var i = 0; i < count; i++) {
    var slot = document.createElement('div');
    slot.className = 'char-slot';
    container.appendChild(slot);
  }
}

function renderKeyboard(letters) {
  var container = document.getElementById('letters-keyboard');
  if (!container) return;
  container.innerHTML = '';
  var shuffled = letters.slice().sort(function() { return 0.5 - Math.random(); });
  shuffled.forEach(function(char) {
    var btn = document.createElement('button');
    btn.className = 'key-btn';
    btn.innerText = char;
    btn.addEventListener('click', function() { selectLetter(char, btn); });
    container.appendChild(btn);
  });
}

function selectLetter(char, btn) {
  var stage = stages.find(function(s) { return s.id === currentPlayingStage; });
  if (!stage || userGuess.length >= stage.answer.length) return;

  userGuess.push({ char: char, btn: btn });
  btn.style.visibility = 'hidden';
  updateSlots();

  if (userGuess.length === stage.answer.length) {
    var word = userGuess.map(function(i) { return i.char; }).join('');
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
  var slots = document.querySelectorAll('.char-slot');
  for (var i = 0; i < slots.length; i++) {
    slots[i].innerText = userGuess[i] ? userGuess[i].char : '';
  }
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
  var stage = stages.find(function(s) { return s.id === currentPlayingStage; });
  if (!stage || stage.type !== 'letters') return;

  var curLen = userGuess.length;
  if (curLen < stage.answer.length) {
    var correctChar = stage.answer[curLen];
    playerData.coins -= 20;
    savePlayerData();
    updateUI();

    var keyBtns = document.querySelectorAll('.key-btn');
    for (var i = 0; i < keyBtns.length; i++) {
      var btn = keyBtns[i];
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

function bindAllEvents() {
  var btnLogin = document.getElementById('btn-login-submit');
  if (btnLogin) btnLogin.addEventListener('click', handleAuthLogin);

  var btnContinue = document.getElementById('btn-continue-game');
  if (btnContinue) btnContinue.addEventListener('click', continueCurrentStage);

  var btnToMap = document.getElementById('btn-to-map');
  if (btnToMap) btnToMap.addEventListener('click', function() { showScreen('screen-map'); });

  var btnMapBack = document.getElementById('btn-map-back');
  if (btnMapBack) btnMapBack.addEventListener('click', function() { showScreen('screen-home'); });

  var btnGameExit = document.getElementById('btn-game-exit');
  if (btnGameExit) btnGameExit.addEventListener('click', function() { showScreen('screen-map'); });

  var btnHintLetter = document.getElementById('hint-letter-btn');
  if (btnHintLetter) btnHintLetter.addEventListener('click', useHintRevealLetter);

  var btnHintSkip = document.getElementById('hint-skip-btn');
  if (btnHintSkip) btnHintSkip.addEventListener('click', useHintSkipStage);

  var btnOpenForgot = document.getElementById('btn-open-forgot');
  if (btnOpenForgot) btnOpenForgot.addEventListener('click', function() {
    var m = document.getElementById('forgot-modal');
    if (m) m.style.display = 'flex';
  });

  var btnCloseForgot = document.getElementById('btn-close-forgot');
  if (btnCloseForgot) btnCloseForgot.addEventListener('click', function() {
    var m = document.getElementById('forgot-modal');
    if (m) m.style.display = 'none';
  });

  var btnSubmitReset = document.getElementById('btn-submit-reset');
  if (btnSubmitReset) btnSubmitReset.addEventListener('click', function() {
    var emailInput = document.getElementById('reset-email-input');
    var email = emailInput ? emailInput.value.trim() : '';
    if (!email) return alert('يرجى كتابة بريدك المسجل!');
    alert('جاري إرسال كلمة المرور إلى بريدك الإلكتروني...');
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'reset_password', email: email })
    }).then(function() {
      alert('تفقد صندوق الوارد في بريدك الإلكتروني الآن!');
      var m = document.getElementById('forgot-modal');
      if (m) m.style.display = 'none';
    });
  });

  var btnOpenProfile = document.getElementById('btn-open-profile');
  if (btnOpenProfile) btnOpenProfile.addEventListener('click', function() {
    var m = document.getElementById('profile-modal');
    if (m) m.style.display = 'flex';
  });

  var btnCloseProfile = document.getElementById('btn-close-profile');
  if (btnCloseProfile) btnCloseProfile.addEventListener('click', function() {
    var m = document.getElementById('profile-modal');
    if (m) m.style.display = 'none';
  });

  var btnSaveNewPass = document.getElementById('btn-save-new-pass');
  if (btnSaveNewPass) btnSaveNewPass.addEventListener('click', function() {
    var passInput = document.getElementById('new-password-input');
    var newPass = passInput ? passInput.value.trim() : '';
    if (!newPass) return alert('اكتب كلمة المرور الجديدة!');
    playerData.password = newPass;
    savePlayerData();
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'change_password', email: playerData.email, newPassword: newPass })
    }).catch(function() {});
    alert('تم تحديث كلمة المرور بنجاح!');
    var m = document.getElementById('profile-modal');
    if (m) m.style.display = 'none';
  });

  var btnLogout = document.getElementById('btn-player-logout');
  if (btnLogout) btnLogout.addEventListener('click', function() {
    localStorage.removeItem('fetnah_v30');
    var m = document.getElementById('profile-modal');
    if (m) m.style.display = 'none';
    showScreen('screen-auth');
  });
}

window.addEventListener('DOMContentLoaded', function() {
  bindAllEvents();
  checkExistingUser();
  loadStagesFromScript();
});
