var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzBRgQ50Yym4IH3NFt8Y45pa2hs_6UvlsQUPE4nLPsvt8UX78KlQD1lsZOo5338YRRuKQ/exec';

var playerData = {
  name: '',
  phone: '',
  maxStage: 1,
  coins: 100
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

// فحص الجلسة عند فتح اللعبة
function checkExistingUser() {
  var saved = localStorage.getItem('fetnah_user_phone_session');
  if (saved) {
    try {
      playerData = JSON.parse(saved);
      if (playerData && playerData.phone) {
        updateUI();
        showScreen('screen-home');
        syncPlayerData(playerData.phone);
        return;
      }
    } catch (e) {}
  }
  showScreen('screen-auth');
}

// مزامنة المرحلة والرصيد مع Google Sheets
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

// تسجيل الدخول بالاسم ورقم الهاتف فقط
function handleAuthLogin() {
  var nameInput = document.getElementById('auth-name');
  var phoneInput = document.getElementById('auth-phone');

  var name = nameInput ? nameInput.value.trim() : '';
  var phone = phoneInput ? phoneInput.value.trim() : '';

  if (!name || !phone) {
    alert('يرجى إدخال اسمك ورقم هاتفك للمتابعة!');
    return;
  }

  playerData.name = name;
  playerData.phone = phone;

  // جلب تقدم اللاعب برقم هاتفه مباشرة من الشيت
  fetch(APPS_SCRIPT_URL + '?action=get_player&phone=' + encodeURIComponent(phone))
    .then(function(res) { return res.json(); })
    .then(function(resData) {
      if (resData && resData.status === 'success') {
        playerData.maxStage = Number(resData.maxStage) || 1;
        playerData.coins = Number(resData.coins) || 100;
      } else {
        // لاعب جديد يبدأ من المرحلة 1 برصيد 100
        playerData.maxStage = 1;
        playerData.coins = 100;
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

// إرسال التحديث للشيت فوراً عند الفوز
function pushPlayerDataToSheet() {
  if (!APPS_SCRIPT_URL || !playerData.phone) return;

  var payload = JSON.stringify({
    name: playerData.name,
    phone: playerData.phone,
    maxStage: playerData.maxStage,
    coins: playerData.coins
  });

  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: payload
  }).catch(function() {});
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
}

function continueCurrentStage() {
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
  playerData = { name: '', phone: '', maxStage: 1, coins: 100 };
  closeModal('profile-modal');
  showScreen('screen-auth');
}
