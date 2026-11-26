import initSqlJs from 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js';

let db = null;

export async function initDatabase() {
    if (db) return db;

    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });

    // Intentar recuperar una base de datos guardada previamente en localStorage
    const savedDb = localStorage.getItem('gastropos_sqlite_backup');
    
    if (savedDb) {
        const uInt8Array = new Uint8Array(JSON.parse(savedDb));
        db = new SQL.Database(uInt8Array);
    } else {
        db = new SQL.Database();
        crearTablasPorDefecto();
    }

    return db;
}

function crearTablasPorDefecto() {
    db.run(`
        CREATE TABLE IF NOT EXISTS mesas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            estado TEXT
        );
    `);
    // Insertar datos iniciales si está vacía
    db.run("INSERT INTO mesas (nombre, estado) VALUES ('Mesa 1 - Sala', 'Libre');");
    db.run("INSERT INTO mesas (nombre, estado) VALUES ('Mesa 2 - Terraza', 'Libre');");
    guardarEnPersistencia();
}

export function guardarEnPersistencia() {
    if (!db) return;
    const data = db.export();
    const arr = Array.from(data);
    localStorage.setItem('gastropos_sqlite_backup', JSON.stringify(arr));
}

export function ejecutarQuery(sql, params = []) {
    if (!db) throw new Error("Base de datos no inicializada");
    return db.exec(sql, params);
}