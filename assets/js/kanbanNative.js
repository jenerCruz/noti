/*
  agendaView.js
  Vista Agenda Semanal Nativa (sin FullCalendar)
  Con selector de propiedad para colorear eventos.
  Se integra al menú y a la app sin tocar el index.html.
*/

(function(){

  // ----- PALETA -----
  const palette = [
    "#4f46e5", "#16a34a", "#dc2626", "#ea580c",
    "#0891b2", "#9333ea", "#b91c1c", "#0284c7",
    "#7c3aed", "#059669", "#be185d"
  ];

  // Colores persistentes por valor
  const colorCacheKey = "agenda_color_map";
  const colorMap = JSON.parse(localStorage.getItem(colorCacheKey) || "{}");

  function saveColorMap(){
    localStorage.setItem(colorCacheKey, JSON.stringify(colorMap));
  }

  function getColorFor(value){
    if(!value) return "#6b7280"; // gris
    if(colorMap[value]) return colorMap[value];

    const c = palette[Object.keys(colorMap).length % palette.length];
    colorMap[value] = c;
    saveColorMap();
    return c;
  }

  // ----- RANGO DE FECHAS SEMANALES -----
  function getStartOfWeek(date){
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0,0,0,0);
    return d;
  }

  function addDays(date, n){
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  // ----- DIBUJAR AGENDA -----
  function renderAgendaWeek(){
    const container = document.getElementById("content-view");
    if(!container) return;

    const now = new Date();
    const weekStart = getStartOfWeek(now);

    // contenedor
    container.innerHTML = `
      <div class="flex items-center justify-between px-3 py-2 bg-white border-b">
        <div class="font-semibold">Agenda semanal</div>

        <select id="agenda-color-prop" class="border p-1 rounded text-sm">
          <option value="">Color por...</option>
        </select>
      </div>

      <div class="overflow-auto h-[calc(100vh-140px)] bg-gray-50">
        <div id="agenda-grid" class="relative"></div>
      </div>
    `;

    injectColorPropertySelector();

    drawWeekGrid(weekStart);
    drawEvents(weekStart);
  }

  // ----- SELECTOR PARA PROPIEDADES -----
  function injectColorPropertySelector(){
    const select = document.getElementById("agenda-color-prop");
    if(!select) return;

    const ws = state.workspaces.find(w => w.id === state.currentWorkspaceId);
    if(!ws) return;

    ws.properties.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.name;
      opt.textContent = p.name;
      select.appendChild(opt);
    });

    select.addEventListener("change", () => renderAgendaWeek());
  }

  // ----- GRID SEMANAL -----
  function drawWeekGrid(weekStart){
    const grid = document.getElementById("agenda-grid");
    if(!grid) return;

    let html = `
      <div class="grid grid-cols-8 border-b bg-white sticky top-0 z-10">
        <div class="p-2 text-xs font-semibold text-gray-500">Hora</div>
    `;

    for(let i=0;i<7;i++){
      const d = addDays(weekStart, i);
      const label = d.toLocaleDateString("es-ES", { weekday:"short", day:"numeric"});
      html += `<div class="p-2 text-xs text-center font-semibold text-gray-700">${label}</div>`;
    }

    html += `</div>`;

    for(let h=6; h<=23; h++){
      html += `<div class="grid grid-cols-8 border-b relative min-h-[60px]">
        <div class="text-xs text-gray-400 p-1">${h}:00</div>
      </div>`;
    }

    grid.innerHTML = html;
  }

  // ----- DIBUJAR EVENTOS -----
  function drawEvents(weekStart){
    const grid = document.getElementById("agenda-grid");
    const rows = grid.children;

    const ws = state.workspaces.find(w => w.id === state.currentWorkspaceId);
    if(!ws) return;

    // qué propiedad define color
    const colorProp = document.getElementById("agenda-color-prop")?.value || "";

    state.currentRecords.forEach(r => {

      const date = r.properties["Fecha"] || r.properties["fecha"] || null;
      const hora = r.properties["Hora"] || r.properties["hora"] || null;
      if(!date || !hora) return;

      const eventDate = new Date(date);
      if(eventDate < weekStart || eventDate >= addDays(weekStart,7)) return;

      const dayIndex = (eventDate.getDay() + 0) % 7;

      const [h, m] = hora.split(":").map(Number);

      const rowIndex = (h - 6) + 1; // la fila 0 es encabezado

      const row = rows[rowIndex];
      if(!row) return;

      const cells = row.children;
      const cell = cells[dayIndex + 1]; // +1 por columna "Hora"
      if(!cell) return;

      const yOffset = (m / 60) * 60;

      let color = "#6366f1";  
      if(colorProp){
        const v = r.properties[colorProp];
        if(Array.isArray(v)) color = getColorFor(v[0]);
        else color = getColorFor(v);
      }

      const box = document.createElement("div");
      box.className = `
        absolute left-0 right-0 mx-1 p-1 rounded text-xs shadow
        cursor-pointer text-white overflow-hidden 
      `;
      box.style.background = color;
      box.style.top = (cell.offsetTop + yOffset) + "px";

      box.innerHTML = `
        <div class="font-semibold">${r.title || "(sin título)"}</div>
        <div>${hora}</div>
      `;

      box.addEventListener("click", () => showItemModal(r.id));
      grid.appendChild(box);
    });
  }

  // ----- AGREGAR A MENÚ LATERAL -----
  function injectAgendaButton(){
    const menu = document.getElementById("side-menu");
    if(!menu) return;

    const btn = document.createElement("div");
    btn.className = "cursor-pointer px-3 py-2 hover:bg-gray-100 rounded";
    btn.textContent = "Agenda semanal";
    btn.addEventListener("click", renderAgendaWeek);

    menu.appendChild(btn);
  }

  // inicializar
  window.addEventListener("load", injectAgendaButton);
  window.renderAgendaWeek = renderAgendaWeek;

})();