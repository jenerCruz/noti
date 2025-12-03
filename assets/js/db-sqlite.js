/*
  db-sqlite.js - Adaptador de Base de Datos para SQLite
  *** Versión Integrada con sql-wasm-browser.min.js ***
*/

window.dbLocal = (function() {
    let _dbInstance = null;
    const DB_NAME = "NotionHR_Workspace";
    // Clave en localStorage para guardar la base de datos binaria
    const STORAGE_KEY = `${DB_NAME}.sqlite_data`; 

    // --- Funciones Auxiliares de SQL ---
    
    // Ejecuta una sentencia sin esperar resultados (INSERT, UPDATE, DELETE, CREATE)
    function runSql(query, params = []) {
        if (!_dbInstance) return;
        try {
            _dbInstance.run(query, params);
        } catch (e) {
            console.error("❌ Error al ejecutar SQL:", query, params, e);
        }
        // Persistir inmediatamente después de cualquier cambio
        persistDb();
    }

    // Consulta datos y retorna un array de objetos (SELECT)
    function querySql(query, params = []) {
        if (!_dbInstance) return [];
        try {
            const res = _dbInstance.exec(query, params);
            if (!res || res.length === 0) return [];

            // Mapear resultados (convierte el formato de sql.js a un array de objetos JS)
            const rows = res[0].values;
            const columns = res[0].columns;
            return rows.map(row => {
                const obj = {};
                row.forEach((value, i) => {
                    obj[columns[i]] = value;
                });
                return obj;
            });
        } catch (e) {
            console.error("❌ Error al consultar SQL:", query, params, e);
            return [];
        }
    }

    // Guardar la DB completa en localStorage para persistir entre sesiones
    function persistDb() {
        if (!_dbInstance) return;
        try {
            const data = _dbInstance.export(); // Obtiene el archivo .sqlite binario
            // Codificar el array binario a Base64 para guardarlo en localStorage (string)
            const base64 = btoa(String.fromCharCode.apply(null, data));
            localStorage.setItem(STORAGE_KEY, base64);
        } catch (error) {
            console.error("No se pudo persistir la DB:", error);
        }
    }

    // ===========================================
    // 1. INICIALIZACIÓN (Carga y Configuración)
    // ===========================================

    async function init() {
        console.log("🛠️ Inicializando DB SQLite local...");

        // initSqlJs() viene de la librería sql-wasm-browser.min.js.
        try {
            // Pasamos un objeto de configuración para que encuentre el archivo .wasm
            const SQL = await initSqlJs({ 
                // La función locateFile debe devolver la ruta correcta para sql-wasm.wasm
                locateFile: filename => `./assets/js/${filename}` // Esto localizará 'sql-wasm.wasm'
            });

            // Cargar DB desde localStorage si existe
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const buffer = Uint8Array.from(atob(data), c => c.charCodeAt(0));
                _dbInstance = new SQL.Database(buffer);
            } else {
                _dbInstance = new SQL.Database();
            }
            
            // Definición de Tablas
            runSql(`CREATE TABLE IF NOT EXISTS Workspaces (
                id TEXT PRIMARY KEY, 
                name TEXT NOT NULL, 
                properties TEXT
            )`);
            runSql(`CREATE TABLE IF NOT EXISTS Records (
                id TEXT PRIMARY KEY, 
                workspaceId TEXT, 
                title TEXT, 
                properties TEXT
            )`);

            // Inicializar con un workspace por defecto si está vacío
            const wsCount = querySql("SELECT COUNT(*) as count FROM Workspaces")[0]?.count || 0;
            if (wsCount === 0) {
                const initialWs = { id: "ws-main", name: "Principal", properties: window.initialProperties || [] };
                await saveWorkspace(initialWs); 
            }

            console.log("✅ Conexión SQLite lista.");
            return true;
        } catch (error) {
            console.error("❌ Error grave al inicializar SQLite:", error);
            alert("Error: No se pudo cargar el motor SQLite. Verifique la ruta de 'sql-wasm-browser.min.js' y 'sql-wasm.wasm' en './assets/js/'.");
            return false;
        }
    }

    // ===========================================
    // 2. OPERACIONES CRUD Workspaces
    // ===========================================

    async function getWorkspaces() {
        const results = querySql("SELECT * FROM Workspaces");
        return results.map(row => ({
            ...row, 
            properties: JSON.parse(row.properties || '[]')
        }));
    }

    async function saveWorkspace(workspace) {
        const propsJson = JSON.stringify(workspace.properties);
        runSql("REPLACE INTO Workspaces (id, name, properties) VALUES (?, ?, ?)", 
               [workspace.id, workspace.name, propsJson]);
    }

    // ===========================================
    // 3. OPERACIONES CRUD Records
    // ===========================================

    async function getRecords(workspaceId) {
        const results = querySql("SELECT * FROM Records WHERE workspaceId = ?", [workspaceId]);
        return results.map(row => ({
            ...row, 
            properties: JSON.parse(row.properties || '{}')
        }));
    }

    async function saveRecord(record) {
        if (!record.id) record.id = `rec-${Date.now()}`;
        
        const propsJson = JSON.stringify(record.properties);
        runSql("REPLACE INTO Records (id, workspaceId, title, properties) VALUES (?, ?, ?, ?)", 
               [record.id, record.workspaceId, record.title, propsJson]);
        return record.id;
    }

    async function deleteRecord(recordId) {
        runSql("DELETE FROM Records WHERE id = ?", [recordId]);
    }
    
    // ===========================================
    // EXPORT PÚBLICO
    // ===========================================

    return {
        init,
        getWorkspaces,
        saveWorkspace,
        getRecords,
        saveRecord,
        deleteRecord
    };
})();
