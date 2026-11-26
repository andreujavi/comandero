// Sustituye esta IP por la IPv4 real de tu PC (ej: la que obtienes con 'ipconfig')
const SERVER_URL = 'http://192.168.1.50:1420/api/pedidos';

// Enviar un pedido (ej. desde la tablet al tomar nota en una mesa)
export async function enviarPedido(mesaId, detalles) {
    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesa_id: mesaId, detalles, estado: 'Pendiente' })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error("Error de red: No se pudo conectar con el PC", error);
        return false;
    }
}

// Obtener la lista actualizada de pedidos en tiempo real
export async function obtenerPedidos() {
    try {
        const response = await fetch(SERVER_URL);
        const data = await response.json();
        return data.success ? data.pedidos : [];
    } catch (error) {
        console.error("No se pudieron sincronizar los pedidos", error);
        return [];
    }
}