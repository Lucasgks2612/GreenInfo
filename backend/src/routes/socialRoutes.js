const express = require('express');
const router = express.Router();
const connection = require('../db_config');

router.get('/search', (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ success: false, message: 'Mínimo 2 caracteres' });
  }

  const query = 'SELECT id, name, profile_picture, bio FROM users WHERE name LIKE ? LIMIT 10';
  connection.query(query, [`%${q}%`], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao buscar' });
    }
    res.json({ success: true, users: results });
  });
});

router.post('/follow/:userId', (req, res) => {
  const currentUserId = req.header('X-User-Id');
  const targetUserId = req.params.userId;

  if (!currentUserId) {
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }

  if (currentUserId === targetUserId) {
    return res.status(400).json({ success: false, message: 'Não pode seguir a si mesmo' });
  }

  res.json({ success: true, message: 'Seguindo usuário' });
});

router.delete('/follow/:userId', (req, res) => {
  const currentUserId = req.header('X-User-Id');

  if (!currentUserId) {
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }

  res.json({ success: true, message: 'Deixou de seguir' });
});

module.exports = router;
