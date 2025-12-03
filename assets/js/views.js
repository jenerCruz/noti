// views.js - Extensión avanzada: Panel+, Galería Notion-style y utilidades UI
// Se integra con la lógica existente (dbLocal, state, showItemModal, etc.)
// Incluir después del script principal: <script src="./assets/js/views.js"></script>

/*
  Características añadidas:
  - Panel mejorado con tarjetas, sección 'Destacados', y gráficos SVG.
  - Galería estilo Notion con portada (imagen o color), título grande, y propiedades en la portada.
  - Menú desplegable en cada tarjeta: cambiar estado, marcar destacado, agregar a listas.
  - Botones en tarjeta para cambiar estado (con persistencia en Dexie).
  - Lógica para 'Listas' (propiedad tipo select/multi) y 'Destacado' (flag en record.properties.Destacado).
  - Mini-gráficos SVG (barras) generados dinámicamente a partir de datos actuales.
  - No modifica diseño global ni lógica preexistente; usa APIs públicas: dbLocal, state.
*/

(function(){
    // ---- helpers robustos para leer propiedades por nombre o id ----
    function getPropValue(record, propName){
        if(!record || !record.properties) return undefined;
        // 1) intento directo por llave
        if(record.properties[propName] !== undefined) return record.properties[propName];
        // 2) intentar encontrar propiedad cuyo id o name coincide en workspace definition
        const ws = state.workspaces.find(w => w.id === state.currentWorkspaceId);
        if(!ws) return undefined;
        // buscar propiedad por name o id
        const found = ws.properties.find(p => p.name === propName || p.id === propName);
        if(found && record.properties[found.id] !== undefined) return record.properties[found.id];
        // fallback: buscar por cualquier key que case case-insensitive
        const key = Object.keys(record.properties).find(k => k.toLowerCase() === propName.toLowerCase());
        return key ? record.properties[key] : undefined;
    }

    async function setPropValue(recordId, propName, value){
        const record = state.currentRecords.find(r => r.id === recordId);
        if(!record) return;

        // actualizar en memoria
        // intentar actualizar con la key existente que coincide
        let key = Object.keys(record.properties).find(k => k.toLowerCase() === propName.toLowerCase());
        if(!key){
            // intentar encontrar en workspace properties y usar su id
            const ws = state.workspaces.find(w => w.id === state.currentWorkspaceId);
            const p = ws ? ws.properties.find(pp => pp.name === propName || pp.id === propName) : null;
            key = p ? p.id : propName;
        }

        const updated = {...record.properties, [key]: value};

        await dbLocal.records.update(recordId, { properties: updated, lastModified: Date.now() });

        // reflect in local state
        record.properties = updated;
    }

    // ---- utilidades UI ----
    function createEl(tag, attrs = {}, children = []){
        const el = document.createElement(tag);
        for(const k in attrs){
            if(k === 'class') el.className = attrs[k];
            else if(k === 'html') el.innerHTML = attrs[k];
            else if(k.startsWith('on') && typeof attrs[k] === 'function') el.addEventListener(k.substring(2), attrs[k]);
            else el.setAttribute(k, attrs[k]);
        }
        (Array.isArray(children)?children:[children]).forEach(c => { if(!c) return; if(typeof c === 'string') el.appendChild(document.createTextNode(c)); else el.appendChild(c); });
        return el;
    }

    function formatDate(d){ if(!d) return ''; try{ return new Date(d).toLocaleDateString('es-ES'); }catch(e){return d;} }

    // ---- Charts: simple SVG bar chart ----
    function createBarChartSVG(dataPairs, width=300, height=80){
        // dataPairs: [{label, value}]
        const max = Math.max(...dataPairs.map(d=>d.value), 1);
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        const padding = 6;
        const barGap = 6;
        const barWidth = (width - padding*2 - (dataPairs.length-1)*barGap) / dataPairs.length;

        dataPairs.forEach((d,i) => {
            const h = (d.value / max) * (height - padding*2 - 12);
            const x = padding + i*(barWidth+barGap);
            const y = height - padding - h;
            const rect = document.createElementNS(svgNS,'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', barWidth);
            rect.setAttribute('height', h);
            rect.setAttribute('rx', 4);
            rect.setAttribute('fill','#6366f1');
            svg.appendChild(rect);

            const txt = document.createElementNS(svgNS,'text');
            txt.setAttribute('x', x + barWidth/2);
            txt.setAttribute('y', height - 2);
            txt.setAttribute('text-anchor','middle');
            txt.setAttribute('font-size','9');
            txt.setAttribute('fill','#374151');
            txt.textContent = d.label;
            svg.appendChild(txt);
        });

        return svg;
    }

    // ---- Panel Avanzado con gráficos y destacados ----
    function renderPanelAdvanced(){
        const container = document.getElementById('content-view');
        const records = state.currentRecords || [];

        const byStatus = {};
        records.forEach(r => {
            const s = (getPropValue(r, 'Estado') || 'Sin Estado');
            byStatus[s] = (byStatus[s] || 0) + 1;
        });

        const statusPairs = Object.keys(byStatus).map(k=>({label:k, value:byStatus[k]}));

        const upcoming = (records.filter(r => getPropValue(r,'Fecha')).sort((a,b)=>new Date(getPropValue(a,'Fecha'))-new Date(getPropValue(b,'Fecha')))).slice(0,6);

        // destacados
        const destacados = records.filter(r => getPropValue(r,'Destacado') === true || getPropValue(r,'Destacado') === 'true');

        container.innerHTML = '';

        const grid = createEl('div',{class:'grid grid-cols-1 md:grid-cols-3 gap-6'});

        grid.appendChild(cardStat('Total', records.length, 'text-indigo-600', 'bg-indigo-50'));
        Object.keys(byStatus).slice(0,2).forEach((k,idx)=> grid.appendChild(cardStat(k, byStatus[k], idx===0?'text-yellow-600':'text-green-600', idx===0?'bg-yellow-50':'bg-green-50')));

        container.appendChild(grid);

        // charts + upcoming + destacados
        const lower = createEl('div',{class:'mt-6 grid grid-cols-1 md:grid-cols-3 gap-6'});

        const chartBox = createEl('div',{class:'bg-white p-4 rounded-xl shadow'});
        chartBox.appendChild(createEl('h4',{class:'font-semibold text-gray-700 mb-3', html:'Resumen por Estado'}));
        const svg = createBarChartSVG(statusPairs, 340, 90);
        chartBox.appendChild(svg);
        lower.appendChild(chartBox);

        const upBox = createEl('div',{class:'bg-white p-4 rounded-xl shadow'});
        upBox.appendChild(createEl('h4',{class:'font-semibold text-gray-700 mb-3', html:'Próximas fechas'}));
        if(upcoming.length===0) upBox.appendChild(createEl('p',{class:'text-gray-400', html:'No hay eventos próximos'}));
        else{
            const ul = createEl('ul',{class:'space-y-2'});
            upcoming.forEach(r=>{
                const li = createEl('li',{class:'p-2 border rounded-lg cursor-pointer'});
                li.appendChild(createEl('div',{class:'font-semibold', html:r.title || getPropValue(r,'Título') || 'Sin título'}));
                li.appendChild(createEl('div',{class:'text-xs text-gray-500', html:formatDate(getPropValue(r,'Fecha'))}));
                li.addEventListener('click', ()=> showItemModal(r.id));
                ul.appendChild(li);
            });
            upBox.appendChild(ul);
        }
        lower.appendChild(upBox);

        const destBox = createEl('div',{class:'bg-white p-4 rounded-xl shadow'});
        destBox.appendChild(createEl('h4',{class:'font-semibold text-gray-700 mb-3', html:'Destacados'}));
        if(destacados.length===0) destBox.appendChild(createEl('p',{class:'text-gray-400', html:'No hay destacados'}));
        else{
            const ul = createEl('ul',{class:'space-y-2'});
            destacados.slice(0,6).forEach(r=>{
                const li = createEl('li',{class:'p-2 border rounded-lg cursor-pointer', html:`<div class='font-semibold'>${r.title}</div><div class='text-xs text-gray-500'>${formatDate(getPropValue(r,'Fecha'))}</div>`});
                li.addEventListener('click', ()=> showItemModal(r.id));
                ul.appendChild(li);
            });
            destBox.appendChild(ul);
        }
        lower.appendChild(destBox);

        container.appendChild(lower);
    }

    function cardStat(title, value, textClass='text-indigo-600', bgClass='bg-indigo-50'){
        return createEl('div',{class:`p-6 ${bgClass} rounded-xl shadow`},[
            createEl('p',{class:`text-4xl font-extrabold ${textClass}`, html:value}),
            createEl('p',{class:'text-gray-600 font-semibold', html:title})
        ]);
    }

    // ---- Galería avanzada: portada, dropdown, botones, listas ----
    function renderGalleryView(){
        const container = document.getElementById('content-view');
        const records = state.currentRecords || [];
        const ws = state.workspaces.find(w=>w.id===state.currentWorkspaceId) || {properties:[]};

        container.innerHTML = '';

        const grid = createEl('div',{class:'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'});

        records.forEach(rec=> grid.appendChild(createGalleryCard(rec, ws)));

        container.appendChild(grid);
    }

    function createGalleryCard(record, ws){
        const foto = getPropValue(record,'Foto');
        const titulo = record.title || getPropValue(record,'Título') || 'Sin título';
        const destacado = getPropValue(record,'Destacado');
        const listas = getPropValue(record,'Listas');

        const card = createEl('div',{class:'rounded-xl shadow bg-white hover:shadow-lg transition'});

        // cover
        const cover = createEl('div',{class:'h-36 w-full rounded-t-xl overflow-hidden bg-gray-200 flex items-center justify-center', style: foto?`background:#fff`:`background:${randomGalleryColor()}`});
        if(foto){
            const img = createEl('img',{class:'w-full h-full object-cover', src:foto});
            cover.appendChild(img);
        } else {
            // show big title initials center if no photo
            const initials = titulo.split(' ').map(s=>s[0]).slice(0,2).join('');
            cover.appendChild(createEl('div',{class:'text-3xl font-bold text-gray-700', html:initials}));
        }

        // body
        const body = createEl('div',{class:'p-3'});
        const titleEl = createEl('div',{class:'font-semibold text-gray-800 mb-1', html:titulo});
        body.appendChild(titleEl);

        // properties preview (up to 3)
        const preview = createEl('div',{class:'text-xs text-gray-500 space-y-1 mb-2'});
        const propsToShow = ws.properties.filter(p=>!['Foto','Contenido','content','title'].includes(p.name)).slice(0,3);
        propsToShow.forEach(p=>{
            const v = getPropValue(record,p.name);
            if(v) preview.appendChild(createEl('div',{html:`<strong>${p.name}:</strong> ${v}`}));
        });
        body.appendChild(preview);

        // acciones (botones + dropdown)
        const actions = createEl('div',{class:'flex items-center justify-between'});

        const left = createEl('div',{});
        // estado quick-change button
        const status = getPropValue(record,'Estado') || 'Pendiente';
        const btnState = createEl('button',{class:'px-2 py-1 text-xs rounded-lg border', html:status});
        btnState.addEventListener('click', async (e)=>{
            e.stopPropagation();
            // cycle states
            const estados = ['Pendiente','En Proceso','Terminado'];
            const idx = estados.indexOf(status);
            const next = estados[(idx+1) % estados.length];
            await setPropValue(record.id, 'Estado', next);
            await refreshViews();
        });
        left.appendChild(btnState);

        // Add to list button
        const listBtn = createEl('button',{class:'ml-2 px-2 py-1 text-xs rounded-lg border', html:'➕ Lista'});
        listBtn.addEventListener('click',(e)=>{ e.stopPropagation(); showAddToListMenu(e, record); });
        left.appendChild(listBtn);

        actions.appendChild(left);

        // dropdown
        const menuBtn = createEl('div',{class:'relative'});
        const mbtn = createEl('button',{class:'px-2 py-1 text-xs rounded-lg border', html:'⋯'});
        menuBtn.appendChild(mbtn);
        const dropdown = createEl('div',{class:'absolute right-0 mt-2 w-44 bg-white border rounded shadow hidden', style:'z-index:50;'});
        dropdown.appendChild(createEl('button',{class:'block w-full text-left p-2 text-sm hover:bg-gray-100', html:'Marcar/Desmarcar Destacado'}));
        dropdown.appendChild(createEl('button',{class:'block w-full text-left p-2 text-sm hover:bg-gray-100', html:'Editar'}));
        dropdown.appendChild(createEl('button',{class:'block w-full text-left p-2 text-sm hover:bg-gray-100', html:'Eliminar'}));

        // acciones dropdown handlers
        dropdown.children[0].addEventListener('click', async (ev)=>{ ev.stopPropagation(); const cur = getPropValue(record,'Destacado'); await setPropValue(record.id,'Destacado', !cur); await refreshViews(); hideDropdown(dropdown); });
        dropdown.children[1].addEventListener('click', (ev)=>{ ev.stopPropagation(); showItemModal(record.id); hideDropdown(dropdown); });
        dropdown.children[2].addEventListener('click', async (ev)=>{ ev.stopPropagation(); if(confirm('Eliminar elemento?')){ await dbLocal.records.delete(record.id); await loadAndRefresh(); } hideDropdown(dropdown); });

        mbtn.addEventListener('click',(e)=>{ e.stopPropagation(); toggleDropdown(dropdown); });

        menuBtn.appendChild(dropdown);
        actions.appendChild(menuBtn);

        body.appendChild(actions);

        // footer: listas y destacado tag
        const footer = createEl('div',{class:'mt-2 flex items-center justify-between text-xs text-gray-500'});
        const listasText = Array.isArray(listas) ? listas.join(', ') : (listas || '');
        footer.appendChild(createEl('div',{html:listasText || '<i>Sin listas</i>'}));
        if(destacado) footer.appendChild(createEl('div',{class:'text-yellow-600 font-semibold', html:'★ Destacado'}));

        card.appendChild(cover);
        card.appendChild(body);
        card.appendChild(footer);
        // click open
        card.addEventListener('click', ()=> showItemModal(record.id));

        return card;
    }

    function toggleDropdown(drop){ if(drop.classList.contains('hidden')) drop.classList.remove('hidden'); else drop.classList.add('hidden'); }
    function hideDropdown(drop){ drop.classList.add('hidden'); }

    // ---- Add to list menu (inline small popup) ----
    function showAddToListMenu(event, record){
        // remove any existing
        const existing = document.getElementById('add-to-list-menu'); if(existing) existing.remove();
        const menu = createEl('div',{id:'add-to-list-menu', class:'absolute bg-white border p-2 rounded shadow', style:'z-index:60;'});

        const input = createEl('input',{class:'border p-1 text-sm', placeholder:'Nombre de lista'});
        const btn = createEl('button',{class:'ml-2 px-2 py-1 text-sm bg-indigo-600 text-white rounded', html:'Agregar'});
        btn.addEventListener('click', async (e)=>{
            const val = input.value.trim(); if(!val) return;
            // obtener listas actuales
            let listas = getPropValue(record,'Listas');
            if(!listas) listas = [];
            if(!Array.isArray(listas)) listas = ([listas].filter(Boolean));
            if(!listas.includes(val)) listas.push(val);
            await setPropValue(record.id,'Listas', listas);
            await refreshViews();
            menu.remove();
        });

        menu.appendChild(input); menu.appendChild(btn);
        document.body.appendChild(menu);
        // position
        const rect = event.target.getBoundingClientRect();
        menu.style.left = (rect.left) + 'px';
        menu.style.top = (rect.bottom + 6) + 'px';

        // click outside to close
        setTimeout(()=>{
            window.addEventListener('click', function clos(e){ if(!menu.contains(e.target)){ menu.remove(); window.removeEventListener('click', clos); } });
        },50);
    }

    function randomGalleryColor(){
        const colores = ['#fce7f3','#e0f2fe','#ede9fe','#fef9c3','#dcfce7','#fee2e2','#f3e8ff'];
        return colores[Math.floor(Math.random()*colores.length)];
    }

    // ---- refrescar y carga de datos ----
    async function loadAndRefresh(){
        const wsId = state.currentWorkspaceId;
        await loadRecords(wsId);
        await refreshViews();
    }

    async function refreshViews(){
        // rerender current view
        if(typeof window.renderContent === 'function') window.renderContent();
        if(typeof window.renderTabs === 'function') window.renderTabs();
    }

    // ---- Integrar tabs nuevas al renderTabs original (si existe) ----
    (function(){
        const old = window.renderTabs || function(){};
        window.renderTabs = function(){
            old();
            const container = document.getElementById('view-tabs'); if(!container) return;
            // prevent duplicates
            if(container.querySelector('[data-v="panel2"]')) return;

            const btnPanel2 = createEl('button',{class:'px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 text-gray-600', html:'Panel+'});
            btnPanel2.dataset.v = 'panel2';
            btnPanel2.addEventListener('click', ()=>{ state.currentView = 'panel2'; refreshViews(); });

            const btnGallery = createEl('button',{class:'px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 text-gray-600', html:'Galería'});
            btnGallery.dataset.v = 'galeria';
            btnGallery.addEventListener('click', ()=>{ state.currentView = 'galeria'; refreshViews(); });

            container.appendChild(btnPanel2);
            container.appendChild(btnGallery);
        };
    })();

    // ---- Exponer algunas utilidades globales por si las quieres usar ----
    window.viewsUtils = {
        renderPanelAdvanced,
        renderGalleryView,
        setPropValue,
        getPropValue,
        refreshViews
    };

})();