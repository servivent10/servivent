/**
 * Módulo para la gestión de usuarios.
 * Sigue el patrón de arquitectura definido en GUIA_MODULOS.md.
 */

import { setupPagination } from './pagination.js';
import { SUPABASE_BUCKET } from '../config.js';

// Devuelve la estructura HTML estática del módulo.
export default async function() {
    return `
        <h1>Gestión de Usuarios</h1>
        <div class="table-responsive">
            <table id="user-table" class="table-custom">
                <thead>
                    <tr>
                        <th>Avatar</th>
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th>Rol</th>
                        <th>Usuario</th>
                        <th>PIN</th>
                        <th>Sucursal</th>
                        <th class="action-column">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Las filas de usuarios se cargarán aquí dinámicamente -->
                </tbody>
            </table>
        </div>

    `;
}

// Inicializa la lógica dinámica del módulo después de que el HTML ha sido cargado.
export async function init() {
    let allUsers = []; // allUsers ahora solo contendrá los datos de la página actual
    let allSucursales = [];
    const userTableBody = document.querySelector('#user-table tbody');
    let searchInput = document.getElementById('search-input'); // Este ID ahora está en index.html
    const userModal = new bootstrap.Modal(document.getElementById('user-modal'));
    const modalTitle = document.getElementById('modal-title');
    let userForm = document.getElementById('user-form');
    let pinInput = document.getElementById('pin');
    let togglePinVisibilityButton = document.getElementById('toggle-pin-visibility');
    let sucursalSelect = document.getElementById('sucursal_id');
    const avatarFileInput = document.getElementById('avatar-file');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarUrlInput = document.getElementById('avatar-url');

    // Función para renderizar usuarios en la tabla
    const renderUsers = (users) => {
        userTableBody.innerHTML = '';
        if (users.length === 0) {
            userTableBody.innerHTML = `<tr><td colspan="8" class="text-center">No hay usuarios para mostrar.</td></tr>`;
            return;
        }
        users.forEach(user => {
            const sucursalNombre = user.sucursales ? user.sucursales.nombre : 'N/A';
            const avatarUrl = user.avatar_url || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
            const row = userTableBody.insertRow();
            row.setAttribute('data-id', user.id);
            row.innerHTML = `
                <td><img src="${avatarUrl}" alt="Avatar" class="rounded-circle" width="40" height="40" style="object-fit: cover;"></td>
                <td>${user.nombre || ''}</td>
                <td>${user.telefono || ''}</td>
                <td>${user.rol || ''}</td>
                <td>${user.usuario || ''}</td>
                <td>${user.pin || ''}</td>
                <td>${sucursalNombre}</td>
                <td class="action-column">
                    <button class="btn-custom btn-custom-edit edit-btn"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn-custom btn-custom-delete delete-btn"><i class="bi bi-trash-fill"></i></button>
                </td>
            `;
        });
    };

    // Función de carga de datos para la paginación
    const loadUsersPaginated = async (offset, limit, searchTerm = '') => {
        let query = window.supabaseClient
            .from('usuarios')
            .select('*, sucursales(nombre)', { count: 'exact' })
            .order('nombre'); // Ordenar por nombre para paginación consistente

        if (searchTerm) {
            query = query.or(`nombre.ilike.%${searchTerm}%,usuario.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%,rol.ilike.%${searchTerm}%,sucursales.nombre.ilike.%${searchTerm}%`, {
                foreignTable: 'sucursales'
            });
        }

        const { data, error, count } = await query.range(offset, offset + limit - 1);

        if (error) throw error;

        allUsers = data; // Actualizar los usuarios de la página actual
        renderUsers(allUsers);
        
        return { data, count };
    };

    // Configurar la paginación
    const pagination = setupPagination('user-table', loadUsersPaginated);

    // Integrar el buscador con la paginación
    // Abortar el listener anterior para evitar duplicados
    if (window.searchAbortController) {
        window.searchAbortController.abort();
    }
    window.searchAbortController = new AbortController();

    searchInput.addEventListener('input', () => {
        pagination.updateSearchTerm(searchInput.value);
    }, { signal: window.searchAbortController.signal });

    const loadSucursales = async () => {
        try {
            // Asegurarse de que sucursalSelect apunta al elemento correcto en el DOM
            const currentSucursalSelect = document.getElementById('sucursal_id');
            const { data, error } = await window.supabaseClient.from('sucursales').select('id, nombre');
            if (error) throw error;
            allSucursales = data;
            currentSucursalSelect.innerHTML = '<option value="" disabled selected>Seleccione...</option>';
            allSucursales.forEach(sucursal => {
                const option = document.createElement('option');
                option.value = sucursal.id;
                option.textContent = sucursal.nombre;
                currentSucursalSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando sucursales:', error);
        }
    };

    // Previsualizar imagen seleccionada
    avatarFileInput.addEventListener('change', () => {
        const file = avatarFileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // El botón se crea dinámicamente, así que asignamos el evento al contenedor
    document.getElementById('seccion_botones').addEventListener('click', (e) => {
        const button = e.target.closest('#btn-nuevo-usuarios');
        if (button) {
            modalTitle.textContent = 'Nuevo Usuario';
            // Se usa la referencia al formulario clonado para el reset
            userForm.reset();
            document.getElementById('user-id').value = '';
            document.getElementById('avatar-preview').src = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
            document.getElementById('avatar-url').value = '';
            document.getElementById('avatar-file').value = '';
            // Se usa la referencia al input de pin clonado
            pinInput.type = 'password';
            userModal.show();
        }
    });

    // Clonar y reemplazar el formulario para limpiar listeners antiguos
    // Clonar y reemplazar el formulario para limpiar listeners antiguos
    const oldUserForm = userForm;
    userForm = oldUserForm.cloneNode(true);
    oldUserForm.parentNode.replaceChild(userForm, oldUserForm);

    // Recargar las sucursales en el nuevo formulario clonado
    await loadSucursales();

    // Reasignar referencias a los elementos dentro del nuevo formulario clonado
    sucursalSelect = userForm.querySelector('#sucursal_id');
    pinInput = userForm.querySelector('#pin');
    togglePinVisibilityButton = userForm.querySelector('#toggle-pin-visibility');

    // Añadir el listener al nuevo botón del ojo
    togglePinVisibilityButton.addEventListener('click', () => {
        pinInput.type = pinInput.type === 'password' ? 'text' : 'password';
    });

    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const id = document.getElementById('user-id').value;
            const file = avatarFileInput.files[0];
            let avatar_url = avatarUrlInput.value;

            if (file) {
                // Subir nueva imagen
                const filePath = `avatars/${Date.now()}-${file.name}`;
                const { error: uploadError } = await window.supabaseClient.storage
                    .from(SUPABASE_BUCKET)
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Obtener URL pública
                const { data: urlData } = window.supabaseClient.storage
                    .from(SUPABASE_BUCKET)
                    .getPublicUrl(filePath);
                
                avatar_url = urlData.publicUrl;
            }

            const formData = {
                nombre: document.getElementById('nombre').value,
                telefono: document.getElementById('telefono').value,
                rol: document.getElementById('rol').value,
                sucursal_id: document.getElementById('sucursal_id').value,
                usuario: document.getElementById('usuario').value,
                pin: document.getElementById('pin').value,
                avatar_url: avatar_url
            };

            const { data: savedUser, error } = id
                ? await window.supabaseClient.from('usuarios').update(formData).eq('id', id).select().single()
                : await window.supabaseClient.from('usuarios').insert([formData]).select().single();

            if (error) throw error;

            // Si el usuario editado es el mismo que el logueado, actualizamos la sesión
            const currentUser = JSON.parse(sessionStorage.getItem('user'));
            if (currentUser && currentUser.id === savedUser.id) {
                // Volvemos a pedir los datos del usuario para tener la info completa (ej. nombre de sucursal)
                const { data: updatedUser, error: fetchError } = await window.supabaseClient
                    .from('usuarios')
                    .select('*, sucursales(nombre)')
                    .eq('id', savedUser.id)
                    .single();
                
                if (fetchError) throw fetchError;

                sessionStorage.setItem('user', JSON.stringify(updatedUser));
                // Forzamos la actualización del display del usuario en la barra lateral
                if (window.updateUserDisplay) {
                    window.updateUserDisplay(updatedUser);
                }
            }

            Swal.fire('¡Guardado!', 'El usuario ha sido guardado.', 'success');
            userModal.hide();
            pagination.loadData(); // Recargar datos
        } catch (error) {
            console.error('Error guardando usuario:', error);
            Swal.fire('Error', `Hubo un problema: ${error.message}`, 'error');
        }
    });

    userTableBody.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-btn');
        const deleteButton = e.target.closest('.delete-btn');
        const row = e.target.closest('tr');
        if (!row) return;
        const id = row.getAttribute('data-id');
        const user = allUsers.find(u => u.id === id);

        if (editButton && user) {
            modalTitle.textContent = 'Editar Usuario';
            userForm.reset();
            document.getElementById('user-id').value = user.id;
            document.getElementById('nombre').value = user.nombre;
            document.getElementById('telefono').value = user.telefono;
            document.getElementById('rol').value = user.rol;
            document.getElementById('sucursal_id').value = user.sucursal_id;
            document.getElementById('usuario').value = user.usuario;
            document.getElementById('pin').value = user.pin;
            
            const avatarUrl = user.avatar_url || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';
            avatarPreview.src = avatarUrl;
            avatarUrlInput.value = user.avatar_url || '';
            avatarFileInput.value = '';

            pinInput.type = 'password';
            userModal.show();
        }

        if (deleteButton && user) {
            Swal.fire({
                title: '¿Estás seguro?',
                text: `Eliminar a ${user.nombre}`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, ¡eliminar!',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const { error } = await window.supabaseClient.from('usuarios').delete().eq('id', id);
                        if (error) throw error;
                        Swal.fire('¡Eliminado!', 'El usuario ha sido eliminado.', 'success');
                        pagination.loadData(); // Recargar datos a través de la paginación
                    } catch (error) {
                        console.error('Error eliminando usuario:', error);
                        Swal.fire('Error', `Hubo un problema: ${error.message}`, 'error');
                    }
                }
            });
        }
    });

    // Cargar datos iniciales (solo sucursales, usuarios se cargan con paginación)
    // La carga de sucursales ya se hace después de clonar el formulario.
}
