import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de rutas en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Puerto dinámico obligatorio para Render
const PORT = process.env.PORT || 10000;

// 1. Habilitar CORS abierto para evitar bloqueos desde APK, Electron o distintos dominios
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 2. Servir archivos estáticos (index.html, cocina.html, etc.) desde la carpeta raíz o 'www'
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'www')));

// Evitar error 404 en consola cuando el navegador pide /favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Ruta principal explícita para servir index.html sin errores 404
app.get('/', (req, res) => {
    const rutaRaiz = path.join(__dirname, 'index.html');
    const rutaWww = path.join(__dirname, 'www', 'index.html');
    if (fs.existsSync(rutaRaiz)) {
        return res.sendFile(rutaRaiz);
    }
    if (fs.existsSync(rutaWww)) {
        return res.sendFile(rutaWww);
    }
    res.status(404).send('No se encontró index.html en el servidor.');
});

// Archivo JSON local para persistencia de comandas
const DB_FILE = path.join(__dirname, 'database.json');

// Inicializar database.json si no existe
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ pedidos: [], historial_caja: [] }, null, 2), 'utf8');
}

function leerBaseDatos() {
    try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const data = JSON.parse(raw);
        return {
            pedidos: Array.isArray(data.pedidos) ? data.pedidos : [],
            historial_caja: Array.isArray(data.historial_caja) ? data.historial_caja : []
        };
    } catch (error) {
        console.error('Error leyendo database.json:', error);
        return { pedidos: [], historial_caja: [] };
    }
}

function guardarBaseDatos(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify({
            pedidos: Array.isArray(data.pedidos) ? data.pedidos : [],
            historial_caja: Array.isArray(data.historial_caja) ? data.historial_caja : []
        }, null, 2), 'utf8');
    } catch (error) {
        console.error('Error guardando database.json:', error);
    }
}

function calcularImportePedidoServer(pedido) {
    if (typeof pedido.importe === 'number' && !isNaN(pedido.importe)) {
        return pedido.importe;
    }
    if (Array.isArray(pedido.items) && pedido.items.length > 0) {
        return pedido.items.reduce((acc, it) => acc + ((Number(it.precio) || 0) * (Number(it.cantidad) || 1)), 0);
    }
    const texto = String(pedido.detalles || '');
    const matchTotal = texto.match(/Total:\s*([\d.,]+)\s*€/i);
    if (matchTotal) {
        return parseFloat(matchTotal[1].replace(',', '.')) || 0;
    }
    return 0;
}

// =========================================================================
// ENDPOINTS DE PEDIDOS (COMANDAS) - COMPATIBLE CON CUALQUIER FORMATO
// =========================================================================

// Obtener todos los pedidos activos
app.get(['/api/pedidos', '/api/pedido'], (req, res) => {
    const db = leerBaseDatos();
    res.json(db.pedidos);
});

