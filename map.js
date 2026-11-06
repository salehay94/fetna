// رسم خريطة المراحل
function renderMapNodes() {
  var container = document.getElementById('map-container');
  if (!container) return;
  container.innerHTML = '';

  stages.forEach(function(st) {
    var node = document.createElement('div');
    node.innerText = st.id;

    if (st.id < playerData.maxStage) {
      node.className = 'stage-node completed';
      node.title = 'مرحلة مكتملة';
      node.onclick = function() { startStage(st.id); };
    } else if (st.id === playerData.maxStage) {
      node.className = 'stage-node current';
      node.onclick = function() { startStage(st.id); };
    } else {
      node.className = 'stage-node locked';
      node.innerText = '🔒';
      node.onclick = function() { alert('المرحلة مقفولة! أنجز المراحل السابقة أولاً.'); };
    }

    container.appendChild(node);
  });
}
