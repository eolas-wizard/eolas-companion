(() => {
  "use strict";
  const KEY = "eolas-companion-alpha-03";
  const legacyKeys = ["eolas-companion-alpha-02"];
  const data = window.PALWORLD_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const themes = [
    {id:"north-star",name:"North Star",note:"Eolas default",a:"#6868e8",b:"#8d6bf0"},
    {id:"grove",name:"Grove",note:"Soft green",a:"#428b62",b:"#72ad68"},
    {id:"frost",name:"Frost",note:"Cool blue",a:"#3488b6",b:"#62b1cd"},
    {id:"ember",name:"Ember",note:"Warm orange",a:"#d65b3d",b:"#e58b47"},
    {id:"blossom",name:"Blossom",note:"Soft pink",a:"#bb5792",b:"#d783af"},
    {id:"night",name:"Night Sky",note:"Deep dark",a:"#34355f",b:"#8c86ff"}
  ];
  const defaults = {checked:{},lastArea:"Windswept Hills",theme:"north-star",largeText:false,reducedMotion:false,highContrast:false};
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch {}
  if (!saved) for (const k of legacyKeys) { try { const x = JSON.parse(localStorage.getItem(k)||"null"); if(x){ saved=x; break; } } catch {} }
  let state = {...defaults,...(saved||{}),checked:{...defaults.checked,...(saved?.checked||{})}};
  let installPrompt = null;
  const els = Object.fromEntries(["areaSelect","mapAreaSelect","markerFilter","palSearch","palList","markerList","areaProgressLabel","areaPercent","areaProgressFill","homeStats","areaCards","progressStats","progressAreas","journeyArea","journeyPercent","journeyFill","nextGoals","themeGrid","toast","installButton","palsTitle"].map(id=>[id,$("#"+id)]));
  const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const itemId = (kind,area,name,type="") => [kind,area,name,type].join("|");
  const save = () => localStorage.setItem(KEY,JSON.stringify(state));
  const isChecked = id => !!state.checked[id];
  const readyAreas = () => data.areas.filter(a=>a.status==="ready");

  function applyPrefs(){
    document.documentElement.dataset.theme=state.theme;
    document.documentElement.classList.toggle("large-text",state.largeText);
    document.documentElement.classList.toggle("reduced-motion",state.reducedMotion);
    document.documentElement.classList.toggle("high-contrast",state.highContrast);
    ["largeText","reducedMotion","highContrast"].forEach(k=>$("#"+k).checked=state[k]);
    const meta=$("#themeColorMeta"); if(meta) meta.content=getComputedStyle(document.documentElement).getPropertyValue("--bg").trim()||"#101827";
  }

  function setupControls(){
    const options=data.areas.map(a=>`<option value="${esc(a.name)}" ${a.status!=="ready"?"disabled":""}>${esc(a.name)}${a.status!=="ready"?" — coming soon":""}</option>`).join("");
    els.areaSelect.innerHTML=options; els.mapAreaSelect.innerHTML=options;
    if(!readyAreas().some(a=>a.name===state.lastArea)) state.lastArea=readyAreas()[0].name;
    els.areaSelect.value=state.lastArea; els.mapAreaSelect.value=state.lastArea;
    els.markerFilter.innerHTML=data.markerTypes.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");
    renderThemes();
  }

  function renderThemes(){
    els.themeGrid.innerHTML=themes.map(t=>`<button type="button" class="theme-card ${state.theme===t.id?"selected":""}" data-theme="${t.id}" style="--sample-a:${t.a};--sample-b:${t.b}"><i></i><span><strong>${t.name}</strong><small>${t.note}</small></span></button>`).join("");
    $$('[data-theme]',els.themeGrid).forEach(b=>b.addEventListener("click",()=>{state.theme=b.dataset.theme;save();applyPrefs();renderThemes();toast(`${b.querySelector("strong").textContent} theme applied`);}));
  }

  const pals = area => data.areaPals[area] || [];
  const markers = area => data.markers[area] || [];
  function stats(area){
    const ps=pals(area),ms=markers(area),pd=ps.filter(n=>isChecked(itemId("pal",area,n))).length,md=ms.filter(m=>isChecked(itemId("marker",area,m.name,m.type))).length;
    const total=ps.length+ms.length,done=pd+md;
    return {ps,ms,pd,md,total,done,percent:total?Math.round(done/total*100):0};
  }

  function checklistRow(item){
    const done=isChecked(item.id);
    return `<label class="check-row ${done?"done":""}"><input type="checkbox" data-id="${esc(item.id)}" ${done?"checked":""}><span class="custom-check">✓</span><span class="row-copy"><strong>${esc(item.name)}</strong>${item.note?`<small>${esc(item.note)}</small>`:""}</span><span class="tag">${esc(item.tag)}</span></label>`;
  }
  function bindChecks(root){$$('input[data-id]',root).forEach(x=>x.addEventListener("change",()=>{state.checked[x.dataset.id]=x.checked;save();renderAll();}));}

  function renderPals(){
    const area=els.areaSelect.value||state.lastArea; state.lastArea=area; els.mapAreaSelect.value=area; save();
    const q=els.palSearch.value.trim().toLowerCase(); const list=pals(area).filter(n=>n.toLowerCase().includes(q));
    els.palsTitle.textContent=area;
    els.palList.innerHTML=list.length?list.map(n=>checklistRow({id:itemId("pal",area,n),name:n,tag:"Pal"})).join(""):`<div class="empty-state"><h3>No matches</h3><p>Try a different Pal name.</p></div>`;
    bindChecks(els.palList); const s=stats(area);
    els.areaProgressLabel.textContent=`${s.pd} of ${s.ps.length} Pals caught`; els.areaPercent.textContent=`${s.percent}%`; els.areaProgressFill.style.width=s.percent+"%";
  }

  function renderMarkers(){
    const area=els.mapAreaSelect.value||state.lastArea,filter=els.markerFilter.value||"All"; state.lastArea=area; els.areaSelect.value=area; save();
    const list=markers(area).filter(m=>filter==="All"||m.type===filter);
    els.markerList.innerHTML=list.length?list.map(m=>checklistRow({id:itemId("marker",area,m.name,m.type),name:m.name,note:m.note,tag:m.type})).join(""):`<div class="empty-state"><h3>No discoveries in this filter</h3><p>Choose another type.</p></div>`;
    bindChecks(els.markerList);
  }

  function totals(){let total=0,done=0,palTotal=0,palDone=0;readyAreas().forEach(({name})=>{const s=stats(name);total+=s.total;done+=s.done;palTotal+=s.ps.length;palDone+=s.pd;});return{total,done,palTotal,palDone,percent:total?Math.round(done/total*100):0};}
  const statCard=(v,l)=>`<article class="stat-card"><strong>${esc(v)}</strong><span>${esc(l)}</span></article>`;

  function renderHome(){
    const area=state.lastArea,s=stats(area); els.journeyArea.textContent=area; els.journeyPercent.textContent=s.percent+"%"; els.journeyFill.style.width=s.percent+"%";
    const missingPals=s.ps.filter(n=>!isChecked(itemId("pal",area,n))), missingMarkers=s.ms.filter(m=>!isChecked(itemId("marker",area,m.name,m.type)));
    const goals=[...missingPals.slice(0,2).map(n=>`<div class="goal"><span>✦</span><div><strong>Catch ${esc(n)}</strong><small>Add it to your regional collection.</small></div></div>`),...missingMarkers.slice(0,1).map(m=>`<div class="goal"><span>⌖</span><div><strong>${esc(m.name)}</strong><small>${esc(m.type)} · ${esc(m.note)}</small></div></div>`)];
    els.nextGoals.innerHTML=goals.join("")||`<div class="goal"><span>✓</span><div><strong>Region complete</strong><small>Choose your next adventure.</small></div></div>`;
    const t=totals(); els.homeStats.innerHTML=statCard(`${t.palDone}/${t.palTotal}`,"Pals caught")+statCard(`${s.done}/${s.total}`,`${area} complete`);
    els.areaCards.innerHTML=data.areas.map(a=>{if(a.status==="ready"){const x=stats(a.name);return`<button class="region-card" data-area="${esc(a.name)}"><span class="region-icon">✦</span><span><strong>${esc(a.name)}</strong><small>${x.pd}/${x.ps.length} Pals · ${x.md}/${x.ms.length} discoveries</small></span><span class="chevron">›</span></button>`;}return`<div class="region-card disabled"><span class="region-icon">◇</span><span><strong>${esc(a.name)}</strong><small>${esc(a.subtitle)}</small></span><span class="chevron">·</span></div>`;}).join("");
    $$('[data-area]',els.areaCards).forEach(b=>b.addEventListener("click",()=>{state.lastArea=b.dataset.area;els.areaSelect.value=state.lastArea;els.mapAreaSelect.value=state.lastArea;switchView("adventureView");}));
  }

  function renderJourney(){const t=totals();els.progressStats.innerHTML=statCard(t.percent+"%","Overall")+statCard(`${t.palDone}/${t.palTotal}`,"Pals");els.progressAreas.innerHTML=readyAreas().map(({name})=>{const s=stats(name);return`<div class="progress-area"><div><strong>${esc(name)}</strong><span>${s.done}/${s.total}</span></div><div class="progress-track"><div style="width:${s.percent}%"></div></div></div>`;}).join("");}
  function renderAll(){renderPals();renderMarkers();renderHome();renderJourney();}
  function switchView(view){$$('.view').forEach(x=>x.classList.toggle('active',x.id===view));$$('.bottom-nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===view));window.scrollTo({top:0,behavior:state.reducedMotion?'auto':'smooth'});if(view==='homeView')renderHome();if(view==='adventureView')renderPals();if(view==='mapView')renderMarkers();if(view==='journeyView')renderJourney();}

  $$('.bottom-nav button').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));
  els.areaSelect.addEventListener('change',renderPals); els.mapAreaSelect.addEventListener('change',renderMarkers); els.markerFilter.addEventListener('change',renderMarkers); els.palSearch.addEventListener('input',renderPals);
  ["largeText","reducedMotion","highContrast"].forEach(k=>$("#"+k).addEventListener("change",e=>{state[k]=e.target.checked;save();applyPrefs();}));
  $("#exportButton").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({version:"alpha-0.3",exportedAt:new Date().toISOString(),state},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="eolas-companion-backup.json";a.click();URL.revokeObjectURL(a.href);});
  $("#importInput").addEventListener("change",async e=>{try{const p=JSON.parse(await e.target.files[0].text());state={...defaults,...p.state,checked:{...(p.state?.checked||{})}};save();applyPrefs();setupControls();renderAll();toast("Backup imported");}catch{alert("That backup could not be imported.");}});
  $("#resetButton").addEventListener("click",()=>{if(confirm("Reset all Eolas progress on this device?")){state={...defaults,checked:{}};save();applyPrefs();setupControls();renderAll();toast("Progress reset");}});
  function toast(message){els.toast.textContent=message;els.toast.classList.remove("hidden");setTimeout(()=>els.toast.classList.add("hidden"),1800);}
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;els.installButton.classList.remove("hidden");});
  els.installButton.addEventListener("click",async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;els.installButton.classList.add("hidden");}});
  if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js?v=03"));
  applyPrefs(); setupControls(); renderAll();
})();