// Crear un nuevo pedido (acepta POST tanto en '/' como en '/api/pedidos' o '/api/pedido')
app.post(['/', '/api/pedidos', '/api/pedido'], (req, res) => {
    const body = req.body || {};

    // Detectar número o nombre de mesa en cualquiera de sus variantes
    const mesa = body.mesa_id ?? body.mesa ?? body.numeroMesa ?? '1';

    // Detectar artículos enviados como texto (detalles) o como lista/carrito
    let detallesTexto = '';
    const listaArticulos = body.carrito || body.productos || body.items || body.articulos;

    if (typeof body.detalles === 'string' && body.detalles.trim() !== '') {
        detallesTexto = body.detalles.trim();
    } else if (Array.isArray(listaArticulos) && listaArticulos.length > 0) {
        detallesTexto = listaArticulos.map(item => {
            if (typeof item === 'string') return item;
            const cant = item.cantidad || item.qty || item.unidades || 1;
            const nombre = item.nombre || item.name || item.producto || item.title || 'Artículo';
            const nota = item.nota || item.observaciones ? ` (${item.nota || item.observaciones})` : '';
            return `${cant}x ${nombre}${nota}`;
        }).join(', ');
    } else if (body.producto || body.articulo || body.nombre) {
        const cant = body.cantidad || 1;
        const nombre = body.producto || body.articulo || body.nombre;
        detallesTexto = `${cant}x ${nombre}`;
    }

    if (!detallesTexto) {
        return res.status(400).json({ error: 'No se recibieron artículos o detalles en el pedido.' });
    }

    const db = leerBaseDatos();
    const nuevoPedido = {
        id: Date.now(),
        mesa_id: String(mesa),
        mesa: String(mesa),
        tipo: body.tipo || body.seccion || 'comida',
        detalles: detallesTexto,
        items: Array.isArray(listaArticulos) ? listaArticulos : [],
        created_at: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
    nuevoPedido.importe = calcularImportePedidoServer(nuevoPedido);

    db.pedidos.push(nuevoPedido);
    guardarBaseDatos(db);

    res.status(201).json({ ok: true, mensaje: 'Pedido registrado', pedido: nuevoPedido });
});

// Borrar/Cobrar un pedido individual al pulsar "Servido / Cobrado" y sumarlo a Caja
app.delete(['/api/pedidos/:id', '/api/pedido/:id'], (req, res) => {
    const idBuscado = req.params.id;
    const db = leerBaseDatos();
    const pedidoCobrado = db.pedidos.find(p => String(p.id) === String(idBuscado));

    if (!pedidoCobrado) {
        return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    const importeCobrado = calcularImportePedidoServer(pedidoCobrado);
    db.historial_caja.push({
        id: pedidoCobrado.id,
        mesa_id: pedidoCobrado.mesa_id,
        tipo: pedidoCobrado.tipo || 'comida',
        detalles: pedidoCobrado.detalles,
        importe: importeCobrado,
        hora_pedido: pedidoCobrado.created_at || '',
        hora_cobro: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        fecha: new Date().toISOString().slice(0, 10)
    });

    db.pedidos = db.pedidos.filter(p => String(p.id) !== String(idBuscado));
    guardarBaseDatos(db);

    res.json({ ok: true, mensaje: 'Pedido cobrado y registrado en caja', id: idBuscado, importe: importeCobrado });
});

// =========================================================================
// ENDPOINTS DE CAJA Y RECAUDACIÓN TOTAL DEL DÍA
// =========================================================================

app.get('/api/caja', (req, res) => {
    const db = leerBaseDatos();
    const cobradoCaja = db.historial_caja.reduce((acc, item) => acc + (Number(item.importe) || 0), 0);
    const pendienteMesas = db.pedidos.reduce((acc, p) => acc + calcularImportePedidoServer(p), 0);

    const cobradoComida = db.historial_caja
        .filter(i => i.tipo !== 'barra')
        .reduce((acc, i) => acc + (Number(i.importe) || 0), 0);
    const cobradoBarra = db.historial_caja
        .filter(i => i.tipo === 'barra')
        .reduce((acc, i) => acc + (Number(i.importe) || 0), 0);

    res.json({
        ok: true,
        cobradoCaja,
        pendienteMesas,
        recaudacionTotalDia: cobradoCaja + pendienteMesas,
        cobradoComida,
        cobradoBarra,
        totalTicketsCobrados: db.historial_caja.length,
        totalComandasPendientes: db.pedidos.length,
        historial: db.historial_caja
    });
});

// Reiniciar caja al hacer el cierre diario (Cierre Z)
app.post('/api/caja/cierre', (req, res) => {
    const db = leerBaseDatos();
    const totalCerrado = db.historial_caja.reduce((acc, item) => acc + (Number(item.importe) || 0), 0);
    db.historial_caja = [];
    guardarBaseDatos(db);
    res.json({ ok: true, mensaje: 'Cierre de caja realizado correctamente', totalCerrado });
});

// =========================================================================
// ENDPOINTS PARA CONFIGURACIÓN STUN / TURN Y SEÑALIZACIÓN WEBRTC
// =========================================================================

// Devuelve la configuración ICE (STUN + ExpressTURN) centralizada para los clientes
app.get('/api/ice-config', (req, res) => {
    res.json({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun.cloudflare.com:3478' },
            {
                urls: 'turn:free.expressturn.com:3478',
                username: '000000002102154901',
                credential: 'zTwHEShFvegqotlDMnVBLEt7pTo='
            }
        ],
        iceCandidatePoolSize: 10
    });
});

// Almacén en memoria para intercambio de señales WebRTC (Oferta, Respuesta y Candidatos ICE)
let senalesWebRTC = {
    offer: null,
    answer: null,
    candidates: []
};

app.get('/api/webrtc/signal', (req, res) => {
    res.json(senalesWebRTC);
});

app.post('/api/webrtc/signal', (req, res) => {
    const { type, data } = req.body;
    if (type === 'offer') {
        senalesWebRTC = { offer: data, answer: null, candidates: [] };
    } else if (type === 'answer') {
        senalesWebRTC.answer = data;
    } else if (type === 'candidate' && data) {
        senalesWebRTC.candidates.push(data);
    } else if (type === 'reset') {
        senalesWebRTC = { offer: null, answer: null, candidates: [] };
    }
    res.json({ ok: true });
});

// =========================================================================
// RUTA DE SALUD (HEALTH CHECK) Y ARRANQUE DEL SERVIDOR
// =========================================================================

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor GastroPOS activo en http://0.0.0.0:${PORT}`);
});