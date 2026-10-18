"use strict";
const $=id=>document.getElementById(id);
let recent=[];
function msg(node,text){node.textContent=text}
async function api(url,payload){
 const options=payload===undefined?{}:{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)};
 const response=await fetch(url,options);
 const data=await response.json();
 if(!response.ok)throw new Error(data.error||"Request failed");
 return data;
}
document.querySelectorAll(".nav").forEach(button=>button.addEventListener("click",()=>{
 document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b===button));
 document.querySelectorAll(".view").forEach(v=>v.classList.toggle("hidden",v.id!==button.dataset.view));
 const titles={search:"Search your codebase",chat:"Local AI chat",hardware:"Hardware & AI",about:"About XERJ Companion"};
 msg($("heading"),titles[button.dataset.view]);
}));
function element(tag,cl,text){const n=document.createElement(tag);if(cl)n.className=cl;if(text!==undefined)n.textContent=text;return n}
$("searchBtn").addEventListener("click",async()=>{
 const query=$("query").value.trim();if(!query)return;
 msg($("resultCount"),"Searching...");
 $("results").replaceChildren();
 try{
  const data=await api("/api/search",{query,index:$("index").value.trim()||"*"});
  recent=data.hits||[];
  msg($("resultCount"),recent.length+" matches");
  if(!recent.length)$("results").append(element("div","empty","No matches. Check the index name and searchable fields."));
  recent.forEach(h=>{
   const card=element("article","hit");
   const head=element("header");head.append(element("b","",h.index||"Index"),element("span",""," · "+(h.id||"source")));
   card.append(head,element("pre","",JSON.stringify(h.source||{},null,2)));
   $("results").append(card);
  });
 }catch(e){msg($("resultCount"),"Search unavailable");$("results").append(element("div","empty",e.message))}
});
$("query").addEventListener("keydown",e=>{if(e.key==="Enter")$("searchBtn").click()});
$("chatBtn").addEventListener("click",async()=>{
 const prompt=$("prompt").value.trim();if(!prompt)return;
 msg($("answer"),"Generating locally...");
 try{const r=await api("/api/chat",{prompt,model:$("chatModel").value,evidence:recent.map(h=>({index:h.index,id:h.id,source:h.source}))});msg($("answer"),r.answer||"No text returned")}
 catch(e){msg($("answer"),e.message)}
});
$("detectBtn").addEventListener("click",async()=>{
 try{
  const [hardware,models]=await Promise.all([api("/api/hardware"),api("/api/models")]);
  msg($("hardwareInfo"),"OS: "+hardware.os+"\nCPU cores: "+hardware.cpu_cores+"\nRAM: "+(hardware.ram_gb??"unknown")+" GB\nGPU: "+(hardware.gpu||"not detected")+"\nSuggested: "+hardware.suggested_model+"\n"+hardware.note);
  $("hardwareInfo").style.whiteSpace="pre-line";
  msg($("models"),models.models.length?models.models.join(", "):models.message||"No models installed");
  $("pullModel").value=hardware.suggested_model;
 }catch(e){msg($("hardwareInfo"),e.message)}
});
$("pullBtn").addEventListener("click",async()=>{
 const model=$("pullModel").value;
 if(!confirm("Download "+model+" using Ollama? This requires Internet access and disk space."))return;
 try{const r=await api("/api/model/pull",{model});msg($("models"),r.message)}
 catch(e){msg($("models"),e.message)}
});
api("/api/status").then(s=>msg($("status"),s.online?"● XERJ online":"○ XERJ offline")).catch(()=>msg($("status"),"○ Backend offline"));