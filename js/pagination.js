/**
 * Componente de paginación reutilizable.
 * Permite añadir paginación y selector de filas por página a cualquier tabla.
 */

export function setupPagination(tableId, loadDataCallback, options = {}) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Error: Tabla con ID '${tableId}' no encontrada para la paginación.`);
        return;
    }

    const defaultOptions = {
        initialPageSize: 5,
        pageSizeOptions: [5, 10, 25, 50, 100],
        showTotalRecords: true,
        showPageNumbers: false // Por ahora, solo Anterior/Siguiente
    };
    const config = { ...defaultOptions, ...options };

    let currentPage = 0; // 0-indexed
    let pageSize = config.initialPageSize;
    let totalRecords = 0;
    let searchTerm = ''; // Para integrar con el buscador

    // Crear el HTML del footer de paginación
    const paginationFooterHtml = `
        <div class="pagination-footer">
            <div class="pagination-controls-left">
                <label for="page-size-${tableId}" class="pagination-label">Mostrar:</label>
                <select id="page-size-${tableId}" class="pagination-select">
                    ${config.pageSizeOptions.map(option => `<option value="${option}" ${option === pageSize ? 'selected' : ''}>${option}</option>`).join('')}
                </select>
            </div>
            <div class="pagination-info" id="pagination-info-${tableId}"></div>
            <div class="pagination-controls-right">
                <button id="prev-page-${tableId}" class="pagination-button" disabled>Anterior</button>
                <button id="next-page-${tableId}" class="pagination-button" disabled>Siguiente</button>
            </div>
        </div>
    `;

    // Insertar el footer después de la tabla
    table.insertAdjacentHTML('afterend', paginationFooterHtml);

    // Obtener referencias a los elementos del DOM
    const pageSizeSelect = document.getElementById(`page-size-${tableId}`);
    const paginationInfo = document.getElementById(`pagination-info-${tableId}`);
    const prevPageButton = document.getElementById(`prev-page-${tableId}`);
    const nextPageButton = document.getElementById(`next-page-${tableId}`);

    // Función para actualizar la información de paginación y el estado de los botones
    const updatePaginationControls = () => {
        const start = totalRecords === 0 ? 0 : (currentPage * pageSize) + 1;
        const end = Math.min((currentPage + 1) * pageSize, totalRecords);
        paginationInfo.textContent = `Mostrando ${start} a ${end} de ${totalRecords} entradas`;

        prevPageButton.disabled = currentPage === 0;
        nextPageButton.disabled = (currentPage + 1) * pageSize >= totalRecords;
    };

    // Función para cargar los datos
    const loadData = async () => {
        try {
            const offset = currentPage * pageSize;
            const limit = pageSize;
            const result = await loadDataCallback(offset, limit, searchTerm);
            totalRecords = result.count;
            updatePaginationControls();
        } catch (error) {
            console.error("Error al cargar datos paginados:", error);
            // Manejo de errores, quizás mostrar un mensaje al usuario
        }
    };

    // Event Listeners
    pageSizeSelect.addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 0; // Resetear a la primera página al cambiar el tamaño
        loadData();
    });

    prevPageButton.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadData();
        }
    });

    nextPageButton.addEventListener('click', () => {
        if ((currentPage + 1) * pageSize < totalRecords) {
            currentPage++;
            loadData();
        }
    });

    // Función para actualizar el término de búsqueda y recargar datos
    const updateSearchTerm = (newSearchTerm) => {
        searchTerm = newSearchTerm;
        currentPage = 0; // Resetear a la primera página al buscar
        loadData();
    };

    // Cargar los datos iniciales
    loadData();

    // Devolver funciones que pueden ser útiles para el módulo que lo usa
    return {
        loadData, // Para recargar los datos desde fuera (ej. después de un CRUD)
        updateSearchTerm // Para integrar con un campo de búsqueda externo
    };
}
