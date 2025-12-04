window.dbLocal = (function() {
    const DB_NAME = "NotionHR_Workspace";
    const DB_VERSION = 1;

    // Definición de la base de datos con Dexie
    const db = new Dexie(DB_NAME);
    db.version(DB_VERSION).stores({
        workspaces: 'id,name,properties,rules',
        records: 'id,workspaceId,title,properties'
    });

    // Inicialización (no es asíncrona, pero puedes devolver una promesa si lo prefieres)
    async function init() {
        console.log("🛠️ Inicializando DB con Dexie...");
        try {
            await db.open();
            // Inicializar con un workspace por defecto si no hay datos
            const workspaces = await db.workspaces.toArray();
            if (workspaces.length === 0) {
                await db.workspaces.add({
                    id: 'default-ws',
                    name: 'Proyecto Principal',
                    properties: JSON.stringify([])
                });
            }
            console.log("✅ Conexión Dexie lista.");
            return true;
        } catch (error) {
            console.error("❌ Error al inicializar Dexie:", error);
            return false;
        }
    }

    // Funciones CRUD para workspaces
    async function getWorkspaces() {
        return await db.workspaces.toArray();
    }

    async function saveWorkspace(ws) {
        await db.workspaces.put(ws);
    }

    // Funciones CRUD para records
    async function getRecords(wsId) {
        return await db.records.where('workspaceId').equals(wsId).toArray();
    }

    async function saveRecord(record) {
        await db.records.put(record);
    }

    async function deleteRecord(recordId) {
        await db.records.delete(recordId);
    }

    return {
        init,
        getWorkspaces,
        saveWorkspace,
        getRecords,
        saveRecord,
        deleteRecord
    };
})();