// مصفوفة تعرجات الطريق - تتكرر تلقائياً لكل المراحل مهما بلغ عددها
var pathStepStyles = [
  { right: '48%' }, // مرحلة 1
  { right: '44%' }, // مرحلة 2
  { right: '40%' }, // مرحلة 3
  { right: '52%' }, // مرحلة 4
  { right: '62%' }, // مرحلة 5
  { right: '55%' }, // مرحلة 6
  { right: '45%' }, // مرحلة 7
  { right: '42%' }, // مرحلة 8
  { right: '48%' }, // مرحلة 9
  { right: '50%' }  // مرحلة 10
];

function renderMapNodes() {
  var container = document.getElementById('map-container');
  if (!container) return;
  container.innerHTML = '';

  if (!stages || stages.length === 0) {
    console.log('لا توجد مراحل لعرضها');
    return;
  }

  // رسم كل المراحل القادمة من الشيت دون استثناء
  stages.forEach(function(st, index) {
    var node = document.createElement('div');
    
    // أيقونة نوع السؤال
    var icon = st.icon;
    if (!icon) {
      if (st.type === 'choices') icon = '🔠';
      else if (st.type === 'tf' || st.type === 'true_false') icon = '⚖️';
      else icon = '✍️';
    }

    // تدوير التعرج تلقائياً مهما كان رقم المرحلة كبيراً
    var stepStyle = pathStepStyles[(st.id - 1) % pathStepStyles.length];

    if (st.id < playerData.maxStage) {
      node.className = 'stage-node completed';
      node.style.right = stepStyle.right;
      node.innerHTML = '<span class="node-num">' + st.id + '</span><span class="node-icon">' + icon + '</span>';
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

  // النزول التلقائي للمرحلة الحالية للاعب
  setTimeout(function() {
    var currentNode = container.querySelector('.stage-node.current');
    if (currentNode) {
      currentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, 150);
}
