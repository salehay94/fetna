var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyIkOXySRCaVxR8f_yy6WVQXyTHMwSsFnx1Bo4NnoCjSPKRpi84kNAXUktlILJIWok8_A/exec';

var playerData = {
  name: '',
  email: '',
  password: '',
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
  // إعادة ضبط الجلسة العالقة لمرة واحدة لتبدأ المراحل الـ 230 من البداية
  if (localStorage.getItem('fetnah_cache_flush_v500') !== 'done') {
    localStorage.removeItem('fetnah_user_session_v6');
    localStorage.setItem('fetnah_cache_flush_v500', 'done');
  }

  var saved = localStorage.getItem('fetnah_user_session_v6');
  if (saved) {
    try {
      playerData = JSON.parse(saved);
      if (playerData && playerData.email) {
        updateUI();
        showScreen('screen-home');
        syncCoinsFromSheet(playerData.email);
        return;
      }
    } catch (e) {}
  }
  showScreen('screen-auth');
}

async function syncCoinsFromSheet(email) {
  if (!APPS_SCRIPT_URL || !email) return;
  try {
    var response = await fetch(APPS_SCRIPT_URL + '?action=get_player&email=' + encodeURIComponent(email));
    if (response.ok) {
      var resData = await response.json();
      if (resData && resData.status === 'success') {
        playerData.coins = Number(resData.coins);
        if (resData.maxStage) playerData.maxStage = Number(resData.maxStage);
        savePlayerData();
        updateUI();
        if (typeof renderMapNodes === 'function') renderMapNodes();
      }
    }
  } catch (err) {
    console.log('تعذر مزامنة الرصيد حالياً:', err);
  }
}

function handleAuthLogin() {
  var nameInput = document.getElementById('auth-name');
  var emailInput = document.getElementById('auth-email');
  var passInput = document.getElementById('auth-pass');

  var name = nameInput ? nameInput.value.trim() : '';
  var email = emailInput ? emailInput.value.trim() : '';
  var pass = passInput ? passInput.value.trim() : '';

  if (!name || !email) {
    alert('يرجى إدخال اسمك وبريدك الإلكتروني للمتابعة!');
    return;
  }

  playerData.name = name;
  playerData.email = email;
  playerData.password = pass || '123456';
  playerData.maxStage = 1;
  playerData.coins = 100;

  savePlayerData();
  updateUI();
  if (typeof renderMapNodes === 'function') renderMapNodes();
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
  localStorage.setItem('fetnah_user_session_v6', JSON.stringify(playerData));
}

function updateUI() {
  var nameEl = document.getElementById('display-player-name');
  if (nameEl) nameEl.innerText = playerData.name || 'لاعب جديد';

  var modalName = document.getElementById('modal-player-name');
  var modalEmail = document.getElementById('modal-player-email');
  if (modalName) modalName.innerText = playerData.name || 'لاعب جديد';
  if (modalEmail) modalEmail.innerText = playerData.email || '-';

  var coinIds = ['home-coins', 'map-coins', 'game-coins'];
  for (var i = 0; i < coinIds.length; i++) {
    var el = document.getElementById(coinIds[i]);
    if (el) el.innerText = playerData.coins;
  }
}

function continueCurrentStage() {
  if (typeof stages === 'undefined' || stages.length === 0) {
    alert('جاري تجهيز المراحل... انتظر لحظة واحدة.');
    return;
  }
  var target = playerData.maxStage || 1;
  if (target > stages.length) target = stages.length;
  startStage(target);
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
  localStorage.removeItem('fetnah_user_session_v6');
  playerData = { name: '', email: '', password: '', maxStage: 1, coins: 100 };
  closeModal('profile-modal');
  showScreen('screen-auth');
}
