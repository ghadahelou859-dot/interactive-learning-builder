/* Normal page button editor enhancements */
(function(){
let activeProject=null;
const names={next:'▶ التالي',prev:'◀ السابق',page:'🔢 123 صفحة',url:'🔗 رابط',whatsapp:'💬 واتساب',video:'🎬 فيديو',home:'🏠 الرئيسية'};
function title(h){return h.label||names[h.action]||'زر'}
function edit(h,changed,draw){
 const n=prompt('اسم الزر',title(h));if(n!==null)h.label=n;
 const c=prompt('لون الزر HEX',h.background||'#6d4aff');if(c)h.background=c;
 const t=prompt('لون الكتابة HEX',h.textColor||'#ffffff');if(t)h.textColor=t;
 const s=prompt('شكل الزر:\n1 مستطيل\n2 مستدير\n3 كبسولة\n4 دائري\n5 بيضاوي\n6 شكل مخصص',({rect:'1',round:'2',pill:'3',circle:'4',oval:'5',custom:'6'}[h.shape]||'2'));
 h.shape=s==='1'?'rect':s==='3'?'pill':s==='4'?'circle':s==='5'?'oval':s==='6'?'custom':'round';
 if(h.shape==='custom'){const r=Number(prompt('استدارة الزوايا من 0 إلى 100',h.customRadius??30));h.customRadius=Number.isFinite(r)?Math.max(0,Math.min(100,r)):30}
 const w=Number(prompt('عرض الزر % — كبّري أو صغّري كما تريدين',h.w));if(Number.isFinite(w)&&w>=2)h.w=Math.min(100,w);
 const ht=Number(prompt('ارتفاع الزر % — كبّري أو صغّري كما تريدين',h.h));if(Number.isFinite(ht)&&ht>=2)h.h=Math.min(100,ht);
 if(h.shape==='circle'){const size=Math.min(h.w,h.h);h.w=size;h.h=size}
 h.kind='styled';changed();draw();
}
function choosePage(current){const pages=activeProject?.pages||[];if(!pages.length)return null;const msg=pages.map((p,i)=>(i+1)+' — '+p.title+(p.id===current?' (الحالية)':'')).join('\n');const n=Number(prompt('اختاري رقم الصفحة\n\n'+msg,'1'))-1;return pages[n]||null}
window.hotspotEditor=function(page){
 const portrait=page.settings?.image_portrait,landscape=page.settings?.image_landscape;if(!portrait&&!landscape)return alert('ارفعي صورة أولًا');
 page.hotspots=page.hotspots||[];let variant=landscape?'landscape':'portrait',dirty=false;
 const o=document.createElement('div');o.style.cssText='position:fixed;inset:0;z-index:9999;background:#f5f5f7;overflow:auto;padding:15px';
 const top=document.createElement('div');top.style.cssText='display:flex;gap:8px;flex-wrap:wrap;position:sticky;top:0;z-index:50;background:#f5f5f7;padding:8px';
 const b=x=>{const q=document.createElement('button');q.textContent=x;return q},close=b('✕ إغلاق'),toggle=b('📱/💻'),p123=b('🔢 123 صفحة'),next=b('▶ التالي'),prev=b('◀ السابق'),home=b('🏠 الرئيسية'),url=b('🔗 رابط'),wa=b('💬 واتساب'),video=b('🎬 فيديو'),full=b('☑️ كل الصفحة'),save=b('💾 حفظ');
 save.style.cssText='background:#111;color:#fff';top.append(close,toggle,p123,next,prev,home,url,wa,video,full,save);
 const status=document.createElement('b');status.textContent='✓ محفوظ';top.append(status);
 const help=document.createElement('p');help.textContent='اسحبي الزر لتغيير مكانه. ضغطتين لتعديل الاسم واللون والشكل والحجم. × الأحمر يحذف زرًا واحدًا.';
 const stage=document.createElement('div');stage.style.cssText='position:relative;margin:auto;max-width:1100px;background:#fff;box-shadow:0 3px 18px #bbb;touch-action:none';const img=document.createElement('img');img.style.cssText='display:block;width:100%';stage.append(img);
 function changed(){dirty=true;status.textContent='● تغييرات غير محفوظة'}
 function radius(h){return h.shape==='circle'||h.shape==='oval'?'50%':h.shape==='pill'?'999px':h.shape==='rect'?'0':h.shape==='custom'?(Math.max(0,Math.min(100,Number(h.customRadius)||0))+'px'): '18px'}
 function draw(){
  const media=variant==='portrait'?(portrait||landscape):(landscape||portrait);img.src=media.url;toggle.textContent=variant==='portrait'?'📱 الطولية':'💻 العرضية';stage.querySelectorAll('.hs,.delete-x').forEach(x=>x.remove());
  page.hotspots.filter(h=>h.variant===variant).forEach((h,i)=>{
   const el=document.createElement('div');el.className='hs';const styled=h.kind==='styled';el.style.cssText=`position:absolute;left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%;box-sizing:border-box;cursor:move;z-index:${10+i};display:flex;align-items:center;justify-content:center;font-weight:800;border:${styled?'2px solid #fff':'3px dashed #6d4aff'};background:${styled?(h.background||'#6d4aff'):'rgba(109,74,255,.18)'};color:${h.textColor||'#fff'};border-radius:${radius(h)}`;el.textContent=title(h);el.ondblclick=e=>{e.stopPropagation();edit(h,changed,draw)};
   if(!h.fullPage){let sx=null,sy=null,ox=0,oy=0;el.onpointerdown=e=>{sx=e.clientX;sy=e.clientY;ox=+h.x||0;oy=+h.y||0;el.setPointerCapture(e.pointerId)};el.onpointermove=e=>{if(sx===null)return;const r=stage.getBoundingClientRect();h.x=Math.max(0,Math.min(100-h.w,ox+(e.clientX-sx)/r.width*100));h.y=Math.max(0,Math.min(100-h.h,oy+(e.clientY-sy)/r.height*100));el.style.left=h.x+'%';el.style.top=h.y+'%'};el.onpointerup=()=>{if(sx!==null)changed();sx=sy=null}}
   stage.append(el);
   const del=document.createElement('button');del.className='delete-x';del.textContent='×';del.style.cssText=`position:absolute;left:${Math.min(99,(+h.x||0)+(+h.w||0))}%;top:${Math.max(0,(+h.y||0)-1)}%;transform:translate(-50%,-50%);width:30px;height:30px;border:2px solid #fff;border-radius:50%;background:#d32f2f;color:#fff;font-size:22px;font-weight:900;z-index:${1000+i};cursor:pointer;padding:0`;del.onpointerdown=e=>e.stopPropagation();del.onclick=async e=>{e.stopPropagation();if(!confirm('حذف هذا الزر فقط؟'))return;page.hotspots=page.hotspots.filter(x=>x.id!==h.id);draw();try{await saveHotspots(page);dirty=false;status.textContent='✓ تم الحذف والحفظ'}catch(err){alert(err.message)}};stage.append(del);
  });
 }
 function make(action,x,y,w,h,extra={}){const variants=[];if(portrait)variants.push('portrait');if(landscape)variants.push('landscape');if(!variants.length)variants.push(variant);const group=crypto.randomUUID();variants.forEach(v=>page.hotspots.push({id:crypto.randomUUID(),groupId:group,variant:v,x,y,w,h,label:'',action,target:'',kind:'transparent',shape:'round',background:'#6d4aff',textColor:'#fff',...extra}));changed();draw()}
 next.onclick=()=>make('next',72,84,18,9);prev.onclick=()=>make('prev',6,84,18,9);home.onclick=()=>make('home',4,4,14,8);
 p123.onclick=()=>{const p=choosePage(page.id);if(!p)return alert('افتحي المشروع من قائمة المشاريع ثم جربي 123 مرة أخرى');make('page',40,75,22,10,{target:p.id,targetTitle:p.title})};
 url.onclick=()=>{let v=prompt('الرابط','https://');if(!v)return;if(!/^https?:\/\//i.test(v))v='https://'+v;make('url',40,70,20,9,{target:v,label:prompt('اسم الزر','رابط')||'رابط'})};
 wa.onclick=()=>{const v=(prompt('رقم واتساب مع رمز الدولة','970')||'').replace(/\D/g,'');if(!v)return;make('whatsapp',40,70,20,9,{target:v,label:prompt('اسم الزر','واتساب')||'واتساب'})};
 video.onclick=()=>{let v=prompt('رابط الفيديو المباشر','https://');if(!v)return;if(!/^https?:\/\//i.test(v))v='https://'+v;make('video',40,65,22,11,{target:v,label:prompt('اسم الزر','فيديو')||'فيديو'})};
 full.onclick=()=>make('next',0,0,100,100,{fullPage:true,shape:'rect'});
 toggle.onclick=()=>{variant=variant==='portrait'?'landscape':'portrait';draw()};
 save.onclick=async()=>{try{save.disabled=true;await saveHotspots(page);dirty=false;status.textContent='✓ محفوظ';draw()}catch(e){alert(e.message)}finally{save.disabled=false}};
 close.onclick=()=>{if(dirty&&!confirm('يوجد تغييرات غير محفوظة. إغلاق؟'))return;o.remove()};o.append(top,help,stage);document.body.append(o);draw();
};
const old=window.openPageEditor;if(typeof old==='function')window.openPageEditor=function(d,page){activeProject=d;return old(d,page)};
})();