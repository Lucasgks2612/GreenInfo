const express = require('express');
const router = express.Router();
const connection = require('../db_config');


router.get('/posts', (req, res, next) => {
  const query = `SELECT p.id, p.user_id, p.title, p.content, p.img, p.created_at,
    u.name as user_name, u.profile_picture,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
    FROM news p
    LEFT JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC`;

  connection.query(query, (err, results) => {
    if (err) return next(err);
    res.json({ success: true, posts: results });
  });
});


router.post('/posts', (req, res, next) => {
  if (!req.upload) {
    return next(new Error('Multer não foi inicializado (req.upload ausente).'));
  }

  req.upload.single('image')(req, res, (err) => {
    if (err) return next(err);

    const userId = req.header('X-User-Id');
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    const { content, title } = req.body;
    let imgPath = null;
    if (req.file) imgPath = `/uploads/profiles/${req.file.filename}`;

    const query = 'INSERT INTO news (user_id, title, content, img) VALUES (?, ?, ?, ?)';
    connection.query(query, [userId, title || null, content || null, imgPath], (err, result) => {
      if (err) return next(err);
      res.json({ success: true, postId: result.insertId, img: imgPath });
    });
  });
});

router.get('/posts/:postId/comments', (req, res, next) => {
  const postId = req.params.postId;

  const query = `SELECT c.id, c.content, c.created_at,
    u.id as user_id, u.name as user_name, u.profile_picture
    FROM comments c
    LEFT JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC`;

  connection.query(query, [postId], (err, results) => {
    if (err) return next(err);
    res.json({ success: true, comments: results });
  });
});


router.post('/posts/:postId/comment', (req, res, next) => {
  const userId = req.header('X-User-Id');
  const postId = req.params.postId;
  const { content } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }
  if (!content) {
    return res.status(400).json({ success: false, message: 'Comentário vazio' });
  }

  const query = 'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)';
  connection.query(query, [postId, userId, content], (err, result) => {
    if (err) return next(err);
    res.json({ success: true, commentId: result.insertId });
  });
});


router.post('/posts/:postId/like', (req, res, next) => {
  const userId = req.header('X-User-Id');
  const postId = req.params.postId;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }

  const checkQuery = 'SELECT id FROM likes WHERE post_id = ? AND user_id = ?';

  connection.query(checkQuery, [postId, userId], (err, rows) => {
    if (err) return next(err);

    if (rows.length > 0) {
      return connection.query('DELETE FROM likes WHERE id = ?', [rows[0].id], (err2) => {
        if (err2) return next(err2);
        res.json({ success: true, liked: false });
      });
    }

    connection.query('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, userId], (err3) => {
      if (err3) return next(err3);
      res.json({ success: true, liked: true });
    });
  });
});

module.exports = router;