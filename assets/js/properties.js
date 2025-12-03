// properties.js - Módulo avanzado de propiedades (Notion-style)
// Gestiona tipos: texto, número, peso, select, multiselect, checkbox, fecha,
// estado, relación, botón, fórmula y lógica condicional/visibilidad.
// Debe incluirse ANTES de rules.js y views.js.

(function () {
  const PropertyTypes = {
    TEXT: "text",
    NUMBER: "number",
    WEIGHT: "weight",
    SELECT: "select",
    MULTISELECT: "multiselect",
    CHECKBOX: "checkbox",
    DATE: "date",
    STATUS: "status",
    RELATION: "relation",
    BUTTON: "button",
    FORMULA: "formula"
  };

  // -------------------------
  // Utilidades DOM pequeñas
  // -------------------------
  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.startsWith("on") && typeof attrs[k] === "function") {
        e.addEventListener(k.substring(2), attrs[k]);
      } else {
        e.setAttribute(k, attrs[k]);
      }
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c === null || c === undefined) return;
      if (typeof c === "string") e.appendChild(document.createTextNode(c));
      else e.appendChild(c);
    });
    return e;
  }

  function formatDate(d) {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("es-ES"); }
    catch { return d; }
  }

  // -------------------------
  // Render de campos
  // -------------------------
  function renderPropertyField(propDef, value, onChange) {
    const wrapper = el("div", { class: "space-y-1" });
    const label = el("label", { class: "text-xs font-semibold text-gray-600" }, propDef.name || "Propiedad");
    wrapper.appendChild(label);
    wrapper.appendChild(createField(propDef, value, onChange));
    return wrapper;
  }

  function createField(p, value, onChange) {
    switch (p.type) {
      case PropertyTypes.TEXT: return inputField("text", value, onChange);
      case PropertyTypes.NUMBER: return inputField("number", value, onChange);
      case PropertyTypes.WEIGHT: return inputField("number", value, onChange, { step: "0.01", min: "0" });
      case PropertyTypes.SELECT: return selectField(p.options || [], value, onChange);
      case PropertyTypes.MULTISELECT: return multiSelectField(p.options || [], value, onChange);
      case PropertyTypes.CHECKBOX: return checkboxField(Boolean(value), onChange);
      case PropertyTypes.DATE: return inputField("date", value, onChange);
      case PropertyTypes.STATUS: return selectField(p.options || ["Pendiente", "En Progreso", "Completado"], value, onChange);
      case PropertyTypes.RELATION: return relationField(p, value, onChange);
      case PropertyTypes.BUTTON: return buttonField(p, value, onChange);
      case PropertyTypes.FORMULA: return formulaViewer(p, value);
      default: return inputField("text", value, onChange);
    }
  }

  // -------------------------
  // Campos básicos
  // -------------------------
  function inputField(type, value = "", onChange = ()=>{}, extra = {}) {
    const i = el("input", { class: "w-full p-2 border rounded-lg text-sm", type, value, ...extra });
    i.addEventListener("input", () => onChange(i.value));
    return i;
  }

  function selectField(options = [], value = "", onChange = ()=>{}) {
    const s = el("select", { class: "w-full p-2 border rounded-lg text-sm" });
    const empty = el("option", { value: "" }, "(Seleccionar)");
    s.appendChild(empty);
    options.forEach(opt => {
      const o = el("option", { value: opt }, opt);
      if (opt === value) o.selected = true;
      s.appendChild(o);
    });
    s.addEventListener("change", () => onChange(s.value));
    return s;
  }

  function multiSelectField(options = [], value = [], onChange = ()=>{}) {
    const wrap = el("div", { class: "flex flex-wrap gap-1" });
    const vals = Array.isArray(value) ? value.slice() : [];
    options.forEach(opt => {
      const btn = el("button", { class: vals.includes(opt) ? "px-2 py-1 text-xs bg-indigo-600 text-white rounded" : "px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded" }, opt);
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        const idx = vals.indexOf(opt);
        if (idx === -1) vals.push(opt); else vals.splice(idx,1);
        // actualizar clases
        btn.className = vals.includes(opt) ? "px-2 py-1 text-xs bg-indigo-600 text-white rounded" : "px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded";
        onChange(vals.slice());
      });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function checkboxField(checked=false, onChange = ()=>{}) {
    const cb = el("input", { type: "checkbox" });
    cb.checked = Boolean(checked);
    cb.addEventListener("change", ()=> onChange(cb.checked));
    return cb;
  }

  // -------------------------
  // Relación entre bases (simple picker)
  // -------------------------
  function relationField(propDef, currentValue, onChange) {
    const wrap = el("div", { class: "space-y-1" });
    const btn = el("button", { class: "px-2 py-1 bg-indigo-600 text-white rounded text-sm" }, currentValue ? "Cambiar relación" : "Agregar relación");
    btn.addEventListener("click", ()=> openRelationPicker(propDef, currentValue, onChange));
    wrap.appendChild(btn);
    return wrap;
  }

  function openRelationPicker(propDef, currentValue, onChange) {
    // Modal ligero para elegir un registro del workspace referenciado
    const modal = el("div", { class: "fixed inset-0 bg-black/50 flex items-center justify-center z-50" });
    const box = el("div", { class: "bg-white p-4 rounded-xl w-80 max-h-[80vh] overflow-auto" });
    const title = el("div", { class: "font-semibold mb-2" }, `Relacionar: ${propDef.name || ''}`);
    box.appendChild(title);

    const targetWsId = propDef.relationWorkspace;
    const targetWs = state.workspaces.find(w => w.id === targetWsId);
    if (!targetWs) {
      box.appendChild(el("div", { class: "text-red-500" }, "Workspace no encontrado"));
    } else {
      // buscar registros (asumiendo que existe state.currentRecords o global)
      const all = typeof state.allRecords !== "undefined" ? state.allRecords : [];
      const list = all.filter(r => r.workspaceId === targetWsId);
      list.forEach(r => {
        const btn = el("button", { class: "block w-full text-left p-2 hover:bg-gray-100" }, r.title || `#${r.id}`);
        btn.addEventListener("click", ()=> { onChange(r.id); modal.remove(); });
        box.appendChild(btn);
      });
      if(list.length === 0) box.appendChild(el("div", { class: "text-gray-400" }, "No hay registros en ese workspace"));
    }

    modal.appendChild(box);
    modal.addEventListener("click", (e)=> { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  // -------------------------
  // Botón (acción definida por prop.action)
  // -------------------------
  function buttonField(propDef, value, onChange) {
    const b = el("button", { class: "px-3 py-2 bg-indigo-600 text-white rounded text-sm" }, propDef.label || propDef.name || "Acción");
    b.addEventListener("click", (e)=> {
      e.preventDefault();
      if (typeof propDef.action === "function") propDef.action({ value, recordState: state }, onChange);
    });
    return b;
  }

  // -------------------------
  // Fórmula (visualizador simple)
  // -------------------------
  function formulaViewer(propDef, value) {
    return el("div", { class: "bg-gray-50 p-2 rounded text-xs text-gray-600" }, value || "(fórmula)");
  }

  // -------------------------
  // Lógica condicional para visibilidad
  // -------------------------
  // Integración con RulesModule (si existe)
  function applyConditionalLogic(properties, record, rulesMap) {
    // Si RulesModule existe, delegar; si no, devolver propiedades tal cual
    if (window.RulesModule && typeof window.RulesModule.filterPropertiesByRules === "function") {
      return window.RulesModule.filterPropertiesByRules(properties, record, rulesMap);
    }
    return properties;
  }

  // -------------------------
  // Render de un contenedor de propiedades dinámico (ej: modal de item)
  // properties: array de definiciones de propiedad (p.id, p.name, p.type, p.options...)
  // currentValues: objeto con valores actuales del record
  // rulesMap: opcional, mapa de reglas para visibilidad
  // onSaveField: función(recordKey, newValue) llamada cada vez que un campo cambia
  // -------------------------
  function renderPropertiesContainer(container, properties, currentValues = {}, rulesMap = {}, onSaveField = ()=>{}) {
    container.innerHTML = "";
    const visibleProps = applyConditionalLogic(properties, { properties: currentValues }, rulesMap);
    visibleProps.forEach(prop => {
      const key = prop.id || prop.name;
      const val = (currentValues && (currentValues[key] !== undefined)) ? currentValues[key] : (prop.default || "");
      const field = renderPropertyField(prop, val, (newVal)=> {
        onSaveField(key, newVal);
      });
      container.appendChild(field);
    });
  }

  // -------------------------
  // Export público
  // -------------------------
  window.PropertiesModule = {
    PropertyTypes,
    renderPropertyField,
    renderPropertiesContainer,
    applyConditionalLogic
  };

})();