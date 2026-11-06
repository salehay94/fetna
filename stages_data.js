var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzN3JfmOEpwHgEkb4oaAYXufez3ug9Ah94HfYqXPaiUzQWfeirGl2ua9OJCWpKA9V8HGg/exec';
var stages = [];

// دالة لخلط المصفوفة عشوائياً
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

async function loadStages() {
  try {
    var res = await fetch(APPS_SCRIPT_URL);
    if (!res.ok) throw new Error('Network error');
    var data = await res.json();
    
    if (Array.isArray(data) && data.length > 0) {
      // خلط المراحل القادمة من الشيت عشوائياً لتنويع اللعب في كل مرة
      stages = shuffleArray(data);
      
      // إعادة تعيين الرقم التعريفي (ID) ليتناسب مع الترتيب العشوائي الجديد في الخريطة
      stages.forEach(function(st, index) {
        st.id = index + 1;
      });

      renderMapNodes();
      console.log('تم تحميل وخلط ' + stages.length + ' مرحلة من كل الشيتات عشوائياً.');
      return;
    }
  } catch (err) {
    console.log('جاري اعتماد المراحل الاحتياطية المختلطة:', err);
  }

  // مراحل احتياطية متنوعة بين كل الأنماط
  var backup = [
    { id: 1, type: 'letters', question: 'ما هي قبلة المسلمين التي يتجهون إليها في صلاتهم؟', answer: 'الكعبة', letters: ['ا', 'ل', 'ك', 'ع', 'ب', 'ة', 'م', 'ق'] },
    { id: 2, type: 'choices', question: 'كم عدد سور القرآن الكريم؟', answer: '114 سورة', choices: ['110 سورة', '112 سورة', '114 سورة', '120 سورة'] },
    { id: 3, type: 'letters', question: 'المدينة المقدسة التي ولد فيها النبي عليه الصلاة والسلام', answer: 'مكة', letters: ['م', 'ك', 'ة', 'ب', 'د', 'ر', 'س', 'ع'] },
    { id: 4, type: 'crossword', question: 'كلمات متقاطعة:\nأفقي: أم القرآن الكريم\nعمودي: كتاب أُنزل على موسى عليه السلام', answer: 'الفاتحة', crossAnswer: 'التوراة', intersect: 'ت', letters: ['ا', 'ل', 'ف', 'ا', 'ت', 'ح', 'ة', 'ا', 'ل', 'ت', 'و', 'ر', 'ا', 'ة'] },
    { id: 5, type: 'choices', question: 'في أي عام هجري وقعت غزوة بدر الكبرى؟', answer: '2 هـ', choices: ['1 هـ', '2 هـ', '3 هـ', '5 هـ'] },
    { id: 6, type: 'crossword', question: 'كلمات متقاطعة:\nأفقي: نبي الله الملقب بالصديق\nعمودي: كتاب منزل على داود عليه السلام', answer: 'يوسف', crossAnswer: 'زبور', intersect: 'س', letters: ['ي', 'و', 'س', 'ف', 'ز', 'ب', 'و', 'ر', 'ا', 'م', 'ج', 'د'] }
  ];
  
  stages = shuffleArray(backup);
  stages.forEach(function(st, index) {
    st.id = index + 1;
  });
  renderMapNodes();
}
