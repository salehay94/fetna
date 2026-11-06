// تحديد نسب إزاحة الدوائر لتجلس على أحجار الطريق المتعرج تماماً
var pathStepStyles = [
  { right: '48%' }, // مرحلة 1: في الوسط قريباً من اليمين
  { right: '44%' }, // مرحلة 2: فوق الحجر الثاني
  { right: '40%' }, // مرحلة 3: منعطف خفيف لليمين
  { right: '52%' }, // مرحلة 4: وسط الطريق
  { right: '62%' }, // مرحلة 5: ميلان لليسار باتجاه الخيمة
  { right: '55%' }, // مرحلة 6: رجوع للوسط
  { right: '45%' }, // مرحلة 7: ميلان يمين
  { right: '42%' }, // مرحلة 8: يمين
  { right: '48%' }, // مرحلة 9: بداية الدخول للمحراب
  { right: '48%' }  // مرحلة 10: أمام المحراب
];

function renderMapNodes() {
  var container = document.getElementById('map-container');
  if (!container) return;
  container.innerHTML = '';

  stages.forEach(function(st, index) {
    var node = document.createElement('div');
    
    // أيقونة نوع التحدي
    var icon = st.icon;
    if (!icon) {
      if (st.type === 'choices') icon = '🔠';
      else if (st.type === 'crossword') icon = '🧩';
      else if (st.type === 'password') icon = '🔑';
      else icon = '✍️';
    }

    // تطبيق موضع الانحناء الخاص بالحجر
    var stepStyle = pathStepStyles[(st.id - 1) % pathStepStyles.length];

    if (st.id < playerData.maxStage) {
      node.className = 'stage-node completed';
      node.style.right = stepStyle.right;
      node.innerHTML = '<span class="node-num">' + st.id + '</span><span class="node-icon">' + icon + '</span>';
      node.title = 'مرحلة مكتملة';
      node.onclick = function() { startStage(st.id); };
    } else if (st.id === playerData.maxStage) {
      node.className = 'stage-node current';
      node.style.right = stepStyle.right;
      node.innerHTML = '<span class="node-num">' + st.id + '</span><span class="node-icon">' + icon + '</span>';
      node.onclick = function() { startStage(st.id); };
    } else {
      node.className = 'stage-node locked';
      node.style.right = stepStyle.right;
      node.innerHTML = '<span class="node-num">' + st.id + '</span><span class="node-icon">🔒</span>';
      node.onclick = function() {
        if (typeof showGameAlert === 'function') {
          showGameAlert(false, 'المرحلة مقفولة!', 'أنجز المراحل السابقة للوصول إلى هذا التحدي.', 'حسناً');
        }
      };
    }

    container.appendChild(node);
  });

  // النزول التلقائي لأسفل الخريطة فور فتحها ليظهر رقم 1 أو المرحلة الحالية فوراً
  setTimeout(function() {
    container.scrollTop = container.scrollHeight;
  }, 100);
}
