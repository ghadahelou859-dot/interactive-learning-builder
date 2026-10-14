/* Independent map-character editor. No background or hotspot changes. */
(function(){
const old=window.openPageEditor;
if(typeof old!=='function')return;
window.openPageEditor=function(project,page){
 old.apply(this,arguments);
 if(page.page_type!=='map')return;
 const panel=document.querySelector('.panel');
 if(!panel)return;
 const box=document.createElement('section');
 box.style.cssText='margin:18px 0;padding:18px;border:1px solid #c8c0ff;border-radius:16px;background:#f7f5ff';
 const title=document.createElement('h3');title.textContent='🚶 إضافة شخصية متحركة على الخريطة';
 const note=document.createElement('p');note.textContent='الشخصية طبقة مستقلة؛ لن يتم استبدال صور الخريطة أو تغيير الأزرار. اختاري PNG بخلفية شفافة.';
 const img=document.createElement('img');img.alt='معاينة الشخصية';img.style.cssText='display:block;max-width:130px;max-height:180px;object-fit:contain;margin:12px auto';
 const current=page.settings?.animated_map||{};
 if(current.sprite)img.src=current.sprite;
 const input=document.createElement('input');input.type='file';input.accept='image/png,image/webp';input.style.cssText='display:block;margin:12px 0;width:100%';
 const size=document.createElement('input');size.type='range';size.min='10';size.max='38';size.value=String(current.width||24);
 const sizeLabel=document.createElement('label');sizeLabel.textContent='حجم الشخصية: '+size.value+'%';size.oninput=()=>sizeLabel.textContent='حجم الشخصية: '+size.value+'%';
 const save=document.createElement('button');save.textContent='💾 رفع وحفظ الشخصية';save.style.cssText='display:block;background:#6d4aff;color:white;padding:12px 18px;border:0;border-radius:12px;margin-top:14px';
 const status=document.createElement('p');status.setAttribute('role','status');
 input.onchange=()=>{const f=input.files?.[0];if(f){const u=URL.createObjectURL(f);img.onload=()=>URL.revokeObjectURL(u);img.src=u}};
 save.onclick=async()=>{
 const f=input.files?.[0];if(!f&&!current.sprite){status.textContent='اختاري صورة الشخصية أولًا';return}
 if(f&&(!['image/png','image/webp'].includes(f.type)||f.size>20*1024*1024)){status.textContent='اختاري PNG أو WebP بحجم أقل من 20MB';return}
 save.disabled=true;status.textContent='جاري الحفظ...';
 try{
 let sprite=current.sprite;
 if(f){
 const fd=new FormData();fd.append('password',sessionStorage.getItem('creatorPassword')||'');fd.append('page_id',page.id);fd.append('variant','quiz');fd.append('file',f);
 const upload=await fetch('https://jzswtwicvgppisasrkqe.supabase.co/functions/v1/creator-media',{method:'POST',body:fd});
 const data=await upload.json();if(!upload.ok||!data.image?.url)throw Error(data.error||'تعذر رفع الصورة');
 sprite=data.image.url;
 }
 const animated_map={...current,sprite,sprite_mode:'single',width:Number(size.value)};
 const response=await fetch('https://jzswtwicvgppisasrkqe.supabase.co/functions/v1/creator-projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:sessionStorage.getItem('creatorPassword')||'',action:'save_page_settings',page_id:page.id,settings:{animated_map}})});
 const result=await response.json();if(!response.ok||!result.ok)throw Error(result.error||'تعذر حفظ الإعدادات');
 page.settings={...page.settings,...result.settings};status.textContent='✓ تم الحفظ. افتحي درس زين لمشاهدة الشخصية.';img.src=sprite;
 }catch(e){status.textContent='لم يكتمل الحفظ: '+e.message}finally{save.disabled=false}
 };
 box.append(title,note,img,input,sizeLabel,size,save,status);
 panel.append(box);
};
})();