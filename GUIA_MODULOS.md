# Guía para la Creación de Nuevos Módulos en ServiVENT

Este documento describe el patrón a seguir para agregar nuevas secciones (módulos) a la aplicación. Seguir estos pasos asegura que el código se mantenga consistente, organizado y fácil de mantener.

## Paso 1: Crear el Archivo JavaScript del Módulo

1.  **Ubicación:** Crea un nuevo archivo de JavaScript dentro de la carpeta `/js/`.
2.  **Nomenclatura:** El nombre del archivo debe ser descriptivo, en minúsculas y usar guiones bajos si es necesario. Por ejemplo: `mi_nuevo_modulo.js`.

## Paso 2: Escribir el Código del Módulo

El archivo del módulo tiene una responsabilidad principal: **generar y devolver el código HTML de su interfaz como una cadena de texto (string).**

Debe seguir esta estructura:

```javascript
// js/mi_nuevo_modulo.js

// La función debe ser 'export default' y 'async'.
export default async function() {
    // 1. (Opcional) Obtener datos necesarios para el módulo.
    // Por ejemplo, obtener la información del usuario desde la sesión del navegador:
    const user = JSON.parse(sessionStorage.getItem('user'));

    // Si necesitas datos de la base de datos, puedes usar el cliente global de Supabase:
    // const { data, error } = await window.supabaseClient.from('mi_tabla').select('*');

    // 2. Construir y devolver el contenido HTML como un string.
    // Es obligatorio usar backticks (`) para crear un string multilínea.
    return `
        <div class="container-fluid">
            <h1 class="mb-4">Mi Nuevo Módulo</h1>
            <p>Hola, ${user.nombre}. Este es tu nuevo módulo.</p>
            
            <!--
              Aquí va todo el contenido HTML de tu módulo.
              Puedes agregar tarjetas, tablas, formularios, etc.
            -->
            <div class="card">
                <div class="card-body">
                    <p>Contenido de la tarjeta de mi nuevo módulo.</p>
                </div>
            </div>
        </div>
    `;
}
```

**Importante:** El módulo **no debe** modificar el DOM directamente (por ejemplo, usando `document.getElementById('main-content').innerHTML = ...`). Su única tarea es devolver el string de HTML. El script `js/main.js` se encargará de inyectarlo en la página.

## Paso 3: Integrar el Módulo en la Interfaz

Para que los usuarios puedan acceder a tu módulo, necesitas agregarlo a la barra de navegación lateral.

#### a) Modificar `index.html`

Añade un nuevo elemento a la lista de navegación (`<ul>`) en el `sidebar`.

-   El `id` del enlace `<a>` es muy importante. Debe seguir el patrón `nav-nombre_del_modulo`.

```html
<!-- Dentro de <ul class="nav nav-pills flex-column mb-auto"> -->

<li class="nav-item">
    <a href="#" class="nav-link text-white" id="nav-mi_nuevo_modulo">
        <i class="bi bi-app-indicator me-2"></i> <!-- Puedes cambiar el ícono de Bootstrap Icons -->
        Mi Nuevo Módulo
    </a>
</li>
```

#### b) Modificar `js/main.js`

Añade un "event listener" para que el nuevo botón del menú cargue tu módulo al hacer clic. Busca la sección de "Event Listeners para navegación" y añade tu línea.

-   El `id` que usas en `getElementById` debe coincidir con el que pusiste en `index.html`.
-   El string que pasas a `loadContent()` debe ser el nombre de tu archivo `.js` (sin la extensión).

```javascript
// Cerca del final del archivo, junto a los otros listeners de navegación:

document.getElementById('nav-mi_nuevo_modulo').addEventListener('click', () => loadContent('mi_nuevo_modulo'));
```

## Checklist Rápido

Antes de dar por terminado un módulo, verifica:

- [ ] ¿El nuevo archivo `.js` está en la carpeta `/js/`?
- [ ] ¿El archivo `.js` tiene una única función `export default async function`?
- [ ] ¿La función devuelve el HTML como un string usando backticks?
- [ ] ¿Se ha añadido el elemento `<li>` al `sidebar` en `index.html`?
- [ ] ¿El `id` del nuevo enlace en `index.html` es `nav-nombre_del_modulo`?
- [ ] ¿Se ha añadido el `addEventListener` en `js/main.js` que llama a `loadContent('nombre_del_modulo')`?
