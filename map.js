var pathStepStyles = [
  { right: '48%' },
  { right: '44%' },
  { right: '40%' },
  { right: '52%' },
  { right: '62%' },
  { right: '55%' },
  { right: '45%' },
  { right: '42%' },
  { right: '48%' },
  { right: '50%' }
];

function renderMapNodes() {
  var container = document.getElementById('map-container');
  if (!container) return;
  container.innerHTML = '';

  if (!stages || stages.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding-top:40px; color:#64748B;">جاري تحميل خريطة المراحل...</p>';
    return;
  }

  stages.forEach(function(st) {
    var node = document.createElement('div');
    var icon = st.icon || '✍️';
    var stepStyle = pathStepStyles[(st.id - 1) % pathStepStyles.length];

    if (st.id < playerData.maxStage) {
      node.className = 'stage-node completed';
      node.style.right = stepStyle.right;
      node.innerHTML = '<span class="node-num">' + st.id + '</span><span class="node-icon">' + icon + '</span>';
      node.onclick = function() {
        if (typeof startStage === 'function') startStage(st.id);
      };
    } else if (st.id === playerData.maxStage) {
      node.className = 'stage-node current';
      node.style.right = stepStyle.right;
      node.innerHTML = '<span class="node-num">' + st.id + '</span><span class="node-icon">' + icon + '</span>';
      node.onclick = function() {
        if (typeof startStage === 'function') startStage(st.id);
      };
    } else {
      node.className = 'stage-node locked';
      node.style.right = stepStyle.right;
      node.innerHTML = '<span class="node-num">' + st.id + '</span><span class="node-icon">🔒</span>';
      node.onclick = function() {
        alert('هذه المرحلة مقفلة! يجب إكمال المراحل السابقة أولاً.');
      };
    }

    container.appendChild(node);
  });

  setTimeout(function() {
    var currentNode = container.querySelector('.stage-node.current');
    if (currentNode) {
      currentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 200);
}
