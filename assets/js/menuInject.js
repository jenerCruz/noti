/*
 menuInject.js
 Inyecta botones en la barra lateral y en las tabs para todas las vistas nuevas.
 - Evita duplicados
 - Si ya existe la vista en renderTabs, no duplica
 - Conecta Agenda semanal, Panel+, Galería (ya definidas), Kanban nativo
 - También crea un mini menú de configuración para 'color by' por vista
*/

(function(){

  function ensureSidebar(){
    // intenta detectar tu sidebar; en tu index lo llamaste 'sidebar'
    const sidebar = document.getElementById("sidebar");
    if(!sidebar) return null;

    // sección de vistas -> si existe view-tabs también añade
    return sidebar;
  }

  function createButton(text, onclick, className = "w-full text-left p-2 rounded-lg hover:bg-gray-100 text-gray-800 font-medium mb-1"){
    const btn = document.createElement("button");
    btn.className = className;
    btn.textContent = text;
    btn.addEventListener("click", onclick);
    return btn;
  }

  function injectButtons(){
    const sb = ensureSidebar();
    if(!sb) return;

    // avoid duplicate container
    if(document.getElementById("injected-views-container")) {
      return;
    }

    const cont = document.createElement("div");
    cont.id = "injected-views-container";
    cont.className = "mt-4 p-2 border-t";

    // Agenda semanal
    cont.appendChild(createButton("Agenda semanal", ()=> {
      state.currentView = "agendaCustom" /* alias */;
      // render using the existing function if present
      if(typeof window.renderAgendaWeek === "function") window.renderAgendaWeek();
      else window.renderContent();
    }));

    // Panel+
    cont.appendChild(createButton("Panel+", ()=> {
      state.currentView = "panel2";
      window.renderTabs && window.renderTabs();
      window.renderContent && window.renderContent();
    }));

    // Galería
    cont.appendChild(createButton("Galería", ()=> {
      state.currentView = "galeria";
      window.renderTabs && window.renderTabs();
      window.renderContent && window.renderContent();
    }));

    // Kanban Native
    cont.appendChild(createButton("Kanban nativo", ()=> {
      state.currentView = "kanbanNative";
      window.renderTabs && window.renderTabs();
      window.renderContent && window.renderContent();
    }));

    // small config button for color-by defaults
    const cfg = document.createElement("div");
    cfg.className = "mt-3";
    cfg.appendChild(createButton("Configurar colores por vista", openColorConfig, "w-full text-left p-2 rounded-lg bg-indigo-50 text-indigo-700 font-medium"));
    cont.appendChild(cfg);

    // append to sidebar (before the + nuevo espacio)
    const insertBefore = sb.querySelector("button:nth-last-child(1)") || null;
    if(insertBefore) sb.insertBefore(cont, insertBefore);
    else sb.appendChild(cont);
  }

  function openColorConfig(){
    // modal to set default color-by property for each view
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
    const box = document.createElement("div");
    box.className = "bg-white p-4 rounded-xl w-96 max-h-[80vh] overflow-auto";
    box.innerHTML = "<h3 class='font-semibold mb-3'>Configurar color por vista</h3>";

    const views = ["Agenda semanal","Kanban nativo","Galería","Panel+"];
    views.forEach(v=>{
      const row = document.createElement("div");
      row.className = "mb-3";
      const label = document.createElement("div"); label.className = "text-sm font-medium"; label.textContent = v;
      const input = document.createElement("input"); input.className = "w-full p-2 border rounded text-sm";
      input.placeholder = "Nombre de propiedad (ej. Estado, Categoría)";
      // load saved
      input.value = localStorage.getItem("color_prop_for_"+v) || "";
      row.appendChild(label); row.appendChild(input);
      box.appendChild(row);
    });

    const btnSave = document.createElement("button"); btnSave.className="px-3 py-2 bg-indigo-600 text-white rounded";
    btnSave.textContent="Guardar";
    btnSave.onclick = ()=>{
      const inputs = box.querySelectorAll("input");
      inputs.forEach((inp,i)=>{
        localStorage.setItem("color_prop_for_"+views[i], inp.value.trim());
      });
      modal.remove();
      alert("Configuración guardada");
    };
    box.appendChild(btnSave);

    modal.appendChild(box);
    modal.addEventListener("click", (e)=> { if(e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  // Add also to header tabs container if exists
  function injectIntoTabs(){
    const tabs = document.getElementById("view-tabs");
    if(!tabs) return;
    // avoid duplicates
    if(tabs.querySelector("[data-injected='true']")) return;

    const span = document.createElement("div");
    span.dataset.injected = "true";
    span.className = "flex items-center space-x-2";

    const btnAgenda = document.createElement("button");
    btnAgenda.className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 text-gray-600";
    btnAgenda.textContent="Agenda";
    btnAgenda.onclick = ()=> { state.currentView = "agendaCustom"; window.renderTabs && window.renderTabs(); window.renderContent && window.renderContent(); };

    const btnKanban = document.createElement("button");
    btnKanban.className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 text-gray-600";
    btnKanban.textContent="Kanban+";
    btnKanban.onclick = ()=> { state.currentView = "kanbanNative"; window.renderTabs && window.renderTabs(); window.renderContent && window.renderContent(); };

    span.appendChild(btnAgenda); span.appendChild(btnKanban);
    tabs.appendChild(span);
  }

  // run on load
  window.addEventListener("load", ()=> {
    try { injectButtons(); injectIntoTabs(); } catch(e){ console.error(e); }
  });

  // expose API
  window.MenuInject = { injectButtons, injectIntoTabs };

})();