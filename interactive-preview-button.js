/* Restore interactive preview button without changing editor/delete controls */
(function(){
  const original=window.openPageEditor;
  if(typeof original!=='function') return;
  window.openPageEditor=function(projectData,page){
    const result=original(projectData,page);
    setTimeout(function(){
      if(!window.interactivePreview) return;
      const panel=document.querySelector('.panel');
      if(!panel||panel.querySelector('[data-interactive-preview]')) return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.setAttribute('data-interactive-preview','1');
      btn.textContent='👁 معاينة تفاعلية';
      btn.style.cssText='background:#fff;border:2px solid #6d4aff;color:#4f35c8;font-weight:800;margin:10px;padding:14px;border-radius:10px;cursor:pointer';
      btn.onclick=function(){ window.interactivePreview(projectData,page,'portrait'); };
      const heading=panel.querySelector('h1');
      if(heading) heading.insertAdjacentElement('afterend',btn); else panel.prepend(btn);
    },0);
    return result;
  };
})();