/* Keep approved delete X and resize handle visually attached to the button while dragging. */
(function(){
  function sync(el){
    if(!el || !el.classList || !el.classList.contains('hs')) return;
    const stage=el.parentElement;
    if(!stage) return;
    const x=parseFloat(el.style.left)||0;
    const y=parseFloat(el.style.top)||0;
    const w=parseFloat(el.style.width)||0;
    const h=parseFloat(el.style.height)||0;
    let node=el.nextElementSibling;
    let del=null, resize=null;
    for(let i=0;node&&i<3;i++,node=node.nextElementSibling){
      if(node.classList?.contains('delete-x')) del=node;
      if(node.classList?.contains('resize-handle')) resize=node;
    }
    if(del){
      del.style.left=Math.min(99,x+w)+'%';
      del.style.top=Math.max(0,y-1)+'%';
    }
    if(resize){
      resize.style.left=Math.min(99,x+w)+'%';
      resize.style.top=Math.min(99,y+h)+'%';
    }
  }
  document.addEventListener('pointermove',function(e){
    const el=e.target?.closest?.('.hs');
    if(el) requestAnimationFrame(()=>sync(el));
  },true);
  document.addEventListener('pointerup',function(e){
    const el=e.target?.closest?.('.hs');
    if(el) sync(el);
  },true);
})();