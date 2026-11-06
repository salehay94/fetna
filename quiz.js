var currentPlayingStage = 1;
var userGuess = [];
var isCrosswordSecondWord = false;
var nextActionCallback = null;

// حالة الكلمات المتقاطعة
var cwHorizontalGuess = [];
var cwVerticalGuess = [];
var cwActiveWord = 'H'; // 'H' للأفقي و 'V' للعمودي

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

function getCurrentStageReward() {
  var stage = stages.find(function(s) { return s.id === currentPlayingStage; });
  if (!stage) return 15;
  var r = stage.reward || stage['النقاط'] || stage['المكافأة'] || stage.points;
  return (r && !isNaN(r)) ? Number(r) : 15;
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
  cwHorizontalGuess = [];
  cwVerticalGuess = [];
  cwActiveWord = 'H';

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
    setupCrosswordGame(stage);
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

/* =========================================
   نظام الكلمات المتقاطعة الشبكي
========================================= */
function setupCrosswordGame(stage) {
  var answerBoxes = document.getElementById('answer-boxes');
  if (!answerBoxes) return;

  var hWord = stage.answer;      // أفقي
  var vWord = stage.crossAnswer; // عمودي
  var intersectChar = stage.intersect || 'ت';

  var hIdx = hWord.indexOf(intersectChar);
  var vIdx = vWord.indexOf(intersectChar);
  if (hIdx === -1) hIdx = 0;
  if (vIdx === -1) vIdx = 0;

  var cols = hWord.length;
  var rows = vWord.length;

  var html = '';
  html += '<div class="cross-indicator-bar">';
  html += '  <span id="pill-h" class="cross-pill active">أفقي (' + hWord.length + ' أحرف)</span>';
  html += '  <span id="pill-v" class="cross-pill">عمودي (' + vWord.length + ' أحرف)</span>';
  html += '</div>';

  html += '<div class="crossword-container">';
  html += '  <div class="crossword-grid" style="grid-template-columns: repeat(' + cols + ', 42px); grid-template-rows: repeat(' + rows + ', 42px);">';

  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      var isH = (r === vIdx);
      var isV = (c === hIdx);

      if (isH && isV) {
        html += '<div class="cross-cell intersect" id="cell-' + r + '-' + c + '"></div>';
      } else if (isH) {
        html += '<div class="cross-cell" id="cell-' + r + '-' + c + '"></div>';
      } else if (isV) {
        html += '<div class="cross-cell" id="cell-' + r + '-' + c + '"></div>';
      } else {
        html += '<div class="cross-cell empty"></div>';
      }
    }
  }

  html += '  </div>';
  html += '</div>';

  answerBoxes.innerHTML = html;
  renderKeyboard(stage.letters);
}

function selectLetterCrossword(char, btn) {
  var stage = stages.find(function(s) { return s.id === currentPlayingStage; });
  if (!stage) return;

  var hWord = stage.answer;
  var vWord = stage.crossAnswer;
  var hIdx = hWord.indexOf(stage.intersect || 'ت');
  var vIdx = vWord.indexOf(stage.intersect || 'ت');
  if (hIdx === -1) hIdx = 0;
  if (vIdx === -1) vIdx = 0;

  if (cwActiveWord === 'H') {
    if (cwHorizontalGuess.length >= hWord.length) return;
    cwHorizontalGuess.push({ char: char, btn: btn });
    btn.style.visibility = 'hidden';

    var c = cwHorizontalGuess.length - 1;
    var cell = document.getElementById('cell-' + vIdx + '-' + c);
    if (cell) {
      cell.innerText = char;
      cell.classList.add('filled');
    }

    if (cwHorizontalGuess.length === hWord.length) {
      var fullH = cwHorizontalGuess.map(function(i){ return i.char; }).join('');
      if (fullH === hWord) {
        showGameAlert(true, 'أحسنت!', 'حللت الكلمة الأفقية بنجاح! الآن جمّع الكلمة العمودية', 'متابعة ⏩', function() {
          cwActiveWord = 'V';
          document.getElementById('pill-h').classList.remove('active');
          document.getElementById('pill-v').classList.add('active');

          // إظهار الحروف مرة أخرى للعمودي ما عدا الحرف المشترك
          var keys = document.querySelectorAll('.key-btn');
          keys.forEach(function(k) { k.style.visibility = 'visible'; });

          // تثبيت الحرف المشترك تلقائياً في العمودي
          cwVerticalGuess = [];
          for (var r = 0; r < vWord.length; r++) {
            if (r === vIdx) {
              cwVerticalGuess.push({ char: stage.intersect, auto: true });
            }
          }
        });
      } else {
        showGameAlert(false, 'الكلمة الأفقية غير صحيحة', 'حاول ترتيب الحروف بشكل سليم', 'إعادة المحاولة', function() {
          resetCrosswordGuess('H', vIdx, hWord.length);
        });
      }
    }
  } else {
    // حل العمودي
    if (cwVerticalGuess.length >= vWord.length) return;

    var curRow = cwVerticalGuess.length;
    if (curRow === vIdx) {
      // خانة التقاطع مملوءة مسبقاً
      curRow++;
    }

    cwVerticalGuess.push({ char: char, btn: btn });
    btn.style.visibility = 'hidden';

    var cellV = document.getElementById('cell-' + (cwVerticalGuess.length - 1) + '-' + hIdx);
    if (cellV) {
      cellV.innerText = char;
      cellV.classList.add('filled');
    }

    if (cwVerticalGuess.length === vWord.length) {
      var fullV = cwVerticalGuess.map(function(i){ return i.char; }).join('');
      if (fullV === vWord) {
        var reward = getCurrentStageReward();
        showGameAlert(true, '', '+' + reward + ' نقطة تمت إضافتها لرصيدك', 'المرحلة التالية ⏩', function() {
          onStagePassed();
        });
      } else {
        showGameAlert(false, 'الكلمة العمودية غير صحيحة', 'ركز وحاول مجدداً', 'إعادة المحاولة', function() {
          resetCrosswordGuess('V', hIdx, vWord.length, vIdx);
        });
      }
    }
  }
}

