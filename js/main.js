import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';

// Configuración de Supabase
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos del DOM
const sidebar = document.querySelector(".sidebar");
const menuBtn = document.querySelector("#btn-menu");
const mainContent = document.getElementById('main-content');
const seccionBotones = document.getElementById('seccion_botones');

// --- Control del Sidebar ---
function handleSidebar() {
    const isSmallScreen = window.innerWidth <= 768;
    if (isSmallScreen) {
        sidebar.classList.remove("open");
    } else {
        sidebar.classList.add("open");
    }
    menuBtnChange();
}

menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    menuBtnChange();
});

function menuBtnChange() {
    if (sidebar.classList.contains("open")) {
        menuBtn.classList.replace("bx-menu", "bx-menu-alt-right");
    } else {
        menuBtn.classList.replace("bx-menu-alt-right", "bx-menu");
    }
}

// Controlar el estado del sidebar al cargar y al redimensionar
window.addEventListener('resize', handleSidebar);

// --- Carga de Contenido Dinámico ---
async function loadContent(module) {
    // Remover clase active de todos los enlaces y añadir al actual
    document.querySelectorAll('.nav-list li a').forEach(link => {
        link.classList.remove('active');
    });
    document.getElementById(`nav-${module}`).classList.add('active');

    try {
        const moduleUrl = `/js/${module}.js?v=${Date.now()}`;
        const moduleScript = await import(moduleUrl);
        const content = await moduleScript.default();
        
        if (content) {
            mainContent.innerHTML = content;
            if (moduleScript.init) {
                moduleScript.init();
            }
        }
        updateHeaderButtons(module);

    } catch (error) {
        console.error('Error al cargar el módulo:', error);
        mainContent.innerHTML = `<div class="alert alert-danger">Error al cargar el módulo: ${error.message}</div>`;
    }
}

// --- Actualizar Botones de la Cabecera ---
function updateHeaderButtons(module) {
    seccionBotones.innerHTML = ''; // Limpiar botones existentes
    if (module === 'usuarios' || module === 'sucursales') {
        const newButton = document.createElement('button');
        newButton.className = 'btn btn-primary';
        newButton.innerHTML = `<i class='bx bx-plus'></i> Nuevo`;
        newButton.id = `btn-nuevo-${module}`;
        seccionBotones.appendChild(newButton);
    }
}

// --- Autenticación y Datos de Usuario ---
async function checkAuth() {
    const userString = sessionStorage.getItem('user');
    const user = JSON.parse(userString);

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    updateUserDisplay(user);
    loadContent('home');
}

window.updateUserDisplay = async function(user) {
    const branchName = user.sucursales?.nombre || 'N/A';
    const role = `${user.rol}`;

    document.getElementById('user-display-name').textContent = user.nombre;
    document.getElementById('user-display-role').textContent = role;
    document.getElementById('user-display-branch').textContent = branchName;

    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) {
        userAvatar.src = user.avatar_url || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
    }
}

// --- Event Listeners ---
document.getElementById('nav-home').addEventListener('click', (e) => {
    e.preventDefault();
    loadContent('home');
});
document.getElementById('nav-usuarios').addEventListener('click', (e) => {
    e.preventDefault();
    loadContent('usuarios');
});
document.getElementById('nav-sucursales').addEventListener('click', (e) => {
    e.preventDefault();
    loadContent('sucursales');
});

document.getElementById('logout-button').addEventListener('click', async () => {
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
});

// --- Iniciar la aplicación ---
handleSidebar(); // Llamada inicial para establecer el estado correcto
checkAuth();
