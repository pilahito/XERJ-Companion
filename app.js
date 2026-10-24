"use strict";
const $=id=>document.getElementById(id);
const LANG_KEY="xerj.lang",STATS_KEY="xerj.stats",RAIL_KEY="xerj.rail",RING=327;
const KW=new Set("fn pub use let mut const async await struct impl enum match if else return self for in while crate mod type trait where move ref Some None Ok Err Result Option def class import from function var new this try catch throw interface export default extends".split(" "));
let I18N=null,lang="en",view="search",statusState="checking";
let lastHits=[],lastQuery="",currentIndex="*",activeHit=null,indexData=[],messages=[],busy=false;
let stats=loadStats();

function loadStats(){
 try{const raw=JSON.parse(localStorage.getItem(STATS_KEY));return{searches:raw.searches||0,queries:raw.queries||{},times:raw.times||{},sources:raw.sources||{}}}catch(e){return{searches:0,queries:{},times:{},sources:{}}}
}
function saveStats(){try{localStorage.setItem(STATS_KEY,JSON.stringify(stats))}catch(e){}}

function argsOf(node){try{return node.dataset.i18nArgs?JSON.parse(node.dataset.i18nArgs):{}}catch(e){return{}}}
function t(key,args){
 const dict=(I18N&&I18N[lang])||{},fallback=(I18N&&I18N.en)||{};
 let s=dict[key]!==undefined?dict[key]:fallback[key];
 if(s===undefined)return key;
 return String(s).replace(/\{(\w+)\}/g,(m,name)=>args&&args[name]!==undefined?String(args[name]):m);
}
function setKey(node,key,args){
 if(!node)return;
 node.dataset.i18n=key;
 if(args)node.dataset.i18nArgs=JSON.stringify(args);else delete node.dataset.i18nArgs;
 if(I18N)node.textContent=t(key,args);
}
function setRaw(node,text){if(!node)return;delete node.dataset.i18n;delete node.dataset.i18nArgs;node.textContent=text}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function esc(s){return String(s).replace(/[&<>]/g,c=>c==="&"?"&amp;":c==="<"?"&lt;":"&gt;")}
function fmt(n){return Number(n||0).toLocaleString(lang==="es"?"es-ES":"en-US")}
function compact(n){
 n=Number(n||0);
 if(n>=1e6)return (n/1e6).toFixed(1).replace(".",lang==="es"?",":".")+"M";
 if(n>=1e4)return (n/1e3).toFixed(1).replace(".",lang==="es"?",":".")+"k";
 return fmt(n);
}
function parseSize(text){
 const m=/^([\d.]+)\s*(b|kb|mb|gb|tb|pb)$/i.exec(String(text||"").trim());
 if(!m)return 0;
 const mult={b:1,kb:1024,mb:1024**2,gb:1024**3,tb:1024**4,pb:1024**5}[m[2].toLowerCase()];
 return parseFloat(m[1])*mult;
}
function formatSize(bytes){
 if(!bytes)return "—";
 const units=["B","KB","MB","GB","TB"];let i=0,v=bytes;
 while(v>=1024&&i<units.length-1){v/=1024;i++}
 return v.toFixed(v>=10||i===0?0:1).replace(".",lang==="es"?",":".")+" "+units[i];
}
function relativeTime(ts){
 const diff=Math.max(0,Date.now()-ts),min=60000,hr=3600000,day=86400000;
 if(diff<min)return t("time.now");
 if(diff<hr)return t("time.min",{n:Math.floor(diff/min)});
 if(diff<day)return t("time.hour",{n:Math.floor(diff/hr)});
 return t("time.day",{n:Math.floor(diff/day)});
}
function hl(line){
 const re=/(\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;
 let out="",last=0,match;
 while((match=re.exec(line))){
  out+=esc(line.slice(last,match.index));
  if(match[1])out+='<span class="tok-com">'+esc(match[1])+"</span>";
  else if(match[2])out+='<span class="tok-str">'+esc(match[2])+"</span>";
  else if(match[3])out+='<span class="tok-num">'+esc(match[3])+"</span>";
  else if(match[4])out+=KW.has(match[4])?'<span class="tok-kw">'+esc(match[4])+"</span>":esc(match[4]);
  last=re.lastIndex;
 }
 return out+esc(line.slice(last));
}
function field(src,names){
 for(const name of names){const v=src[name];if(typeof v==="string"&&v.trim())return v}
 return "";
}
function norm(hit){
 const src=hit.source||{};
 const path=field(src,["path","file","filepath","filename","source_path","name"]);
 const text=field(src,["text","content","code","snippet","body","excerpt"]);
 return{
  id:hit.id,index:hit.index,score:hit.score,
  path:path,name:path?path.split("/").pop():(field(src,["title"])||hit.id||"source"),
  text:text||JSON.stringify(src,null,2),lang:field(src,["language","lang"]),
  lines:field(src,["lines","line_range","range","lines_range"]),
  note:field(src,["note","description","summary","title"]),source:src
 };
}
async function api(url,payload){
 const options=payload===undefined?{}:{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)};
 const response=await fetch(url,options);
 const data=await response.json();
 if(!response.ok)throw new Error(data.error||"Request failed");
 return data;
}
function modelName(){return ($("chatModel").value||"llama3.2:1b")}