function resetCrosswordGuess(type, fixedPos, len, skipIdx) {
  if (type === 'H') {
    cwHorizontalGuess.forEach(function(i) {
      if (i.btn) i.btn.style.visibility = 'visible';
    });
    cwHorizontalGuess = [];
    for (var c = 0; c < len; c++) {
      var cell = document.getElementById('cell-' + fixedPos + '-' + c);
      if (cell) {
        cell.innerText = '';
        cell.classList.remove('filled');
      }
    }
  } else {
    cwVerticalGuess.forEach(function(i) {
      if (i.btn) i.btn.style.visibility = 'visible';
    });
    cwVerticalGuess = [];
    for (var r = 0; r < len; r++) {
      if (r === skipIdx) continue;
      var cellV = document.getElementById('cell-' + r + '-' + fixedPos);
      if (cellV) {
        cellV.innerText = '';
        cellV.classList.remove('filled');
      }
    }
  }
}

/* =========================================
   الأنماط الأخرى (خيارات + حروف)
========================================= */
function renderChoices(choices, correctAnswer) {
  var container = document.getElementById('choice-mode-area');
  if (!container) return;
  container.innerHTML = '';

  var reward = getCurrentStageReward();

  choices.forEach(function(opt) {
    var btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = opt;
    btn.onclick = function() {
      if (opt === correctAnswer) {
        btn.classList.add('correct');
        showGameAlert(true, '', '+' + reward + ' نقطة تمت إضافتها لرصيدك', 'المرحلة التالية ⏩', function() {
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
  var row = document.createElement('div');
  row.className = 'answer-row';
  for (var i = 0; i < count; i++) {
    var slot = document.createElement('div');
    slot.className = 'char-slot';
    row.appendChild(slot);
  }
  container.appendChild(row);
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
    btn.onclick = function() {
      var stage = stages.find(function(s) { return s.id === currentPlayingStage; });
      if (stage && stage.type === 'crossword') {
        selectLetterCrossword(char, btn);
      } else {
        selectLetter(char, btn);
      }
    };
    container.appendChild(btn);
  });
}

function selectLetter(char, btn) {
  var stage = stages.find(function(s) { return s.id === currentPlayingStage; });
  if (!stage) return;

  var targetAnswer = stage.answer;
  var reward = getCurrentStageReward();

  if (userGuess.length >= targetAnswer.length) return;

  userGuess.push({ char: char, btn: btn });
  btn.style.visibility = 'hidden';
  updateSlots();

  if (userGuess.length === targetAnswer.length) {
    var word = userGuess.map(function(i) { return i.char; }).join('');
    if (word === targetAnswer) {
      showGameAlert(true, '', '+' + reward + ' نقطة تمت إضافتها لرصيدك', 'المرحلة التالية ⏩', function() {
        onStagePassed();
      });
    } else {
      showGameAlert(false, 'الكلمة غير صحيحة', 'حاول ترتيب الحروف بالشكل السليم', 'إعادة المحاولة 🔄', function() {
        resetGuess();
      });
    }
  }
}

function onStagePassed() {
  var reward = getCurrentStageReward();

  if (currentPlayingStage === playerData.maxStage) {
    playerData.maxStage++;
    playerData.coins += reward;
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
    showGameAlert(false, 'الرصيد غير كافٍ', 'تحتاج إلى 20 نقطة على الأقل لاستخدام التلميح', 'حسناً');
    return;
  }
  var stage = stages.find(function(s) { return s.id === currentPlayingStage; });
  if (!stage || stage.type === 'choices') return;

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
  if (playerData.coins < 50) {
    showGameAlert(false, 'الرصيد غير كافٍ', 'تحتاج إلى 50 نقطة لتخطي هذا السؤال', 'حسناً');
    return;
  }
  playerData.coins -= 50;
  savePlayerData();
  updateUI();
  onStagePassed();
}
