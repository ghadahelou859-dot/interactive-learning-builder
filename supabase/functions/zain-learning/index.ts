import { createClient } from "npm:@supabase/supabase-js@2.95.3";
const PROJECT="ffadddd9-492d-4ec8-9ffe-bca15ca8d991";
const ADMIN_HASH="f407b67428f317a92c12ef10d6083c214e77a6dbd148628e330a768ecb335f8f";
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const json=(x:unknown,status=200)=>new Response(JSON.stringify(x),{status,headers});
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,"0")).join("");
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 try{
  const b=await req.json();
  const keys=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}");
  const sb=createClient(Deno.env.get("SUPABASE_URL")!,keys.default||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
  async function check(q:any){const {data,error}=await q;if(error)throw error;return data;}
  const quizzes=await check(sb.from("educational_quizzes").select("id").eq("project_id",PROJECT));
  const quiz=quizzes?.[0]?.id;
  if(b.action==="config"){
   const pages=await check(sb.from("educational_pages").select("id,title,page_type,sort_order,settings,hotspots,video_settings").eq("project_id",PROJECT).order("sort_order"));
   return json({pages:pages.map((p:any)=>({...p,settings:{image_portrait:p.settings.image_portrait,image_landscape:p.settings.image_landscape,animated_map:p.settings.animated_map,lesson_number:p.settings.lesson_number},hotspots:p.hotspots.filter((h:any)=>["next","prev","page","home"].includes(h.action))}))});
  }
  const ANALYTICS="0b9b61c4-15dd-4013-bd5b-775249104488";
  const visitor=String(b.visitor_key||"");
  const validVisitor=/^[a-zA-Z0-9_-]{16,100}$/.test(visitor);
  if(["engagement","like","view"].includes(b.action)){
   if(!validVisitor)return json({error:"معرّف الزيارة غير صحيح"},400);
   if(b.action!=="engagement"){
    const type=b.action,session=String(b.session_key||"");
    if(type==="view"&&!/^[a-zA-Z0-9_-]{16,100}$/.test(session))return json({error:"معرّف الجلسة غير صحيح"},400);
    const key=type==="like"?"like":"view:"+session;
    const {error}=await sb.from("zain_engagement").insert({visitor_key:visitor,event_key:key,event_type:type});
    if(error&&error.code!=="23505")throw error;
    if(!error)await check(sb.from("analytics_events").insert({project_id:ANALYTICS,visitor_key:visitor,session_key:session||null,event_name:type,page_key:"zain",metadata:{source:"zain-learning"}}));
   }
   const {count,error}=await sb.from("zain_engagement").select("visitor_key",{head:true,count:"exact"}).eq("event_type","like");if(error)throw error;
   const liked=await check(sb.from("zain_engagement").select("visitor_key").eq("visitor_key",visitor).eq("event_key","like").maybeSingle());
   return json({likes:count||0,liked:!!liked});
  }
  if(b.action==="social"){
   if(!validVisitor||!["whatsapp","instagram","tiktok","snapchat"].includes(b.network))return json({error:"طلب غير صحيح"},400);
   await check(sb.from("analytics_events").insert({project_id:ANALYTICS,visitor_key:visitor,session_key:String(b.session_key||"").slice(0,100),event_name:"social_click",page_key:"zain",metadata:{network:b.network}}));return json({ok:true});
  }
  if(["teacher","admin"].includes(b.action)){
   const admin=b.action==="admin";
   if(admin){if(await hash(String(b.password||""))!==ADMIN_HASH)return json({error:"كلمة المرور غير صحيحة"},401);}
   else{
    const ip=await hash(req.headers.get("x-forwarded-for")||"unknown");
    const {count,error}=await sb.from("zain_access_attempts").select("id",{count:"exact",head:true}).eq("ip_hash",ip).gte("attempted_at",new Date(Date.now()-900000).toISOString());if(error)throw error;
    if((count||0)>=8)return json({error:"محاولات دخول كثيرة. انتظري ١٥ دقيقة."},429);
    const access=await check(sb.from("zain_teacher_access").select("salt,code_hash").eq("project_id",PROJECT).single());
    if(!/^[0-9]{8}$/.test(String(b.code||""))||await hash(access.salt+String(b.code))!==access.code_hash){await check(sb.from("zain_access_attempts").insert({ip_hash:ip}));return json({error:"رمز المعلمة غير صحيح"},401);}
   }
   const all:any[]=[];
   for(let from=0;;from+=1000){const batch=await check(sb.from("educational_quiz_attempts").select("id,guest_name,score,max_score,started_at,completed_at,duration_seconds,metadata").eq("quiz_id",quiz).order("started_at",{ascending:true}).order("id").range(from,from+999));all.push(...batch);if(batch.length<1000)break;}
   const counters=new Map<string,number>();
   const rows=all.map((r:any)=>{const email=String(r.metadata.email||"").toLowerCase();const number=(counters.get(email)||0)+1;counters.set(email,number);return {id:r.id,name:r.guest_name,email,email_verified:false,score:r.score,total:r.max_score,attempt_number:number,started_at:r.started_at,completed_at:r.completed_at,duration:r.duration_seconds};}).reverse();
   const students=counters.size,completed=rows.filter((r:any)=>r.completed_at).length;
   const visits=admin?await check(sb.from("zain_student_visits").select("name,email,entered_at,last_seen_at").order("last_seen_at",{ascending:false})):undefined;
   return json({rows,students,completed,attempts:rows.length,visits});
  }
  if(b.action==="register"){
   const name=String(b.name||"").trim(),email=String(b.email||"").trim().toLowerCase();
   if(!validVisitor||name.length<2||name.length>80||email.length>150||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:"أدخلي الاسم والبريد الإلكتروني بشكل صحيح"},400);
   const existing=await check(sb.from("zain_student_visits").select("entered_at").eq("visitor_key",visitor).maybeSingle());
   await check(sb.from("zain_student_visits").upsert({visitor_key:visitor,name,email,entered_at:existing?.entered_at||new Date().toISOString(),last_seen_at:new Date().toISOString()}));
   return json({ok:true});
  }
  if(!quiz)return json({error:"الأسئلة غير جاهزة"},503);
  async function questions(){return await check(sb.from("educational_questions").select("id,question_text,explanation,sort_order,educational_question_options(id,option_text,is_correct,sort_order)").eq("quiz_id",quiz).order("sort_order"));}
  function publicQ(q:any){return {id:q.id,text:q.question_text,answers:q.educational_question_options.sort((a:any,c:any)=>a.sort_order-c.sort_order).map((a:any)=>({id:a.id,text:a.option_text}))};}
  if(b.action==="start"){
   const name=String(b.name||"").trim(),email=String(b.email||"").trim().toLowerCase();
   if(name.length<2||name.length>80||email.length>150||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:"أدخلي الاسم والبريد الإلكتروني بشكل صحيح"},400);
   const ip=await hash(req.headers.get("x-forwarded-for")||"unknown");
   const {count,error}=await sb.from("educational_quiz_attempts").select("id",{count:"exact",head:true}).eq("quiz_id",quiz).eq("metadata->>ip_hash",ip).gte("started_at",new Date(Date.now()-3600000).toISOString());
   if(error)throw error;if((count||0)>=30)return json({error:"محاولات كثيرة، جرّبي لاحقًا"},429);
   const bank=await questions(),chosen:any[]=[];
   const random=(list:any[])=>list.map(x=>({x,r:crypto.getRandomValues(new Uint32Array(1))[0]})).sort((a,c)=>a.r-c.r).map(x=>x.x);
   for(let i=0;i<6;i++){const group=bank.filter((q:any)=>Math.floor(q.sort_order/5)===i);if(group.length)chosen.push(random(group)[0]);}
   chosen.push(...random(bank.filter((q:any)=>!chosen.includes(q))).slice(0,10-chosen.length));
   const selected=random(chosen),token=crypto.randomUUID()+crypto.randomUUID(),deadline=Date.now()+30000;
   const a=await check(sb.from("educational_quiz_attempts").insert({quiz_id:quiz,guest_name:name,max_score:selected.length,metadata:{email,email_verified:false,ip_hash:ip,token_hash:await hash(token),ids:selected.map(q=>q.id),index:0,version:0,deadline,status:"answer",answers:[]}}).select("id").single());
   return json({attempt_id:a.id,token,question:publicQ(selected[0]),index:0,total:selected.length,deadline});
  }
  if(!["answer","next"].includes(b.action))return json({error:"Unknown action"},400);
  const a=await check(sb.from("educational_quiz_attempts").select("*").eq("id",String(b.attempt_id||"")).eq("quiz_id",quiz).maybeSingle());
  if(!a||await hash(String(b.token||""))!==a.metadata.token_hash)return json({error:"المحاولة غير متاحة"},401);
  const m=a.metadata;
  if(a.completed_at){const last=a.metadata.answers.at(-1);return json({...last,done:true,result:{score:a.score,total:a.max_score,name:a.guest_name,answers:a.metadata.answers}});}
  const bank=await questions(),q=bank.find((q:any)=>q.id===m.ids[m.index]);
  if(!q)return json({error:"السؤال غير متاح"},400);
  if(b.action==="answer"){
   if(m.status!=="answer"){const last=m.answers.at(-1);return json({...last,done:false,result:null});}
   const option=q.educational_question_options.find((o:any)=>o.id===b.option_id);
   if(b.option_id&&!option)return json({error:"الخيار غير صحيح"},400);
   const correct=Date.now()<=m.deadline+2000&&!!option?.is_correct;
   const answers=[...m.answers,{question:q.question_text,correct,selected:option?.option_text||"انتهى الوقت",expected:q.educational_question_options.find((x:any)=>x.is_correct)?.option_text,explanation:q.explanation}];
   const done=m.index===m.ids.length-1;
   const score=Number(a.score)+(correct?1:0);
   const update:any={score,metadata:{...m,version:m.version+1,status:"feedback",answers}};
   if(done){update.completed_at=new Date().toISOString();update.duration_seconds=Math.round((Date.now()-Date.parse(a.started_at))/1000);}
   const saved=await check(sb.from("educational_quiz_attempts").update(update).eq("id",a.id).eq("metadata->>version",String(m.version)).select("id"));
   if(!saved.length)return json({error:"الإجابة سُجلت، أعيدي المحاولة"},409);
   return json({correct,explanation:q.explanation,expected:answers.at(-1).expected,done,result:done?{score,total:a.max_score,name:a.guest_name,answers}:null});
  }
  if(m.status!=="feedback")return json({question:publicQ(q),index:m.index,total:a.max_score,deadline:m.deadline});
  const index=m.index+1,deadline=Date.now()+30000,next=bank.find((q:any)=>q.id===m.ids[index]);
  const saved=await check(sb.from("educational_quiz_attempts").update({metadata:{...m,index,deadline,status:"answer",version:m.version+1}}).eq("id",a.id).eq("metadata->>version",String(m.version)).select("id"));
  if(!saved.length)return json({error:"تعذر الانتقال، جرّبي مرة أخرى"},409);
  return json({question:publicQ(next),index,total:a.max_score,deadline});
 }catch(e){console.error("zain-learning",e);return json({error:"تعذّر الاتصال. جرّبي مرة أخرى."},500);}
});
