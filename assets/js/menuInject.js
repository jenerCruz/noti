/*
 menuInject.js
 Inyecta botones en la barra lateral y en las tabs para todas las vistas nuevas.
 CRÍTICO: Usa los contenedores existentes #injected-views-container y #view-tabs.
*/

(function() {

  function createButton(text, onclick, className = "w-full text-left p-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 font-medium mb-1 flex items-center gap-3") {
    const btn = document.createElement("button");
    btn.className = className;
    btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        <span>${text}</span>
    `; // Icono genérico para diseño
    btn.addEventListener("click", onclick);
    return btn;
  }

  function injectButtons() {
    // 🚨 CORRECCIÓN CRÍTICA: BUSCAR el contenedor, NO verificar si existe para salir. 🚨
    const cont = document.getElementById("injected-views-container");
    
    if(!cont) {
      console.error("❌ Placeholder '#injected-views-container' no encontrado. No se inyectarán vistas.");
      return;
    }

    // Limpiar por si acaso (para evitar duplicados en re-render)
    cont.innerHTML = ''; 

    // --- Inyección de botones de menú lateral ---

    // Agenda semanal
    cont.appendChild(createButton("Agenda semanal", ()=> {
      state.currentView = "agendaCustom"; 
      window.refreshViews && window.refreshViews();
    }));

    // Panel+
    cont.appendChild(createButton("Panel+", ()=> {
      state.currentView = "panel2";
      window.refreshViews && window.refreshViews();
    }));

    // Galería
    cont.appendChild(createButton("Galería", ()=> {
      state.currentView = "galeria";
      window.refreshViews && window.refreshViews();
    }));

    // Kanban Native
    cont.appendChild(createButton("Kanban nativo", ()=> {
      state.currentView = "kanbanNative";
      window.refreshViews && window.refreshViews();
    }));
    
    console.log("✅ Vistas de extensión inyectadas en el menú lateral.");
  }
  
  // Inyectar botones en el header (Vista de Tabs)
  function injectIntoTabs(){
    const tabs = document.getElementById("view-tabs");
    if(!tabs || tabs.querySelector("[data-injected='true']")) return;

    const span = document.createElement("div");
    span.dataset.injected = "true";
    span.className = "flex items-center space-x-2";

    // NOTA: La vista "Tabla" ya se renderiza en views.js. Aquí solo inyectamos las extras.
    
    const viewsToInject = [
      { text: "Kanban", view: "kanbanNative" },
      { text: "Agenda", view: "agendaCustom" },
      { text: "Panel+", view: "panel2" }
    ];

    viewsToInject.forEach(v => {
        const btn = document.createElement("button");
        btn.className="px-3 py-1 rounded-md text-sm font-medium transition duration-150 text-gray-600 hover:bg-gray-200";
        btn.textContent=v.text;
        btn.onclick = ()=> { 
            state.currentView = v.view; 
            window.refreshViews && window.refreshViews(); 
        };
        span.appendChild(btn);
    });

    tabs.appendChild(span);
  }

  // ---- EXPOSICIÓN GLOBAL para views.js ----
  window.MenuInject = { injectButtons, injectIntoTabs };

})();
