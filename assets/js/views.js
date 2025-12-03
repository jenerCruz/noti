/*
  views.js - Lógica principal de la aplicación
  Orquesta la inicialización de la DB, el estado, la UI y los módulos (responsive, menú).
*/

// ===========================================
// 1. ESTADO GLOBAL DE LA APLICACIÓN
// ===========================================
window.state = {
    currentWorkspaceId: null, 
    currentView: "table",     
    workspaces: [],           
    currentRecords: [],       
};


// ===========================================
// 2. FUNCIÓN DE INICIO (El nuevo punto de partida)
// ===========================================
async function initApp() {
    console.log("App: Iniciando aplicación...");
    
    // 1. Inicializar la DB
    if (typeof dbLocal === 'undefined') {
        console.error("❌ Error: db-sqlite.js no está cargado.");
        return;
    }
    const dbReady = await dbLocal.init();
    if (!dbReady) return;

    // 2. Lógica Responsiva (responsive.js) - Se inicia ahora, después de que el DOM está listo
    if (typeof initResponsiveLayout === 'function') {
        initResponsiveLayout();
    }
    
    // 3. Cargar datos iniciales
    state.workspaces = await dbLocal.getWorkspaces();
    state.currentWorkspaceId = state.workspaces[0]?.id || null;
    if (state.currentWorkspaceId) {
        state.currentRecords = await dbLocal.getRecords(state.currentWorkspaceId);
    }

    // 4. Renderizado inicial
    refreshViews();
    
    // 5. Inyección de Vistas (menuInject.js) - Se asegura de que se inyecte solo después del render
    if (typeof window.MenuInject === 'object' && typeof window.MenuInject.injectButtons === 'function') {
        window.MenuInject.injectButtons();
        window.MenuInject.injectIntoTabs();
    } else {
        console.warn("Módulo menuInject no disponible.");
    }
    
    console.log("✅ App: Carga inicial completada.");
}


// ... (El resto de las funciones refreshViews, renderSidebarWorkspaces, 
// renderTabs, renderContent, setActiveWorkspace, showItemModal, 
// addWorkspace, exportToGist siguen igual que la versión anterior de views.js) ...

// ---- EXPOSICIÓN GLOBAL ----
window.initApp = initApp;
window.refreshViews = refreshViews;
// ... (otras funciones globales) ...
