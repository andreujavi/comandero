// CLAVE: Extraemos la IP o dominio exacto desde donde el móvil cargó la web
const ipServidor = window.location.origin; // Devuelve algo como "http://192.168.1.50:3000"

// Conectamos Socket.io usando esa dirección dinámica (no localhost)
const socket = io(ipServidor);

// Elementos del DOM
const estadoConexion = document.getElementById('estado-conexion');
const btnEnviar = document.getElementById('btn-enviar');
const listaComandas = document.getElementById('lista-comandas');

// 1. Manejar el estado visual de la conexión
socket.on('connect', () => {
    estadoConexion.textContent = '🟢 Conectado al Servidor';
    estadoConexion.className = 'estado conectado';
});

socket.on('disconnect', () => {
    estadoConexion.textContent = '🔴 Servidor Desconectado';
    estadoConexion.className = 'estado desconectado';
});

// 2. Enviar una comanda al tocar el botón
btnEnviar.addEventListener('click', () => {
    const nuevaComanda = {
        producto: "Café",
        mesa: Math.floor(Math.random() * 10) + 1, // Mesa aleatoria 1-10
        hora: new Date().toLocaleTimeString()
    };
    
    // Enviamos el dato al servidor
    socket.emit('nueva-comanda', nuevaComanda);
});

// 3. Recibir comandas de cualquier dispositivo y pintarlas en pantalla
socket.on('actualizar-comandas', (comanda) => {
    const li = document.createElement('li');
    li.textContent = `Mesa ${comanda.mesa}: ${comanda.producto} (${comanda.hora})`;
    
    // Añadimos la comanda arriba de la lista
    listaComandas.prepend(li);
});

const ipServidor = window.location.origin; 
const socket = io(ipServidor);

// NUEVO: Leemos si en la dirección web dice "?rol=tablet"
const urlParams = new URLSearchParams(window.location.search);
const rol = urlParams.get('rol');

// Si es la tablet, le avisamos al servidor para que nos meta en la sala
if (rol === 'tablet') {
    socket.emit('soy-tablet');
}
