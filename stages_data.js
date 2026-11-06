// الرابط الجديد المنشور للـ Web App
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
        
        // استخراج المكافأة المكتوبة في الشيت بدقة
        var r = st.reward || st['النقاط'] || st['المكافأة'] || st.points;
        st.reward = (r && !isNaN(r)) ? Number(r) : 15;

        // تحديد الأيقونة حسب النمط
        if (!st.icon) {
          if (st.type === 'choices') st.icon = '🔠';
          else if (st.type === 'crossword') st.icon = '🧩';
          else if (st.type === 'password') st.icon = '🔑';
          else st.icon = '✍️';
        }
      });

      renderMapNodes();
      console.log('تم تحميل ' + stages.length + ' مرحلة من الشيت بالرابط الجديد بنجاح.');
      return;
    }
  } catch (err) {
    console.log('جاري اعتماد قائمة المراحل الاحتياطية:', err);
  }

  // مراحل احتياطية بمكافآت متنوعة
  stages = [
    { id: 1, type: 'letters', icon: '✍️', reward: 20, question: 'ما هي قبلة المسلمين التي يتجهون إليها في صلاتهم؟', answer: 'الكعبة', letters: ['ا', 'ل', 'ك', 'ع', 'ب', 'ة', 'م', 'ق'] },
    { id: 2, type: 'letters', icon: '✍️', reward: 25, question: 'المدينة المقدسة التي ولد فيها النبي عليه الصلاة والسلام', answer: 'مكة', letters: ['م', 'ك', 'ة', 'ب', 'د', 'ر', 'س', 'ع'] },
    { id: 3, type: 'crossword', icon: '🧩', reward: 50, question: 'أفقي: أم القرآن الكريم\nعمودي: كتاب أُنزل على موسى عليه السلام', answer: 'الفاتحة', crossAnswer: 'التوراة', intersect: 'ت', letters: ['ا', 'ل', 'ف', 'ا', 'ت', 'ح', 'ة', 'ا', 'ل', 'ت', 'و', 'ر', 'ا', 'ة'] },
    { id: 4, type: 'choices', icon: '🔠', reward: 30, question: 'كم عدد سور القرآن الكريم؟', answer: '114 سورة', choices: ['110 سورة', '112 سورة', '114 سورة', '120 سورة'] },
    { id: 5, type: 'choices', icon: '🔠', reward: 35, question: 'في أي عام هجري وقعت غزوة بدر الكبرى؟', answer: '2 هـ', choices: ['1 هـ', '2 هـ', '3 هـ', '5 هـ'] }
  ];

  renderMapNodes();
}
