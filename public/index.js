// =====================================================================
// 1. CONEXIÓN TODOTERRENO (Localhost + Render + 4G)
// =====================================================================
const socket = io(window.location.origin, { 
    transports: ['polling', 'websocket'], // Polling primero esquiva los bloqueos de 4G
    secure: true,
    reconnection: true
});

// =====================================================================
// 2. ENLACES A LA PANTALLA
// =====================================================================
const estadoConexion = document.getElementById('estado-conexion');
const mesaActualTexto = document.getElementById('mesa-actual');
const inputNota = document.getElementById('nota-pedido');
const btnEnviar = document.getElementById('btn-enviar');
const btnImprimir = document.getElementById('btn-imprimir');
const listaComandas = document.getElementById('lista-comandas');
const contenedorProductos = document.getElementById('contenedor-productos');
const listaCuenta = document.getElementById('lista-cuenta');
const precioTotalTexto = document.getElementById('precio-total');

let mesaSeleccionada = null;
let pedidoActual = [];
let totalCuenta = 0;

// Identificamos el dispositivo (ej: ?rol=terraza)
const urlParams = new URLSearchParams(window.location.search);
const rol = urlParams.get('rol') || 'PC';

// =====================================================================
// 3. LA SÚPER CARTA DEL RESTAURANTE (Añade lo que quieras aquí)
// =====================================================================
const carta = [
    // ☕ CAFETERÍA
    { cat: 'Café', nombre: 'Café Solo', precio: 1.20 },
    { cat: 'Café', nombre: 'Cortado', precio: 1.30 },
    { cat: 'Café', nombre: 'Café con Leche', precio: 1.50 },
    { cat: 'Café', nombre: 'Carajillo', precio: 2.00 },
    { cat: 'Café', nombre: 'Infusión / Té', precio: 1.50 },
    
    // 🍺 BEBIDAS Y VINOS
    { cat: 'Bebida', nombre: 'Caña de Cerveza', precio: 1.80 },
    { cat: 'Bebida', nombre: 'Jarra Cerveza 0.5L', precio: 3.00 },
    { cat: 'Bebida', nombre: 'Copa Vino Rioja', precio: 2.50 },
    { cat: 'Bebida', nombre: 'Refresco Cola/Limón', precio: 2.20 },
    { cat: 'Bebida', nombre: 'Agua Mineral 0.5L', precio: 1.50 },
    { cat: 'Bebida', nombre: 'Vermut de la casa', precio: 3.50 },

    // 🍘 TAPAS Y RACIONES
    { cat: 'Tapa', nombre: 'Patatas Bravas', precio: 4.50 },
    { cat: 'Tapa', nombre: 'Calamares a la Romana', precio: 7.00 },
    { cat: 'Tapa', nombre: 'Croquetas Caseras (6u)', precio: 6.00 },
    { cat: 'Tapa', nombre: 'Ensaladilla Rusa', precio: 5.50 },
    { cat: 'Tapa', nombre: 'Tabla de Quesos', precio: 9.00 },
    { cat: 'Tapa', nombre: 'Plato Jamón Ibérico', precio: 14.00 },

    // 🍳 PLATOS COMBINADOS
    { cat: 'Plato', nombre: 'Pl.1: Lomo, Huevo, Patatas', precio: 8.50 },
    { cat: 'Plato', nombre: 'Pl.2: Pechuga, Ensalada, Patatas', precio: 8.50 },
    { cat: 'Plato', nombre: 'Pl.3: Sepia plancha, Ensalada', precio: 11.50 },
    { cat: 'Plato', nombre: 'Pl.4: Hamburguesa, Huevo, Patatas', precio: 9.50 },
    { cat: 'Plato', nombre: 'Pl.5: Entrecot, Pimientos, Patatas', precio: 14.50 },
    { cat: 'Plato', nombre: 'Pl.6: Merluza, Ensalada, Mayonesa', precio: 10.00 },
    
    // 🍰 POSTRES
    { cat: 'Postre', nombre: 'Flan Casero', precio: 3.50 },
    { cat: 'Postre', nombre: 'Tarta de Queso', precio: 4.50 },
    { cat: 'Postre', nombre: 'Helado (2 bolas)', precio: 3.00 }
];

// =====================================================================
// 4. CREACIÓN DE LOS BOTONES DE CRISTAL LÍQUIDO
// =====================================================================
carta.forEach(producto => {
    const btn = document.createElement('button');
    btn.className = 'glass-btn prod-btn';
    
    // Asignamos iconos automáticamente según la categoría
    let icono = '🍽️';
    if(producto.cat === 'Café') icono = '☕';
    if(producto.cat === 'Bebida') icono = '🥤';
    if(producto.cat === 'Tapa') icono = '🧆';
    if(producto.cat === 'Postre') icono = '🍰';
    
    btn.textContent = `${icono} ${producto.nombre} - ${producto.precio.toFixed(2)}€`;
    
    // Al hacer clic, suma el producto al ticket
    btn.addEventListener('click', () => añadirAlTicket(producto));
    contenedorProductos.appendChild(btn);
});

