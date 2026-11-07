var currentStageIndex = 0;
var currentInputLetters = [];
var targetAnswer = '';

function startStage(stageNumber) {
  if (playerData.hearts <= 0) {
    if (typeof playSound === 'function') playSound('empty');
    openHeartsShopModal();
    return;
  }

  if (typeof playSound === 'function') playSound('click');

  if (!stages || stages.length === 0) {
    alert('جاري تحميل الأسئلة...');
    return;
  }

  currentStageIndex = stageNumber - 1;
  var stage = stages[currentStageIndex];
  if (!stage) return;

  var resModal = document.getElementById('result-modal');
  if (resModal) resModal.style.display = 'none';

  var titleEl = document.getElementById('stage-title');
  if (titleEl) titleEl.innerText = 'المرحلة ' + stage.id;

  var qText = document.getElementById('question-text');
  if (qText) qText.innerText = stage.question;

  var badgeEl = document.getElementById('stage-badge-type');
  var lettersArea = document.getElementById('letters-mode-area');
  var choicesArea = document.getElementById('choice-mode-area');
  var tfArea = document.getElementById('tf-mode-area');

  if (lettersArea) lettersArea.style.display = 'none';
  if (choicesArea) choicesArea.style.display = 'none';
  if (tfArea) tfArea.style.display = 'none';

  showScreen('screen-game');

  if (stage.type === 'choices') {
    if (badgeEl) badgeEl.innerText = 'اختيار من متعدد';
    setupChoicesMode(stage);
  } else if (stage.type === 'tf') {
    if (badgeEl) badgeEl.innerText = 'صح أم خطأ';
    setupTFMode(stage);
  } else {
    if (badgeEl) badgeEl.innerText = 'تجميع حروف';
    setupLettersMode(stage);
  }
}

function setupTFMode(stage) {
  var tfArea = document.getElementById('tf-mode-area');
  if (tfArea) tfArea.style.display = 'flex';
}

function checkTrueFalseAnswer(userChoice) {
  var stage = stages[currentStageIndex];
  if (!stage) return;

  var cleanAnswer = String(stage.answer).trim();
  if (userChoice === cleanAnswer) {
    handleStageSuccess(stage.reward || 5);
  } else {
    handleStageFail();
  }
}

function setupChoicesMode(stage) {
  var choicesArea = document.getElementById('choice-mode-area');
  if (!choicesArea) return;
  choicesArea.innerHTML = '';
  choicesArea.style.display = 'flex';

  var choicesList = stage.choices || [];
  choicesList.forEach(function(opt) {
    var btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = opt;
    btn.onclick = function() {
      if (opt === String(stage.answer).trim()) {
        btn.classList.add('correct');
        setTimeout(function() {
          handleStageSuccess(stage.reward || 5);
        }, 300);
      } else {
        btn.classList.add('wrong');
        setTimeout(function() {
          handleStageFail();
        }, 300);
      }
    };
    choicesArea.appendChild(btn);
  });
}

function setupLettersMode(stage) {
  var lettersArea = document.getElementById('letters-mode-area');
  if (lettersArea) lettersArea.style.display = 'block';

  targetAnswer = String(stage.answer).replace(/[\s,،]/g, '');
  currentInputLetters = [];

  var boxes = document.getElementById('answer-boxes');
  if (boxes) {
    boxes.innerHTML = '';
    for (var i = 0; i < targetAnswer.length; i++) {
      var slot = document.createElement('div');
      slot.className = 'char-slot';
      slot.id = 'slot-' + i;
      slot.onclick = (function(idx) {
        return function() { removeLetterAt(idx); };
      })(i);
      boxes.appendChild(slot);
    }
  }

  var keyboard = document.getElementById('letters-keyboard');
  if (keyboard) {
    keyboard.innerHTML = '';
    var keys = stage.letters && stage.letters.length > 0 ? stage.letters : targetAnswer.split('');
    keys.forEach(function(char, kIdx) {
      var kBtn = document.createElement('button');
      kBtn.className = 'key-btn';
      kBtn.id = 'key-' + kIdx;
      kBtn.innerText = char;
      kBtn.onclick = function() {
        appendLetter(char, kIdx);
      };
      keyboard.appendChild(kBtn);
    });
  }
}

function appendLetter(char, keyIndex) {
  if (currentInputLetters.length >= targetAnswer.length) return;
  if (typeof playSound === 'function') playSound('click');

  currentInputLetters.push({ char: char, keyIndex: keyIndex });
  var kBtn = document.getElementById('key-' + keyIndex);
  if (kBtn) kBtn.style.visibility = 'hidden';

  renderAnswerSlots();

  if (currentInputLetters.length === targetAnswer.length) {
    var userAns = currentInputLetters.map(function(item) { return item.char; }).join('');
    if (userAns === targetAnswer) {
      var stage = stages[currentStageIndex];
      handleStageSuccess(stage ? (stage.reward || 5) : 5);
    } else {
      handleStageFail();
    }
  }
}

function removeLetterAt(index) {
  if (index >= currentInputLetters.length) return;
  if (typeof playSound === 'function') playSound('click');

  var removed = currentInputLetters.splice(index, 1)[0];
  if (removed && removed.keyIndex !== undefined) {
    var kBtn = document.getElementById('key-' + removed.keyIndex);
    if (kBtn) kBtn.style.visibility = 'visible';
  }
  renderAnswerSlots();
}

