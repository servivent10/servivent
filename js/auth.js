import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';

// Inicializar cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos del DOM
const loginForm = document.getElementById('login-form');
const usuarioSelect = document.getElementById('usuario');
const btnLogin = document.getElementById('btn-login');
const btnSpinner = btnLogin.querySelector('.spinner-border');
const btnText = btnLogin.querySelector('span');

// Cargar lista de usuarios
async function cargarUsuarios() {
    window.showProgress(); // Mostrar barra de progreso
    try {
        const { data: usuarios, error } = await supabaseClient
            .from('usuarios')
            .select('id, usuario')
            .order('usuario');

        if (error) throw error;

        // Limpiar y llenar el select
        usuarioSelect.innerHTML = '<option value="" selected disabled>Seleccione un usuario</option>';
        
        usuarios.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario.id; // Guardamos el ID del usuario
            option.textContent = usuario.usuario; // Mostramos el nombre de usuario
            usuarioSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        usuarioSelect.innerHTML = '<option value="" selected disabled>Error al cargar usuarios</option>';
    } finally {
        window.hideProgress(); // Ocultar barra de progreso
    }
}

// Verificar si ya hay sesión


// Mostrar loading en el botón
function showLoading() {
    console.log('DEBUG (auth.js): showLoading() llamado. Añadiendo clase btn-loading y cambiando texto.');
    btnLogin.classList.add('btn-loading');
    btnText.textContent = 'Ingresando...'; // Cambiar texto
    btnSpinner.classList.remove('d-none'); // Mostrar spinner
    btnLogin.disabled = true;
    usuarioSelect.disabled = true;
    document.getElementById('pin').disabled = true;
}

// Ocultar loading en el botón
function hideLoading() {
    btnLogin.classList.remove('btn-loading');
    btnText.textContent = 'Ingresar'; // Restaurar texto
    btnSpinner.classList.add('d-none'); // Ocultar spinner
    btnLogin.disabled = false;
    usuarioSelect.disabled = false;
    document.getElementById('pin').disabled = false;
}

// Manejar el inicio de sesión
async function handleLogin(event) {
    event.preventDefault();
    
    const usuarioId = usuarioSelect.value;
    if (!usuarioId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor seleccione un usuario'
        });
        return;
    }

    const pin = document.getElementById('pin').value;
    
    if (pin.length !== 4) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El PIN debe tener 4 dígitos'
        });
        return;
    }

    showLoading();
    
    try {
        // Verificamos si el usuario existe y el PIN es correcto
        const { data: userData, error: userError } = await supabaseClient
            .from('usuarios')
            .select('*, sucursales(nombre)')
            .eq('id', usuarioId)
            .eq('pin', pin)
            .single();

        if (userError || !userData) {
            throw new Error('PIN incorrecto');
        }

        // Si el usuario existe y el PIN es correcto, guardamos los datos y redirigimos.
        // No ocultamos el loading aquí, para que el usuario lo vea hasta que la nueva página cargue.
        sessionStorage.setItem('user', JSON.stringify(userData));
        window.location.href = 'index.html';

    } catch (error) {
        console.error('Error de inicio de sesión:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'PIN incorrecto'
        });
        document.getElementById('pin').value = '';
        document.getElementById('pin').focus();
        // Ocultamos el loading solo si hay un error
        hideLoading();
    }
}

// Validar que el PIN solo acepte números
document.getElementById('pin').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '');
});

// Event Listeners
loginForm.addEventListener('submit', handleLogin);

// Cuando se selecciona un usuario, enfocar el campo PIN
usuarioSelect.addEventListener('change', () => {
    document.getElementById('pin').focus();
});

// Verificar sesión al cargar
cargarUsuarios();
