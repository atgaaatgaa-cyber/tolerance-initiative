// جسور التسامح — وضع تجريبي محلي، أو Supabase عند إضافة بيانات المشروع.
const SUPABASE_URL = "https://xqjassgvdqnqeiuosoo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-F3D_CNtKstwpQEXpdA7Nw_l05bpZZf"; // مفتاح عام فقط؛ لا تضع Secret Key هنا
const hasCloud = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);
const db = hasCloud ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const $ = (s) => document.querySelector(s);
const roleNames = {student:"طالب", parent:"ولي أمر", teacher:"معلم"};
const prompts = {
 student:"أكمل العبارة: التسامح بالنسبة لي هو...",
 parent:"ما القيمة التي تحرص على تعليمها لأبنائك لتعزيز التسامح؟",
 teacher:"كيف تعزز ثقافة التسامح وتقبل الاختلاف في البيئة التعليمية؟"
};
let localApproved = [];
let localPending = [];
const leafColors = {student:"#d9bd83",parent:"#9eb38a",teacher:"#d59a80"};
function safeText(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function updateRole(){const role=document.querySelector('input[name="role"]:checked').value;$("#questionLabel").textContent=prompts[role];}
document.querySelectorAll('input[name="role"]').forEach(el=>el.addEventListener("change",updateRole));
$("#promptText").addEventListener("input",e=>$("#charCount").textContent=e.target.value.length+" / 280");
function renderStats(rows){const counts={student:0,parent:0,teacher:0};rows.forEach(r=>{if(counts[r.role]!==undefined)counts[r.role]++});$("#totalCount").textContent=rows.length;$("#studentCount").textContent=counts.student;$("#parentCount").textContent=counts.parent;$("#teacherCount").textContent=counts.teacher;}
function renderWall(rows){const wall=$("#messageWall");if(!rows.length){wall.innerHTML='<div class="empty-wall">ستظهر هنا الرسائل المعتمدة من المشاركين 🌿</div>';return;}wall.innerHTML=rows.slice(0,9).map(r=>`<article class="message-card"><span class="leaf-mark">✦</span><p>${safeText(r.message)}</p><small>${roleNames[r.role]||"مشارك"} · رسالة معتمدة</small></article>`).join("");}
function renderTree(rows){const group=$("#treeLeaves");group.innerHTML="";const positions=[[300,80],[245,110],[355,110],[190,145],[410,145],[270,175],[330,180],[130,205],[470,190],[220,235],[380,240],[300,265],[170,285],[430,285],[260,315],[340,320],[300,135],[235,195],[365,195],[300,220]];rows.slice(0,40).forEach((r,i)=>{const [x,y]=positions[i%positions.length];const ns="http://www.w3.org/2000/svg";const e=document.createElementNS(ns,"ellipse");e.setAttribute("cx",x+(i>=positions.length?((i%3)-1)*12:0));e.setAttribute("cy",y+(i>=positions.length?Math.floor(i/positions.length)*7:0));e.setAttribute("rx",10+(i%3)*2);e.setAttribute("ry",6+(i%2)*2);e.setAttribute("fill",leafColors[r.role]||"#d9bd83");e.setAttribute("class","tree-leaf");e.setAttribute("transform",`rotate(${(i*37)%90-45} ${x} ${y})`);group.appendChild(e)});$("#treeMessage").textContent=rows.length?`شجرتنا تحمل ${rows.length} أثرًا جميلًا`:"كل أثر طيب... ينبت خيرًا";$("#treeSub").textContent=rows.length?"كل ورقة هنا تمثل رسالة إيجابية من أحد أفراد المجتمع.":"كن أول من يزرع ورقته في شجرتنا.";}
function render(rows){renderStats(rows);renderWall(rows);renderTree(rows);}
async function load(){if(!db){localApproved=JSON.parse(sessionStorage.getItem("atharApproved")||"[]");render(localApproved);$("#modeHint").textContent="وضع العرض المحلي: المشاركات لا تنتقل إلى أجهزة الآخرين، وتُمسح عند انتهاء الجلسة. اربط Supabase للنشر الجماعي.";return;}$("#modeHint").textContent="المشاركات تُرسل للمراجعة، ولا تظهر للعامة إلا بعد اعتمادها.";const {data,error}=await db.from("submissions").select("id,role,message,created_at").eq("status","approved").order("created_at",{ascending:false}).limit(60);if(error){$("#formStatus").textContent="تعذر تحميل المشاركات. تحقق من إعداد قاعدة البيانات.";return;}render(data||[]);}
$("#shareForm").addEventListener("submit",async e=>{e.preventDefault();const status=$("#formStatus");const role=document.querySelector('input[name="role"]:checked').value;const message=$("#promptText").value.trim();if(message.length<8){status.textContent="اكتب رسالة من 8 أحرف على الأقل.";return;}if(/https?:\/\/|www\.|@/.test(message)){status.textContent="فضلاً، لا تضف روابط أو بيانات تواصل.";return;}const payload={role,message,status:"pending"};status.textContent="جارٍ إرسال رسالتك...";const button=$(".submit-btn");button.disabled=true;
try{if(db){const {error}=await db.from("submissions").insert(payload);if(error)throw error;}else{localPending.push(payload);status.textContent="تم استلام رسالتك في هذا العرض التجريبي. النشر الجماعي يحتاج ربط قاعدة البيانات ومراجعة المشاركة.";$("#promptText").value="";$("#charCount").textContent="0 / 280";button.disabled=false;return;}
status.textContent="وصلت رسالتك بنجاح! ستظهر على الجدار والشجرة بعد مراجعتها واعتمادها.";$("#promptText").value="";$("#charCount").textContent="0 / 280";
}catch(err){status.textContent="لم نتمكن من إرسال الرسالة. حاول مرة أخرى لاحقًا.";}finally{button.disabled=false;}});
load();