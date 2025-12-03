/*
  views.js - Lógica principal de la aplicación
  Define el estado global y las funciones de control de vistas.
*/

// ===========================================
// 1. ESTADO GLOBAL DE LA APLICACIÓN (CRUCIAL)
// ===========================================
window.state = {
    currentWorkspaceId: null, // ID del workspace activo
    currentView: "table",     // Vista activa (table, kanbanNative, agendaCustom, etc.)
    workspaces: [],           // Lista de workspaces cargados
    currentRecords: [],       // Registros del workspace activo
};


// ===========================================
// 2. FUNCIONES DE INICIO Y CONTROL
// ===========================================

// Función de arranque (Llamada al final del HTML)
async function initApp() {
    console.log("App: Iniciando aplicación...");
    
    // 1. Inicializar la DB (usa db-sqlite.js)
    const dbReady = await dbLocal.init();
    if (!dbReady) return;

    // 2. Cargar Workspaces
    state.workspaces = await dbLocal.getWorkspaces();
    if (state.workspaces.length === 0) {
        // Manejar el caso de que no haya workspaces
        console.warn("No hay workspaces. La DB se inicializó con uno por defecto.");
    }

    // 3. Establecer el Workspace activo (usa el primero)
    state.currentWorkspaceId = state.workspaces[0]?.id || null;
    
    // 4. Cargar Registros
    if (state.currentWorkspaceId) {
        state.currentRecords = await dbLocal.getRecords(state.currentWorkspaceId);
    }

    // 5. Renderizar la interfaz
    refreshViews();
    console.log("App: Carga inicial completada.");
}


// Refresca todos los componentes de la UI basados en 'state'
function refreshViews() {
    renderSidebarWorkspaces();
    renderTabs();
    renderContent();
}


// ===========================================
// 3. FUNCIONES DE UI (Stubs)
// ===========================================

// Renderiza la lista de workspaces en el sidebar (usa #workspaces-list)
function renderSidebarWorkspaces() {
    const list = document.getElementById('workspaces-list');
    if (!list) return;
    list.innerHTML = '';
    
    state.workspaces.forEach(ws => {
        const btn = document.createElement('button');
        btn.textContent = ws.name;
        btn.className = 'workspace-btn w-full text-left p-2 rounded-lg hover:bg-gray-50 flex items-center gap-3 ' + (ws.id === state.currentWorkspaceId ? 'bg-gray-200' : '');
        btn.onclick = () => { setActiveWorkspace(ws.id); };
        list.appendChild(btn);
    });
}

// Renderiza los tabs de vista (Tabla, Galería, etc.) (usa #view-tabs)
function renderTabs() {
    const tabs = document.getElementById('view-tabs');
    // Lógica para renderizar los tabs de vista por defecto (Tabla, Galería, etc.)
    // Los scripts de extensión como menuInject.js también modificarán esta sección.
}

// Renderiza el contenido principal (llama a la vista activa: tabla, agenda, kanban)
function renderContent() {
    const container = document.getElementById('current-view-container');
    if (!container) return;
    
    // Limpiar container
    container.innerHTML = ''; 

    // Lógica condicional para renderizar la vista correcta
    if (state.currentView === 'kanbanNative' && typeof window.renderKanban === 'function') {
        window.renderKanban(container);
    } else if (state.currentView === 'agendaCustom' && typeof window.renderAgendaWeek === 'function') {
        window.renderAgendaWeek(container);
    } else {
        // Vista por defecto (ej. Tabla o Panel)
        container.innerHTML = `<h2>Vista: ${state.currentView}</h2>`;
        // Aquí iría tu función renderTable(container); o renderPanel(container);
    }
}


// ===========================================
// 4. FUNCIONES GLOBALES (Llamadas desde el HTML)
// ===========================================

// Cambia el workspace activo y refresca
async function setActiveWorkspace(workspaceId) {
    state.currentWorkspaceId = workspaceId;
    // Recargar registros
    state.currentRecords = await dbLocal.getRecords(state.currentWorkspaceId);
    refreshViews();
}

// Abre el modal para crear/editar un registro (usa properties.js y rules.js)
function showItemModal(recordId = null) {
    console.log(`Abriendo modal para ID: ${recordId}`);
    // Aquí se usaría PropertiesModule para construir el formulario
    // Aquí se usaría RulesModule para aplicar validaciones
    // La función de guardado dentro del modal llamaría a dbLocal.saveRecord()
}

// Crea un nuevo workspace (Llamado desde el HTML)
async function addWorkspace() {
    const newName = prompt("Introduce el nombre del nuevo espacio de trabajo:");
    if (newName) {
        const newWs = {
            id: 'ws-' + Date.now(),
            name: newName,
            properties: [] // Usa initialProperties o un array vacío
        };
        await dbLocal.saveWorkspace(newWs);
        state.workspaces.push(newWs);
        // Cambiar inmediatamente al nuevo workspace
        await setActiveWorkspace(newWs.id);
    }
}

// Exporta todos los datos a Gist (Llamado desde el HTML)
async function exportToGist() {
    // Lógica para obtener datos de dbLocal.exportData() y enviarlos a Gist
    alert("Exportación de datos simulada.");
}

// Exponer funciones globales
window.initApp = initApp;
window.refreshViews = refreshViews;
window.renderContent = renderContent; // Para que las vistas puedan forzar un re-render
window.renderTabs = renderTabs;
window.showItemModal = showItemModal;
window.addWorkspace = addWorkspace;
window.exportToGist = exportToGist;
// ... (Otras funciones que necesites exponer) ...
