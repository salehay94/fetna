// إدارة الأسئلة، تجميع الحروف، الخيارات، والمساعدات
var currentPlayingStage = 1;
var userGuess = [];

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
    btn.onclick = function() {
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
  if (playerData.coins < 20) return alert('تحتاج 20 قطعة نقدية!');
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
  if (playerData.coins < 50) return alert('تحتاج 50 قطعة نقدية!');
  if (confirm('هل تريد إنفاق 50 قطعة نقدية وتخطي السؤال؟')) {
    playerData.coins -= 50;
    savePlayerData();
    updateUI();
    onStagePassed();
  }
}
