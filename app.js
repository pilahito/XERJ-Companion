"use strict";
const $=id=>document.getElementById(id);
const LANG_KEY="xerj.lang";
let I18N=null,lang="en",activeView="search",statusState="checking",recent=[],lastHardware=null,lastModels=null;

function argsOf(node){
 try{return node.dataset.i18nArgs?JSON.parse(node.dataset.i18nArgs):{}}catch(e){return{}}
}
function t(key,args){
 const dict=(I18N&&I18N[lang])||{},fallback=(I18N&&I18N.en)||{};
 let s=dict[key]!==undefined?dict[key]:fallback[key];
 if(s===undefined)return key;
 return String(s).replace(/\{(\w+)\}/g,(m,name)=>args&&args[name]!==undefined?String(args[name]):m);
}
function setKey(node,key,args){
 node.dataset.i18n=key;
 if(args)node.dataset.i18nArgs=JSON.stringify(args);else delete node.dataset.i18nArgs;
 if(I18N)node.textContent=t(key,args);
}
function applyLang(code){
 if(!I18N||!I18N[code])return false;
 lang=code;
 document.documentElement.lang=code;
 document.title=t("meta.title");
 document.querySelectorAll("[data-i18n]").forEach(node=>{node.textContent=t(node.dataset.i18n,argsOf(node))});
 document.querySelectorAll("[data-i18n-ph]").forEach(node=>{node.placeholder=t(node.dataset.i18nPh)});
 const other=lang==="en"?"es":"en";
 $("langBtn").textContent=other.toUpperCase();
 $("langBtn").setAttribute("aria-label",t(other==="en"?"lang.toEnglish":"lang.toSpanish"));
 $("langBtn").title=$("langBtn").getAttribute("aria-label");
 renderHardware();
 return true;
}
function currentLang(){
 try{const stored=localStorage.getItem(LANG_KEY);if(stored==="en"||stored==="es")return stored}catch(e){}
 return (navigator.language||"en").toLowerCase().startsWith("es")?"es":"en";
}
function refreshStatus(){
 setKey($("status"),"status."+statusState);
}
function showView(view){
 activeView=view;
 document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 document.querySelectorAll(".view").forEach(v=>v.classList.toggle("hidden",v.id!==view));
 setKey($("heading"),"view."+view+".title");
}
function emptyBox(key){
 const box=document.createElement("div");
 box.className="empty";
 const p=document.createElement("p");
 setKey(p,key);
 box.append("\u2315",p);
 $("results").append(box);
}
function rawBox(text){
 const box=document.createElement("div");
 box.className="empty";
 box.textContent=text;
 $("results").append(box);
}
function renderHardware(){
 if(lastHardware){
  const value=(v,missing)=>v===null||v===undefined||v===""?missing:v;
  $("hardwareInfo").textContent=[
   t("hardware.os")+value(lastHardware.os,t("hardware.unknown")),
   t("hardware.cpu")+value(lastHardware.cpu_cores,t("hardware.unknown")),
   t("hardware.ram")+(lastHardware.ram_gb==null?t("hardware.unknown"):lastHardware.ram_gb+" GB"),
   t("hardware.gpu")+value(lastHardware.gpu,t("hardware.notDetected")),
   t("hardware.suggested")+lastHardware.suggested_model,
   t("hardware.note")
  ].join("\n");
 }
 if(lastModels){
  $("models").textContent=lastModels.length?lastModels.join(", "):t("hardware.modelsNone");
 }
}
async function api(url,payload){
 const options=payload===undefined?{}:{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)};
 const response=await fetch(url,options);
 const data=await response.json();
 if(!response.ok)throw new Error(data.error||"Request failed");
 return data;
}

document.querySelectorAll(".nav").forEach(button=>button.addEventListener("click",()=>showView(button.dataset.view)));

$("langBtn").addEventListener("click",()=>{
 const next=lang==="en"?"es":"en";
 if(!applyLang(next))return;
 try{localStorage.setItem(LANG_KEY,next)}catch(e){}
});

$("searchBtn").addEventListener("click",async()=>{
 const query=$("query").value.trim();if(!query)return;
 setKey($("resultCount"),"search.searching");
 $("results").replaceChildren();
 try{
  const data=await api("/api/search",{query,index:$("index").value.trim()||"*"});
  recent=data.hits||[];
  setKey($("resultCount"),"search.matches",{n:recent.length});
  if(!recent.length)emptyBox("search.none");
  recent.forEach(h=>{
   const card=document.createElement("article");
   card.className="hit";
   const head=document.createElement("header");
   const index=document.createElement("b");
   index.textContent=h.index||"Index";
   const id=document.createElement("span");
   id.textContent=" · "+(h.id||"source");
   head.append(index,id);
   const body=document.createElement("pre");
   body.textContent=JSON.stringify(h.source||{},null,2);
   card.append(head,body);
   $("results").append(card);
  });
 }catch(e){
  setKey($("resultCount"),"search.unavailable");
  rawBox(e.message);
 }
});
$("query").addEventListener("keydown",e=>{if(e.key==="Enter")$("searchBtn").click()});

$("chatBtn").addEventListener("click",async()=>{
 const prompt=$("prompt").value.trim();if(!prompt)return;
 setKey($("answer"),"chat.generating");
 try{
  const r=await api("/api/chat",{prompt,model:$("chatModel").value,evidence:recent.map(h=>({index:h.index,id:h.id,source:h.source}))});
  $("answer").textContent=r.answer||t("chat.noText");
 }catch(e){$("answer").textContent=e.message}
});

$("detectBtn").addEventListener("click",async()=>{
 try{
  const [hardware,models]=await Promise.all([api("/api/hardware"),api("/api/models")]);
  lastHardware=hardware;
  lastModels=models.models;
  renderHardware();
  $("hardwareInfo").style.whiteSpace="pre-line";
  $("pullModel").value=hardware.suggested_model;
 }catch(e){$("hardwareInfo").textContent=e.message}
});

$("pullBtn").addEventListener("click",async()=>{
 const model=$("pullModel").value;
 if(!confirm(t("hardware.pullConfirm",{model})))return;
 try{
  await api("/api/model/pull",{model});
  $("models").textContent=t("hardware.pullStarted");
 }catch(e){$("models").textContent=e.message}
});

fetch("/i18n.json",{cache:"no-store"}).then(r=>r.json()).then(data=>{
 I18N=data;
 applyLang(currentLang());
}).catch(()=>{});
api("/api/status").then(s=>{
 statusState=s.online?"online":"offline";
 refreshStatus();
}).catch(()=>{
 statusState="backend";
 refreshStatus();
});
