const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./api_filmes.sqlite', (err) => {
    if (err) console.error('Erro ao conectar ao banco:', err.message);
    else console.log('Conectado ao banco SQLite.');
});

db.serialize(() => {
    // Tabela de Usuários (Para o JWT)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    // Tabela de Diretores
    db.run(`CREATE TABLE IF NOT EXISTS directors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )`);

    // Tabela de Filmes (Relacionamento com Diretores)
    db.run(`CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        genre TEXT NOT NULL,
        release_year INTEGER,
        director_id INTEGER,
        FOREIGN KEY (director_id) REFERENCES directors(id)
    )`);

    // Populando o banco com +20 registros (Seed)
    db.get("SELECT COUNT(*) as count FROM movies", (err, row) => {
        if (row.count === 0) {
            db.run(`INSERT INTO directors (name) VALUES ('Christopher Nolan'), ('Quentin Tarantino'), ('Steven Spielberg')`);
            
            const stmt = db.prepare(`INSERT INTO movies (title, genre, release_year, director_id) VALUES (?, ?, ?, ?)`);
            const movies = [
                ['A Origem', 'Ficção', 2010, 1], ['Interestelar', 'Ficção', 2014, 1], ['Batman: O Cavaleiro das Trevas', 'Ação', 2008, 1],
                ['Pulp Fiction', 'Crime', 1994, 2], ['Kill Bill', 'Ação', 2003, 2], ['Django Livre', 'Faroeste', 2012, 2],
                ['Jurassic Park', 'Aventura', 1993, 3], ['Tubarão', 'Suspense', 1975, 3], ['A Lista de Schindler', 'Drama', 1993, 3],
                ['Amnésia', 'Suspense', 2000, 1], ['Bastardos Inglórios', 'Guerra', 2009, 2], ['E.T.', 'Ficção', 1982, 3],
                ['O Grande Truque', 'Mistério', 2006, 1], ['Cães de Aluguel', 'Crime', 1992, 2], ['O Resgate do Soldado Ryan', 'Guerra', 1998, 3],
                ['Dunkirk', 'Guerra', 2017, 1], ['Os Oito Odiados', 'Faroeste', 2015, 2], ['Prenda-Me Se For Capaz', 'Comédia', 2002, 3],
                ['Tenet', 'Ficção', 2020, 1], ['Era Uma Vez em... Hollywood', 'Comédia', 2019, 2], ['Indiana Jones', 'Aventura', 1981, 3]
            ];
            movies.forEach(m => stmt.run(m));
            stmt.finalize();

            // Criar usuário admin padrão (senha: 123456)
            const hash = bcrypt.hashSync('123456', 10);
            db.run(`INSERT INTO users (username, password) VALUES ('admin', '${hash}')`);
        }
    });
});

module.exports = db;