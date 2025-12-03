// zoom.js - Módulo UI: Botón Zoom y Fit-to-Screen
// Añade control de zoom (+/-/fit) en la esquina, persiste preferencia en Dexie config.
// Incluir después de views.js para que afecte al content-view y otros elementos.

(function(){
    const ZKEY = 'ui_zoom_level';

    function getZoom(){
        const z = localStorage.getItem(ZKEY);
        return z ? Number(z) : 1;
    }

    function setZoom(val){
        localStorage.setItem(ZKEY, val);
        applyZoom(val);
    }

    function applyZoom(val){
        const el = document.getElementById('content-view');
        if(!el) return;
        el.style.transformOrigin = 'top left';
        el.style.transform = `scale(${val})`;
        // also adjust height to keep fit
        el.style.width = (100 / val) + '%';
    }

    function createUI(){
        const wrapper = document.createElement('div');
        wrapper.id = 'zoom-controls';
        wrapper.className = 'fixed right-4 bottom-20 flex flex-col space-y-2 z-50';

        const btnPlus = document.createElement('button'); btnPlus.textContent = '+';
        const btnMinus = document.createElement('button'); btnMinus.textContent = '-';
        const btnFit = document.createElement('button'); btnFit.textContent = 'Fit';

        [btnPlus, btnMinus, btnFit].forEach(b=>{
            b.className = 'w-10 h-10 rounded-lg shadow bg-white flex items-center justify-center text-lg border';
        });

        btnPlus.onclick = ()=>{ const z = Math.min(2, +(getZoom()) + 0.1); setZoom(Number(z.toFixed(2))); };
        btnMinus.onclick = ()=>{ const z = Math.max(0.5, +(getZoom()) - 0.1); setZoom(Number(z.toFixed(2))); };
        btnFit.onclick = ()=> fitToScreen();

        wrapper.appendChild(btnPlus); wrapper.appendChild(btnMinus); wrapper.appendChild(btnFit);
        document.body.appendChild(wrapper);

        // draggable small handle to hide/show
        const toggle = document.createElement('button');
        toggle.textContent = '🔍';
        toggle.className = 'fixed right-4 bottom-12 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center z-50 shadow';
        toggle.onclick = ()=>{ wrapper.classList.toggle('hidden'); };
        document.body.appendChild(toggle);
    }

    function fitToScreen(){
        // scale content-view so it fits vertically and horizontally
        const el = document.getElementById('content-view');
        if(!el) return;
        const parent = el.parentElement;
        const pad = 32; // margins
        const pw = parent.clientWidth - pad;
        const ph = parent.clientHeight - pad;
        const bw = el.scrollWidth;
        const bh = el.scrollHeight;
        const scaleW = pw / bw;
        const scaleH = ph / bh;
        const scale = Math.min(scaleW, scaleH, 1);
        setZoom(Number(scale.toFixed(2)));
    }

    // init
    window.addEventListener('load', ()=>{
        createUI();
        applyZoom(getZoom());
    });

    window.ZoomModule = { getZoom, setZoom, fitToScreen };

})();
