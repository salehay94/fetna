var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1ThCiccGEnrpNuqs6rDxuQKLeZudF0KrUH2X9pPpfleOhQwIMGbAdxU64qn1ksYxh/exec';
var stages = [];

function loadStages() {
  fetch(APPS_SCRIPT_URL)
    .then(function(res) {
      if (!res.ok) throw new Error('فشل جلب البيانات: ' + res.status);
      return res.json();
    })
    .then(function(data) {
      if (Array.isArray(data) && data.length > 0) {
        stages = [];
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

          stages.push({
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

        console.log('تم تحميل ' + stages.length + ' مرحلة من الشيت بنجاح.');
        if (typeof renderMapNodes === 'function') {
          renderMapNodes();
        }
      } else {
        throw new Error('البيانات فارغة');
      }
    })
    .catch(function(err) {
      console.warn('تنبيه: تم اعتماد المراحل الاحتياطية:', err);
      stages = [
        { id: 1, type: 'letters', icon: '✍️', reward: 5, question: 'ما هي قبلة المسلمين التي يتجهون إليها في صلاتهم؟', answer: 'الكعبة', letters: ['ا', 'ل', 'ك', 'ع', 'ب', 'ة', 'م', 'ق'] },
        { id: 2, type: 'letters', icon: '✍️', reward: 5, question: 'المدينة المقدسة التي ولد فيها النبي ﷺ', answer: 'مكة', letters: ['م', 'ك', 'ة', 'ب', 'د', 'ر', 'س', 'ع'] },
        { id: 3, type: 'choices', icon: '🔠', reward: 5, question: 'كم عدد سور القرآن الكريم؟', answer: '114 سورة', choices: ['110 سورة', '112 سورة', '114 سورة', '120 سورة'] },
        { id: 4, type: 'tf', icon: '⚖️', reward: 5, question: 'فرضت الصلاة في رحلة الإسراء والمعراج', answer: 'صح' }
      ];
      if (typeof renderMapNodes === 'function') {
        renderMapNodes();
      }
    });
}
