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
  var saved = localStorage.getItem('fetnah_user_session_v3');
  if (saved) {
    try {
      playerData = JSON.parse(saved);
      if (playerData && playerData.name) {
        updateUI();
        showScreen('screen-home');
        return;
      }
    } catch (e) {}
  }
  // إذا كان لاعباً جديداً يفتح له صفحة التسجيل
  showScreen('screen-auth');
}

function handleAuthLogin() {
  var nameInput = document.getElementById('auth-name');
  var emailInput = document.getElementById('auth-email');
  var passInput = document.getElementById('auth-pass');

  var name = nameInput ? nameInput.value.trim() : '';
  var email = emailInput ? emailInput.value.trim() : '';
  var pass = passInput ? passInput.value.trim() : '';

  if (!name || !email) {
    alert('يرجى كتابة الاسم والبريد للمتابعة!');
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

  if (typeof APPS_SCRIPT_URL !== 'undefined' && APPS_SCRIPT_URL) {
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
  localStorage.setItem('fetnah_user_session_v3', JSON.stringify(playerData));
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
  localStorage.removeItem('fetnah_user_session_v3');
  playerData = { name: '', email: '', password: '', maxStage: 1, coins: 100 };
  closeModal('profile-modal');
  showScreen('screen-auth');
}
