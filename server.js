import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('✅ Nuevo dispositivo conectado');

    socket.on('registro-dispositivo', (rol) => {
        console.log(`Dispositivo registrado como: ${rol}`);
    });

    socket.on('nueva-comanda', (comanda) => {
        console.log('Nueva comanda recibida:', comanda);
        io.emit('actualizar-comandas', comanda);
    });

    socket.on('disconnect', () => {
        console.log('🔴 Dispositivo desconectado');
    });
});

const PUERTO = process.env.PORT || 3000;
server.listen(PUERTO, '0.0.0.0', () => {
    console.log(`🚀 Servidor GastroPOS funcionando en el puerto ${PUERTO}`);
});
