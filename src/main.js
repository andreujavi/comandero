// Función para refrescar los pedidos en la pantalla del PC automáticamente
async function actualizarPantallaPC() {
    try {
        const respuesta = await fetch('http://localhost:3000/api/pedidos');
        const datos = await respuesta.json();
        
        if (datos.success) {
            console.عام("Pedidos actualizados:", datos.pedidos);
            // Aquí pintas los pedidos en tu tabla o lista HTML del PC
        }
    } catch (error) {
        console.error("Error al sincronizar con el servidor local");
    }
}

// Se ejecuta solo cada 3 segundos
setInterval(actualizarPantallaPC, 3000);