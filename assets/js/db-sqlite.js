/*
  db-sqlite.js - Adaptador de Base de Datos para SQLite
  Reemplaza a Dexie.js (IndexedDB) con una capa de abstracción basada en SQLite.
  Expone el objeto global 'window.dbLocal' con las funciones asíncronas de la API de datos.
*/

window.dbLocal = (function() {
    let _dbInstance = null; // Instancia de la base de datos SQLite (ej: new SQL.Database())
    const DB_NAME = "NotionHR_Workspace";

    // --- MOCK/SIMULACIÓN DE DATOS EN MEMORIA ---
    // Usar solo para desarrollo. Reemplazar por la lógica real de consulta a SQLite.
    let _mockWorkspaces = [];
    let _mockRecords = [];

    // ===========================================
    // 1. INICIALIZACIÓN
    // ===========================================

    async function init() {
        console.log("🛠️ Inicializando adaptador de DB SQLite...");

        try {
            // 💡 PASO 1: Cargar la librería SQLite.
            // Si usas sql.js, la lógica real iría aquí:
            // const SQL = await initSqlJs({ locateFile: file => './assets/js/sql-wasm.wasm' });
            // _dbInstance = new SQL.Database();
            
            // --- Carga de datos de ejemplo (solo para la simulación) ---
            if (localStorage.getItem('db_initialized') !== 'true') {
                _mockWorkspaces = [
                    { id: "ws-main", name: "Principal", properties: window.initialProperties || [] },
                    { id: "ws-hr", name: "Recursos Humanos", properties: [] }
                ];
                _mockRecords = [];
                localStorage.setItem('db_initialized', 'true');
                console.log("Datos de ejemplo cargados en la simulación.");
            } else {
                // Recuperar datos mock si existen
                _mockWorkspaces = JSON.parse(localStorage.getItem('workspaces') || '[]');
                _mockRecords = JSON.parse(localStorage.getItem('records') || '[]');
            }


            // 💡 PASO 2: Crear Tablas.
            // _dbInstance.run("CREATE TABLE IF NOT EXISTS Workspaces (id TEXT PRIMARY KEY, name TEXT, properties TEXT)");
            // _dbInstance.run("CREATE TABLE IF NOT EXISTS Records (id TEXT PRIMARY KEY, workspaceId TEXT, title TEXT, properties TEXT)");

            console.log("✅ Conexión SQLite simulada exitosa.");
            return true;
        } catch (error) {
            console.error("❌ Error al inicializar DB SQLite simulada:", error);
            return false;
        }
    }

    // ===========================================
    // 2. OPERACIONES DE WORKSPACES
    // ===========================================

    async function getWorkspaces() {
        // 💡 Lógica SQLite:
        // const stmt = _dbInstance.prepare("SELECT * FROM Workspaces");
        // return stmt.all().map(row => ({...row, properties: JSON.parse(row.properties)}));

        // --- SIMULACIÓN ---
        return _mockWorkspaces;
    }

    async function saveWorkspace(workspace) {
        // 💡 Lógica SQLite:
        // const propsJson = JSON.stringify(workspace.properties);
        // _dbInstance.run("REPLACE INTO Workspaces (id, name, properties) VALUES (?, ?, ?)", [workspace.id, workspace.name, propsJson]);

        // --- SIMULACIÓN ---
        const index = _mockWorkspaces.findIndex(w => w.id === workspace.id);
        if (index > -1) {
            _mockWorkspaces[index] = workspace;
        } else {
            _mockWorkspaces.push(workspace);
        }
        localStorage.setItem('workspaces', JSON.stringify(_mockWorkspaces));
        console.log(`dbLocal: Workspace ${workspace.id} guardado.`);
    }

    // ===========================================
    // 3. OPERACIONES DE REGISTROS (RECORDS/ITEMS)
    // ===========================================

    async function getRecords(workspaceId) {
        // 💡 Lógica SQLite:
        // const stmt = _dbInstance.prepare("SELECT * FROM Records WHERE workspaceId = ?");
        // return stmt.all(workspaceId).map(row => ({...row, properties: JSON.parse(row.properties)}));

        // --- SIMULACIÓN ---
        return _mockRecords.filter(r => r.workspaceId === workspaceId);
    }

    async function saveRecord(record) {
        // Asegurar ID si es nuevo (esto debería hacerlo views.js, pero lo aseguramos)
        if (!record.id) record.id = `rec-${Date.now()}`;

        // 💡 Lógica SQLite:
        // const propsJson = JSON.stringify(record.properties);
        // _dbInstance.run("REPLACE INTO Records (id, workspaceId, title, properties) VALUES (?, ?, ?, ?)", [record.id, record.workspaceId, record.title, propsJson]);

        // --- SIMULACIÓN ---
        const index = _mockRecords.findIndex(r => r.id === record.id);
        if (index > -1) {
            _mockRecords[index] = record;
        } else {
            _mockRecords.push(record);
        }
        localStorage.setItem('records', JSON.stringify(_mockRecords));
        console.log(`dbLocal: Record ${record.id} guardado.`);
        return record.id;
    }

    async function deleteRecord(recordId) {
        // 💡 Lógica SQLite:
        // _dbInstance.run("DELETE FROM Records WHERE id = ?", [recordId]);

        // --- SIMULACIÓN ---
        _mockRecords = _mockRecords.filter(r => r.id !== recordId);
        localStorage.setItem('records', JSON.stringify(_mockRecords));
        console.log(`dbLocal: Record ${recordId} eliminado.`);
    }
    
    // ===========================================
    // 4. EXPORTAR DATOS PARA BACKUP (GIST)
    // ===========================================
    
    async function exportData() {
        // 💡 Lógica SQLite:
        // Deberías exportar TODAS las filas de Workspaces y Records.
        // return { workspaces: _dbInstance.exec("SELECT * FROM Workspaces"), records: _dbInstance.exec("SELECT * FROM Records") }

        // --- SIMULACIÓN ---
        return {
            workspaces: _mockWorkspaces,
            records: _mockRecords
        };
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
        deleteRecord,
        exportData // Usado por la función exportToGist()
    };
})();
