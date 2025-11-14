const express = require('express');
const router = express.Router();
const connection = require('../db_config');

router.get('/profile', (req, res) => {
  const userId = req.header('X-User-Id');

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }

  const query = 'SELECT id, name, email, profile_picture, bio, created_at FROM users WHERE id = ?';

  connection.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao buscar perfil' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    res.json({ success: true, user: results[0] });
  });
});

router.put('/profile', (req, res) => {
  const upload = req.upload;
  
  upload.single('profile_picture')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const userId = req.header('X-User-Id');

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    const { name, bio } = req.body;

    let profilePicture = null;
    if (req.file) {
      profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    let query = 'UPDATE users SET ';
    let updates = [];
    let params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }

    if (bio) {
      updates.push('bio = ?');
      params.push(bio);
    }

    if (profilePicture) {
      updates.push('profile_picture = ?');
      params.push(profilePicture);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Nenhum dado para atualizar' });
    }
    console.log('teste da silva');
    query += updates.join(', ') + ' WHERE id = ?';
    params.push(userId);

    connection.query(query, params, (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Erro ao atualizar perfil' });
      }

      res.json({
        success: true,
        message: 'Perfil atualizado',
        profile_picture: profilePicture
      });
    });
  });
});

router.get('/profile/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = 'SELECT id, name, profile_picture, bio, created_at FROM users WHERE id = ?';

  connection.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao buscar perfil' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    res.json({ success: true, user: results[0] });
  });
});

router.delete('/profile', (req, res) => {
  const userId = req.header('X-User-Id');

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }

  const query = 'DELETE FROM users WHERE id = ?';

  connection.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao deletar conta' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    res.json({ success: true, message: 'Conta deletada com sucesso' });
  });
});

module.exports = router;
