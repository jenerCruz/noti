// rules.js - Módulo de Lógica Avanzada (Reglas Condicionales)
// Define y evalúa reglas que controlan visibilidad y comportamiento de propiedades.
// Debe incluirse DESPUÉS de properties.js y ANTES de views.js.

(function () {

    // ===============================
    //   EVALUADOR DE CONDICIONES
    // ===============================
    //
    // Las reglas tienen esta forma:
    // {
    //   id: "regla1",
    //   description: "Mostrar si 'Aprobado' es 'Sí'",
    //   condition: {
    //      op: "eq",
    //      prop: "Aprobado",
    //      value: "Sí"
    //   }
    // }

    function evalCondition(cond, record, depth = 0) {
        if (!cond) return true;
        if (depth > 3) return true; // límite de anidación

        const op = cond.op ? cond.op.toLowerCase() : null;

        // Campos principales
        const propVal = getRecordProp(record, cond.prop);

        // --- OPERADORES LÓGICOS ---
        if (op === "and") {
            return (cond.conditions || []).every(c => evalCondition(c, record, depth + 1));
        }

        if (op === "or") {
            return (cond.conditions || []).some(c => evalCondition(c, record, depth + 1));
        }

        if (op === "not") {
            return !evalCondition(cond.condition, record, depth + 1);
        }

        // --- OPERADORES BINARIOS ---
        switch (op) {
            case "eq":  return propVal == cond.value;
            case "neq": return propVal != cond.value;
            case "in":  return Array.isArray(cond.value) && cond.value.includes(propVal);
            case "nin": return Array.isArray(cond.value) && !cond.value.includes(propVal);
            case "gt":  return Number(propVal) > Number(cond.value);
            case "lt":  return Number(propVal) < Number(cond.value);
            case "exists": return propVal !== undefined && propVal !== null && propVal !== "";
            default:
                return true;
        }
    }

    // ===============================
    //   OBTENER VALOR DE UNA PROPIEDAD
    // ===============================

    function getRecordProp(record, key) {
        if (!record || !record.properties) return undefined;

        // Búsqueda case-insensitive
        const found = Object.keys(record.properties)
            .find(k => k.toLowerCase() === String(key).toLowerCase());

        if (found) return record.properties[found];

        // fallback
        return record.properties[key];
    }

    // ===============================
    //   APLICAR LISTA DE REGLAS
    // ===============================

    function applyRulesList(rules, record) {
        if (!rules || !rules.length) return true;
        return rules.every(r => evalCondition(r.condition, record));
    }

    // ===============================
    //   FILTRAR PROPIEDADES POR REGLAS
    // ===============================
    //
    // rulesMap:
    // {
    //   propertyId1: ["rule-id-1", "rule-id-2"],
    //   __defs: { "rule-id-1": {...}, "rule-id-2": {...} }
    // }

    function filterPropertiesByRules(properties, record, rulesMap) {
        if (!rulesMap) return properties;

        return properties.filter(prop => {
            const ruleIds = rulesMap[prop.id] || [];
            if (ruleIds.length === 0) return true;

            const rules = ruleIds.map(id => rulesMap.__defs[id]).filter(Boolean);
            return applyRulesList(rules, record);
        });
    }

    // ===============================
    //   EXPORTAR MÓDULO
    // ===============================

    window.RulesModule = {
        evalCondition,
        applyRulesList,
        filterPropertiesByRules,
        _internal: { getRecordProp }
    };

})();