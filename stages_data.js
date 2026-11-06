// جلب وتخزين المراحل من الشيت
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzN3JfmOEpwHgEkb4oaAYXufez3ug9Ah94HfYqXPaiUzQWfeirGl2ua9OJCWpKA9V8HGg/exec';
var stages = [];

async function loadStages() {
  try {
    var res = await fetch(APPS_SCRIPT_URL);
    if (!res.ok) throw new Error('Network error');
    var data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      stages = data;
      renderMapNodes();
      console.log('تم تحميل ' + stages.length + ' مرحلة من الشيت.');
      return;
    }
  } catch (err) {
    console.log('جاري اعتماد المراحل الاحتياطية:', err);
  }

  // مراحل احتياطية تعمل فوراً
  stages = [
    { id: 1, type: 'letters', question: 'ما هي قبلة المسلمين التي يتجهون إليها في صلاتهم؟', answer: 'الكعبة', letters: ['ا', 'ل', 'ك', 'ع', 'ب', 'ة', 'م', 'ق'] },
    { id: 2, type: 'letters', question: 'المدينة المقدسة التي ولد فيها النبي عليه الصلاة والسلام', answer: 'مكة', letters: ['م', 'ك', 'ة', 'ب', 'د', 'ر', 'س', 'ع'] },
    { id: 3, type: 'letters', question: 'من هو خاتم الأنبياء والمرسلين عليه الصلاة والسلام؟', answer: 'محمد', letters: ['م', 'ح', 'م', 'د', 'ع', 'ل', 'ي', 'س'] },
    { id: 4, type: 'choices', question: 'كم عدد سور القرآن الكريم؟', answer: '114 سورة', choices: ['110 سورة', '112 سورة', '114 سورة', '120 سورة'] },
    { id: 5, type: 'choices', question: 'في أي عام هجري وقعت غزوة بدر الكبرى؟', answer: '2 هـ', choices: ['1 هـ', '2 هـ', '3 هـ', '5 هـ'] }
  ];
  renderMapNodes();
}
