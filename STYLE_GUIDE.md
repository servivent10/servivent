## Paginación y Control de Filas por Tabla

Para añadir paginación y un selector de filas por página a cualquier tabla, se utiliza el componente reutilizable `js/pagination.js`.

### 1. Preparar el HTML de la Tabla

La tabla debe tener un `id` único. El componente de paginación inyectará sus controles justo después de la tabla.

```html
<div class="table-responsive">
    <table id="mi-tabla-unica" class="table-custom">
        <thead>
            <!-- Encabezados de la tabla -->
        </thead>
        <tbody>
            <!-- Las filas se cargarán dinámicamente aquí -->
        </tbody>
    </table>
</div>
<!-- El footer de paginación se inyectará automáticamente aquí -->
```

### 2. Integrar en el Archivo JavaScript del Módulo (`mi_modulo.js`)

Dentro de la función `init()` de tu módulo (la que se exporta y se llama después de que el HTML ha sido inyectado), sigue estos pasos:

#### a) Importar el Componente de Paginación

```javascript
// js/mi_modulo.js
import { setupPagination } from './pagination.js';

// ... (resto de tu código del módulo)
```

#### b) Definir la Función de Carga de Datos (`loadDataCallback`)

Esta función será la encargada de obtener los datos de tu base de datos (Supabase) para la página actual. Debe aceptar `offset`, `limit` y `searchTerm` como parámetros y devolver un objeto con los `data` (los registros de la página) y el `count` (el total de registros en la tabla).

```javascript
// Dentro de export async function init() {

    const miTablaBody = document.querySelector('#mi-tabla-unica tbody');

    const renderFilas = (items) => {
        miTablaBody.innerHTML = '';
        if (items.length === 0) {
            miTablaBody.innerHTML = `<tr><td colspan="X" class="text-center">No hay registros para mostrar.</td></tr>`;
            return;
        }
        items.forEach(item => {
            const row = miTablaBody.insertRow();
            row.setAttribute('data-id', item.id);
            row.innerHTML = `
                <!-- Celdas de la tabla con los datos del item -->
                <td>${item.propiedad1}</td>
                <td>${item.propiedad2}</td>
                <td class="action-column">
                    <!-- Botones de acción -->
                </td>
            `;
        });
    };

    const loadDataPaginated = async (offset, limit, searchTerm = '') => {
        let query = window.supabaseClient
            .from('tu_tabla_en_supabase')
            .select('*, relacion_opcional(nombre)', { count: 'exact' })
            .order('nombre_de_columna_para_ordenar'); // Importante para paginación consistente

        if (searchTerm) {
            // Ejemplo de búsqueda en múltiples columnas
            query = query.or(`columna1.ilike.%${searchTerm}%,columna2.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query.range(offset, offset + limit - 1);

        if (error) throw error;

        renderFilas(data); // Renderizar solo los datos de la página actual
        
        return { data, count };
    };

    // ... (resto de tu código init())
```

#### c) Inicializar la Paginación

Llama a `setupPagination` pasándole el `id` de tu tabla y la función de carga de datos que acabas de definir. Guarda la referencia a la instancia de paginación.

```javascript
// Dentro de export async function init() {

    // ... (código anterior)

    const pagination = setupPagination('mi-tabla-unica', loadDataPaginated, {
        initialPageSize: 10, // Opcional: tamaño de página inicial
        pageSizeOptions: [5, 10, 25, 50], // Opcional: opciones de tamaño de página
    });

    // ... (resto de tu código init())
```

#### d) Integrar el Buscador (si existe)

Si tu módulo tiene un campo de búsqueda, conéctalo a la paginación usando `pagination.updateSearchTerm()`.

```javascript
// Dentro de export async function init() {

    // ... (código anterior)

    const searchInput = document.getElementById('search-input'); // Asegúrate de que este ID exista en tu HTML
    searchInput.addEventListener('input', () => {
        pagination.updateSearchTerm(searchInput.value);
    });

    // ... (resto de tu código init())
```

#### e) Recargar Datos Después de Operaciones CRUD

Después de cualquier operación de crear, editar o eliminar un registro, llama a `pagination.loadData()` para que la tabla se actualice y la paginación se ajuste.

```javascript
// Ejemplo dentro de una función de guardar/eliminar:

    // ... (código de guardar/eliminar)

    Swal.fire('¡Guardado!', 'El registro ha sido guardado.', 'success');
    miModal.hide();
    pagination.loadData(); // ¡Importante para recargar la tabla paginada!

    // ... (resto del bloque try/catch/finally)
```

Siguiendo estos pasos, cualquier nueva tabla en tu aplicación podrá beneficiarse de la paginación reutilizable y los estilos consistentes.