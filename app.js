var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1ThCiccGEnrpNuqs6rDxuQKLeZudF0KrUH2X9pPpfleOhQwIMGbAdxU64qn1ksYxh/exec';

var playerData = {
  name: '',
  phone: '',
  maxStage: 1,
  coins: 100,
  hearts: 3,
  lastHeartTime: null,
  soundEnabled: true
};

var HEART_RECOVERY_TIME = 15 * 60 * 1000; // 15 دقيقة لكل قلب

// ================= نظام المؤثرات الصوتية MP3 =================
var SOUND_EFFECTS = {
  correct: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
  wrong: new Audio('https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3'),
  click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
  empty: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3')
};

function playSound(type) {
  if (!playerData.soundEnabled) return;
  try {
    var audio = SOUND_EFFECTS[type];
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.55;
      audio.play().catch(function() {});
    }
  } catch (e) {}
}

function toggleSound() {
  playerData.soundEnabled = !playerData.soundEnabled;
  savePlayerData();
  updateUI();
  if (playerData.soundEnabled) playSound('click');
}

// ================= إدارة الشاشات والتنقل =================
function showScreen(screenId) {
  var screens = document.querySelectorAll('.screen');
  for (var i = 0; i < screens.length; i++) {
    screens[i].classList.remove('active');
    screens[i].style.setProperty('display', 'none', 'important');
  }
  var target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    target.style.setProperty('display', 'flex', 'important');
  }
}

// ================= استعادة القلوب والعداد التنازلي =================
function checkHeartsRecovery() {
  if (playerData.hearts < 3) {
    var now = Date.now();
    if (!playerData.lastHeartTime) {
      playerData.lastHeartTime = now;
      savePlayerData();
    }
    var elapsed = now - playerData.lastHeartTime;
    if (elapsed >= HEART_RECOVERY_TIME) {
      var recovered = Math.floor(elapsed / HEART_RECOVERY_TIME);
      playerData.hearts = Math.min(3, playerData.hearts + recovered);
      if (playerData.hearts >= 3) {
        playerData.lastHeartTime = null;
      } else {
        playerData.lastHeartTime = playerData.lastHeartTime + (recovered * HEART_RECOVERY_TIME);
      }
      savePlayerData();
      updateUI();
    }
  } else {
    playerData.lastHeartTime = null;
  }
}

function updateHeartTimerDisplay() {
  var timerEl = document.getElementById('heart-timer');
  if (!timerEl) return;

  if (playerData.hearts < 3 && playerData.lastHeartTime) {
    var now = Date.now();
    var elapsed = now - playerData.lastHeartTime;
    var timeLeft = HEART_RECOVERY_TIME - elapsed;

    if (timeLeft > 0) {
      var minutes = Math.floor(timeLeft / 60000);
      var seconds = Math.floor((timeLeft % 60000) / 1000);
      var strMin = minutes < 10 ? '0' + minutes : minutes;
      var strSec = seconds < 10 ? '0' + seconds : seconds;
      timerEl.innerText = '(' + strMin + ':' + strSec + ')';
    } else {
      timerEl.innerText = '';
    }
  } else {
    timerEl.innerText = '';
  }
}

setInterval(function() {
  checkHeartsRecovery();
  updateHeartTimerDisplay();
}, 1000);

// ================= تسجيل الدخول والتحقق من الجلسة =================
function checkExistingUser() {
  var saved = localStorage.getItem('fetnah_user_phone_session');
  if (saved) {
    try {
      var loaded = JSON.parse(saved);
      if (loaded && loaded.phone) {
        playerData.name = loaded.name || '';
        playerData.phone = loaded.phone || '';
        playerData.maxStage = loaded.maxStage || 1;
        playerData.coins = loaded.coins || 100;
        playerData.hearts = loaded.hearts !== undefined ? loaded.hearts : 3;
        playerData.lastHeartTime = loaded.lastHeartTime || null;
        playerData.soundEnabled = loaded.soundEnabled !== undefined ? loaded.soundEnabled : true;

        checkHeartsRecovery();
        updateUI();
        showScreen('screen-home');
        syncPlayerData(playerData.phone);
        return;
      }
    } catch (e) {}
  }
  showScreen('screen-auth');
}

