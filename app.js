var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwwMEoUfoM0GKY7PHlVXZCWMmROBM5s-geLgxnw5Lsq8edlAFatZBM6DUN1qXg6_Stcog/exec';

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
  var phone = phoneInput ? phoneInput.value.trim() : '';

  if (!name || !phone) {
    alert('يرجى إدخال اسمك ورقم هاتفك للمتابعة!');
    return;
  }

  playerData.name = name;
  playerData.phone = phone;

  fetch(APPS_SCRIPT_URL + '?action=get_player&phone=' + encodeURIComponent(phone))
    .then(function(res) { return res.json(); })
    .then(function(resData) {
      if (resData && resData.status === 'success') {
        playerData.maxStage = Number(resData.maxStage) || 1;
        playerData.coins = Number(resData.coins) || 100;
      } else {
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
      playerData.maxStage = 1;
      playerData.coins = 100;
      savePlayerData();
      updateUI();
      showScreen('screen-home');
    });
}

function savePlayerData() {
  localStorage.setItem('fetnah_user_phone_session', JSON.stringify(playerData));
}

// التحديث اللحظي المباشر إلى الشيت فوراً
function pushPlayerDataToSheet() {
  if (!APPS_SCRIPT_URL || !playerData.phone) return;

  var url = APPS_SCRIPT_URL + 
    '?action=update_player' +
    '&phone=' + encodeURIComponent(playerData.phone) +
    '&name=' + encodeURIComponent(playerData.name) +
    '&maxStage=' + encodeURIComponent(playerData.maxStage) +
    '&coins=' + encodeURIComponent(playerData.coins);

  fetch(url, { mode: 'no-cors' })
    .then(function() {
      console.log('تم إرسال التحديث للشيت فوراً');
    })
    .catch(function(err) {
      console.log('خطأ تحديث الشيت:', err);
    });
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

function openMapScreen() {
  if (typeof renderMapNodes === 'function') {
    renderMapNodes();
  }
  showScreen('screen-map');
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
