# Notas sobre la Carga de Módulos en ServiVENT 10.1

## Problema Identificado

El error principal que causó que los datos no se mostraran en el módulo de "Usuarios" fue una **doble carga/inicialización de los scripts de módulo**.

1.  **Carga Estática en `index.html`**: Los archivos `js/usuarios.js` y `js/sucursales.js` estaban siendo incluidos directamente en `index.html` mediante etiquetas `<script>`. Esto hacía que el código dentro de estos archivos se ejecutara tan pronto como el navegador los cargaba.
2.  **Carga Dinámica en `js/main.js`**: El archivo `js/main.js` contiene una función `loadModule` que está diseñada para cargar scripts de forma dinámica (creando una nueva etiqueta `<script>`) y, una vez cargados, llamar a sus respectivas funciones de inicialización (ej. `window.initUsuarios()`, `window.initSucursales()`).

El conflicto surgía porque, al estar ya cargados estáticamente, la carga dinámica no siempre disparaba el evento `onload` de la manera esperada, o la función de inicialización no se llamaba porque el script ya había sido procesado. Esto resultaba en que `window.initUsuarios()` (y por ende `loadUsers()`) no se ejecutaba al navegar al módulo.

Además, se identificó que dentro de `window.initUsuarios()`, la función `loadUsers()` no se estaba llamando inicialmente, solo `loadSucursales()`.

## Solución Implementada

1.  **Eliminación de Carga Estática**: Se eliminaron las etiquetas `<script>` para `js/usuarios.js` y `js/sucursales.js` de `index.html`. Esto asegura que `js/main.js` sea el único responsable de la carga y gestión de estos módulos.
2.  **Llamada Explícita a `loadUsers()`**: Se añadió la llamada a `loadUsers()` dentro de `window.initUsuarios()` en `js/usuarios.js`, justo después de `loadSucursales()`, para asegurar que los datos de usuarios se carguen al inicializar el módulo.

## Lección Aprendida y Recomendaciones para Futuros Módulos

Para cualquier nuevo módulo que se añada a la aplicación (ej. `productos.js`, `reportes.js`), se debe seguir el siguiente patrón para evitar problemas de carga e inicialización:

1.  **Definir una Función de Inicialización Global**: Cada archivo de módulo (ej. `productos.js`) debe encapsular su lógica principal dentro de una función global, por ejemplo:
    ```javascript
    // js/productos.js
    window.initProductos = () => {
        // Lógica de inicialización del módulo de productos
        // ...
        loadProductos(); // Asegurarse de llamar a la función de carga de datos
    };

    const loadProductos = async () => {
        // Lógica para cargar productos desde Supabase
    };
    // ... otras funciones del módulo
    ```
2.  **Carga Única y Dinámica**: **NO** incluir el script del nuevo módulo directamente en `index.html`. En su lugar, confiar en la función `loadModule` de `js/main.js` para cargarlo dinámicamente cuando sea necesario.
3.  **Llamada a la Función de Inicialización**: Asegurarse de que `loadModule` en `js/main.js` llame correctamente a la función de inicialización del nuevo módulo (ej. `window.initProductos()`) una vez que el script se haya cargado. El patrón actual en `main.js` ya maneja esto automáticamente:
    ```javascript
    // Dentro de loadModule en js/main.js
    script.onload = () => {
        if (window[`init${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}`]) {
            window[`init${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}`]();
        }
    };
    ```
4.  **Orden de Carga de Datos**: Si un módulo depende de datos de otro (como `usuarios` depende de `sucursales`), asegúrate de que las funciones de carga de datos se llamen en el orden correcto dentro de la función de inicialización del módulo dependiente.

Siguiendo estas pautas, se mantendrá una estructura de carga de módulos consistente y se evitarán errores de inicialización en el futuro.