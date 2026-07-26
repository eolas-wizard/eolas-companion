(() => {
  "use strict";
  const KEY = "eolas-companion-alpha-05";
  const legacyKeys = ["eolas-companion-alpha-04","eolas-companion-alpha-03","eolas-companion-alpha-02"];
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
  const defaults = {checked:{},palProgress:{},notebookEntries:[],alphaNotebookEnabled:false,lastArea:"Windswept Hills",theme:"north-star",largeText:false,reducedMotion:false,highContrast:false};
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch {}
  if (!saved) for (const k of legacyKeys) { try { const x = JSON.parse(localStorage.getItem(k)||"null"); if(x){ saved=x; break; } } catch {} }
  let state = {...defaults,...(saved||{}),checked:{...defaults.checked,...(saved?.checked||{})},palProgress:{...defaults.palProgress,...(saved?.palProgress||{})},notebookEntries:Array.isArray(saved?.notebookEntries)?saved.notebookEntries:[]};
  let installPrompt = null;
  const els = Object.fromEntries(["areaSelect","mapAreaSelect","markerFilter","palSearch","palList","markerList","areaProgressLabel","areaPercent","areaProgressFill","homeStats","areaCards","progressStats","progressAreas","journeyArea","journeyPercent","journeyFill","nextGoals","themeGrid","toast","installButton","palsTitle","palSheet","palSheetContent"].map(id=>[id,$("#"+id)]));
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
    ["largeText","reducedMotion","highContrast","alphaNotebookEnabled"].forEach(k=>{const el=$("#"+k);if(el)el.checked=!!state[k];});
    const notebookPanel=$("#alphaNotebookPanel"); if(notebookPanel) notebookPanel.classList.toggle("hidden",!state.alphaNotebookEnabled);
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

  function palProgressId(area,name,key){ return [area,name,key].join("|"); }
  function hasProgress(area,name,key){ return !!state.palProgress[palProgressId(area,name,key)]; }
  function profileFor(name){
    return data.palProfiles?.[name] || {no:"—",elements:["Unknown"],summary:"A full field guide entry is still being researched for this Pal.",difficulty:"Unknown",obtain:[{type:"Wild / World",detail:"Known to appear in this region. Exact acquisition details are coming in a future data pack."}],work:[],partner:{name:"Profile in progress",detail:"Partner Skill details are still being verified."},drops:[],why:["Capture it to complete the regional Pal collection"],notes:"This Alpha build includes fully researched profiles for selected starter Pals first.",progress:["seen","captured","bred","lucky"]};
  }
  function palCard(area,name){
    const p=profileFor(name), caught=isChecked(itemId("pal",area,name));
    const methods=p.obtain.slice(0,3).map(o=>`<span class="method-chip">${esc(o.type)}</span>`).join("");
    return `<article class="pal-card ${caught?"caught":""}">
      <button type="button" class="pal-open" data-pal="${esc(name)}" aria-label="Open ${esc(name)} details">
        <span class="pal-avatar">${esc(name.slice(0,1))}</span>
        <span class="pal-card-copy"><span class="pal-kicker">No. ${esc(p.no)} · ${esc(p.elements.join(" / "))}</span><strong>${esc(name)}</strong><small>${esc(p.summary)}</small><span class="method-row">${methods}</span></span>
        <span class="pal-chevron">›</span>
      </button>
      <label class="quick-catch"><input type="checkbox" data-id="${esc(itemId("pal",area,name))}" ${caught?"checked":""}><span class="mini-check">✓</span><span>${caught?"Captured":"Mark captured"}</span></label>
    </article>`;
  }
  function renderPals(){
    const area=els.areaSelect.value||state.lastArea; state.lastArea=area; els.mapAreaSelect.value=area; save();
    const q=els.palSearch.value.trim().toLowerCase(); const list=pals(area).filter(n=>{const p=profileFor(n);return [n,p.summary,...p.elements,...p.obtain.map(x=>x.type),...p.work].join(" ").toLowerCase().includes(q)});
    els.palsTitle.textContent=area;
    els.palList.innerHTML=list.length?list.map(n=>palCard(area,n)).join(""):`<div class="empty-state"><h3>No matches</h3><p>Try a Pal name, element, work type, or acquisition method such as fishing.</p></div>`;
    bindChecks(els.palList); $$('[data-pal]',els.palList).forEach(b=>b.addEventListener('click',()=>openPalSheet(area,b.dataset.pal)));
    const s=stats(area); els.areaProgressLabel.textContent=`${s.pd} of ${s.ps.length} Pals caught`; els.areaPercent.textContent=`${s.percent}%`; els.areaProgressFill.style.width=s.percent+"%";
  }
  const progressLabels={seen:"Seen",captured:"Captured",fished:"Caught by fishing",alphaDefeated:"Alpha defeated",dungeonAlpha:"Dungeon / realm Alpha",bred:"Bred",lucky:"Lucky found"};
  function openPalSheet(area,name){
    const p=profileFor(name), caught=isChecked(itemId("pal",area,name));
    const progress=[...new Set(p.progress||["seen","captured","bred","lucky"])];
    els.palSheetContent.innerHTML=`
      <header class="pal-hero"><div class="pal-avatar large">${esc(name.slice(0,1))}</div><div><p class="pal-kicker">PALPEDIA NO. ${esc(p.no)}</p><h2 id="palSheetTitle">${esc(name)}</h2><div class="element-row">${p.elements.map(x=>`<span>${esc(x)}</span>`).join("")}<span class="difficulty ${p.difficulty.toLowerCase()}">${esc(p.difficulty)}</span></div></div></header>
      <p class="pal-summary">${esc(p.summary)}</p>
      <section class="detail-section"><div class="detail-heading"><h3>How to obtain</h3><span>${p.obtain.length} methods</span></div><div class="obtain-list">${p.obtain.map(o=>`<article><span class="obtain-icon">${o.type.includes("Fishing")?"🎣":o.type.includes("Boss")?"♛":o.type.includes("Dungeon")?"◇":o.type.includes("Egg")?"🥚":o.type.includes("Breeding")?"⌁":"⌖"}</span><div><strong>${esc(o.type)}</strong><p>${esc(o.detail)}</p></div></article>`).join("")}</div></section>
      <section class="insight-card"><p class="section-label">WHY CAPTURE THIS PAL?</p><ul>${p.why.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section>
      <section class="detail-section"><h3>Work suitability</h3><div class="skill-grid">${p.work.length?p.work.map(x=>`<span>${esc(x)}</span>`).join(""):'<span>None documented yet</span>'}</div></section>
      <section class="detail-section"><h3>${esc(p.partner.name)}</h3><p>${esc(p.partner.detail)}</p></section>
      <section class="detail-section"><h3>Drops</h3><div class="drop-row">${p.drops.length?p.drops.map(x=>`<span>${esc(x)}</span>`).join(""):'<span>Research in progress</span>'}</div></section>
      <section class="companion-note"><span>✦</span><div><p class="section-label">COMPANION NOTE</p><p>${esc(p.notes)}</p></div></section>
      <section class="detail-section"><h3>Your progress</h3><div class="progress-toggle-grid">${progress.map(k=>{const checked=k==='captured'?caught:hasProgress(area,name,k);return `<label><input type="checkbox" data-pal-progress="${esc(k)}" ${checked?'checked':''}><span class="mini-check">✓</span><span>${esc(progressLabels[k]||k)}</span></label>`}).join("")}</div></section>`;
    $$('[data-pal-progress]',els.palSheetContent).forEach(x=>x.addEventListener('change',()=>{const k=x.dataset.palProgress;if(k==='captured')state.checked[itemId('pal',area,name)]=x.checked;else state.palProgress[palProgressId(area,name,k)]=x.checked;save();renderAll();}));
    els.palSheet.classList.remove('hidden'); document.body.classList.add('sheet-open');
  }
  function closePalSheet(){els.palSheet.classList.add('hidden');document.body.classList.remove('sheet-open');}

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

  function renderNotebook(){const root=$("#notebookEntries");if(!root)return;const entries=state.notebookEntries||[];root.innerHTML=entries.length?entries.map((n,i)=>`<article class="notebook-entry"><div class="notebook-entry-head"><div><strong>${esc(n.session||"Playtest observation")}</strong><small>${esc(new Date(n.createdAt).toLocaleString())}</small><span class="notebook-type">${esc(n.type)}</span></div><button class="notebook-delete" data-note-delete="${i}" aria-label="Delete observation">×</button></div><p><span>What happened</span>${esc(n.text)}</p>${n.help?`<p><span>What would have helped</span>${esc(n.help)}</p>`:""}</article>`).join(""):`<div class="notebook-empty">No observations yet. Add one during or immediately after a play session.</div>`;$$(`[data-note-delete]`,root).forEach(b=>b.addEventListener("click",()=>{state.notebookEntries.splice(Number(b.dataset.noteDelete),1);save();renderNotebook();toast("Observation deleted");}));}
  function renderJourney(){const t=totals();els.progressStats.innerHTML=statCard(t.percent+"%","Overall")+statCard(`${t.palDone}/${t.palTotal}`,"Pals");els.progressAreas.innerHTML=readyAreas().map(({name})=>{const s=stats(name);return`<div class="progress-area"><div><strong>${esc(name)}</strong><span>${s.done}/${s.total}</span></div><div class="progress-track"><div style="width:${s.percent}%"></div></div></div>`;}).join("");renderNotebook();}
  function renderAll(){renderPals();renderMarkers();renderHome();renderJourney();}
  function switchView(view){$$('.view').forEach(x=>x.classList.toggle('active',x.id===view));$$('.bottom-nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===view));window.scrollTo({top:0,behavior:state.reducedMotion?'auto':'smooth'});if(view==='homeView')renderHome();if(view==='adventureView')renderPals();if(view==='mapView')renderMarkers();if(view==='journeyView')renderJourney();}

  $$('.bottom-nav button').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));
  els.areaSelect.addEventListener('change',renderPals); els.mapAreaSelect.addEventListener('change',renderMarkers); els.markerFilter.addEventListener('change',renderMarkers); els.palSearch.addEventListener('input',renderPals);
  ["largeText","reducedMotion","highContrast","alphaNotebookEnabled"].forEach(k=>$("#"+k).addEventListener("change",e=>{state[k]=e.target.checked;save();applyPrefs();renderJourney();if(k==="alphaNotebookEnabled")toast(e.target.checked?"Alpha Notebook enabled":"Alpha Notebook hidden");}));
  $("#exportButton").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({version:"alpha-0.5",exportedAt:new Date().toISOString(),state},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="eolas-companion-backup.json";a.click();URL.revokeObjectURL(a.href);});
  $("#importInput").addEventListener("change",async e=>{try{const p=JSON.parse(await e.target.files[0].text());state={...defaults,...p.state,checked:{...(p.state?.checked||{})},palProgress:{...(p.state?.palProgress||{})},notebookEntries:Array.isArray(p.state?.notebookEntries)?p.state.notebookEntries:[]};save();applyPrefs();setupControls();renderAll();toast("Backup imported");}catch{alert("That backup could not be imported.");}});
  $("#resetButton").addEventListener("click",()=>{if(confirm("Reset all Eolas progress on this device?")){state={...defaults,checked:{},palProgress:{},notebookEntries:[]};save();applyPrefs();setupControls();renderAll();toast("Progress reset");}});

  $("#notebookForm").addEventListener("submit",e=>{e.preventDefault();const text=$("#noteText").value.trim();if(!text){toast("Describe what happened first");return;}state.notebookEntries.unshift({createdAt:new Date().toISOString(),session:$("#noteSession").value.trim(),type:$("#noteType").value,text,help:$("#noteHelp").value.trim()});save();e.target.reset();renderNotebook();toast("Observation saved");});
  $("#exportNotebook").addEventListener("click",()=>{const lines=["# Eolas Alpha Notebook","",`Exported: ${new Date().toLocaleString()}`,""];(state.notebookEntries||[]).forEach((n,i)=>{lines.push(`## ${i+1}. ${n.session||"Playtest observation"}`,`- Date: ${new Date(n.createdAt).toLocaleString()}`,`- Flag: ${n.type}`,"",`**What happened**`,"",n.text,"",`**What would have helped**`,"",n.help||"—","");});const blob=new Blob([lines.join("\n")],{type:"text/markdown"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="eolas-alpha-notebook.md";a.click();URL.revokeObjectURL(a.href);});
  function toast(message){els.toast.textContent=message;els.toast.classList.remove("hidden");setTimeout(()=>els.toast.classList.add("hidden"),1800);}
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;els.installButton.classList.remove("hidden");});
  els.installButton.addEventListener("click",async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;els.installButton.classList.add("hidden");}});
  if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js?v=05"));
  $("#closePalSheet").addEventListener("click",closePalSheet); $("#sheetBackdrop").addEventListener("click",closePalSheet); document.addEventListener("keydown",e=>{if(e.key==="Escape")closePalSheet();});
  applyPrefs(); setupControls(); renderAll();
})();