function syncPlayerData(phone) {
  if (!APPS_SCRIPT_URL || !phone) return;
  fetch(APPS_SCRIPT_URL + '?action=get_player&phone=' + encodeURIComponent(phone))
    .then(function(res) { return res.json(); })
    .then(function(resData) {
      if (resData && resData.status === 'success') {
        playerData.maxStage = Number(resData.maxStage) || 1;
        playerData.coins = Number(resData.coins) || 100;
        if (resData.name) playerData.name = resData.name;
        savePlayerData();
        updateUI();
        if (typeof renderMapNodes === 'function') renderMapNodes();
      }
    })
    .catch(function(err) {
      console.log('مزامنة الشيت:', err);
    });
}

function handleAuthLogin() {
  var nameInput = document.getElementById('auth-name');
  var phoneInput = document.getElementById('auth-phone');

  var name = nameInput ? nameInput.value.trim() : '';
  var rawPhone = phoneInput ? phoneInput.value.trim() : '';
  var cleanPhone = rawPhone.replace(/[^0-9]/g, '').replace(/^0+/, '');

  if (!name || !cleanPhone) {
    alert('يرجى إدخال اسمك ورقم هاتفك للمتابعة!');
    return;
  }

  playSound('click');

  playerData.name = name;
  playerData.phone = cleanPhone;

  fetch(APPS_SCRIPT_URL + '?action=get_player&phone=' + encodeURIComponent(cleanPhone))
    .then(function(res) { return res.json(); })
    .then(function(resData) {
      if (resData && resData.status === 'success') {
        playerData.maxStage = Number(resData.maxStage) || 1;
        playerData.coins = Number(resData.coins) || 100;
        playerData.name = resData.name || name;
      } else {
        playerData.maxStage = 1;
        playerData.coins = 100;
        playerData.hearts = 3;
        pushPlayerDataToSheet();
      }
      savePlayerData();
      updateUI();
      if (typeof renderMapNodes === 'function') renderMapNodes();
      showScreen('screen-home');
    })
    .catch(function() {
      savePlayerData();
      updateUI();
      showScreen('screen-home');
    });
}

function savePlayerData() {
  localStorage.setItem('fetnah_user_phone_session', JSON.stringify(playerData));
}

function pushPlayerDataToSheet() {
  if (!APPS_SCRIPT_URL || !playerData.phone || playerData.phone === "0") return;

  var url = APPS_SCRIPT_URL + 
    '?action=update_player' +
    '&phone=' + encodeURIComponent(playerData.phone) +
    '&name=' + encodeURIComponent(playerData.name) +
    '&maxStage=' + encodeURIComponent(playerData.maxStage) +
    '&coins=' + encodeURIComponent(playerData.coins);

  fetch(url, { mode: 'no-cors' }).catch(function() {});
}

function updateUI() {
  var nameEl = document.getElementById('display-player-name');
  if (nameEl) nameEl.innerText = playerData.name || 'لاعب';

  var modalName = document.getElementById('modal-player-name');
  var modalPhone = document.getElementById('modal-player-phone');
  if (modalName) modalName.innerText = playerData.name || 'لاعب';
  if (modalPhone) modalPhone.innerText = playerData.phone || '-';

  var coinIds = ['home-coins', 'map-coins', 'game-coins'];
  for (var i = 0; i < coinIds.length; i++) {
    var el = document.getElementById(coinIds[i]);
    if (el) el.innerText = playerData.coins;
  }

  var heartIds = ['home-hearts', 'map-hearts', 'game-hearts'];
  for (var h = 0; h < heartIds.length; h++) {
    var hEl = document.getElementById(heartIds[h]);
    if (hEl) hEl.innerText = playerData.hearts !== undefined ? playerData.hearts : 3;
  }

  var soundOn = document.getElementById('sound-icon-on');
  var soundOff = document.getElementById('sound-icon-off');
  if (soundOn && soundOff) {
    soundOn.style.display = playerData.soundEnabled ? 'block' : 'none';
    soundOff.style.display = playerData.soundEnabled ? 'none' : 'block';
  }
}

