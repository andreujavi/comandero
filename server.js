import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = { pedidos: [] };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/pedidos', (req, res) => {
    const db = readDB();
    res.json({ success: true, pedidos: db.pedidos || [] });
});

app.post('/api/pedidos', (req, res) => {
    const db = readDB();
    const nuevoPedido = {
        id: Date.now(),
        mesa_id: req.body.mesa_id || 1,
        detalles: req.body.detalles || 'Sin detalles',
        estado: 'pendiente',
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (!db.pedidos) db.pedidos = [];
    db.pedidos.push(nuevoPedido);
    writeDB(db);

    res.json({ success: true, pedido: nuevoPedido });
});

app.delete('/api/pedidos/:id', (req, res) => {
    const pedidoId = Number(req.params.id);
    const db = readDB();

    if (!db.pedidos) db.pedidos = [];

    const totalAntes = db.pedidos.length;
    db.pedidos = db.pedidos.filter(p => p.id !== pedidoId);

    if (db.pedidos.length < totalAntes) {
        writeDB(db);
        res.json({ success: true, message: 'Pedido eliminado correctamente' });
    } else {
        res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor GastroPOS activo en http://0.0.0.0:${PORT}`);
});