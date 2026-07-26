(() => {
  "use strict";
  const KEY = "eolas-companion-alpha-05";
  const legacyKeys = ["eolas-companion-alpha-04","eolas-companion-alpha-03","eolas-companion-alpha-02"];
  const data = window.PALWORLD_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const themes = [
    {id:"north-star",name:"North Star",note:"Eolas default",a:"#6868e8",b:"#8d6bf0"},
    {id:"botan",name:"Botan",note:"Grass variant",a:"#428b62",b:"#72ad68"},
    {id:"cryst",name:"Cryst",note:"Ice variant",a:"#3488b6",b:"#62b1cd"},
    {id:"ignis",name:"Ignis",note:"Fire variant",a:"#d65b3d",b:"#e58b47"},
    {id:"lux",name:"Lux",note:"Electric variant",a:"#c69220",b:"#f3c74f"},
    {id:"noct",name:"Noct",note:"Dark variant",a:"#34355f",b:"#8c86ff"},
    {id:"terra",name:"Terra",note:"Ground variant",a:"#8a6844",b:"#c3955d"},
    {id:"aqua",name:"Aqua",note:"Water variant",a:"#167f93",b:"#53bfd2"}
  ];
  const defaults = {checked:{},palProgress:{},notebookEntries:[],notebookArchives:[],alphaNotebookEnabled:true,lastArea:"Windswept Hills",theme:"north-star",largeText:false,reducedMotion:false,highContrast:false};
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch {}
  if (!saved) for (const k of legacyKeys) { try { const x = JSON.parse(localStorage.getItem(k)||"null"); if(x){ saved=x; break; } } catch {} }
  let state = {...defaults,...(saved||{}),checked:{...defaults.checked,...(saved?.checked||{})},palProgress:{...defaults.palProgress,...(saved?.palProgress||{})},notebookEntries:Array.isArray(saved?.notebookEntries)?saved.notebookEntries:[],notebookArchives:Array.isArray(saved?.notebookArchives)?saved.notebookArchives:[]};
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
    ["largeText","reducedMotion","highContrast"].forEach(k=>{const el=$("#"+k);if(el)el.checked=!!state[k];});
    const notebookPanel=$("#alphaNotebookPanel"); if(notebookPanel) notebookPanel.classList.remove("hidden");
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
    return data.palProfiles?.[name] || {no:"—",elements:["Unknown"],summary:"A full field guide entry is still being researched for this Pal.",difficulty:"Unknown",obtain:[{type:"Wild / World",detail:"Known to appear in this region. Exact acquisition details are coming in a future data pack."}],work:[],partner:{name:"Profile in progress",detail:"Partner Skill details are still being verified."},drops:[],why:["Capture it to complete the regional Pal collection"],notes:"This Alpha build includes fully researched profiles for selected starter Pals first.",stats:{food:"—",hp:"—",attack:"—",defense:"—"},variants:[],progress:["seen","captured","bred","lucky"]};
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
      <section class="pal-facts">
        <article><strong>${esc(p.stats?.food ?? "—")}</strong><span>Food</span></article>
        <article><strong>${esc(p.stats?.hp ?? "—")}</strong><span>HP</span></article>
        <article><strong>${esc(p.stats?.attack ?? "—")}</strong><span>Attack</span></article>
        <article><strong>${esc(p.stats?.defense ?? "—")}</strong><span>Defense</span></article>
      </section>
      ${p.route?`<section class="route-card"><div class="route-title"><span>⌖</span><div><p class="section-label">CAPTURE ROUTE</p><h3>${esc(p.route.scope||"Recommended route")}</h3></div></div><div class="route-grid"><article><small>FAST TRAVEL</small><strong>${esc(p.route.fastTravel)}</strong><span>${esc(p.route.fastTravelCoords)}</span></article><article><small>TARGET</small><strong>${esc(p.route.target)}</strong><span>${esc(p.route.targetCoords)}</span></article></div><p class="route-directions">${esc(p.route.directions)}</p>${p.route.prep?`<p class="route-prep"><strong>Before you go:</strong> ${esc(p.route.prep)}</p>`:""}</section>`:""}
      ${p.variants?.length?`<section class="detail-section"><h3>Variants</h3><div class="variant-row">${p.variants.map(v=>`<button type="button" class="variant-chip variant-${esc(v.suffix.toLowerCase())}" data-variant-pal="${esc(v.name)}"><span>${esc(v.suffix)}</span><strong>${esc(v.name)}</strong></button>`).join("")}</div></section>`:""}
      <section class="detail-section"><div class="detail-heading"><h3>How to obtain</h3><span>${p.obtain.length} methods</span></div><div class="obtain-list">${p.obtain.map(o=>`<article><span class="obtain-icon">${o.type.includes("Fishing")?"🎣":o.type.includes("Boss")?"♛":o.type.includes("Dungeon")?"◇":o.type.includes("Egg")?"🥚":o.type.includes("Breeding")?"⌁":"⌖"}</span><div><strong>${esc(o.type)}</strong><p>${esc(o.detail)}</p></div></article>`).join("")}</div></section>
      <section class="insight-card"><p class="section-label">WHY CAPTURE THIS PAL?</p><ul>${p.why.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section>
      <section class="detail-section"><h3>Work suitability</h3><div class="skill-grid">${p.work.length?p.work.map(x=>`<span>${esc(x)}</span>`).join(""):'<span>None documented yet</span>'}</div></section>
      <section class="detail-section"><h3>${esc(p.partner.name)}</h3><p>${esc(p.partner.detail)}</p></section>
      <section class="detail-section"><h3>Drops</h3><div class="drop-row">${p.drops.length?p.drops.map(x=>`<span>${esc(x)}</span>`).join(""):'<span>Research in progress</span>'}</div></section>
      <section class="companion-note"><span>✦</span><div><p class="section-label">COMPANION NOTE</p><p>${esc(p.notes)}</p></div></section>
      <section class="detail-section"><h3>Your progress</h3><div class="progress-toggle-grid">${progress.map(k=>{const checked=k==='captured'?caught:hasProgress(area,name,k);return `<label><input type="checkbox" data-pal-progress="${esc(k)}" ${checked?'checked':''}><span class="mini-check">✓</span><span>${esc(progressLabels[k]||k)}</span></label>`}).join("")}</div></section>`;
    $$('[data-variant-pal]',els.palSheetContent).forEach(b=>b.addEventListener('click',()=>openPalSheet(area,b.dataset.variantPal)));
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
    const goals=[...missingPals.slice(0,2).map(n=>{const p=profileFor(n),r=p.route;const loc=r?`Fast travel: ${r.fastTravel} (${r.fastTravelCoords}) · Target: ${r.target} (${r.targetCoords})`:(p.obtain?.[0]?.detail||`Search ${area}`);return `<button type="button" class="goal goal-button" data-goal-pal="${esc(n)}"><span>⌖</span><div><strong>Catch ${esc(n)}</strong><small>${esc(loc)}</small><em>${r?"Open full capture route":"Open field guide"} ›</em></div></button>`}),...missingMarkers.slice(0,1).map(m=>`<button type="button" class="goal goal-button" data-goal-marker="${esc(m.type)}"><span>⌖</span><div><strong>${esc(m.name)}</strong><small>${esc(m.type)} · Coordinates ${esc(m.note)}</small><em>Open discoveries ›</em></div></button>`)];
    els.nextGoals.innerHTML=goals.join("")||`<div class="goal"><span>✓</span><div><strong>Region complete</strong><small>Choose your next adventure.</small></div></div>`;
    $$('[data-goal-pal]',els.nextGoals).forEach(b=>b.addEventListener('click',()=>openPalSheet(area,b.dataset.goalPal)));
    $$('[data-goal-marker]',els.nextGoals).forEach(b=>b.addEventListener('click',()=>{els.markerFilter.value=b.dataset.goalMarker;switchView('mapView');}));
    const t=totals(); els.homeStats.innerHTML=statCard(`${t.palDone}/${t.palTotal}`,"Pals caught")+statCard(`${s.done}/${s.total}`,`${area} complete`);
    els.areaCards.innerHTML=data.areas.map(a=>{if(a.status==="ready"){const x=stats(a.name);return`<button class="region-card" data-area="${esc(a.name)}"><span class="region-icon">✦</span><span><strong>${esc(a.name)}</strong><small>${x.pd}/${x.ps.length} Pals · ${x.md}/${x.ms.length} discoveries</small></span><span class="chevron">›</span></button>`;}return`<div class="region-card disabled"><span class="region-icon">◇</span><span><strong>${esc(a.name)}</strong><small>${esc(a.subtitle)}</small></span><span class="chevron">·</span></div>`;}).join("");
    $$('[data-area]',els.areaCards).forEach(b=>b.addEventListener("click",()=>{state.lastArea=b.dataset.area;els.areaSelect.value=state.lastArea;els.mapAreaSelect.value=state.lastArea;switchView("adventureView");}));
  }

  function renderNotebook(){
    const root=$("#notebookEntries"),archiveRoot=$("#notebookArchives"),count=$("#activeNoteCount"); if(!root)return;
    const entries=state.notebookEntries||[],archives=state.notebookArchives||[]; if(count) count.textContent=String(entries.length);
    root.innerHTML=entries.length?entries.map((n,i)=>`<article class="notebook-entry"><div class="notebook-entry-head"><div><strong>${esc(n.session||"Playtest observation")}</strong><small>${esc(new Date(n.createdAt).toLocaleString())}</small></div><button class="notebook-delete" data-note-delete="${i}" aria-label="Delete observation">×</button></div><p>${esc(n.text)}</p></article>`).join(""):`<div class="notebook-empty">No active notes. Use the + Note button while you play.</div>`;
    $$(`[data-note-delete]`,root).forEach(b=>b.addEventListener("click",()=>{state.notebookEntries.splice(Number(b.dataset.noteDelete),1);save();renderNotebook();toast("Observation deleted");}));
    if(archiveRoot) archiveRoot.innerHTML=archives.length?archives.map((a,i)=>`<details class="archive-session"><summary><span><strong>${esc(a.title)}</strong><small>${a.entries.length} notes · ${esc(new Date(a.archivedAt).toLocaleDateString())}</small></span><span>›</span></summary><div>${a.entries.map(n=>`<article><strong>${esc(n.session||"Observation")}</strong><p>${esc(n.text)}</p></article>`).join("")}</div></details>`).join(""):`<p class="notebook-empty">No archived playtests yet.</p>`;
  }
  function renderJourney(){const t=totals();els.progressStats.innerHTML=statCard(t.percent+"%","Overall")+statCard(`${t.palDone}/${t.palTotal}`,"Pals");els.progressAreas.innerHTML=readyAreas().map(({name})=>{const s=stats(name);return`<div class="progress-area"><div><strong>${esc(name)}</strong><span>${s.done}/${s.total}</span></div><div class="progress-track"><div style="width:${s.percent}%"></div></div></div>`;}).join("");renderNotebook();}
  function renderAll(){renderPals();renderMarkers();renderHome();renderJourney();}
  function switchView(view){if(!els.palSheet.classList.contains("hidden"))closePalSheet();$$('.view').forEach(x=>x.classList.toggle('active',x.id===view));$$('.bottom-nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===view));window.scrollTo({top:0,behavior:'auto'});if(view==='homeView')renderHome();if(view==='adventureView')renderPals();if(view==='mapView')renderMarkers();if(view==='journeyView')renderJourney();}

  $$('.bottom-nav button').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));
  els.areaSelect.addEventListener('change',renderPals); els.mapAreaSelect.addEventListener('change',renderMarkers); els.markerFilter.addEventListener('change',renderMarkers); els.palSearch.addEventListener('input',renderPals);
  ["largeText","reducedMotion","highContrast"].forEach(k=>$("#"+k).addEventListener("change",e=>{state[k]=e.target.checked;save();applyPrefs();renderJourney();}));
  $("#exportButton").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({version:"alpha-0.5.5",exportedAt:new Date().toISOString(),state},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="eolas-companion-backup.json";a.click();URL.revokeObjectURL(a.href);});
  $("#importInput").addEventListener("change",async e=>{try{const p=JSON.parse(await e.target.files[0].text());state={...defaults,...p.state,checked:{...(p.state?.checked||{})},palProgress:{...(p.state?.palProgress||{})},notebookEntries:Array.isArray(p.state?.notebookEntries)?p.state.notebookEntries:[],notebookArchives:Array.isArray(p.state?.notebookArchives)?p.state.notebookArchives:[]};save();applyPrefs();setupControls();renderAll();toast("Backup imported");}catch{alert("That backup could not be imported.");}});
  $("#resetButton").addEventListener("click",()=>{if(confirm("Reset all Eolas progress on this device?")){state={...defaults,checked:{},palProgress:{},notebookEntries:[],notebookArchives:[]};save();applyPrefs();setupControls();renderAll();toast("Progress reset");}});

  $("#notebookForm").addEventListener("submit",e=>{e.preventDefault();const text=$("#noteText").value.trim();if(!text){toast("Describe what happened first");return;}state.notebookEntries.unshift({createdAt:new Date().toISOString(),session:$("#noteSession").value.trim(),type:$("#noteType").value,text,help:$("#noteHelp").value.trim()});save();e.target.reset();renderNotebook();toast("Observation saved");});
  $("#exportNotebook").addEventListener("click",()=>{const lines=["# Eolas Alpha Notebook","",`Exported: ${new Date().toLocaleString()}`,""];(state.notebookEntries||[]).forEach((n,i)=>{lines.push(`## ${i+1}. ${n.session||"Playtest observation"}`,`- Date: ${new Date(n.createdAt).toLocaleString()}`,`- Flag: ${n.type}`,"",`**What happened**`,"",n.text,"",`**What would have helped**`,"",n.help||"—","");});const blob=new Blob([lines.join("\n")],{type:"text/markdown"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="eolas-alpha-notebook.md";a.click();URL.revokeObjectURL(a.href);});
  $("#archiveNotebook").addEventListener("click",()=>{if(!state.notebookEntries.length){toast("No active notes to archive");return;}const title=prompt("Name this playtest archive",`Playtest ${new Date().toLocaleDateString()}`);if(!title)return;state.notebookArchives.unshift({title:title.trim()||"Playtest archive",archivedAt:new Date().toISOString(),entries:state.notebookEntries.map(x=>({...x}))});state.notebookEntries=[];save();renderNotebook();toast("Playtest archived");});
  let currentContext = "General app observation";
  function noteContext(){
    const openPal = !els.palSheet.classList.contains("hidden") ? els.palSheetContent.querySelector("h2")?.textContent : "";
    if(openPal) return `Pal: ${openPal}`;
    const active = document.querySelector(".view.active")?.id || "homeView";
    return ({homeView:"Home",adventureView:`Adventure · ${state.lastArea}`,mapView:`Discoveries · ${state.lastArea}`,journeyView:"Journey",settingsView:"Settings"})[active] || "Eolas";
  }
  function openQuickNote(prefill=""){
    currentContext=noteContext();
    $("#quickNoteContext").textContent=currentContext;
    $("#quickNoteText").value=prefill;
    $("#quickNoteModal").classList.remove("hidden");
    document.body.classList.add("quick-note-open");
    setTimeout(()=>$("#quickNoteText").focus(),30);
  }
  function closeQuickNote(){$("#quickNoteModal").classList.add("hidden");document.body.classList.remove("quick-note-open");}
  $("#quickNoteButton").addEventListener("click",()=>openQuickNote());
  $("#quickNoteClose").addEventListener("click",closeQuickNote);
  $("#quickNoteBackdrop").addEventListener("click",closeQuickNote);
  $("#quickNoteSave").addEventListener("click",()=>{const text=$("#quickNoteText").value.trim();if(!text){toast("Write a quick note first");return;}state.notebookEntries.unshift({createdAt:new Date().toISOString(),session:currentContext,type:"Observation",text,help:""});save();renderNotebook();closeQuickNote();toast("Alpha Note saved");});

  function toast(message){els.toast.textContent=message;els.toast.classList.remove("hidden");setTimeout(()=>els.toast.classList.add("hidden"),1800);}
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;els.installButton.classList.remove("hidden");});
  els.installButton.addEventListener("click",async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;els.installButton.classList.add("hidden");}});
  if("serviceWorker" in navigator) navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});
  if("caches" in window) caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("eolas")).map(k=>caches.delete(k)))).catch(()=>{});
  $("#closePalSheet").addEventListener("click",closePalSheet); $("#sheetBackdrop").addEventListener("click",closePalSheet); document.addEventListener("keydown",e=>{if(e.key==="Escape")closePalSheet();});
  applyPrefs(); setupControls(); renderAll();
})();
