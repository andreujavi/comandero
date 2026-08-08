-- Habilitar claves foráneas (clave para integridad en SQLite)
PRAGMA foreign_keys = ON;

-- ==========================================
-- 1. TABLA DE ZONAS (Ej: Sala, Terraza, Barra)
-- ==========================================
CREATE TABLE IF NOT EXISTS zonas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

-- ==========================================
-- 2. TABLA DE MESAS
-- ==========================================
CREATE TABLE IF NOT EXISTS mesas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zona_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    estado TEXT DEFAULT 'Libre', -- 'Libre', 'Ocupada', 'Cobrada'
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE CASCADE
);

-- ==========================================
-- 3. TABLA DE PRODUCTOS (Menú / Carta)
-- ==========================================
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio REAL NOT NULL,
    categoria TEXT NOT NULL,
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

-- ==========================================
-- 4. TABLA DE PEDIDOS / COMANDAS
-- ==========================================
CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mesa_id INTEGER NOT NULL,
    estado TEXT DEFAULT 'Pendiente', -- 'Pendiente', 'Enviado a Cocina', 'Cobrado', 'Cancelado'
    total REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE
);

-- ==========================================
-- 5. TABLA DE DETALLES DEL PEDIDO (Líneas)
-- ==========================================
CREATE TABLE IF NOT EXISTS pedido_detalles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- ==========================================
-- 6. TABLA DE CONTROL DE SINCRONIZACIÓN (Sync Log)
-- ==========================================
-- Permite registrar qué cambios se han hecho para pasarlos entre la tablet y el PC
CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tabla TEXT NOT NULL,
    registro_id INTEGER NOT NULL,
    operacion TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    timestamp DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

-- ==========================================
-- 7. DATOS INICIALES POR DEFECTO (Seed Data)
-- ==========================================
INSERT INTO zonas (nombre) VALUES ('Sala Principal'), ('Terraza'), ('Barra');

INSERT INTO mesas (zona_id, nombre, estado) VALUES 
(1, 'Mesa 1', 'Libre'),
(1, 'Mesa 2', 'Libre'),
(1, 'Mesa 3', 'Libre'),
(2, 'Terraza 1', 'Libre'),
(2, 'Terraza 2', 'Libre'),
(3, 'Barra 1', 'Libre');

INSERT INTO productos (nombre, precio, categoria) VALUES 
('Café Solo', 1.30, 'Bebidas'),
('Café con Leche', 1.50, 'Bebidas'),
('Caña de Cerveza', 2.00, 'Bebidas'),
('Refresco de Cola', 2.20, 'Bebidas'),
('Bocadillo de Jamón', 4.50, 'Comidas'),
('Hamburguesa Completa', 8.50, 'Comidas'),
('Ración de Patatas Bravas', 5.00, 'Comidas');