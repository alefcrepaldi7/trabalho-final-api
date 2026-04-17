const request = require('supertest');
const app = require('./server'); // Importa a sua API

describe('Trabalho Final - Testes da API de Filmes', () => {
    
    // Teste 1: Verifica se a API lista os filmes corretamente
    it('Deve listar os filmes e retornar status 200', async () => {
        const res = await request(app).get('/movies');
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBeTruthy();
    });

    // Teste 2: Verifica se o Login padrão gera um Token JWT
    it('Deve fazer login com admin e retornar um Token JWT', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                username: 'admin',
                password: '123456'
            });
            
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

});