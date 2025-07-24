/**
 * Módulo para la gestión de sucursales.
 * Sigue el patrón de arquitectura definido en GUIA_MODULOS.md.
 */

import { setupPagination } from './pagination.js';

// Devuelve la estructura HTML estática del módulo.
export default async function() {
    return `
        <h1>Gestión de Sucursales</h1>
        <div class="table-responsive">
            <table id="sucursal-table" class="table-custom">
                <thead>
                    <tr>
                        <th>Empresa</th>
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th>Dirección</th>
                        <th>Documento</th>
                        <th class="action-column">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Las filas se cargarán dinámicamente -->
                </tbody>
            </table>
        </div>

    `;
}

// Inicializa la lógica dinámica del módulo.
export async function init() {
    let allSucursales = []; // allSucursales ahora solo contendrá los datos de la página actual
    const sucursalTableBody = document.querySelector('#sucursal-table tbody');
    let searchInput = document.getElementById('search-input'); // ID global del buscador
    const sucursalModal = new bootstrap.Modal(document.getElementById('sucursal-modal'));
    const modalTitle = document.getElementById('sucursal-modal-title');
    let sucursalForm = document.getElementById('sucursal-form');

    const renderSucursales = (sucursales) => {
        sucursalTableBody.innerHTML = '';
        if (sucursales.length === 0) {
            sucursalTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No hay sucursales para mostrar.</td></tr>`;
            return;
        }
        sucursales.forEach(sucursal => {
            const row = sucursalTableBody.insertRow();
            row.setAttribute('data-id', sucursal.id);
            row.innerHTML = `
                <td>${sucursal.empresa}</td>
                <td>${sucursal.nombre}</td>
                <td>${sucursal.telefono || 'N/A'}</td>
                <td>${sucursal.direccion || 'N/A'}</td>
                <td>${sucursal.documento || 'N/A'}</td>
                <td class="action-column">
                    <button class="btn-custom btn-custom-edit edit-btn"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn-custom btn-custom-delete delete-btn"><i class="bi bi-trash-fill"></i></button>
                </td>
            `;
        });
    };

    // Función de carga de datos para la paginación
    const loadSucursalesPaginated = async (offset, limit, searchTerm = '') => {
        let query = window.supabaseClient
            .from('sucursales')
            .select('*', { count: 'exact' })
            .order('nombre'); // Ordenar por nombre para paginación consistente

        if (searchTerm) {
            query = query.or(`empresa.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%,direccion.ilike.%${searchTerm}%,documento.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query.range(offset, offset + limit - 1);

        if (error) throw error;

        allSucursales = data; // Actualizar las sucursales de la página actual
        renderSucursales(allSucursales);
        
        return { data, count };
    };

    // Configurar la paginación
    const pagination = setupPagination('sucursal-table', loadSucursalesPaginated);

    // Integrar el buscador con la paginación
    // Abortar el listener anterior para evitar duplicados
    if (window.searchAbortController) {
        window.searchAbortController.abort();
    }
    window.searchAbortController = new AbortController();

    searchInput.addEventListener('input', () => {
        pagination.updateSearchTerm(searchInput.value);
    }, { signal: window.searchAbortController.signal });

    // El botón se crea dinámicamente, así que asignamos el evento al contenedor
    document.getElementById('seccion_botones').addEventListener('click', (e) => {
        const button = e.target.closest('#btn-nuevo-sucursales');
        if (button) {
            modalTitle.textContent = 'Nueva Sucursal';
            sucursalForm.reset();
            document.getElementById('sucursal-id').value = '';
            sucursalModal.show();
        }
    });

    // Clonar y reemplazar el formulario para limpiar listeners antiguos
    const oldSucursalForm = sucursalForm;
    sucursalForm = oldSucursalForm.cloneNode(true);
    oldSucursalForm.parentNode.replaceChild(sucursalForm, oldSucursalForm);

    sucursalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('sucursal-id').value;
        const formData = {
            empresa: document.getElementById('sucursal-empresa').value,
            nombre: document.getElementById('sucursal-nombre').value,
            telefono: document.getElementById('sucursal-telefono').value,
            direccion: document.getElementById('sucursal-direccion').value,
            documento: document.getElementById('sucursal-documento').value
        };

        try {
            const { error } = id
                ? await window.supabaseClient.from('sucursales').update(formData).eq('id', id)
                : await window.supabaseClient.from('sucursales').insert([formData]);
            if (error) throw error;
            Swal.fire('¡Guardado!', 'La sucursal ha sido guardada.', 'success');
            sucursalModal.hide();
            pagination.loadData(); // Recargar datos a través de la paginación
        } catch (error) {
            console.error('Error guardando sucursal:', error);
            Swal.fire('Error', `Hubo un problema: ${error.message}`, 'error');
        }
    });

    sucursalTableBody.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-btn');
        const deleteButton = e.target.closest('.delete-btn');
        const row = e.target.closest('tr');
        if (!row) return;
        const id = row.getAttribute('data-id');
        const sucursal = allSucursales.find(s => s.id === id);

        if (editButton && sucursal) {
            modalTitle.textContent = 'Editar Sucursal';
            document.getElementById('sucursal-id').value = sucursal.id;
            document.getElementById('sucursal-empresa').value = sucursal.empresa;
            document.getElementById('sucursal-nombre').value = sucursal.nombre;
            document.getElementById('sucursal-telefono').value = sucursal.telefono || '';
            document.getElementById('sucursal-direccion').value = sucursal.direccion || '';
            document.getElementById('sucursal-documento').value = sucursal.documento || '';
            sucursalModal.show();
        }

        if (deleteButton && sucursal) {
            Swal.fire({
                title: '¿Estás seguro?',
                text: `Eliminar la sucursal ${sucursal.nombre}`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, ¡eliminar!',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const { error } = await window.supabaseClient.from('sucursales').delete().eq('id', id);
                        if (error) throw error;
                        Swal.fire('¡Eliminada!', 'La sucursal ha sido eliminada.', 'success');
                        pagination.loadData(); // Recargar datos a través de la paginación
                    } catch (error) {
                        console.error('Error eliminando sucursal:', error);
                        Swal.fire('Error', `Hubo un problema: ${error.message}`, 'error');
                    }
                }
            });
        }
    });

    // Cargar datos iniciales
    // await loadSucursales(); // Ahora se carga a través de pagination.loadData()
}
