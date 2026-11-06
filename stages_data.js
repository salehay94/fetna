var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxliYIEMFsp2XWRGVzsv3b_fvW3j-uBok0STJzVGZ8b6t6lrCvthcwtt-d4tQ-qb9SCVw/exec';
var stages = [];

async function loadStages() {
  try {
    var res = await fetch(APPS_SCRIPT_URL);
    if (!res.ok) throw new Error('Network error');
    var data = await res.json();
    
    if (Array.isArray(data) && data.length > 0) {
      stages = data;
      stages.forEach(function(st, index) {
        st.id = index + 1;
        var r = st.reward || st['النقاط'] || st['المكافأة'] || st.points;
        st.reward = (r && !isNaN(r)) ? Number(r) : 15;

        if (!st.icon) {
          if (st.type === 'choices') st.icon = '🔠';
          else if (st.type === 'tf' || st.type === 'true_false') st.icon = '⚖️';
          else st.icon = '✍️';
        }
      });
      renderMapNodes();
      return;
    }
  } catch (err) {
    console.log('اعتماد المراحل الاحتياطية:', err);
  }

  // مراحل ثابتة منوعة مع نمط صح وخطأ
  stages = [
    { id: 1, type: 'letters', icon: '✍️', reward: 20, question: 'ما هي قبلة المسلمين التي يتجهون إليها في صلاتهم؟', answer: 'الكعبة', letters: ['ا', 'ل', 'ك', 'ع', 'ب', 'ة', 'م', 'ق'] },
    { id: 2, type: 'letters', icon: '✍️', reward: 25, question: 'المدينة المقدسة التي ولد فيها النبي عليه الصلاة والسلام', answer: 'مكة', letters: ['م', 'ك', 'ة', 'ب', 'د', 'ر', 'س', 'ع'] },
    { id: 3, type: 'tf', icon: '⚖️', reward: 30, question: 'هل فُرضت الصلاة على المسلمين في ليلة الإسراء والمعراج؟', answer: 'صح' },
    { id: 4, type: 'choices', icon: '🔠', reward: 20, question: 'كم عدد سور القرآن الكريم؟', answer: '114 سورة', choices: ['110 سورة', '112 سورة', '114 سورة', '120 سورة'] },
    { id: 5, type: 'choices', icon: '🔠', reward: 25, question: 'في أي عام هجري وقعت غزوة بدر الكبرى؟', answer: '2 هـ', choices: ['1 هـ', '2 هـ', '3 هـ', '5 هـ'] },
    { id: 6, type: 'tf', icon: '⚖️', reward: 30, question: 'سورة الفاتحة هي أول سورة نزلت في القرآن الكريم كاملاً.', answer: 'خطأ' }
  ];

  renderMapNodes();
}
