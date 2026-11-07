var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwIEGfaGfm-3OSsxmgKX3C8ho4hsf_eN2c78G2TcQ8bs5QGOzJzsnzssor49ADvwDc9Ng/exec';

var playerData = {
  name: '',
  phone: '',
  maxStage: 1,
  coins: 100,
  hearts: 3,
  lastHeartTime: Date.now()
};

var HEART_RECOVERY_TIME = 15 * 60 * 1000; // 15 دقيقة لكل قلب

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

function checkHeartsRecovery() {
  if (playerData.hearts < 3) {
    var now = Date.now();
    var elapsed = now - (playerData.lastHeartTime || now);
    if (elapsed >= HEART_RECOVERY_TIME) {
      var recovered = Math.floor(elapsed / HEART_RECOVERY_TIME);
      playerData.hearts = Math.min(3, playerData.hearts + recovered);
      playerData.lastHeartTime = now;
      savePlayerData();
      updateUI();
    }
  }
}
setInterval(checkHeartsRecovery, 5000);

function checkExistingUser() {
  var saved = localStorage.getItem('fetnah_user_phone_session');
  if (saved) {
    try {
      playerData = JSON.parse(saved);
      if (playerData.hearts === undefined) playerData.hearts = 3;
      if (!playerData.lastHeartTime) playerData.lastHeartTime = Date.now();

      if (playerData && playerData.phone) {
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
    .then(function(res) {
      if (!res.ok) throw new Error('Network error');
      return res.json();
    })
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

  // تجريد الصفر الأيسر تلقائياً لمطابقة الشيت
  var cleanPhone = rawPhone.replace(/[^0-9]/g, '').replace(/^0+/, '');

  if (!name || !cleanPhone) {
    alert('يرجى إدخال اسمك ورقم هاتفك للمتابعة!');
    return;
  }

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
}

function openMapScreen() {
  syncPlayerData(playerData.phone);
  if (typeof renderMapNodes === 'function') {
    renderMapNodes();
  }
  showScreen('screen-map');
}

function continueCurrentStage() {
  if (playerData.hearts <= 0) {
    alert('نفدت قلوبك! انتظر قليلاً حتى يعود لك قلب ❤️');
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
  playerData = { name: '', phone: '', maxStage: 1, coins: 100, hearts: 3 };
  closeModal('profile-modal');
  showScreen('screen-auth');
}