function renderAnswerSlots() {
  for (var i = 0; i < targetAnswer.length; i++) {
    var slot = document.getElementById('slot-' + i);
    if (slot) {
      slot.innerText = currentInputLetters[i] ? currentInputLetters[i].char : '';
    }
  }
}

function handleStageSuccess(reward) {
  if (typeof playSound === 'function') playSound('correct');

  playerData.coins += reward;
  if (currentStageIndex + 1 === playerData.maxStage) {
    playerData.maxStage++;
  }
  savePlayerData();
  updateUI();

  if (typeof pushPlayerDataToSheet === 'function') {
    pushPlayerDataToSheet();
  }

  var resModal = document.getElementById('result-modal');
  var resCard = document.getElementById('result-card-box');
  var resIcon = document.getElementById('result-icon');
  var resTitle = document.getElementById('result-title');
  var resDesc = document.getElementById('result-desc');
  var resBtn = document.getElementById('result-btn');

  if (resCard) resCard.classList.remove('wrong-border');
  if (resIcon) resIcon.innerText = '🎉';
  if (resTitle) resTitle.innerText = 'أحسنت! إجابة صحيحة';
  if (resDesc) resDesc.innerText = '+' + reward + ' نقاط تمت إضافتها لرصيدك';
  if (resBtn) resBtn.innerText = 'المرحلة التالية';

  if (resModal) resModal.style.display = 'flex';
}

function handleStageFail() {
  if (typeof playSound === 'function') playSound('wrong');

  playerData.hearts = Math.max(0, (playerData.hearts || 3) - 1);
  if (playerData.hearts < 3 && !playerData.lastHeartTime) {
    playerData.lastHeartTime = Date.now();
  }
  savePlayerData();
  updateUI();

  var resModal = document.getElementById('result-modal');
  var resCard = document.getElementById('result-card-box');
  var resIcon = document.getElementById('result-icon');
  var resTitle = document.getElementById('result-title');
  var resDesc = document.getElementById('result-desc');
  var resBtn = document.getElementById('result-btn');

  if (resCard) resCard.classList.add('wrong-border');
  if (resIcon) resIcon.innerText = '💔';
  if (resTitle) resTitle.innerText = 'إجابة غير صحيحة!';
  
  if (playerData.hearts > 0) {
    if (resDesc) resDesc.innerText = 'خسرت قلباً! تبقى لديك ' + playerData.hearts + ' قلوب.';
    if (resBtn) resBtn.innerText = 'إعادة المحاولة';
  } else {
    if (resDesc) resDesc.innerText = 'نفدت قلوبك! يمكنك شحن القلوب بالنقاط أو الانتظار ⏳';
    if (resBtn) resBtn.innerText = 'العودة للرئيسية';
  }

  if (resModal) resModal.style.display = 'flex';
}

function handleResultDismiss() {
  var resModal = document.getElementById('result-modal');
  if (resModal) resModal.style.display = 'none';

  if (playerData.hearts <= 0) {
    showScreen('screen-home');
    openHeartsShopModal();
    return;
  }

  var resTitle = document.getElementById('result-title');
  if (resTitle && resTitle.innerText.indexOf('أحسنت') !== -1) {
    if (currentStageIndex + 1 < stages.length) {
      startStage(currentStageIndex + 2);
    } else {
      openMapScreen();
    }
  } else {
    startStage(currentStageIndex + 1);
  }
}

function handleResultGoHome() {
  var resModal = document.getElementById('result-modal');
  if (resModal) resModal.style.display = 'none';
  showScreen('screen-home');
}

function useHintRevealLetter() {
  var stage = stages[currentStageIndex];
  if (!stage || stage.type !== 'letters') {
    alert('كشف الحروف متاح فقط في مراحل تجميع الكلمات!');
    return;
  }
  if (playerData.coins < 20) {
    if (typeof playSound === 'function') playSound('empty');
    alert('عذراً، لا تملك رصيداً كافياً (المطلوب 20 نقطة)');
    return;
  }
  if (currentInputLetters.length >= targetAnswer.length) return;

  if (typeof playSound === 'function') playSound('click');
  playerData.coins -= 20;
  savePlayerData();
  updateUI();
  if (typeof pushPlayerDataToSheet === 'function') pushPlayerDataToSheet();

  var nextIdx = currentInputLetters.length;
  var requiredChar = targetAnswer[nextIdx];

  var keyboard = document.getElementById('letters-keyboard');
  var buttons = keyboard ? keyboard.querySelectorAll('.key-btn') : [];
  for (var b = 0; b < buttons.length; b++) {
    if (buttons[b].innerText === requiredChar && buttons[b].style.visibility !== 'hidden') {
      appendLetter(requiredChar, b);
      break;
    }
  }
}

function useHintSkipStage() {
  if (playerData.coins < 50) {
    if (typeof playSound === 'function') playSound('empty');
    alert('عذراً، لا تملك رصيداً كافياً لتخطي المرحلة (المطلوب 50 نقطة)');
    return;
  }
  playerData.coins -= 50;
  var stage = stages[currentStageIndex];
  handleStageSuccess(stage ? (stage.reward || 5) : 5);
}
