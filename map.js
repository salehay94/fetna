// مصفوفة تعرجات الطريق لتطابق أحجار مسار الصورة تماماً
var pathOffsets = [
  'pos-center',     // مرحلة 1
  'pos-center',     // مرحلة 2
  'pos-mid-right',  // مرحلة 3
  'pos-right',      // مرحلة 4
  'pos-center',     // مرحلة 5
  'pos-mid-left',   // مرحلة 6
  'pos-left',       // مرحلة 7
  'pos-mid-left',   // مرحلة 8
  'pos-center',     // مرحلة 9
  'pos-center'      // مرحلة 10
];

function renderMapNodes() {
  var container = document.getElementById('map-container');
  if (!container) return;
  container.innerHTML = '';

  stages.forEach(function(st, index) {
    var node = document.createElement('div');
    
    // جلب رمز نوع المرحلة
    var icon = st.icon;
    if (!icon) {
      if (st.type === 'choices') icon = '🔠';
      else if (st.type === 'crossword') icon = '🧩';
      else if (st.type === 'password') icon = '🔑';
      else icon = '✍️';
    }

    // تحديد موضع الانعطاف على مسار الطريق
    var offsetClass = pathOffsets[(st.id - 1) % pathOffsets.length];

    if (st.id < playerData.maxStage) {
      node.className = 'stage-node completed ' + offsetClass;
      node.innerHTML = '<span class="node-num">' + st.id + '</span><span class="node-icon">' + icon + '</span>';
      node.title = 'مرحلة مكتملة';
      node.onclick = function() { startStage(st.id); };
    } else if (st.id === playerData.maxStage) {
      node.className = 'stage-node current ' + offsetClass;
      node.innerHTML = '<span class="node-num">' + st.id + '</span><span class="node-icon">' + icon + '</span>';
      node.onclick = function() { startStage(st.id); };
    } else {
      node.className = 'stage-node locked ' + offsetClass;
      node.innerHTML = '<span class="node-num">' + st.id + '</span><span class="node-icon">🔒</span>';
      node.onclick = function() {
        if (typeof showGameAlert === 'function') {
          showGameAlert(false, 'المرحلة مقفولة!', 'أنجز المراحل السابقة للوصول إلى هذا التحدي.', 'حسناً');
        }
      };
    }

    container.appendChild(node);
  });
}
