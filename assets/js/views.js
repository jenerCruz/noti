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
// 2. FUNCIÓN PRINCIPAL (PUNTO DE INICIO)
// ===========================================
async function initApp() {
    console.log("App: Iniciando aplicación...");

    // 1. Inicializar SQLite
    if (typeof dbLocal === 'undefined') {
        console.error("❌ Error: db-sqlite.js no está cargado.");
        return;
    }

    const dbReady = await dbLocal.init();
    if (!dbReady) return;

    // 2. Inicializar Responsivo
    if (typeof initResponsiveLayout === "function") {
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

    // 5. Inyección del menú
    if (window.MenuInject && typeof window.MenuInject.injectButtons === "function") {
        window.MenuInject.injectButtons();
    }
    if (window.MenuInject && typeof window.MenuInject.injectIntoTabs === "function") {
        window.MenuInject.injectIntoTabs();
    }

    console.log("✅ App: Carga inicial completada.");
}



// ===========================================
// 3. RENDER GENERAL
// ===========================================
function refreshViews() {
    console.log("UI: Refrescando vistas...");
    renderSidebarWorkspaces();
    renderTabs();
    renderContent();
}



// ===========================================
// 4. RENDER SIDEBAR
// ===========================================
function renderSidebarWorkspaces() {
    const container = document.getElementById("workspaceList");
    if (!container) return;

    container.innerHTML = "";

    state.workspaces.forEach(ws => {
        const div = document.createElement("div");
        div.className = "workspace-item " +
                        (ws.id === state.currentWorkspaceId ? "active" : "");

        div.innerHTML = `
            <span>${ws.name}</span>
            <button onclick="setActiveWorkspace(${ws.id})">Abrir</button>
        `;

        container.appendChild(div);
    });
}



// ===========================================
// 5. RENDER TABS
// ===========================================
function renderTabs() {
    const tabs = document.getElementById("mainTabs");
    if (!tabs) return;

    tabs.innerHTML = `
        <button class="${state.currentView === "table" ? "active" : ""}"
                onclick="state.currentView='table'; refreshViews();">
            Tabla
        </button>

        <button class="${state.currentView === "cards" ? "active" : ""}"
                onclick="state.currentView='cards'; refreshViews();">
            Tarjetas
        </button>
    `;
}



// ===========================================
// 6. RENDER CONTENIDO PRINCIPAL
// ===========================================
function renderContent() {
    const container = document.getElementById("mainContent");
    if (!container) return;

    if (!state.currentWorkspaceId) {
        container.innerHTML = "<p>No hay workspace seleccionado.</p>";
        return;
    }

    if (state.currentView === "table") {
        container.innerHTML = renderTableView(state.currentRecords);
    } else {
        container.innerHTML = renderCardsView(state.currentRecords);
    }
}


// ------ Render Tabla ------
function renderTableView(records) {
    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th><th>Texto</th><th>Fecha</th>
                </tr>
            </thead>
            <tbody>
                ${records.map(r => `
                    <tr>
                        <td>${r.id}</td>
                        <td>${r.text}</td>
                        <td>${r.created_at}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}


// ------ Render Cards ------
function renderCardsView(records) {
    return `
        <div class="cards">
            ${records.map(r => `
                <div class="card">
                    <p>${r.text}</p>
                    <span>${r.created_at}</span>
                </div>
            `).join("")}
        </div>
    `;
}



// ===========================================
// 7. CAMBIAR WORKSPACE
// ===========================================
async function setActiveWorkspace(id) {
    state.currentWorkspaceId = id;
    state.currentRecords = await dbLocal.getRecords(id);
    refreshViews();
}



// ===========================================
// 8. MODAL PARA AGREGAR ITEMS
// ===========================================
function showItemModal() {
    const modal = document.getElementById("itemModal");
    if (modal) modal.style.display = "block";
}



// ===========================================
// 9. AGREGAR NUEVA ENTRADA
// ===========================================
async function addWorkspace() {
    const nameInput = document.getElementById("workspaceName");
    if (!nameInput || !nameInput.value.trim()) return;

    const id = await dbLocal.createWorkspace(nameInput.value.trim());
    state.workspaces = await dbLocal.getWorkspaces();

    state.currentWorkspaceId = id;
    state.currentRecords = [];

    refreshViews();
}



// ===========================================
// 10. EXPORTAR A GIST
// ===========================================
async function exportToGist() {
    if (typeof gistExport === "undefined") {
        alert("Error: módulo de Gist no cargado.");
        return;
    }

    await gistExport.export(state);
    alert("Exportado a Gist correctamente");
}



// ===========================================
// 11. EXPOSICIÓN GLOBAL
// ===========================================
window.initApp = initApp;
window.refreshViews = refreshViews;
window.setActiveWorkspace = setActiveWorkspace;
window.showItemModal = showItemModal;
window.addWorkspace = addWorkspace;
window.exportToGist = exportToGist;

console.log("views.js cargado completamente.");