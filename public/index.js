


const io = require('socket.io')(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }


});
// 2. Elementos de la pantalla
const estadoConexion = document.getElementById('estado-conexion');
const btnEnviar = document.getElementById('btn-enviar');
const listaComandas = document.getElementById('lista-comandas');

// 3. IDENTIFICACIÓN FUNCIONAL
const urlParams = new URLSearchParams(window.location.search);
const rol = urlParams.get('rol');

// 4. CHIVATOS DE CONEXIÓN Y ERRORES
socket.on('connect', () => {
    if(estadoConexion) {
        estadoConexion.textContent = `🟢 Conectado como: ${rol ? rol.toUpperCase() : 'PC'}`;
        estadoConexion.className = 'estado conectado';
    }
    if (rol === 'tablet' || rol === 'movil') {
        socket.emit('registro-dispositivo', rol);
    }
});

socket.on('disconnect', (motivo) => {
    if(estadoConexion) {
        estadoConexion.textContent = `🔴 Desconectado: ${motivo}`;
        estadoConexion.className = 'estado desconectado';
    }
});

socket.on('connect_error', (error) => {
    if(estadoConexion) {
        estadoConexion.textContent = `❌ Error: ${error.message}`;
        estadoConexion.className = 'estado desconectado';
    }
});

// 5. ENVIAR COMANDAS
if (btnEnviar) {
    btnEnviar.addEventListener('click', () => {
        const nuevaComanda = {
            producto: `Mesa ${Math.floor(Math.random() * 10) + 1} - Pedido desde ${rol || 'PC'}`,
            hora: new Date().toLocaleTimeString()
        };
        socket.emit('nueva-comanda', nuevaComanda);
    });
}

// 6. RECIBIR COMANDAS
socket.on('actualizar-comandas', (comanda) => {
    if (listaComandas) {
        const li = document.createElement('li');
        li.textContent = `${comanda.producto} (${comanda.hora})`;
        listaComandas.prepend(li);
    }
});
