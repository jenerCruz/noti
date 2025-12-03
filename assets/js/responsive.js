// assets/js/responsive.js

/**
 * Inicializa el comportamiento responsivo del sidebar y el botón de menú.
 */
function initResponsiveLayout() {
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  
  if (!menuToggle || !sidebar) {
    console.error("Elementos del sidebar o botón de menú no encontrados.");
    return;
  }
  
  // Función para actualizar el layout según el tamaño de pantalla
  function updateLayout() {
    if (window.innerWidth < 768) {
      // En móviles: Ocultar sidebar y mostrar botón de menú
      sidebar.classList.add('-translate-x-full');
      sidebar.classList.remove('show');
      menuToggle.classList.remove('hidden');
    } else {
      // En escritorio: Mostrar sidebar y ocultar botón de menú
      sidebar.classList.remove('-translate-x-full');
      sidebar.classList.add('show');
      menuToggle.classList.add('hidden');
    }
  }
  
  // Toggle del sidebar al hacer clic en el botón de menú
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    sidebar.classList.toggle('show');
  });
  
  // Cerrar el sidebar si se hace clic fuera de él (solo en móviles)
  document.addEventListener('click', (event) => {
    if (
      window.innerWidth < 768 &&
      !sidebar.contains(event.target) &&
      !menuToggle.contains(event.target) &&
      !sidebar.classList.contains('-translate-x-full')
    ) {
      sidebar.classList.add('-translate-x-full');
      sidebar.classList.remove('show');
    }
  });
  
  // Actualizar el layout al cargar la página y al redimensionar
  window.addEventListener('load', updateLayout);
  window.addEventListener('resize', updateLayout);
}

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', initResponsiveLayout);