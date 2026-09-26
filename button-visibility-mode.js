/* Transparent / colored mode for normal page buttons. Preserves approved delete, resize, move and preview features. */
(function(){
 const wait=()=>{if(typeof window.hotspotEditor!=='function')return setTimeout(wait,50);const original=window.hotspotEditor;window.hotspotEditor=function(page){original(page);setTimeout(()=>enhance(page),60)}};
 function enhance(page){
  const stage=[...document.querySelectorAll('div')].find(x=>x.style.position==='relative'&&x.querySelector('img')&&x.querySelector('.hs'));if(!stage)return;
  const findHotspot=el=>{const left=parseFloat(el.style.left),top=parseFloat(el.style.top);return (page.hotspots||[]).find(h=>Math.abs((+h.x||0)-left)<.02&&Math.abs((+h.y||0)-top)<.02)};
  function editorLook(el,h){if(!h)return;if(h.visualMode==='transparent'||h.kind==='transparent'){el.style.background='rgba(109,74,255,.12)';el.style.border='3px dashed #6d4aff';el.style.color='#6d4aff'}else{el.style.background=h.background||'#6d4aff';el.style.color=h.textColor||'#fff'}}
  stage.querySelectorAll('.hs').forEach(el=>editorLook(el,findHotspot(el)));
  stage.addEventListener('dblclick',e=>{const el=e.target.closest?.('.hs');if(!el)return;const h=findHotspot(el);if(!h)return;setTimeout(()=>{const modal=[...document.querySelectorAll('div')].find(x=>x.style.zIndex==='200000');if(!modal||modal.querySelector('.visibility-mode'))return;const card=modal.firstElementChild;if(!card)return;let selected=h.visualMode||(h.kind==='transparent'?'transparent':'colored');const box=document.createElement('div');box.className='visibility-mode';box.style.cssText='margin:10px 0;padding:10px;background:#f7f7f9;border-radius:12px';box.innerHTML='<b>ظهور الزر</b><div style="display:flex;gap:8px;margin-top:8px"><button type="button" data-mode="transparent" style="flex:1;padding:9px">⬜ شفاف</button><button type="button" data-mode="colored" style="flex:1;padding:9px">🎨 ملوّن</button></div>';
   const paint=()=>box.querySelectorAll('button').forEach(b=>{b.style.border=b.dataset.mode===selected?'3px solid #6d4aff':'2px solid #ddd';b.style.borderRadius='10px';b.style.background=b.dataset.mode===selected?'#f0ebff':'#fff';b.style.fontWeight=b.dataset.mode===selected?'800':'600'});paint();box.querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=b.dataset.mode;paint()});
   const shapeTitle=[...card.children].find(x=>x.textContent==='شكل الزر');if(shapeTitle)card.insertBefore(box,shapeTitle);else card.append(box);
   const applyBtn=[...card.querySelectorAll('button')].find(b=>b.textContent==='تطبيق');if(!applyBtn)return;const old=applyBtn.onclick;applyBtn.onclick=ev=>{old?.call(applyBtn,ev);h.visualMode=selected;h.kind=selected==='transparent'?'transparent':'styled';setTimeout(()=>{const fresh=[...stage.querySelectorAll('.hs')].find(x=>{const l=parseFloat(x.style.left),t=parseFloat(x.style.top);return Math.abs((+h.x||0)-l)<.02&&Math.abs((+h.y||0)-t)<.02});if(fresh)editorLook(fresh,h)},30)};
  },20)},true)
 }
 wait();
})();