function renderStatus(){setKey($("status"),"status."+statusState)}
function renderTabs(){
 const box=$("tabs");if(!box)return;box.replaceChildren();
 if(!lastHits.length)return;
 const groups=new Map();
 lastHits.forEach(h=>groups.set(h.index||"—",(groups.get(h.index||"—")||0)+1));
 const add=(label,count,key,active)=>{
  const b=el("button","tab"+(active?" active":""));b.type="button";
  b.append(el("span","mark","≡"),el("span","",label),el("b","",String(count)));
  b.addEventListener("click",()=>{currentIndex=key;renderTabs();renderSources();renderCode(activeHit&&activeHit.index===key?activeHit:lastHits.find(h=>key==="*"||h.index===key))});
  box.append(b);
 };
 add(t("search.tabAll"),lastHits.length,"*",currentIndex==="*");
 groups.forEach((count,name)=>add(name,count,name,currentIndex===name));
}
function renderSources(){
 const box=$("sources");if(!box)return;
 const list=currentIndex==="*"?lastHits:lastHits.filter(h=>h.index===currentIndex);
 box.replaceChildren();
 setKey($("sourcesMeta"),"sources.count",{n:list.length});
 if(!list.length){box.append(el("p","empty",t("sources.empty")));return}
 list.slice(0,4).forEach((hit,i)=>{
  const card=el("button","source-card"+(activeHit===hit?" active":""));
  card.type="button";
  const head=el("div","src-head");
  head.append(el("span","file-ico","▤"),el("b","",hit.name));
  const path=el("div","src-path",hit.path||hit.index||"");
  const note=el("p","",hit.note||("· "+(hit.lang||hit.index||"source")));
  const foot=el("div","src-foot");
  if(i===0)foot.append(el("span","tag-best",t("sources.best")));
  if(hit.lines)foot.append(el("span","src-lines",hit.lines));
  foot.append(el("span","src-arrow","›"));
  card.append(head,path,note,foot);
  card.addEventListener("click",()=>{activeHit=hit;renderCode(hit);renderSources()});
  box.append(card);
 });
}
function renderCode(hit){
 activeHit=hit;
 if(!hit||!$("codeCard")){$("codeCard")&&$("codeCard").classList.add("hidden");return}
 $("codeFile").textContent=hit.name||"snippet";
 $("codePath").textContent=hit.path||"";
 const lines=String(hit.text||"").split("\n").slice(0,200);
 const nums=lines.map((_,i)=>i+1).join("\n");
 $("codeBody").innerHTML='<div class="ln">'+nums+"</div><pre>"+lines.map(hl).join("\n")+"</pre>";
 $("codeCard").classList.remove("hidden");
}
function renderRecent(){
 const list=$("recentList");if(!list)return;list.replaceChildren();
 const entries=Object.entries(stats.queries).map(([q,n])=>({q,n})).slice(-8).reverse();
 if(!entries.length){list.append(el("li","empty",t("rail.recent.empty")));return}
 entries.slice(0,6).forEach(({q})=>{
  const li=el("li");
  li.append(el("span","dot-i"),el("span","q",q),el("span","when",relativeTime(stats.times[q]||Date.now())));
  li.addEventListener("click",()=>{setView("search");$("query").value=q;runSearch()});
  list.append(li);
 });
}
function renderTop(){
 const box=$("topList");if(!box)return;box.replaceChildren();
 const items=Object.entries(stats.sources).sort((a,b)=>b[1]-a[1]).slice(0,5);
 if(!items.length){box.append(el("li","empty",t("rail.top.empty")));return}
 items.forEach(([name,uses],i)=>{
  const li=el("li");
  li.append(el("span","n",String(i+1)),el("span","name",name),el("span","uses",t("rail.top.uses",{n:uses})));
  box.append(li);
 });
}
function renderIndexStatus(){
 const total=indexData.reduce((sum,i)=>sum+i.docs,0);
 const size=indexData.reduce((sum,i)=>sum+parseSize(i.size),0);
 const health=indexData.length?(["red","yellow","green"].find(h=>indexData.some(i=>i.health===h))||"green"):"none";
 const pill=$("railIndexPill");
 if(!indexData.length){
  setKey(pill,"rail.status.offline");pill.className="pill red";
  setRaw($("ringValue"),"—");
  $("ringFg").style.strokeDashoffset=String(RING);
  ["statDocs","statIndices","statSize","statHealth"].forEach(id=>setRaw($(id),"—"));
  return;
 }
 pill.className="pill green";setRaw(pill,health==="green"?"● "+health.toUpperCase():"● "+health.toUpperCase());
 pill.classList.toggle("red",health!=="green");
 setRaw($("ringValue"),compact(total));
 $("ringFg").style.strokeDashoffset=String(RING*(1-(health==="green"?1:health==="yellow"?0.66:0.33)));
 setRaw($("statDocs"),fmt(total));
 setRaw($("statIndices"),String(indexData.length));
 setRaw($("statSize"),formatSize(size));
 setRaw($("statHealth"),health);
}
function renderIndexes(){
 const body=$("indexTable");if(!body)return;body.replaceChildren();
 if(!indexData.length){
  const row=el("tr"),cell=el("td","empty",t("indexes.empty"));cell.colSpan=4;row.append(cell);body.append(row);return;
 }
 indexData.forEach(i=>{
  const row=el("tr");
  const name=el("td");const dot=el("span","dot-health");dot.style.background=i.health==="green"?"#34d399":i.health==="yellow"?"#f59e0b":"#f87171";
  name.append(dot,document.createTextNode(i.index));
  row.append(name,el("td","",fmt(i.docs)),el("td","",i.size?formatSize(parseSize(i.size)):("—")),el("td","",i.health||"—"));
  body.append(row);
 });
}
function renderAnalytics(){
 if(!$("analyticsCount"))return;
 setRaw($("analyticsCount"),fmt(stats.searches));
 const queries=$("analyticsQueries"),sources=$("analyticsSources");
 queries.replaceChildren();sources.replaceChildren();
 const qs=Object.entries(stats.queries).sort((a,b)=>b[1]-a[1]).slice(0,5);
 const ss=Object.entries(stats.sources).sort((a,b)=>b[1]-a[1]).slice(0,5);
 if(!qs.length)queries.append(el("li","empty",t("analytics.empty")));
 qs.forEach(([name,uses],i)=>{const li=el("li");li.append(el("span","n",String(i+1)),el("span","name",name),el("span","uses",String(uses)));queries.append(li)});
 if(!ss.length)sources.append(el("li","empty",t("analytics.empty")));
 ss.forEach(([name,uses],i)=>{const li=el("li");li.append(el("span","n",String(i+1)),el("span","name",name),el("span","uses",String(uses)));sources.append(li)});
}
function renderChat(){
 const full=$("chatLog"),rail=$("railChatLog");
 if(rail){
  rail.replaceChildren();
  if(!messages.length)rail.append(el("div","bubble local",t("chat.intro")));
  messages.slice(-4).forEach(m=>rail.append(el("div","bubble "+(m.role==="user"?"user":"local"),m.text)));
 }
 if(full){
  full.replaceChildren();
  if(!messages.length)full.append(el("div","bubble local",t("chat.intro")));
  messages.forEach(m=>full.append(el("div","bubble "+(m.role==="user"?"user":"local"),m.text)));
  full.scrollTop=full.scrollHeight;
 }
 if(rail)rail.scrollTop=rail.scrollHeight;
}
function renderRailState(){
 const state=$("railChatState");if(!state)return;
 setKey(state,busy?"rail.chat.thinking":"rail.chat.ready");
}
function applyLang(code){
 if(!I18N||!I18N[code])return false;
 lang=code;
 document.documentElement.lang=code;
 document.title=t("meta.title");
 document.querySelectorAll("[data-i18n]").forEach(n=>{n.textContent=t(n.dataset.i18n,argsOf(n))});
 document.querySelectorAll("[data-i18n-ph]").forEach(n=>{n.placeholder=t(n.dataset.i18nPh)});
 document.querySelectorAll("[data-i18n-aria]").forEach(n=>{n.setAttribute("aria-label",t(n.dataset.i18nAria))});
 const other=lang==="en"?"es":"en";
 $("langBtn").textContent=lang.toUpperCase();
 $("langBtn").setAttribute("aria-label",t(other==="en"?"lang.toEnglish":"lang.toSpanish"));
 $("langBtn").title=$("langBtn").getAttribute("aria-label");
 renderStatus();renderTabs();renderSources();renderIndexStatus();renderIndexes();
 renderRecent();renderTop();renderAnalytics();renderChat();
 return true;
}
function currentLang(){
 try{const saved=localStorage.getItem(LANG_KEY);if(saved==="en"||saved==="es")return saved}catch(e){}
 return (navigator.language||"en").toLowerCase().startsWith("es")?"es":"en";
}
function setView(next){
 view=next;
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===next));
 document.querySelectorAll(".view").forEach(s=>s.classList.toggle("hidden",s.id!==next));
 if(next==="analytics")renderAnalytics();
 if(next==="indexes")renderIndexes();
 const scroller=document.querySelector(".scroll");if(scroller)scroller.scrollTop=0;
}

