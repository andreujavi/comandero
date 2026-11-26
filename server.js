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
    fs.writeFileSync(DB_FILE, JSON.stringify({ pedidos: [] }, null, 2), 'utf8');
}

function leerBaseDatos() {
    try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const data = JSON.parse(raw);
        return Array.isArray(data.pedidos) ? data : { pedidos: [] };
    } catch (error) {
        console.error('Error leyendo database.json:', error);
        return { pedidos: [] };
    }
}

function guardarBaseDatos(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error guardando database.json:', error);
    }
}

// =========================================================================
// ENDPOINTS DE PEDIDOS (COMANDAS) - COMPATIBLE CON CUALQUIER FORMATO
// =========================================================================

// Obtener todos los pedidos activos
app.get(['/api/pedidos', '/api/pedido'], (req, res) => {
    const db = leerBaseDatos();
    res.json(db.pedidos);
});

// Crear un nuevo pedido (acepta { mesa_id, detalles } o { mesa, carrito/productos/items })
app.post(['/api/pedidos', '/api/pedido'], (req, res) => {
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

    db.pedidos.push(nuevoPedido);
    guardarBaseDatos(db);

    res.status(201).json({ ok: true, mensaje: 'Pedido registrado', pedido: nuevoPedido });
});

// Borrar un pedido individual al pulsar "Servido" en cocina.html
app.delete(['/api/pedidos/:id', '/api/pedido/:id'], (req, res) => {
    const idBuscado = req.params.id;
    const db = leerBaseDatos();
    const longitudInicial = db.pedidos.length;

    db.pedidos = db.pedidos.filter(p => String(p.id) !== String(idBuscado));

    if (db.pedidos.length === longitudInicial) {
        return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    guardarBaseDatos(db);
    res.json({ ok: true, mensaje: 'Pedido eliminado correctamente', id: idBuscado });
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