
export default async function() {
    try {
        // Obtener información del usuario logueado desde sessionStorage
        const user = JSON.parse(sessionStorage.getItem('user'));

        const userName = user ? user.nombre : 'Desconocido';
        const userRole = user ? user.rol : 'N/A';
        const userBranch = user ? (user.sucursales?.nombre || 'N/A') : 'N/A';

        // Devolver el HTML como un string
        return `
            <div class="container-fluid">
                <h1 class="mb-4">Bienvenido al Panel Principal</h1>
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <div class="card shadow-sm">
                            <div class="card-body">
                                <h5 class="card-title">Información del Usuario</h5>
                                <p class="card-text"><strong>Nombre:</strong> <span id="home-user-name">${userName}</span></p>
                                <p class="card-text"><strong>Rol:</strong> <span id="home-user-role">${userRole}</span></p>
                                <p class="card-text"><strong>Sucursal:</strong> <span id="home-user-branch">${userBranch}</span></p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-4">
                        <div class="card shadow-sm">
                            <div class="card-body">
                                <h5 class="card-title">Estadísticas Rápidas</h5>
                                <p class="card-text"><strong>Total de Usuarios:</strong> <span id="home-total-users">N/A</span></p>
                                <p class="card-text"><strong>Total de Sucursales:</strong> <span id="home-total-branches">N/A</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } finally {
        // Ya no se necesita ocultar el progreso
    }
}