async function runSearch(){
 const query=$("query").value.trim();
 if(!query||busy)return;
 busy=true;
 setKey($("answerText"),"search.searching");
 $("tabs").replaceChildren();
 $("sources").replaceChildren();
 renderCode(null);
 try{
  const data=await api("/api/search",{query,index:"*"});
  lastHits=(data.hits||[]).map(norm);
  lastQuery=query;currentIndex="*";activeHit=lastHits[0]||null;
  stats.searches+=1;stats.queries[query]=(stats.queries[query]||0)+1;stats.times[query]=Date.now();saveStats();
  $("crumbQuery").textContent=query?("› "+query):"";
  renderTabs();renderSources();renderCode(activeHit);
  if(lastHits.length){
   setKey($("answerText"),"answer.prompt");
   setKey($("answerMeta"),"answer.sources",{n:lastHits.length});
   setRaw($("answerTime"),"");
  }else{
   setKey($("answerText"),"search.none");
   setKey($("answerMeta"),"sources.count",{n:0});
   setRaw($("answerTime"),"");
  }
  renderRecent();renderTop();
 }catch(e){
  lastHits=[];activeHit=null;
  setRaw($("answerText"),t("search.unavailable")+" — "+e.message);
  $("sources").replaceChildren();
  renderCode(null);
 }finally{busy=false}
}
async function explain(){
 if(!lastHits.length||busy)return;
 busy=true;setKey($("answerText"),"answer.generating");renderRailState();
 const started=performance.now();
 try{
  const result=await api("/api/chat",{prompt:lastQuery||"Explain the results",model:modelName(),evidence:lastHits.slice(0,5)});
  const seconds=((performance.now()-started)/1000).toFixed(1);
  setRaw($("answerText"),result.answer||t("answer.noAi"));
  setKey($("answerMeta"),"answer.sources",{n:Math.min(lastHits.length,5)});
  setRaw($("answerTime"),"· "+seconds+" s");
 }catch(e){
  setRaw($("answerText"),t("answer.noAi")+" — "+e.message);
 }finally{busy=false;renderRailState()}
}
async function sendChat(input){
 const prompt=input.value.trim();
 if(!prompt||busy)return;
 input.value="";
 messages.push({role:"user",text:prompt});
 renderChat();busy=true;renderRailState();
 const started=performance.now();
 try{
  const result=await api("/api/chat",{prompt,model:modelName(),evidence:lastHits.slice(0,5)});
  messages.push({role:"local",text:result.answer||t("chat.noText")});
 }catch(e){
  messages.push({role:"local",text:t("chat.noAi")+" — "+e.message});
 }finally{
  busy=false;renderChat();renderRailState();
 }
}
async function copyCode(){
 if(!activeHit)return;
 const text=activeHit.text||JSON.stringify(activeHit.source,null,2);
 try{await navigator.clipboard.writeText(text)}catch(e){
  const area=document.createElement("textarea");area.value=text;document.body.append(area);area.select();document.execCommand("copy");area.remove();
 }
 const key=activeHit.name||activeHit.path||"source";
 stats.sources[key]=(stats.sources[key]||0)+1;saveStats();
 renderTop();
 setKey($("copyBtn"),"code.copied");
 setTimeout(()=>setKey($("copyBtn"),"code.copy"),1400);
}
async function loadIndexStatus(){
 try{
  const data=await api("/api/indices");
  indexData=(data.indices||[]).map(i=>({index:i.index,health:i.health,docs:Number(i["docs.count"]||0),size:i["store.size"]||""}));
 }catch(e){indexData=[]}
 renderIndexStatus();renderIndexes();
}
async function loadModels(){
 try{
  const data=await api("/api/models");
  const select=$("chatModel");select.replaceChildren();
  (data.models&&data.models.length?data.models:["llama3.2:1b","qwen2.5-coder:7b"]).forEach(name=>{
   const option=el("option","",name);option.value=name;select.append(option);
  });
 }catch(e){}
}
function renderHardware(hardware,models){
 if(hardware){
  const value=(v,missing)=>v===undefined||v===null||v===""?missing:v;
  setRaw($("hardwareInfo"),[
   t("hardware.os")+value(hardware.os,t("hardware.unknown")),
   t("hardware.cpu")+value(hardware.cpu_cores,t("hardware.unknown")),
   t("hardware.ram")+(hardware.ram_gb==null?t("hardware.unknown"):hardware.ram_gb+" GB"),
   t("hardware.gpu")+value(hardware.gpu,t("hardware.notDetected")),
   t("hardware.suggested")+hardware.suggested_model,
   t("hardware.note")
  ].join("\n"));
 }
 if(models)setRaw($("models"),models.length?models.join(", "):t("hardware.modelsNone"));
}

