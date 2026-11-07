var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1ThCiccGEnrpNuqs6rDxuQKLeZudF0KrUH2X9pPpfleOhQwIMGbAdxU64qn1ksYxh/exec';
var stages = [];

function loadStages() {
  // 1. قراءة فورية من الذاكرة المحلية إن وجدت لتفتح اللعبة فوراً
  var cached = localStorage.getItem('fetnah_cached_stages');
  if (cached) {
    try {
      stages = JSON.parse(cached);
      if (typeof renderMapNodes === 'function') renderMapNodes();
    } catch (e) {}
  }

  // 2. تحديث الأسئلة في الخلفية من الشيت بصمت
  fetch(APPS_SCRIPT_URL)
    .then(function(res) {
      if (!res.ok) throw new Error('فشل جلب البيانات: ' + res.status);
      return res.json();
    })
    .then(function(data) {
      if (Array.isArray(data) && data.length > 0) {
        var newStages = [];
        for (var i = 0; i < data.length; i++) {
          var item = data[i];
          var stageId = i + 1;
          var rVal = Number(item.reward) || 5;

          var iconSymbol = '✍️';
          if (item.type === 'choices') {
            iconSymbol = '🔠';
          } else if (item.type === 'tf' || item.type === 'true_false') {
            iconSymbol = '⚖️';
          }

          newStages.push({
            id: stageId,
            type: item.type || 'letters',
            question: item.question || '',
            answer: item.answer || '',
            reward: rVal,
            icon: iconSymbol,
            choices: item.choices || [],
            letters: item.letters || (item.answer ? String(item.answer).replace(/[\s,،]/g, '').split('') : [])
          });
        }

        stages = newStages;
        localStorage.setItem('fetnah_cached_stages', JSON.stringify(stages));
        if (typeof renderMapNodes === 'function') renderMapNodes();
      }
    })
    .catch(function(err) {
      console.warn('تنبيه الشيت:', err);
    });
}
