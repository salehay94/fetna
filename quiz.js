var currentPlayingStage = 1;
var userGuess = [];
var isCrosswordSecondWord = false;
var nextActionCallback = null;

var praisePhrases = [
  'ما شاء الله!',
  'تبارك الرحمن!',
  'الحمد لله!',
  'تبارك الله!',
  'لا تنس ذكر الله!',
  'سبحان الله وبحمده!'
];

function getRandomPraise() {
  var index = Math.floor(Math.random() * praisePhrases.length);
  return praisePhrases[index];
}

function showGameAlert(isSuccess, title, desc, btnText, callback) {
  var modal = document.getElementById('result-modal');
  var card = document.getElementById('result-card-box');
  var icon = document.getElementById('result-icon');
  var t = document.getElementById('result-title');
  var d = document.getElementById('result-desc');
  var btn = document.getElementById('result-btn');
  var homeBtn = document.getElementById('result-home-btn');

  if (!modal) {
    if (callback) callback();
    return;
  }

  nextActionCallback = callback;

  if (isSuccess) {
    card.classList.remove('wrong-border');
    icon.innerText = '🎉';
    t.innerText = getRandomPraise();
    t.style.color = '#2E7D32';
    d.innerText = desc;
    btn.style.display = 'block';
    btn.className = 'btn btn-primary';
    btn.innerText = btnText || 'المرحلة التالية ⏩';
    if (homeBtn) homeBtn.style.display = 'block';
  } else {
    card.classList.add('wrong-border');
    icon.innerText = '❌';
    t.innerText = title || 'إجابة غير صحيحة!';
    t.style.color = '#C62828';
    d.innerText = desc || 'فكر مجدداً في السؤال وحاول';
    btn.style.display = 'block';
    btn.className = 'btn';
    btn.style.backgroundColor = '#E57373';
    btn.style.color = '#FFF';
    btn.innerText = btnText || 'إعادة المحاولة 🔄';
    if (homeBtn) homeBtn.style.display = 'none';
  }

  modal.style.display = 'flex';
}

function handleResultDismiss() {
  var modal = document.getElementById('result-modal');
  if (modal) modal.style.display = 'none';
  if (nextActionCallback) {
    var cb = nextActionCallback;
    nextActionCallback = null;
    cb();
  }
}

function handleResultGoHome() {
  var modal = document.getElementById('result-modal');
  if (modal) modal.style.display = 'none';
  nextActionCallback = null;
  showScreen('screen-home');
}

function startStage(stageNum) {
  if (!stages || stages.length === 0) return;

  var stage = stages.find(function(s) { return s.id === stageNum; }) || stages[0];
  currentPlayingStage = stage.id;
  userGuess = [];
  isCrosswordSecondWord = false;

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
  } else if (stage.type === 'crossword') {
    if (typeBadge) typeBadge.innerText = 'كلمات متقاطعة';
    if (lettersArea) lettersArea.style.display = 'block';
    if (choiceArea) choiceArea.style.display = 'none';
    if (hintBtn) hintBtn.style.display = 'inline-block';
    renderAnswerSlots(stage.answer.length);
    renderKeyboard(stage.letters);
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

  var stage = stages.find(function(s) { return s.id === currentPlayingStage; });
  var stageReward = (stage && stage.reward) ? Number(stage.reward) : 15;

  choices.forEach(function(opt) {
    var btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = opt;
    btn.onclick = function() {
      if (opt === correctAnswer) {
        btn.classList.add('correct');
        showGameAlert(true, '', '+' + stageReward + ' نقطة تمت إضافتها لرصيدك', 'المرحلة التالية ⏩', function() {
          onStagePassed();
        });
      } else {
        btn.classList.add('wrong');
        showGameAlert(false, 'إجابة غير صحيحة!', 'فكر مجدداً في السؤال وحاول', 'إعادة المحاولة 🔄', function() {
          btn.classList.remove('wrong');
        });
      }
    };
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
    btn.onclick = function() { selectLetter(char, btn); };
    container.appendChild(btn);
  });
}

function selectLetter(char, btn) {
  var stage = stages.find(function(s) { return s.id === currentPlayingStage; });
  if (!stage) return;

  var targetAnswer = (stage.type === 'crossword' && isCrosswordSecondWord) ? stage.crossAnswer : stage.answer;
  var stageReward = (stage && stage.reward) ? Number(stage.reward) : 15;

  if (userGuess.length >= targetAnswer.length) return;

  userGuess.push({ char: char, btn: btn });
  btn.style.visibility = 'hidden';
  updateSlots();

  if (userGuess.length === targetAnswer.length) {
    var word = userGuess.map(function(i) { return i.char; }).join('');
    
    if (word === targetAnswer) {
      if (stage.type === 'crossword' && !isCrosswordSecondWord) {
        showGameAlert(true, 'أحسنت!', 'الكلمة الأولى صحيحة، الآن جمّع الكلمة المتقاطعة الثانية', 'متابعة ⏩', function() {
          isCrosswordSecondWord = true;
          userGuess = [];
          renderAnswerSlots(stage.crossAnswer.length);
          var keys = document.querySelectorAll('.key-btn');
          keys.forEach(function(k) { k.style.visibility = 'visible'; });
        });
      } else {
        showGameAlert(true, '', '+' + stageReward + ' نقطة تمت إضافتها لرصيدك', 'المرحلة التالية ⏩', function() {
          onStagePassed();
        });
      }
    } else {
      showGameAlert(false, 'الكلمة غير صحيحة', 'حاول ترتيب الحروف بالشكل السليم', 'إعادة المحاولة 🔄', function() {
        resetGuess();
      });
    }
  }
}

function onStagePassed() {
  var stage = stages.find(function(s) { return s.id === currentPlayingStage; });
  var stageReward = (stage && stage.reward) ? Number(stage.reward) : 15;

  if (currentPlayingStage === playerData.maxStage) {
    playerData.maxStage++;
    playerData.coins += stageReward;
    savePlayerData();
    updateUI();
    if (typeof renderMapNodes === 'function') renderMapNodes();

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
    showGameAlert(true, 'تبارك الله!', 'ختمت جميع مراحل المسابقة بنجاح!', 'الخريطة 🗺️', function() {
      showScreen('screen-map');
    });
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
  if (playerData.coins < 20) {
    showGameAlert(false, 'الرصيد غير كافٍ', 'تحتاج إلى 20 🪙 على الأقل لاستخدام التلميح', 'حسناً');
    return;
  }
  var stage = stages.find(function(s) { return s.id === currentPlayingStage; });
  if (!stage || stage.type === 'choices') return;

  var targetAnswer = (stage.type === 'crossword' && isCrosswordSecondWord) ? stage.crossAnswer : stage.answer;
  var curLen = userGuess.length;

  if (curLen < targetAnswer.length) {
    var correctChar = targetAnswer[curLen];
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
  if (playerData.coins < 50) {
    showGameAlert(false, 'الرصيد غير كافٍ', 'تحتاج إلى 50 🪙 لتخطي هذا السؤال', 'حسناً');
    return;
  }
  playerData.coins -= 50;
  savePlayerData();
  updateUI();
  onStagePassed();
}
