// src/api.js - Puente de comunicación de red con el PC
const PC_IP = '192.168.1.150'; // <--- CAMBIA ESTA IP POR LA DE TU PC

const URL_API = 'http://192.168.1.45:3000/api/pedidos';
// Enviar un pedido (Usado principalmente por la tablet al confirmar comandas)
export async function enviarPedidoAServidor(mesaId, detallesPedido) {
    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mesa_id: mesaId,
                detalles: detallesPedido,
                estado: 'Pendiente'
            })
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error de red al conectar con el PC:', error);
        return false;
    }
}

// Obtener la lista de pedidos (Usado para refrescar la cocina/caja en tiempo real)
export async function obtenerPedidosDelServidor() {
    try {
        const response = await fetch(SERVER_URL);
        const data = await response.json();
        return data.success ? data.pedidos : [];
    } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        return [];
    }
}
import { enviarPedidoAServidor } from './api.js';

document.getElementById('btn-confirmar-pedido').addEventListener('click', async () => {
    // Recoge los valores de tu interfaz táctil en la tablet
    const mesaId = parseInt(document.getElementById('select-mesa').value); 
    const detalles = document.getElementById('resumen-pedido').value || document.getElementById('resumen-pedido').innerText;

    if (!detalles) {
        alert('Por favor, añade productos al pedido antes de enviarlo.');
        return;
    }

    // Envía los datos al servidor del PC
    const enviadoConExito = await enviarPedidoAServidor(mesaId, detalles);

    if (enviadoConExito) {
        alert('¡Pedido enviado a cocina correctamente!');
        // Limpiar la pantalla de la tablet aquí si lo deseas
    } else {
        alert('Error al enviar el pedido. Comprueba la consola.');
    }
});
// Asegúrate de que esto se ejecuta al hacer clic en el botón de enviar
async function enviarComandaPrueba() {
    const exito = await enviarPedidoAServidor(5, "2x Refrescos, 1x Patatas"); // Datos de prueba fijos
    if (exito) {
        console.log("¡Enviado con éxito!");
    } else {
        console.log("Falló el envío");
    }
}

app.post('/api/pedidos', (req, res) => {
    try {
        const { mesa_id, detalles } = req.body;
        
        const stmt = db.prepare('INSERT INTO pedidos (mesa_id, detalles, estado) VALUES (?, ?, ?)');
        const info = stmt.run(mesa_id, detalles, 'Pendiente');

        res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});