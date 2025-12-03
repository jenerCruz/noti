/*
  db-sqlite.js - Adaptador de Base de Datos para SQLite
  CRÍTICO: Depende de que sql-wasm-browser.min.js se cargue primero.
*/

window.dbLocal = (function() {
    let _dbInstance = null;
    const DB_NAME = "NotionHR_Workspace";
    const STORAGE_KEY = `${DB_NAME}.sqlite_data`;
    // const INITIAL_WORKSPACE_NAME = "Mi Primer Proyecto"; // Puedes definir esto

    // --- Funciones de Utilidad (runSql, querySql, persistDb, etc.) van aquí ---

    // ===========================================
    // 1. INICIALIZACIÓN (Carga y Configuración)
    // ===========================================

    async function init() {
        console.log("🛠️ Inicializando DB SQLite local...");

        // **El error initSqlJs is not defined ocurre si el script anterior no cargó.**
        // Si el orden en index.html es correcto, es un problema de ruta o cache.
        // Aquí asumimos que el script está cargado (gracias al orden).
        
        try {
            // initSqlJs() viene de sql-wasm-browser.min.js.
            // locateFile le indica dónde encontrar el archivo binario sql-wasm.wasm.
            const SQL = await initSqlJs({ 
                locateFile: filename => `./assets/js/${filename}`
            });

            // Lógica de carga/creación de la base de datos
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const buffer = Uint8Array.from(atob(data), c => c.charCodeAt(0));
                _dbInstance = new SQL.Database(buffer);
            } else {
                _dbInstance = new SQL.Database();
                // **Crear tablas iniciales si la DB es nueva**
                _dbInstance.run("CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, name TEXT, properties TEXT, rules TEXT);");
                _dbInstance.run("CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, workspaceId TEXT, title TEXT, properties TEXT);");
                // Inicializar con un workspace por defecto si no hay
                saveWorkspace({ 
                    id: 'default-ws', 
                    name: 'Proyecto Principal', 
                    properties: JSON.stringify([]) 
                });
            }
            
            // Forzar la persistencia en cada operación de escritura
            // (La función persistDb no está aquí, pero asumo que existe)
            
            console.log("✅ Conexión SQLite lista.");
            return true;
        } catch (error) {
            console.error("❌ Error grave al inicializar SQLite:", error);
            return false;
        }
    }
    
    // --- STUBS de funciones CRUD ---
    // Debes tener la implementación completa de estas funciones
    async function getWorkspaces() { /* ... */ return [{ id: 'default-ws', name: 'Proyecto Principal' }]; }
    async function saveWorkspace(ws) { /* ... */ }
    async function getRecords(wsId) { /* ... */ return []; }
    async function saveRecord(record) { /* ... */ }
    async function deleteRecord(recordId) { /* ... */ }

    
    return { 
        init, 
        getWorkspaces, 
        saveWorkspace, 
        getRecords, 
        saveRecord, 
        deleteRecord 
    };
})();