document.querySelectorAll(".nav-item").forEach(button=>button.addEventListener("click",()=>setView(button.dataset.view)));
$("configureBtn").addEventListener("click",()=>setView("hardware"));
$("railToggle").addEventListener("click",()=>{
 const app=document.querySelector(".app");
 app.classList.toggle("rail-open");
 try{localStorage.setItem(RAIL_KEY,app.classList.contains("rail-open")?"1":"0")}catch(e){}
});
$("langBtn").addEventListener("click",()=>{
 const next=lang==="en"?"es":"en";
 if(!applyLang(next))return;
 try{localStorage.setItem(LANG_KEY,next)}catch(e){}
});
$("searchBtn").addEventListener("click",runSearch);
$("query").addEventListener("keydown",e=>{if(e.key==="Enter")runSearch()});
$("explainBtn").addEventListener("click",explain);
$("copyBtn").addEventListener("click",copyCode);
$("seeAllBtn").addEventListener("click",()=>setView("analytics"));
$("detectBtn").addEventListener("click",async()=>{
 try{
  const [hardware,models]=await Promise.all([api("/api/hardware"),api("/api/models")]);
  renderHardware(hardware,models.models);
  $("pullModel").value=hardware.suggested_model;
  if(models.models&&models.models.length){
   const select=$("chatModel");select.replaceChildren();
   models.models.forEach(name=>{const option=el("option","",name);option.value=name;select.append(option)});
  }
 }catch(e){setRaw($("hardwareInfo"),e.message)}
});
$("pullBtn").addEventListener("click",async()=>{
 const model=$("pullModel").value;
 if(!confirm(t("hardware.pullConfirm",{model})))return;
 try{await api("/api/model/pull",{model});setRaw($("models"),t("hardware.pullStarted"))}
 catch(e){setRaw($("models"),e.message)}
});
$("chatSend").addEventListener("click",()=>sendChat($("chatPrompt")));
$("chatPrompt").addEventListener("keydown",e=>{if(e.key==="Enter")sendChat($("chatPrompt"))});
$("railSend").addEventListener("click",()=>sendChat($("railPrompt")));
$("railPrompt").addEventListener("keydown",e=>{if(e.key==="Enter")sendChat($("railPrompt"))});

fetch("/i18n.json",{cache:"no-store"}).then(r=>r.json()).then(data=>{
 I18N=data;
 applyLang(currentLang());
 try{if(localStorage.getItem(RAIL_KEY)==="1")document.querySelector(".app").classList.add("rail-open")}catch(e){}
 renderChat();
 loadModels();
 loadIndexStatus();
 api("/api/status").then(s=>{statusState=s.online?"online":"offline";renderStatus()}).catch(()=>{statusState="backend";renderStatus()});
}).catch(()=>{
 api("/api/status").then(s=>{statusState=s.online?"online":"offline";renderStatus()}).catch(()=>{statusState="backend";renderStatus()});
});
