/* Keep approved delete X and resize handle attached to the button after every move. */
(function(){
  function syncControls(){
    document.querySelectorAll('.hs').forEach((el,i)=>{
      const stage=el.parentElement;
      if(!stage)return;
      const x=parseFloat(el.style.left)||0;
      const y=parseFloat(el.style.top)||0;
      const w=parseFloat(el.style.width)||0;
      const h=parseFloat(el.style.height)||0;
      const dels=stage.querySelectorAll('.delete-x');
      const del=dels[i];
      if(del){
        del.style.left=Math.min(99,x+w)+'%';
        del.style.top=Math.max(0,y-1)+'%';
      }
      if(w<99.9||h<99.9){
        const normal=[...stage.querySelectorAll('.hs')].filter(n=>(parseFloat(n.style.width)||0)<99.9||(parseFloat(n.style.height)||0)<99.9);
        const ri=normal.indexOf(el);
        const rh=stage.querySelectorAll('.resize-handle')[ri];
        if(rh){
          rh.style.left=Math.min(99,x+w)+'%';
          rh.style.top=Math.min(99,y+h)+'%';
        }
      }
    });
  }
  document.addEventListener('pointerup',()=>setTimeout(syncControls,0),true);
  document.addEventListener('mouseup',()=>setTimeout(syncControls,0),true);
  document.addEventListener('touchend',()=>setTimeout(syncControls,0),true);
})();