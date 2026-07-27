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
  const starterBases = [
    {id:"base-1",name:"Sakura Operations Center",role:"Headquarters / Production",icon:"🏭",coords:"646, 272",fastTravel:"Secluded Cemetery",status:"Planned",resources:"2 crude oil nodes",buildSpace:"Production campus",raidRisk:"Needs field test",nearby:"Dungeon, fishing, Alpha/bounty activity",notes:"Keep the oil operation visually integrated into the HQ rather than presenting this as a dedicated oil base.",features:["Crafting","Production","Storage","Expeditions","Oil extraction"],imports:"Ore, coal, food",exports:"Weapons, armor, spheres, ammo"},
    {id:"base-2",name:"Coastal Hatchery",role:"Breeding",icon:"🥚",coords:"-418, -833",fastTravel:"Not recorded",status:"Candidate",resources:"Resource nodes are intentionally low priority",buildSpace:"Evaluate pen and incubator capacity",raidRisk:"Needs field test",nearby:"Needs area intel",notes:"Candidate chosen for breeding space and operations rather than nearby mining resources.",features:["Breeding farms","Egg incubation","Pal sorting","Condensation projects"],imports:"Cake, food",exports:"Eggs, bred Pals, condensation candidates"},
    {id:"base-3",name:"",role:"Mining",icon:"⛏️",coords:"",fastTravel:"",status:"Unplanned",resources:"",buildSpace:"",raidRisk:"",nearby:"",notes:"",features:["Ore mining","Coal mining","Smelting","Transport"],imports:"Food",exports:"Ore, ingots, coal, stone"},
    {id:"base-4",name:"",role:"Farm / Food",icon:"🌾",coords:"",fastTravel:"",status:"Unplanned",resources:"",buildSpace:"",raidRisk:"",nearby:"",notes:"",features:["Plantations","Ranches","Cooking","Cake supply","Expedition station"],imports:"Seeds",exports:"Food, cake, milk, eggs, honey"}
  ];
  const defaults = {checked:{},palProgress:{},notebookEntries:[],notebookArchives:[],baseProfiles:starterBases,alphaNotebookEnabled:true,lastArea:"Windswept Hills",theme:"north-star",largeText:false,reducedMotion:false,highContrast:false};
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch {}
  if (!saved) for (const k of legacyKeys) { try { const x = JSON.parse(localStorage.getItem(k)||"null"); if(x){ saved=x; break; } } catch {} }
  let state = {...defaults,...(saved||{}),checked:{...defaults.checked,...(saved?.checked||{})},palProgress:{...defaults.palProgress,...(saved?.palProgress||{})},notebookEntries:Array.isArray(saved?.notebookEntries)?saved.notebookEntries:[],notebookArchives:Array.isArray(saved?.notebookArchives)?saved.notebookArchives:[],baseProfiles:Array.isArray(saved?.baseProfiles)&&saved.baseProfiles.length? saved.baseProfiles : starterBases.map(x=>({...x,features:[...x.features]}))};
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

  const roleIcons={"Headquarters / Production":"🏭","Breeding":"🥚","Mining":"⛏️","Farm / Food":"🌾","Custom":"⌂"};
  const featureOptions=["Crafting","Production","Storage","Expeditions","Oil extraction","Ore mining","Coal mining","Smelting","Transport","Breeding farms","Egg incubation","Pal sorting","Condensation projects","Plantations","Ranches","Cooking","Cake supply","Fishing access"];
  const baseCandidates={
    "Headquarters / Production":[
      {tag:"Current pick",name:"Sakurajima Oil HQ",coords:"646, 272",fastTravel:"Secluded Cemetery",score:96,summary:"Keep your current plan: broad production space with two oil nodes that can be visually integrated into the HQ.",resources:"2 crude oil nodes; wood and stone nearby",buildSpace:"Large late-game production campus",raidRisk:"Field test required",nearby:"Sakurajima activities; record exact dungeon, fishing, and boss travel times during playtest",features:["Crafting","Production","Storage","Expeditions","Oil extraction"],imports:"Ore, coal, food",exports:"Weapons, armor, spheres, ammo, oil",source:"Your selected location"},
      {tag:"Efficiency pick",name:"Western Fortress Works",coords:"-432, -51",fastTravel:"Verify in game",score:91,summary:"A widely recommended main-production alternative where open space and pathing matter more than natural nodes.",resources:"General wood and stone; nodes are secondary",buildSpace:"Strong production layout potential",raidRisk:"Defensible terrain; verify raid routes",nearby:"Central access to the original islands",features:["Crafting","Production","Storage","Expeditions"],imports:"Ore, coal, oil, food",exports:"Weapons, armor, spheres, ammo",source:"2026 community guide candidate"},
      {tag:"Scenic pick",name:"Sunreach Crystal Pool",coords:"-540, -1361",fastTravel:"Sun Reach Crystal Pool",score:88,summary:"Open shallow-water construction and dramatic scenery, with a nearby world-boss tradeoff.",resources:"Open water construction; regional endgame materials",buildSpace:"Very open, including shallow water",raidRisk:"Nearby boss activity; field test before committing",nearby:"Jetragon world boss reported nearby",features:["Crafting","Production","Storage","Fishing access"],imports:"Most production materials",exports:"Crafted equipment and supplies",source:"Palworld 1.0 scenic candidate"}
    ],
    "Breeding":[
      {tag:"Current pick",name:"Southern Hatchery",coords:"-418, -833",fastTravel:"Not recorded",score:94,summary:"Your candidate prioritizes space and low resource interference—the correct criteria for a dedicated egg-breeding campus.",resources:"Natural nodes intentionally ignored",buildSpace:"Evaluate number of pens and incubators in the Palbox radius",raidRisk:"Field test required",nearby:"Record fast travel, fishing, dungeon, and raid observations",features:["Breeding farms","Egg incubation","Pal sorting","Condensation projects"],imports:"Cake, food",exports:"Eggs, bred Pals, condensation candidates",source:"Your selected location"},
      {tag:"Efficiency pick",name:"Southern Production Field",coords:"-198, -702",fastTravel:"Verify in game",score:92,summary:"A current 1.0 guide pick for breeding, farming, or production because its flat space supports clean worker pathing.",resources:"Resources are not the deciding factor",buildSpace:"Large and flat",raidRisk:"Verify approaches before placing the Palbox",nearby:"Southern map access",features:["Breeding farms","Egg incubation","Pal sorting","Condensation projects"],imports:"Cake, food",exports:"Eggs and bred Pals",source:"2026 community guide candidate"},
      {tag:"Quiet pick",name:"Forgotten Island Retreat",coords:"85, -220",fastTravel:"Forgotten Island",score:87,summary:"A peaceful alternative for players who value lower interruption and scenery over maximum build density.",resources:"Wood, stone, and Paldium nearby",buildSpace:"Moderate; inspect pen count before adopting",raidRisk:"Often recommended as a calmer base region",nearby:"Island access and coastal scenery",features:["Breeding farms","Egg incubation","Pal sorting"],imports:"Cake, food",exports:"Eggs and bred Pals",source:"Palworld 1.0 community candidate"}
    ],
    "Mining":[
      {tag:"Resource pick",name:"Devout Ridge Mine",coords:"26, -137",fastTravel:"Approx. 190m away",score:98,summary:"A 1.0 data-driven candidate reported to place dense ore, coal, sulfur, and Paldium within one base-sized circle.",resources:"12 ore, 10 coal, 6 sulfur, 5 Paldium reported",buildSpace:"Resource-dense ridge; inspect foundation space",raidRisk:"Elevated terrain may help defense; field test",nearby:"Devout Mineshaft region",features:["Ore mining","Coal mining","Smelting","Transport"],imports:"Food",exports:"Ore, coal, sulfur, Paldium, ingots",source:"1.0 game-file node-count guide"},
      {tag:"Classic pick",name:"Ore and Coal Mountain",coords:"187, -37",fastTravel:"Nearby statue",score:94,summary:"The familiar elevated ore-and-coal location remains a strong dedicated mining candidate.",resources:"Dense ore and coal cluster",buildSpace:"Compact plateau",raidRisk:"Naturally defensible elevation",nearby:"Central map access",features:["Ore mining","Coal mining","Smelting","Transport"],imports:"Food",exports:"Ore, coal, refined ingots",source:"2026 field-verified guide candidate"},
      {tag:"Mixed mineral pick",name:"Mount Obsidian Mineral Hub",coords:"87, -475",fastTravel:"Verify in game",score:89,summary:"A mixed late-game mineral option when sulfur matters alongside ore and coal.",resources:"Ore, coal, and sulfur reported",buildSpace:"Inspect heat hazards and Pal pathing",raidRisk:"Higher-level volcanic region",nearby:"Mount Obsidian content",features:["Ore mining","Coal mining","Smelting","Transport"],imports:"Food and cooling support",exports:"Ore, coal, sulfur, ingots",source:"Palworld 1.0 guide candidate"}
    ],
    "Farm / Food":[
      {tag:"Efficiency pick",name:"Southern Farmstead",coords:"-198, -702",fastTravel:"Verify in game",score:93,summary:"Large flat ground makes this a flexible candidate for plantations, ranches, cooking, and the expedition structure.",resources:"Nodes are secondary to usable acreage",buildSpace:"Large and flat",raidRisk:"Field test required",nearby:"Southern map access",features:["Plantations","Ranches","Cooking","Cake supply","Expeditions"],imports:"Seeds and starter ingredients",exports:"Food, cake, milk, eggs, honey",source:"2026 community guide candidate"},
      {tag:"Peaceful pick",name:"Forgotten Island Farm",coords:"85, -220",fastTravel:"Forgotten Island",score:88,summary:"A calmer island option with ordinary resources and enough flexibility for a food-focused support base.",resources:"Wood, stone, Paldium",buildSpace:"Moderate; verify ranch and plantation capacity",raidRisk:"Often recommended for peaceful building",nearby:"Coast and fishing potential",features:["Plantations","Ranches","Cooking","Cake supply","Fishing access","Expeditions"],imports:"Seeds",exports:"Food, cake ingredients, ranch products",source:"Palworld 1.0 community candidate"},
      {tag:"Starter-flat pick",name:"Plateau Farm",coords:"263, -529",fastTravel:"Plateau of Beginnings",score:84,summary:"Convenient, accessible flat terrain; less exotic, but practical for a support farm that does not need rare nodes.",resources:"Wood, stone, berry access",buildSpace:"Good early flat area",raidRisk:"One main approach reported",nearby:"Starter-region travel and low-level gathering",features:["Plantations","Ranches","Cooking","Cake supply","Expeditions"],imports:"Seeds",exports:"Food and cake ingredients",source:"Longstanding community candidate; verify after 1.0"}
    ]
  };
  function renderBases(){
    const grid=$("#baseProfileGrid"),count=$("#baseNetworkCount"); if(!grid)return;
    const planned=state.baseProfiles.filter(b=>b.name.trim()&&b.coords.trim()).length; count.textContent=`${planned} of 4 planned`;
    grid.innerHTML=state.baseProfiles.map((b,i)=>{const empty=!b.name.trim();return`<article class="base-profile-card ${empty?'base-empty':''}"><button class="base-card-main" data-base-open="${i}" type="button"><span class="base-role-icon">${esc(b.icon||roleIcons[b.role]||'⌂')}</span><span class="base-card-copy"><strong>${esc(b.name||`Plan Base ${i+1}`)}</strong><small>${esc(b.role)}${b.coords?` · ${esc(b.coords)}`:''}</small><em>${empty?'Tap to name and plan this location':esc(b.fastTravel||'Fast travel not recorded')}</em></span><span class="base-card-status">${esc(b.status||'Planned')}</span></button><div class="base-card-details"><span><strong>${esc(b.resources||'—')}</strong>Resources</span><span><strong>${esc(b.buildSpace||'—')}</strong>Build space</span><span><strong>${esc(b.raidRisk||'—')}</strong>Raid intel</span></div></article>`}).join('');
    $$('[data-base-open]',grid).forEach(btn=>btn.addEventListener('click',()=>openBaseSheet(Number(btn.dataset.baseOpen))));
  }
  function openBaseSheet(index){
    const b=state.baseProfiles[index],root=$("#baseSheetContent");
    root.innerHTML=`<div class="page-intro"><p class="section-label">BASE ${index+1} PROFILE</p><h2 id="baseSheetTitle">${esc(b.name||'Plan this base')}</h2><p>Everything here saves on this device as you type and submit.</p></div><form id="baseProfileForm" class="base-form">
      <label class="field"><span>Base name</span><input name="name" value="${esc(b.name)}" placeholder="Example: Sakura Operations Center"></label>
      <label class="field"><span>Primary role</span><div class="select-wrap"><select name="role" id="baseRoleSelect">${Object.keys(roleIcons).map(r=>`<option ${b.role===r?'selected':''}>${esc(r)}</option>`).join('')}</select></div></label>
      <section class="base-section candidate-section"><div class="candidate-heading"><div><p class="section-label">LOCATION INTELLIGENCE</p><h3>Explore alternatives</h3></div><small>Suggestions never replace your profile until you tap Adopt.</small></div><div id="baseCandidateList" class="candidate-list"></div></section>
      <div class="base-form-grid"><label class="field"><span>Coordinates</span><input name="coords" value="${esc(b.coords)}" placeholder="646, 272"></label><label class="field"><span>Status</span><div class="select-wrap"><select name="status">${["Candidate","Planned","Building","Active"].map(x=>`<option ${b.status===x?'selected':''}>${x}</option>`).join('')}</select></div></label></div>
      <label class="field"><span>Nearby fast travel</span><input name="fastTravel" value="${esc(b.fastTravel)}" placeholder="Fast travel point"></label>
      <div class="base-section"><h3>Area intelligence</h3><div class="base-intel-grid"><label class="field"><span>Natural resources</span><textarea name="resources" rows="2">${esc(b.resources)}</textarea></label><label class="field"><span>Build space</span><textarea name="buildSpace" rows="2">${esc(b.buildSpace)}</textarea></label><label class="field"><span>Raid exposure</span><textarea name="raidRisk" rows="2">${esc(b.raidRisk)}</textarea></label><label class="field"><span>Nearby activities</span><textarea name="nearby" rows="2">${esc(b.nearby)}</textarea></label></div></div>
      <div class="base-section"><h3>What belongs here?</h3><div class="chip-checks">${featureOptions.map(f=>`<label class="chip-check"><input type="checkbox" name="features" value="${esc(f)}" ${(b.features||[]).includes(f)?'checked':''}><span>${esc(f)}</span></label>`).join('')}</div></div>
      <div class="base-form-grid"><label class="field"><span>Imports</span><textarea name="imports" rows="3">${esc(b.imports||'')}</textarea></label><label class="field"><span>Exports</span><textarea name="exports" rows="3">${esc(b.exports||'')}</textarea></label></div>
      <label class="field"><span>Planning notes</span><textarea name="notes" rows="4">${esc(b.notes)}</textarea></label>
      <div class="base-actions"><button class="primary-button" type="submit">Save profile</button><button class="secondary-button" id="clearBaseProfile" type="button">Clear slot</button></div>
    </form>`;
    $("#baseSheet").classList.remove('hidden');document.body.classList.add('sheet-open');
    const renderCandidateList=()=>{const role=$("#baseRoleSelect").value,list=$("#baseCandidateList"),items=baseCandidates[role]||[];list.innerHTML=items.length?items.map((c,i)=>`<article class="candidate-card"><div class="candidate-card-head"><div><span class="candidate-tag">${esc(c.tag)}</span><h4>${esc(c.name)}</h4><p>${esc(c.coords)} · ${esc(c.fastTravel)}</p></div><strong>${c.score}<small>/100</small></strong></div><p>${esc(c.summary)}</p><details><summary>View intelligence</summary><div class="candidate-intel"><span><b>Resources</b>${esc(c.resources)}</span><span><b>Build space</b>${esc(c.buildSpace)}</span><span><b>Raid notes</b>${esc(c.raidRisk)}</span><span><b>Nearby</b>${esc(c.nearby)}</span></div><small class="candidate-source">${esc(c.source)} · Treat unverified details as playtest prompts.</small></details><button type="button" class="secondary-button candidate-adopt" data-candidate-adopt="${i}">Adopt this location</button></article>`).join(''):`<p class="notebook-empty">Choose a supported role to see candidates.</p>`;$$('[data-candidate-adopt]',list).forEach(btn=>btn.addEventListener('click',()=>{const c=items[Number(btn.dataset.candidateAdopt)];if(!c)return;const form=$("#baseProfileForm");form.elements.coords.value=c.coords;form.elements.fastTravel.value=c.fastTravel;form.elements.resources.value=c.resources;form.elements.buildSpace.value=c.buildSpace;form.elements.raidRisk.value=c.raidRisk;form.elements.nearby.value=c.nearby;form.elements.imports.value=c.imports;form.elements.exports.value=c.exports;form.elements.notes.value=`${form.elements.notes.value?form.elements.notes.value+'\n\n':''}Adopted from Eolas suggestion: ${c.tag} — ${c.summary}`;$$('input[name="features"]',form).forEach(x=>x.checked=c.features.includes(x.value));toast('Location adopted — rename it and save when ready');}));};
    renderCandidateList();$("#baseRoleSelect").addEventListener('change',renderCandidateList);
    $("#baseProfileForm").addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.target),role=fd.get('role');state.baseProfiles[index]={...b,name:String(fd.get('name')||'').trim(),role,icon:roleIcons[role]||'⌂',coords:String(fd.get('coords')||'').trim(),status:String(fd.get('status')||'Candidate'),fastTravel:String(fd.get('fastTravel')||'').trim(),resources:String(fd.get('resources')||'').trim(),buildSpace:String(fd.get('buildSpace')||'').trim(),raidRisk:String(fd.get('raidRisk')||'').trim(),nearby:String(fd.get('nearby')||'').trim(),features:fd.getAll('features').map(String),imports:String(fd.get('imports')||'').trim(),exports:String(fd.get('exports')||'').trim(),notes:String(fd.get('notes')||'').trim()};save();renderBases();closeBaseSheet();toast('Base profile saved');});
    $("#clearBaseProfile").addEventListener('click',()=>{if(!confirm('Clear this base profile?'))return;const role=b.role||['Headquarters / Production','Breeding','Mining','Farm / Food'][index];state.baseProfiles[index]={id:b.id,name:'',role,icon:roleIcons[role]||'⌂',coords:'',fastTravel:'',status:'Unplanned',resources:'',buildSpace:'',raidRisk:'',nearby:'',notes:'',features:[],imports:'',exports:''};save();renderBases();closeBaseSheet();toast('Base slot cleared');});
  }
  function closeBaseSheet(){$("#baseSheet").classList.add('hidden');document.body.classList.remove('sheet-open');}
  function renderAll(){renderPals();renderMarkers();renderHome();renderJourney();renderBases();}
  function switchView(view){if(!els.palSheet.classList.contains("hidden"))closePalSheet();if(!$("#baseSheet").classList.contains("hidden"))closeBaseSheet();$$('.view').forEach(x=>x.classList.toggle('active',x.id===view));$$('.bottom-nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===view));window.scrollTo({top:0,behavior:'auto'});if(view==='homeView')renderHome();if(view==='adventureView')renderPals();if(view==='mapView')renderMarkers();if(view==='basesView')renderBases();if(view==='journeyView')renderJourney();}

  $$('.bottom-nav button').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));
  els.areaSelect.addEventListener('change',renderPals); els.mapAreaSelect.addEventListener('change',renderMarkers); els.markerFilter.addEventListener('change',renderMarkers); els.palSearch.addEventListener('input',renderPals);
  ["largeText","reducedMotion","highContrast"].forEach(k=>$("#"+k).addEventListener("change",e=>{state[k]=e.target.checked;save();applyPrefs();renderJourney();}));
  $("#exportButton").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({version:"alpha-0.5.6",exportedAt:new Date().toISOString(),state},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="eolas-companion-backup.json";a.click();URL.revokeObjectURL(a.href);});
  $("#importInput").addEventListener("change",async e=>{try{const p=JSON.parse(await e.target.files[0].text());state={...defaults,...p.state,checked:{...(p.state?.checked||{})},palProgress:{...(p.state?.palProgress||{})},notebookEntries:Array.isArray(p.state?.notebookEntries)?p.state.notebookEntries:[],notebookArchives:Array.isArray(p.state?.notebookArchives)?p.state.notebookArchives:[],baseProfiles:Array.isArray(p.state?.baseProfiles)?p.state.baseProfiles:starterBases.map(x=>({...x,features:[...x.features]}))};save();applyPrefs();setupControls();renderAll();toast("Backup imported");}catch{alert("That backup could not be imported.");}});
  $("#resetButton").addEventListener("click",()=>{if(confirm("Reset all Eolas progress on this device?")){state={...defaults,checked:{},palProgress:{},notebookEntries:[],notebookArchives:[],baseProfiles:starterBases.map(x=>({...x,features:[...x.features]}))};save();applyPrefs();setupControls();renderAll();toast("Progress reset");}});

  $("#notebookForm").addEventListener("submit",e=>{e.preventDefault();const text=$("#noteText").value.trim();if(!text){toast("Describe what happened first");return;}state.notebookEntries.unshift({createdAt:new Date().toISOString(),session:$("#noteSession").value.trim(),type:$("#noteType").value,text,help:$("#noteHelp").value.trim()});save();e.target.reset();renderNotebook();toast("Observation saved");});
  $("#exportNotebook").addEventListener("click",()=>{const lines=["# Eolas Alpha Notebook","",`Exported: ${new Date().toLocaleString()}`,""];(state.notebookEntries||[]).forEach((n,i)=>{lines.push(`## ${i+1}. ${n.session||"Playtest observation"}`,`- Date: ${new Date(n.createdAt).toLocaleString()}`,`- Flag: ${n.type}`,"",`**What happened**`,"",n.text,"",`**What would have helped**`,"",n.help||"—","");});const blob=new Blob([lines.join("\n")],{type:"text/markdown"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="eolas-alpha-notebook.md";a.click();URL.revokeObjectURL(a.href);});
  $("#archiveNotebook").addEventListener("click",()=>{if(!state.notebookEntries.length){toast("No active notes to archive");return;}const title=prompt("Name this playtest archive",`Playtest ${new Date().toLocaleDateString()}`);if(!title)return;state.notebookArchives.unshift({title:title.trim()||"Playtest archive",archivedAt:new Date().toISOString(),entries:state.notebookEntries.map(x=>({...x}))});state.notebookEntries=[];save();renderNotebook();toast("Playtest archived");});
  let currentContext = "General app observation";
  function noteContext(){
    const openPal = !els.palSheet.classList.contains("hidden") ? els.palSheetContent.querySelector("h2")?.textContent : "";
    if(openPal) return `Pal: ${openPal}`;
    const active = document.querySelector(".view.active")?.id || "homeView";
    return ({homeView:"Home",adventureView:`Adventure · ${state.lastArea}`,mapView:`Discoveries · ${state.lastArea}`,basesView:"Base Network",journeyView:"Journey",settingsView:"Settings"})[active] || "Eolas";
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
  $("#closeBaseSheet").addEventListener("click",closeBaseSheet); $("#baseSheetBackdrop").addEventListener("click",closeBaseSheet);
  $("#closePalSheet").addEventListener("click",closePalSheet); $("#sheetBackdrop").addEventListener("click",closePalSheet); document.addEventListener("keydown",e=>{if(e.key==="Escape")closePalSheet();});
  applyPrefs(); setupControls(); renderAll();
})();
