// الرابط الجديد المنشور للـ Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzN3JfmOEpwHgEkb4oaAYXufez3ug9Ah94HfYqXPaiUzQWfeirGl2ua9OJCWpKA9V8HGg/exec';

let stages = [];
let currentPlayingStage = 1;
let userGuess = [];

let playerData = {
  name: 'saleh',
  email: 'mr.saleh.ay.94@gmail.com',
  password: '',
  maxStage: 1,
  coins: 150
};

// 1. إدارة ظهور الشاشات بسلاسة وبدون أي تداخل
function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
  }
}

// 2. التحقق من اللاعب وبدء النظام
function checkExistingUser() {
  const saved = localStorage.getItem('fetnah_registered_player_v12');
  if (saved) {
    try {
      playerData = JSON.parse(saved);
    } catch (e) {}
  }
  updateUI();
  showScreen('screen-home');
}

function handleAuthLogin() {
  const nameInput = document.getElementById('auth-name');
  const emailInput = document.getElementById('auth-email');
  const passInput = document.getElementById('auth-pass');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const pass = passInput ? passInput.value.trim() : '';

  if (!name || !email) {
    alert("يرجى إدخال اسم اللاعب والبريد الإلكتروني للمتابعة!");
    return;
  }

  playerData.name = name;
  playerData.email = email;
  playerData.password = pass || "123456";

  savePlayerData();
  updateUI();
  renderMapNodes();
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
    }).catch(() => {});
  }
}

function savePlayerData() {
  localStorage.setItem('fetnah_registered_player_v12', JSON.stringify(playerData));
}

function updateUI() {
  const nameEl = document.getElementById('display-player-name');
  if (nameEl) nameEl.innerText = playerData.name || 'اللاعب';

  ['home-coins', 'map-coins', 'game-coins'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = playerData.coins;
  });
}

// 3. جلب جميع المراحل من Google Sheets عبر Apps Script
async function loadStagesFromScript() {
  try {
    const res = await fetch(APPS_SCRIPT_URL);
    if (!res.ok) throw new Error('Network error');
    const dynamicStages = await res.json();

    if (Array.isArray(dynamicStages) && dynamicStages.length > 0) {
      stages = dynamicStages;
      renderMapNodes();
      console.log("تم تحميل " + stages.length + " مرحلة من الشيت بنجاح.");
      return;
    }
  } catch (err) {
    console.log("تعذر الجلب المباشر، جاري استخدام المراحل التلقائية:", err);
  }

  // مراحل احتياطية إذا لم يتوفر اتصال بالإنترنت لحظياً
  if (stages.length === 0) {
    stages = [
      { id: 1, type: 'letters', question: "من هو أول الأنبياء عليهم السلام؟", answer: "آدم", letters: ["آ","د","م","س","و","ي","ن","ل"] },
      { id: 2, type: 'letters', question: "أين ولد النبي محمد صلى الله عليه وسلم؟", answer: "مكة", letters: ["م","ك","ة","ق","د","س","ر","ح"] },
      { id: 3, type: 'letters', question: "من هو خاتم الأنبياء والمرسلين؟", answer: "محمد", letters: ["م","ح","م","د","ع","ل","ي","ف"] },
      { id: 4, type: 'choices', question: "كم عدد سور القرآن الكريم؟", answer: "114 س
