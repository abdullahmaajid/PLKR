// controllers/materiController.js
const mysql = require('mysql2/promise');

// Konfigurasi database dari environment variable
const dbConfig = {
  host: process.env.DB_HOST,       
  user: process.env.DB_USER,       
  password: process.env.DB_PASS,   
  database: process.env.DB_NAME    
};

exports.listMateri = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM modules ORDER BY created_at DESC');
    await connection.end();
    res.render('admin/materi/list', { title: 'Daftar Materi', modules: rows, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat mengambil data materi.');
  }
};

exports.createMateriPage = (req, res) => {
  res.render('admin/materi/create', { title: 'Tambah Materi', user: req.session.user });
};

exports.createMateri = async (req, res) => {
  const { title, description, content } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'INSERT INTO modules (title, description, content) VALUES (?, ?, ?)',
      [title, description, content]
    );
    await connection.end();
    res.redirect('/admin/materi');
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat menyimpan materi.');
  }
};

exports.editMateriPage = async (req, res) => {
  const id = req.params.id;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM modules WHERE id = ?', [id]);
    await connection.end();
    if (rows.length === 0) {
      return res.send('Materi tidak ditemukan.');
    }
    res.render('admin/materi/edit', { title: 'Edit Materi', module: rows[0], user: req.session.user });
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat mengambil data materi.');
  }
};

exports.updateMateri = async (req, res) => {
  const id = req.params.id;
  const { title, description, content } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'UPDATE modules SET title = ?, description = ?, content = ? WHERE id = ?',
      [title, description, content, id]
    );
    await connection.end();
    res.redirect('/admin/materi');
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat mengupdate materi.');
  }
};

exports.deleteMateri = async (req, res) => {
  const id = req.params.id;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('DELETE FROM modules WHERE id = ?', [id]);
    await connection.end();
    res.redirect('/admin/materi');
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat menghapus materi.');
  }
};
