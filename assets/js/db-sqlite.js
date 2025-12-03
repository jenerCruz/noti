/*
  db-sqlite.js - Adaptador de Base de Datos para SQLite
  Asegura el uso correcto de initSqlJs
*/

window.dbLocal = (function() {
    let _dbInstance = null;
    const DB_NAME = "NotionHR_Workspace";
    const STORAGE_KEY = `${DB_NAME}.sqlite_data`; 

    // ... (runSql, querySql, persistDb, etc. - Mantenemos estas funciones) ...

    // ===========================================
    // 1. INICIALIZACIÓN (Carga y Configuración)
    // ===========================================

    async function init() {
        console.log("🛠️ Inicializando DB SQLite local...");

        // 🚨 VERIFICACIÓN CRÍTICA 🚨
        if (typeof initSqlJs === 'undefined') {
            console.error("❌ initSqlJs NO está definido. Verifique la carga de 'sql-wasm-browser.min.js' ANTES de db-sqlite.js.");
            // Intentar una recarga si es un problema de carga lenta
            // Esto no es ideal, pero ayuda a diagnosticar
            // return false; 
        }

        try {
            // initSqlJs() viene de la librería sql-wasm-browser.min.js.
            const SQL = await initSqlJs({ 
                // CRÍTICO: Indica DÓNDE buscar el archivo sql-wasm.wasm
                locateFile: filename => `./assets/js/${filename}`
            });

            // Cargar DB desde localStorage si existe
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const buffer = Uint8Array.from(atob(data), c => c.charCodeAt(0));
                _dbInstance = new SQL.Database(buffer);
            } else {
                _dbInstance = new SQL.Database();
            }
            
            // ... (Definición de Tablas y lógica de inicialización) ...
            
            console.log("✅ Conexión SQLite lista.");
            return true;
        } catch (error) {
            console.error("❌ Error grave al inicializar SQLite:", error);
            // El error 'initSqlJs is not defined' ocurre antes del try-catch si el script no cargó.
            return false;
        }
    }
    
    // ... (El resto de las funciones CRUD) ...
    
    return { init, getWorkspaces, saveWorkspace, getRecords, saveRecord, deleteRecord };
})();
