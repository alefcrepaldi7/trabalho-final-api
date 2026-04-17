const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./database');

const app = express();
app.use(express.json());

const SECRET_KEY = "trabalho_final_super_secreto";

// ==========================================
// MIDDLEWARE DE AUTENTICAÇÃO JWT
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Acesso negado. Token não fornecido." });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido." });
        req.user = user;
        next();
    });
};

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================
app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Usuário e senha são obrigatórios." });

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err || !user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    });
});

// ==========================================
// ROTAS CRUD - FILMES
// ==========================================

// 1. CREATE (POST) - Requer JWT e Validação Robusta
app.post('/movies', authenticateToken, (req, res) => {
    const { title, genre, release_year, director_id } = req.body;
    
    // Validações robustas
    if (!title || title.length < 2) return res.status(400).json({ error: "Título inválido." });
    if (!genre) return res.status(400).json({ error: "Gênero é obrigatório." });
    if (typeof release_year !== 'number' || release_year < 1800) return res.status(400).json({ error: "Ano de lançamento inválido." });
    if (!director_id) return res.status(400).json({ error: "ID do diretor é obrigatório." });

    const query = `INSERT INTO movies (title, genre, release_year, director_id) VALUES (?, ?, ?, ?)`;
    db.run(query, [title, genre, release_year, director_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, title, genre, release_year, director_id });
    });
});

// 2. READ (GET) - Filtros, Ordenação, Paginação e JOINs
app.get('/movies', (req, res) => {
    const { genre, sort = 'title', order = 'ASC', page = 1, limit = 5 } = req.query;
    
    const offset = (page - 1) * limit;
    let query = `
        SELECT movies.id, movies.title, movies.genre, movies.release_year, directors.name AS director 
        FROM movies 
        JOIN directors ON movies.director_id = directors.id
    `;
    let params = [];

    // Filtro
    if (genre) {
        query += ` WHERE movies.genre = ?`;
        params.push(genre);
    }

    // Ordenação
    const safeSortParams = ['title', 'release_year'];
    const sortBy = safeSortParams.includes(sort) ? sort : 'title';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    query += ` ORDER BY movies.${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ page: parseInt(page), limit: parseInt(limit), data: rows });
    });
});

// 3. UPDATE (PUT) - Requer JWT
app.put('/movies/:id', authenticateToken, (req, res) => {
    const { title, genre, release_year } = req.body;
    const { id } = req.params;

    if (!title || !genre || !release_year) return res.status(400).json({ error: "Dados incompletos." });

    const query = `UPDATE movies SET title = ?, genre = ?, release_year = ? WHERE id = ?`;
    db.run(query, [title, genre, release_year, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Filme não encontrado." });
        res.status(200).json({ message: "Filme atualizado com sucesso." });
    });
});

// 4. DELETE - Requer JWT
app.delete('/movies/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM movies WHERE id = ?`, id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Filme não encontrado." });
        res.status(204).send(); // 204 No Content
    });
});

const PORT = 3001; 

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na nova porta! Acesse: http://localhost:${PORT}`);
});
module.exports = app;