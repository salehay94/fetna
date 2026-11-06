var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyIkOXySRCaVxR8f_yy6WVQXyTHMwSsFnx1Bo4NnoCjSPKRpi84kNAXUktlILJIWok8_A/exec';
var stages = [];

function loadStages() {
  fetch(APPS_SCRIPT_URL)
    .then(function(response) {
      if (!response.ok) {
        throw new Error('فشل جلب البيانات: ' + response.status);
      }
      return response.json();
    })
    .then(function(data) {
      if (Array.isArray(data) && data.length > 0) {
        stages = [];
        for (var i = 0; i < data.length; i++) {
          var item = data[i];
          var stageId = i + 1;
          var rewardVal = 15;
          
          if (item.reward && !isNaN(item.reward)) {
            rewardVal = Number(item.reward);
          } else if (item['النقاط'] && !isNaN(item['النقاط'])) {
            rewardVal = Number(item['النقاط']);
          }

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
            reward: rewardVal,
            icon: iconSymbol,
            choices: item.choices || [],
            letters: item.letters || (item.answer ? String(item.answer).split('') : [])
          });
        }

        console.log('نجاح: تم تحميل ' + stages.length + ' مرحلة بنجاح دون أخطاء سياسة أمان.');
        if (typeof renderMapNodes === 'function') {
          renderMapNodes();
        }
      } else {
        throw new Error('البيانات المستلمة فارغة');
      }
    })
    .catch(function(error) {
      console.warn('تنبيه: تعذر الاتصال بالشيت، تم تفعيل المراحل الاحتياطية:', error);
      stages = [
        { id: 1, type: 'letters', icon: '✍️', reward: 20, question: 'ما هي قبلة المسلمين التي يتجهون إليها في صلاتهم؟', answer: 'الكعبة', letters: ['ا', 'ل', 'ك', 'ع', 'ب', 'ة', 'م', 'ق'] },
        { id: 2, type: 'letters', icon: '✍️', reward: 25, question: 'المدينة المقدسة التي ولد فيها النبي عليه الصلاة والسلام', answer: 'مكة', letters: ['م', 'ك', 'ة', 'ب', 'د', 'ر', 'س', 'ع'] },
        { id: 3, type: 'tf', icon: '⚖️', reward: 30, question: 'فرضت الصلاة على المسلمين في رحلة الإسراء والمعراج.', answer: 'صح' },
        { id: 4, type: 'choices', icon: '🔠', reward: 20, question: 'كم عدد سور القرآن الكريم؟', answer: '114 سورة', choices: ['110 سورة', '112 سورة', '114 سورة', '120 سورة'] },
        { id: 5, type: 'choices', icon: '🔠', reward: 25, question: 'في أي عام هجري وقعت غزوة بدر الكبرى؟', answer: '2 هـ', choices: ['1 هـ', '2 هـ', '3 هـ', '5 هـ'] },
        { id: 6, type: 'tf', icon: '⚖️', reward: 30, question: 'سورة الفاتحة هي أطول سورة في القرآن الكريم.', answer: 'خطأ' }
      ];
      if (typeof renderMapNodes === 'function') {
        renderMapNodes();
      }
    });
}
