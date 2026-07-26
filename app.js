(() => {
  "use strict";
  const STORAGE_KEY = "palworld-companion-v2";
  const data = window.PALWORLD_DATA;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const defaultState = { checked: {}, customPals: {}, customMarkers: {}, lastArea: data.areas[0] };
  let state = loadState();
  let entryMode = "pal";
  let installPrompt = null;

  const els = {
    areaSelect: $("#areaSelect"), mapAreaSelect: $("#mapAreaSelect"), markerFilter: $("#markerFilter"),
    palSearch: $("#palSearch"), palList: $("#palList"), palEmpty: $("#palEmpty"), markerList: $("#markerList"),
    areaProgressLabel: $("#areaProgressLabel"), areaPercent: $("#areaPercent"), areaProgressFill: $("#areaProgressFill"),
    homeStats: $("#homeStats"), areaCards: $("#areaCards"), progressStats: $("#progressStats"),
    progressAreas: $("#progressAreas"), overallPercent: $("#overallPercent"), overallRing: $("#overallRing"),
    headerContext: $("#headerContext"), dialog: $("#entryDialog"), entryForm: $("#entryForm"),
    dialogTitle: $("#dialogTitle"), entryName: $("#entryName"), entryType: $("#entryType"),
    entryTypeWrap: $("#entryTypeWrap"), entryNoteWrap: $("#entryNoteWrap"), entryNote: $("#entryNote"),
    toast: $("#toast"), installButton: $("#installButton")
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return { ...defaultState, ...(saved || {}), checked: saved?.checked || {}, customPals: saved?.customPals || {}, customMarkers: saved?.customMarkers || {} };
    } catch { return structuredClone(defaultState); }
  }
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function makeId(kind, area, name, suffix = "") { return [kind, area, name, suffix].join("|"); }
  function getPals(area) { return [...(data.areaPals[area] || []), ...(state.customPals[area] || [])]; }
  function getMarkers(area) { return [...(data.markers[area] || []), ...(state.customMarkers[area] || [])]; }
  function isChecked(id) { return Boolean(state.checked[id]); }
  function setChecked(id, checked) { state.checked[id] = checked; saveState(); }

  function setupSelects() {
    const areaOptions = data.areas.map(area => `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`).join("");
    els.areaSelect.innerHTML = areaOptions;
    els.mapAreaSelect.innerHTML = areaOptions;
    els.areaSelect.value = state.lastArea;
    els.mapAreaSelect.value = state.lastArea;
    els.markerFilter.innerHTML = data.markerTypes.map(type => `<option>${escapeHtml(type)}</option>`).join("");
    els.entryType.innerHTML = data.markerTypes.filter(x => x !== "All").map(type => `<option>${escapeHtml(type)}</option>`).join("");
  }

  function checkRow({ id, name, note = "", tag = "" }) {
    const done = isChecked(id);
    return `<label class="check-row ${done ? "done" : ""}">
      <input type="checkbox" data-check-id="${escapeHtml(id)}" ${done ? "checked" : ""}>
      <span class="custom-checkbox" aria-hidden="true">✓</span>
      <span class="row-copy"><strong>${escapeHtml(name)}</strong>${note ? `<small>${escapeHtml(note)}</small>` : ""}</span>
      ${tag ? `<span class="tag">${escapeHtml(tag)}</span>` : ""}
    </label>`;
  }

  function bindCheckRows(root) {
    $$('[data-check-id]', root).forEach(input => input.addEventListener("change", () => {
      setChecked(input.dataset.checkId, input.checked);
      input.closest(".check-row").classList.toggle("done", input.checked);
      renderAllProgress();
    }));
  }

  function renderPals() {
    const area = els.areaSelect.value;
    state.lastArea = area; els.mapAreaSelect.value = area; saveState();
    const query = els.palSearch.value.trim().toLowerCase();
    const all = getPals(area);
    const visible = all.filter(name => name.toLowerCase().includes(query));
    els.palList.innerHTML = visible.map(name => checkRow({ id: makeId("pal", area, name), name, tag: "Pal" })).join("");
    els.palEmpty.classList.toggle("hidden", all.length > 0);
    bindCheckRows(els.palList);
    renderAreaProgress();
  }

  function renderMarkers() {
    const area = els.mapAreaSelect.value;
    state.lastArea = area; els.areaSelect.value = area; saveState();
    const filter = els.markerFilter.value;
    const markers = getMarkers(area).filter(marker => filter === "All" || marker.type === filter);
    els.markerList.innerHTML = markers.length ? markers.map(marker => checkRow({
      id: makeId("marker", area, marker.name, marker.type), name: marker.name, note: marker.note, tag: marker.type
    })).join("") : `<div class="empty-state"><div class="empty-icon">⌖</div><h3>No markers here yet</h3><p>Use + Add to build your own discovery log.</p></div>`;
    bindCheckRows(els.markerList);
  }

  function areaStats(area) {
    const pals = getPals(area);
    const done = pals.filter(name => isChecked(makeId("pal", area, name))).length;
    return { total: pals.length, done, percent: pals.length ? Math.round(done / pals.length * 100) : 0 };
  }

  function totals() {
    let pals = 0, caught = 0, markers = 0, markersDone = 0;
    data.areas.forEach(area => {
      getPals(area).forEach(name => { pals++; if (isChecked(makeId("pal", area, name))) caught++; });
      getMarkers(area).forEach(marker => { markers++; if (isChecked(makeId("marker", area, marker.name, marker.type))) markersDone++; });
    });
    const overall = pals + markers ? Math.round((caught + markersDone) / (pals + markers) * 100) : 0;
    return { pals, caught, markers, markersDone, overall };
  }

  function statCard(value, label) { return `<article class="stat-card"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></article>`; }

  function renderAreaProgress() {
    const stats = areaStats(els.areaSelect.value);
    els.areaProgressLabel.textContent = `${stats.done} of ${stats.total} caught`;
    els.areaPercent.textContent = `${stats.percent}%`;
    els.areaProgressFill.style.width = `${stats.percent}%`;
  }

  function renderAllProgress() {
    const t = totals();
    els.overallPercent.textContent = `${t.overall}%`;
    els.overallRing.style.setProperty("--progress", `${t.overall * 3.6}deg`);
    els.homeStats.innerHTML = statCard(`${t.caught}/${t.pals}`, "Pals caught") + statCard(`${t.markersDone}/${t.markers}`, "Markers completed");
    els.progressStats.innerHTML = statCard(`${t.overall}%`, "Overall") + statCard(`${t.caught}/${t.pals}`, "Pals") + statCard(`${t.markersDone}/${t.markers}`, "Map markers") + statCard(`${data.areas.filter(a => areaStats(a).done > 0).length}`, "Areas started");

    const populated = data.areas.filter(area => getPals(area).length > 0 || getMarkers(area).length > 0 || (state.customPals[area] || []).length > 0);
    els.areaCards.innerHTML = populated.slice(0, 5).map(area => {
      const s = areaStats(area);
      return `<button class="area-card" data-area="${escapeHtml(area)}" type="button"><span><strong>${escapeHtml(area)}</strong><small>${s.done} of ${s.total} Pals</small></span><span class="mini-progress"><i style="width:${s.percent}%"></i></span><b>${s.percent}%</b></button>`;
    }).join("");
    $$('[data-area]', els.areaCards).forEach(button => button.addEventListener("click", () => { els.areaSelect.value = button.dataset.area; switchView("palsView"); renderPals(); }));

    els.progressAreas.innerHTML = data.areas.map(area => {
      const s = areaStats(area);
      return `<div class="progress-area"><div><strong>${escapeHtml(area)}</strong><span>${s.done}/${s.total}</span></div><div class="progress-track"><div style="width:${s.percent}%"></div></div></div>`;
    }).join("");
    renderAreaProgress();
  }

  function switchView(viewId) {
    $$(".view").forEach(view => view.classList.toggle("active", view.id === viewId));
    $$(".bottom-nav button").forEach(button => button.classList.toggle("active", button.dataset.view === viewId));
    const labels = { homeView: "Overview", palsView: "Pal checklist by area", mapView: "Collectibles and discoveries", progressView: "Completion report", aboutView: "App details" };
    els.headerContext.textContent = labels[viewId];
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (viewId === "palsView") renderPals();
    if (viewId === "mapView") renderMarkers();
    if (viewId === "progressView" || viewId === "homeView") renderAllProgress();
  }

  function openEntry(mode) {
    entryMode = mode;
    const isPal = mode === "pal";
    els.dialogTitle.textContent = isPal ? "Add Pal to area" : "Add map marker";
    els.entryTypeWrap.classList.toggle("hidden", isPal);
    els.entryNoteWrap.classList.toggle("hidden", isPal);
    els.entryName.value = ""; els.entryNote.value = "";
    els.dialog.showModal(); setTimeout(() => els.entryName.focus(), 50);
  }

  function showToast(message) {
    els.toast.textContent = message; els.toast.classList.remove("hidden");
    clearTimeout(showToast.timer); showToast.timer = setTimeout(() => els.toast.classList.add("hidden"), 2200);
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), state }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `palworld-companion-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url); showToast("Backup exported");
  }

  async function importBackup(file) {
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed.state || typeof parsed.state !== "object") throw new Error("Invalid backup");
      state = { ...defaultState, ...parsed.state, checked: parsed.state.checked || {}, customPals: parsed.state.customPals || {}, customMarkers: parsed.state.customMarkers || {} };
      saveState(); setupSelects(); renderPals(); renderMarkers(); renderAllProgress(); showToast("Backup imported");
    } catch { alert("That file is not a valid Palworld Companion backup."); }
  }

  $$(".bottom-nav button").forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));
  $$('[data-go]').forEach(button => button.addEventListener("click", () => switchView(button.dataset.go)));
  els.areaSelect.addEventListener("change", renderPals);
  els.mapAreaSelect.addEventListener("change", renderMarkers);
  els.markerFilter.addEventListener("change", renderMarkers);
  els.palSearch.addEventListener("input", renderPals);
  $("#addPalButton").addEventListener("click", () => openEntry("pal"));
  $("#addMarkerButton").addEventListener("click", () => openEntry("marker"));
  $("#exportButton").addEventListener("click", exportBackup);
  $("#importInput").addEventListener("change", event => event.target.files[0] && importBackup(event.target.files[0]));
  $("#resetButton").addEventListener("click", () => { if (confirm("Reset all checklists and custom entries?")) { localStorage.removeItem(STORAGE_KEY); state = structuredClone(defaultState); setupSelects(); renderPals(); renderMarkers(); renderAllProgress(); showToast("Progress reset"); } });

  els.entryForm.addEventListener("submit", event => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    const name = els.entryName.value.trim(); if (!name) return;
    if (entryMode === "pal") {
      const area = els.areaSelect.value; (state.customPals[area] ||= []);
      if (!getPals(area).some(p => p.toLowerCase() === name.toLowerCase())) state.customPals[area].push(name);
      renderPals();
    } else {
      const area = els.mapAreaSelect.value; (state.customMarkers[area] ||= []);
      state.customMarkers[area].push({ type: els.entryType.value, name, note: els.entryNote.value.trim() }); renderMarkers();
    }
    saveState(); renderAllProgress(); els.dialog.close(); showToast("Entry saved");
  });

  window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); installPrompt = event; els.installButton.classList.remove("hidden"); });
  els.installButton.addEventListener("click", async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; els.installButton.classList.add("hidden"); });
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));

  setupSelects(); renderPals(); renderMarkers(); renderAllProgress();
})();
