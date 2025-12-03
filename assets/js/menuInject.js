/*
 menuInject.js
 Inyecta botones en la barra lateral y en las tabs para todas las vistas nuevas.
 *** Versión corregida para usar placeholder existente ***
*/

(function(){

  function createButton(text, onclick, className = "w-full text-left p-2 rounded-lg hover:bg-gray-100 text-gray-800 font-medium mb-1") {
    // ... (función createButton no cambia) ...
    const btn = document.createElement("button");
    btn.className = className;
    btn.textContent = text;
    btn.addEventListener("click", onclick);
    return btn;
  }

  function injectButtons(){
    // 🚨 CORRECCIÓN CRÍTICA: Buscar el contenedor, NO crearlo ni insertarlo con before 🚨
    const cont = document.getElementById("injected-views-container");
    
    if(!cont) {
      console.error("❌ Placeholder '#injected-views-container' no encontrado. No se inyectarán vistas.");
      return;
    }

    // Si ya tiene contenido, asumir que ya se inyectó.
    if(cont.children.length > 0) return;

    // --- Inyección de botones directa al contenedor (cont) ---

    // Agenda semanal
    cont.appendChild(createButton("Agenda semanal", ()=> {
      state.currentView = "agendaCustom"; 
      if(typeof window.renderAgendaWeek === "function") window.renderAgendaWeek();
      else window.renderContent();
    }));

    // Panel+
    cont.appendChild(createButton("Panel+", ()=> {
      state.currentView = "panel2";
      window.refreshViews && window.refreshViews(); // Llama a refreshViews para actualizar
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

    // small config button for color-by defaults
    const cfg = document.createElement("div");
    cfg.className = "mt-3";
    // ... (Resto de la lógica del botón de configuración de colores) ...
    
    console.log("✅ Vistas de extensión inyectadas en el menú lateral.");
  }
  
  // ... (El resto de las funciones openColorConfig, injectIntoTabs sigue igual) ...

  // ---- EXPOSICIÓN GLOBAL ----
  // Quitamos el listener 'load' y exponemos las funciones para que views.js las llame.
  window.MenuInject = { injectButtons, injectIntoTabs };

})();
