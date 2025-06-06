const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));
app.use(cors());

// Conexão com banco
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, // porta do MySQL (geralmente 3306)
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar no banco:', err);
    return;
  }
  console.log('Conectado ao banco!');
});

// GET - Listar todos os pontos (x,y)
app.get('/points', (req, res) => {
  db.query('SELECT x, y FROM points', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// POST - Adicionar novo ponto (x,y)
app.post('/points',
  [
    body('x').isFloat().withMessage('x deve ser um número'),
    body('y').isFloat().withMessage('y deve ser um número')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { x, y } = req.body;
    const sql = 'INSERT INTO points (x, y) VALUES (?, ?)';
    db.query(sql, [x, y], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ x, y });
    });
  }
);

// PUT - Atualizar ponto (x,y) com base no valor antigo de x e y
app.put('/points',
  [
    body('oldX').isFloat().withMessage('oldX deve ser um número'),
    body('oldY').isFloat().withMessage('oldY deve ser um número'),
    body('newX').isFloat().withMessage('newX deve ser um número'),
    body('newY').isFloat().withMessage('newY deve ser um número')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { oldX, oldY, newX, newY } = req.body;
    const sql = 'UPDATE points SET x = ?, y = ? WHERE x = ? AND y = ?';
    db.query(sql, [newX, newY, oldX, oldY], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Ponto não encontrado' });
      res.json({ message: 'Ponto atualizado com sucesso' });
    });
  }
);

// DELETE - Remover ponto (x,y)
app.delete('/points', 
  [
    body('x').isFloat().withMessage('x deve ser um número'),
    body('y').isFloat().withMessage('y deve ser um número')
  ],
  (req, res) => {
    const { x, y } = req.body;
    if (x === undefined || y === undefined) {
      return res.status(400).json({ error: 'x e y são obrigatórios no corpo da requisição' });
    }

    const sql = 'DELETE FROM points WHERE x = ? AND y = ?';
    db.query(sql, [x, y], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Ponto não encontrado' });
      res.json({ message: 'Ponto deletado com sucesso' });
    });
  }
);

// Tratamento global de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
