/* Transparent / colored mode for normal page buttons without changing approved editor behavior */
(function(){
 const wait=()=>{if(typeof window.hotspotEditor!=='function')return setTimeout(wait,50);const original=window.hotspotEditor;window.hotspotEditor=function(page){original(page);setTimeout(()=>enhance(page),60)}};
 function enhance(page){
  const stage=[...document.querySelectorAll('div')].find(x=>x.style.position==='relative'&&x.querySelector('img')&&x.querySelector('.hs'));if(!stage)return;
  function apply(){stage.querySelectorAll('.hs').forEach(el=>{const all=page.hotspots||[];const visible=all.filter(h=>{const left=parseFloat(el.style.left),top=parseFloat(el.style.top);return Math.abs((+h.x||0)-left)<.01&&Math.abs((+h.y||0)-top)<.01});const h=visible[0];if(!h)return;if(h.visualMode==='transparent'){el.style.background='rgba(109,74,255,.12)';el.style.border='3px dashed #6d4aff';el.style.color='#6d4aff';el.dataset.transparent='1'}else el.dataset.transparent='0'})}
  apply();
  stage.addEventListener('dblclick',e=>{const el=e.target.closest?.('.hs');if(!el)return;setTimeout(()=>{const modal=[...document.querySelectorAll('div')].find(x=>x.style.zIndex==='200000');if(!modal||modal.querySelector('.visibility-mode'))return;const card=modal.firstElementChild;if(!card)return;const title=[...card.children].find(x=>x.textContent==='شكل الزر');const box=document.createElement('div');box.className='visibility-mode';box.style.cssText='margin:10px 0;padding:10px;background:#f7f7f9;border-radius:12px';box.innerHTML='<b>ظهور الزر</b><div style="display:flex;gap:8px;margin-top:8px"><button type="button" data-mode="transparent" style="flex:1;padding:9px">⬜ شفاف</button><button type="button" data-mode="colored" style="flex:1;padding:9px">🎨 ملوّن</button></div>';
    const left=parseFloat(el.style.left),top=parseFloat(el.style.top);const h=(page.hotspots||[]).find(x=>Math.abs((+x.x||0)-left)<.01&&Math.abs((+x.y||0)-top)<.01);if(!h)return;let selected=h.visualMode||(h.kind==='transparent'?'transparent':'colored');const paint=()=>box.querySelectorAll('button').forEach(b=>{b.style.border=b.dataset.mode===selected?'2px solid #6d4aff':'2px solid #ddd';b.style.borderRadius='10px';b.style.background='#fff'});paint();box.querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=b.dataset.mode;h.visualMode=selected;h.kind=selected==='transparent'?'transparent':'styled';paint()});
    if(title)card.insertBefore(box,title);else card.append(box);
    const applyBtn=[...card.querySelectorAll('button')].find(b=>b.textContent==='تطبيق');if(applyBtn){const old=applyBtn.onclick;applyBtn.onclick=ev=>{h.visualMode=selected;h.kind=selected==='transparent'?'transparent':'styled';old?.call(applyBtn,ev);setTimeout(apply,20)}}
   },20)},true)
 }
 wait();
})();