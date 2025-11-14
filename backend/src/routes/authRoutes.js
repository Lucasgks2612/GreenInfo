const express = require('express');
const router = express.Router();
const connection = require('../db_config');

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email e senha obrigatórios' });
  }

  const query = 'SELECT * FROM users WHERE email = ?';
  connection.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro no servidor' });
    }

    if (results.length === 0 || results[0].password !== password) {
      return res.json({ success: false, message: 'Usuário/senha incorretos' });
    }

    const user = results[0];

    res.json({
      success: true,
      message: 'Login bem sucedido',
      userId: user.id,
      name: user.name
    });
  });
});

router.post('/cadastro', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Preencha todos os campos' });
  }

  const checkQuery = 'SELECT * FROM users WHERE email = ?';
  connection.query(checkQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro no servidor' });
    }

    if (results.length > 0) {
      return res.json({ success: false, message: 'Email já cadastrado' });
    }

    const insertQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    connection.query(insertQuery, [name, email, password], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Falha durante cadastro' });
      }

      res.json({
        success: true,
        message: 'Cadastro bem sucedido',
        userId: result.insertId
      });
    });
  });
});
console.log('teste da silva');
module.exports = router;

//teste da silva
