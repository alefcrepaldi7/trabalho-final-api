const Database = require('better-sqlite3');
const db = new Database('./api_filmes.sqlite', { verbose: console.log });

// Criar Tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS directors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    release_year INTEGER,
    director_id INTEGER,
    FOREIGN KEY (director_id) REFERENCES directors (id)
  );
`);

console.log('Conectado ao banco SQLite (Better-SQLite3).');

module.exports = db;