function añadirAlTicket(producto) {
    pedidoActual.push(producto);
    totalCuenta += producto.precio;
    
    // Añade la línea visual al ticket
    const li = document.createElement('li');
    li.innerHTML = `<span>${producto.nombre}</span> <span>${producto.precio.toFixed(2)}€</span>`;
    listaCuenta.appendChild(li);
    
    // Actualiza el precio total en pantalla
    precioTotalTexto.textContent = totalCuenta.toFixed(2);
}

// =====================================================================
// 5. CHIVATOS DE CONEXIÓN CON EL SERVIDOR
// =====================================================================
socket.on('connect', () => {
    if(estadoConexion) {
        estadoConexion.textContent = `🟢 Conectado (${rol.toUpperCase()})`;
        estadoConexion.style.color = '#a8ffca';
    }
});

socket.on('disconnect', () => {
    if(estadoConexion) {
        estadoConexion.textContent = `🔴 Desconectado`;
        estadoConexion.style.color = '#ff9999';
    }
});

// =====================================================================
// 6. SELECCIONAR MESAS
// =====================================================================
document.querySelectorAll('.mesa-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.mesa-btn').forEach(b => b.classList.remove('activa'));
        e.target.classList.add('activa');
        mesaSeleccionada = e.target.textContent;
        mesaActualTexto.textContent = mesaSeleccionada;
    });
});

// =====================================================================
// 7. IMPRIMIR EL TICKET FÍSICO
// =====================================================================
if(btnImprimir) {
    btnImprimir.addEventListener('click', () => {
        if (pedidoActual.length === 0) {
            alert('⚠️ El ticket está vacío. Añade productos para imprimir.');
            return;
        }
        // Llama a la ventana de impresión del navegador
        window.print();
    });
}

// =====================================================================
// 8. ENVIAR COMANDA A COCINA Y A TODOS LOS DISPOSITIVOS
// =====================================================================
if(btnEnviar) {
    btnEnviar.addEventListener('click', () => {
        if (!mesaSeleccionada) {
            alert('⚠️ ¡Selecciona una mesa primero!');
            return;
        }
        if (pedidoActual.length === 0) {
            alert('⚠️ ¡Añade al menos un producto al pedido!');
            return;
        }

        // Juntamos los nombres de los productos separados por un "+"
        const nombresProductos = pedidoActual.map(p => p.nombre).join(' + ');
        const notaExtra = inputNota.value.trim() ? `<br><br>📝 <i>Notas: ${inputNota.value}</i>` : '';

        const comanda = {
            mesa: mesaSeleccionada,
            pedido: nombresProductos + notaExtra,
            total: totalCuenta.toFixed(2),
            hora: new Date().toLocaleTimeString(),
            origen: rol.toUpperCase()
        };

        // Disparamos la comanda hacia el servidor (Render o tu red Wi-Fi)
        socket.emit('nueva-comanda', comanda);
        
        // Vaciamos todo para dejar la pantalla lista para la siguiente mesa
        listaCuenta.innerHTML = '';
        totalCuenta = 0;
        precioTotalTexto.textContent = '0.00';
        pedidoActual = [];
        inputNota.value = '';
        document.querySelectorAll('.mesa-btn').forEach(b => b.classList.remove('activa'));
        mesaSeleccionada = null;
        mesaActualTexto.textContent = 'Ninguna';
    });
}

// =====================================================================
// 9. RECIBIR COMANDAS (Para que Cocina y Barra las vean al instante)
// =====================================================================
socket.on('actualizar-comandas', (comanda) => {
    if(listaComandas) {
        const li = document.createElement('li');
        li.className = 'comanda-item';
        
        // Diseño de la tarjeta que aparece en cocina
        li.innerHTML = `
            <span style="font-size:0.85rem; color:#dcdcdc;">⏰ ${comanda.hora} | 📍 <b>${comanda.mesa}</b> | 👤 ${comanda.origen}</span>
            <div style="font-size: 1.1rem; margin-top: 8px;">${comanda.pedido}</div>
            <div style="margin-top: 10px; color: #a8ffca; text-align: right; font-weight: bold; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 5px;">
                Total mesa: ${comanda.total}€
            </div>
        `;
        
        // Lo coloca arriba del todo en la lista
        listaComandas.prepend(li);
    }
});
