// إدارة الشاشات العامة وحساب اللاعب
var playerData = {
  name: 'saleh',
  email: 'mr.saleh.ay.94@gmail.com',
  password: '',
  maxStage: 1,
  coins: 150
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
  var saved = localStorage.getItem('fetnah_split_v1');
  if (saved) {
    try { playerData = JSON.parse(saved); } catch(e) {}
  }
  updateUI();
  showScreen('screen-home');
}

function savePlayerData() {
  localStorage.setItem('fetnah_split_v1', JSON.stringify(playerData));
}

function updateUI() {
  var nameEl = document.getElementById('display-player-name');
  if (nameEl) nameEl.innerText = playerData.name || 'اللاعب';

  var coinIds = ['home-coins', 'map-coins', 'game-coins'];
  for (var i = 0; i < coinIds.length; i++) {
    var el = document.getElementById(coinIds[i]);
    if (el) el.innerText = playerData.coins;
  }
}

function continueCurrentStage() {
  if (typeof stages === 'undefined' || stages.length === 0) {
    alert('جاري تحميل المراحل... انتظر لحظة واحدة.');
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
