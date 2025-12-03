// assets/js/responsive.js

/**
 * Inicializa el comportamiento responsivo del sidebar y el botón de menú.
 * NOTA: Esta función es llamada por views.js (initApp) después de la carga del DOM.
 */
function initResponsiveLayout() {
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  
  if (!menuToggle || !sidebar) {
    console.error("Elementos del sidebar o botón de menú no encontrados.");
    return;
  }
  
  // Agregar clases necesarias para el comportamiento móvil (fijo y animado)
  sidebar.classList.add('fixed', 'h-screen', 'top-0', 'left-0', 'z-50', 'transition-transform', 'duration-300');
  
  // Función para actualizar el layout según el tamaño de pantalla
  function updateLayout() {
    if (window.innerWidth < 768) {
      // En móviles: Ocultar sidebar y mostrar botón de menú
      sidebar.classList.add('-translate-x-full'); // Ocultar
      menuToggle.classList.remove('hidden'); // Mostrar botón
    } else {
      // En escritorio: Mostrar sidebar y ocultar botón de menú
      sidebar.classList.remove('-translate-x-full'); // Mostrar
      menuToggle.classList.add('hidden'); // Ocultar botón
    }
  }
  
  // Toggle del sidebar al hacer clic en el botón de menú
  menuToggle.addEventListener('click', () => {
    // Si está oculto, lo muestra (remueve la clase)
    sidebar.classList.toggle('-translate-x-full');
  });
  
  // Cerrar el sidebar si se hace clic fuera de él (solo en móviles)
  document.addEventListener('click', (event) => {
    if (
      window.innerWidth < 768 &&
      !sidebar.contains(event.target) &&
      !menuToggle.contains(event.target) &&
      !sidebar.classList.contains('-translate-x-full') // Si no está oculto
    ) {
      sidebar.classList.add('-translate-x-full');
    }
  });
  
  // 🚨 CRÍTICO: Ejecutar la función inmediatamente al inicializar
  updateLayout(); 
  
  // Ejecutar al redimensionar la ventana (para manejo de breakpoint)
  window.addEventListener('resize', updateLayout);
}

// Exponer la función para que views.js pueda llamarla
window.initResponsiveLayout = initResponsiveLayout;
