// 1. Conexión automática al servidor (detecta Fly.io por sí solo)
const socket = io();

// 2. Elementos de la pantalla
const estadoConexion = document.getElementById('estado-conexion');
const btnEnviar = document.getElementById('btn-enviar');
const listaComandas = document.getElementById('lista-comandas');

// 3. IDENTIFICACIÓN 100% FUNCIONAL
// Buscamos en la barra de direcciones si pone "?rol=movil" o "?rol=tablet"
const urlParams = new URLSearchParams(window.location.search);
const rol = urlParams.get('rol');

// 4. Cuando el servidor nos acepta la conexión
socket.on('connect', () => {
    // Si tenemos rol, pedimos entrar a la sala privada de GastroPOS
    if (rol === 'tablet' || rol === 'movil') {
        socket.emit('registro-dispositivo', rol);
        
        // Actualizamos el recuadro para que sepas visualmente quién eres
        if(estadoConexion) {
            estadoConexion.textContent = `🟢 Conectado como: ${rol.toUpperCase()}`;
            estadoConexion.className = 'estado conectado';
        }
    } else {
        // Si entras desde el PC sin rol, te avisa de que estás fuera
        if(estadoConexion) {
            estadoConexion.textContent = '🟡 Conectado (Fuera de sala/PC)';
            estadoConexion.className = 'estado';
        }
    }
});

socket.on('disconnect', () => {
    if(estadoConexion) {
        estadoConexion.textContent = '🔴 Servidor Desconectado';
        estadoConexion.className = 'estado desconectado';
    }
});

// 5. ENVIAR COMANDAS (Funciona igual para Tablet y Móvil)
if (btnEnviar) {
    btnEnviar.addEventListener('click', () => {
        const nuevaComanda = {
            // Añadimos el rol para saber visualmente quién lo envió
            producto: `Mesa ${Math.floor(Math.random() * 10) + 1} - Pedido desde ${rol || 'PC'}`,
            hora: new Date().toLocaleTimeString()
        };
        socket.emit('nueva-comanda', nuevaComanda);
    });
}

// 6. RECIBIR COMANDAS (Solo llegará si estás en la sala)
socket.on('actualizar-comandas', (comanda) => {
    if (listaComandas) {
        const li = document.createElement('li');
        li.textContent = `${comanda.producto} (${comanda.hora})`;
        // Ponemos la comanda más nueva arriba
        listaComandas.prepend(li);
    }
});