// ================= التنقل وشاشات اللعب =================
function openMapScreen() {
  playSound('click');
  syncPlayerData(playerData.phone);
  if (typeof renderMapNodes === 'function') renderMapNodes();
  showScreen('screen-map');
}

function continueCurrentStage() {
  if (playerData.hearts <= 0) {
    playSound('empty');
    openHeartsShopModal();
    return;
  }
  if (typeof stages === 'undefined' || stages.length === 0) {
    alert('جاري تجهيز المراحل... يرجى الانتظار ثوانٍ.');
    return;
  }
  var target = playerData.maxStage || 1;
  if (target > stages.length) target = stages.length;
  if (typeof startStage === 'function') startStage(target);
}

function openAboutModal() {
  playSound('click');
  openModal('about-modal');
}

function openHeartsShopModal() {
  playSound('click');
  openModal('hearts-shop-modal');
}

function buyHearts(amount, cost) {
  if (playerData.coins < cost) {
    playSound('empty');
    alert('عذراً، نقاطك غير كافية لإجراء الشراء! (المطلوب ' + cost + ' نقطة)');
    return;
  }
  
  playSound('correct');
  playerData.coins -= cost;
  playerData.hearts = Math.min(3, playerData.hearts + amount);
  if (playerData.hearts >= 3) playerData.lastHeartTime = null;
  
  savePlayerData();
  updateUI();
  pushPlayerDataToSheet();
  closeModal('hearts-shop-modal');
  alert('تم شحن القلوب بنجاح! ❤️');
}

// ================= جلب وعرض الإشعارات الحية من الشيت =================
function openNotificationsModal() {
  playSound('click');
  var dot = document.getElementById('notif-dot');
  if (dot) dot.style.display = 'none';

  var container = document.getElementById('notif-list-container');
  if (container) {
    container.innerHTML = '<p style="text-align:center; color:#718096; padding: 20px;">جاري تحميل التنبيهات...</p>';
  }

  openModal('notifications-modal');

  fetch(APPS_SCRIPT_URL + '?action=get_notifications')
    .then(function(res) { return res.json(); })
    .then(function(notifs) {
      if (!container) return;
      if (Array.isArray(notifs) && notifs.length > 0) {
        container.innerHTML = '';
        notifs.forEach(function(item) {
          var card = document.createElement('div');
          card.className = 'notif-card-item';
          card.innerHTML = '<h4>' + item.title + '</h4>' +
                           '<p>' + item.body + '</p>' +
                           '<span class="notif-time">' + (item.date || '') + '</span>';
          container.appendChild(card);
        });
      } else {
        container.innerHTML = '<p style="text-align:center; color:#718096; padding: 20px;">لا توجد إشعارات جديدة حالياً 🕊️</p>';
      }
    })
    .catch(function() {
      if (container) {
        container.innerHTML = '<p style="text-align:center; color:#e53e3e; padding: 20px;">تعذر تحميل الإشعارات حالياً.</p>';
      }
    });
}

function openModal(id) {
  var m = document.getElementById(id);
  if (m) m.style.display = 'flex';
}

function closeModal(id) {
  var m = document.getElementById(id);
  if (m) m.style.display = 'none';
}

function logoutPlayer() {
  localStorage.removeItem('fetnah_user_phone_session');
  playerData = { name: '', phone: '', maxStage: 1, coins: 100, hearts: 3, lastHeartTime: null, soundEnabled: true };
  closeModal('profile-modal');
  showScreen('screen-auth');
}
