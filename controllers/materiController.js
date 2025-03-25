// controllers/materiController.js
const mysql = require('mysql2/promise');

// Konfigurasi database menggunakan environment variables
const dbConfig = {
  host: process.env.DB_HOST,       
  user: process.env.DB_USER,       
  password: process.env.DB_PASS,   
  database: process.env.DB_NAME    
};

/* ======================
   Helper: Ambil Sections untuk Modul
   ====================== */
async function getModuleSections(moduleId) {
  const connection = await mysql.createConnection(dbConfig);
  const [sections] = await connection.execute(
    'SELECT * FROM module_sections WHERE module_id = ? ORDER BY section_order ASC',
    [moduleId]
  );
  await connection.end();
  return sections;
}

/* ======================
   Fungsi untuk Halaman User (Read-Only)
   ====================== */

// Menampilkan daftar materi dalam bentuk card untuk user
exports.userListMateri = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [modules] = await connection.execute(
      'SELECT * FROM modules ORDER BY created_at DESC'
    );
    await connection.end();
    res.render('user/materi/list', { title: 'Materi Keuangan', modules, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat mengambil data materi.');
  }
};

// Menampilkan detail materi untuk user (misal: /materi/1) beserta bagian-bagian (sections)
exports.userDetailMateri = async (req, res) => {
  const id = req.params.id;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM modules WHERE id = ?',
      [id]
    );
    await connection.end();
    if (rows.length === 0) {
      return res.send('Materi tidak ditemukan.');
    }
    const moduleData = rows[0];
    // Ambil sections untuk modul ini
    const sections = await getModuleSections(id);
    res.render('user/materi/detail', {
      title: moduleData.title,
      module: moduleData,
      sections,
      user: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat mengambil detail materi.');
  }
};

/* ======================
   Fungsi untuk Halaman Admin (CRUD Materi)
   ====================== */

// Menampilkan daftar materi untuk admin
exports.listMateri = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [modules] = await connection.execute(
      'SELECT * FROM modules ORDER BY created_at DESC'
    );
    await connection.end();
    res.render('admin/materi/list', { title: 'Daftar Materi Admin', modules, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat mengambil data materi.');
  }
};

// Menampilkan halaman form tambah materi
exports.createMateriPage = (req, res) => {
  res.render('admin/materi/create', { title: 'Tambah Materi', user: req.session.user });
};

// Proses penambahan materi baru
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

// Menampilkan halaman form edit materi berdasarkan id, termasuk sections-nya
exports.editMateriPage = async (req, res) => {
  const id = req.params.id;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM modules WHERE id = ?',
      [id]
    );
    await connection.end();
    if (rows.length === 0) {
      return res.send('Materi tidak ditemukan.');
    }
    const moduleData = rows[0];
    // Ambil sections untuk modul ini
    const sections = await getModuleSections(id);
    res.render('admin/materi/edit', {
      title: 'Edit Materi',
      module: moduleData,
      sections,
      user: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat mengambil data materi.');
  }
};

// Proses update materi berdasarkan id
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

// Proses penghapusan materi berdasarkan id (otomatis menghapus sections terkait karena ON DELETE CASCADE)
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

/* ======================
   Fungsi CRUD untuk Module Sections (Admin)
   ====================== */

// Menampilkan halaman form tambah section untuk modul tertentu
exports.createSectionPage = async (req, res) => {
  const moduleId = req.params.moduleId;
  res.render('admin/materi/createSection', { title: 'Tambah Section', moduleId, user: req.session.user });
};

// Proses penambahan section baru untuk modul
exports.createSection = async (req, res) => {
  const moduleId = req.params.moduleId;
  const { section_order, section_title, section_content } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'INSERT INTO module_sections (module_id, section_order, section_title, section_content) VALUES (?, ?, ?, ?)',
      [moduleId, section_order, section_title, section_content]
    );
    await connection.end();
    res.redirect(`/admin/materi/edit/${moduleId}`);
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat menambahkan section.');
  }
};

// Menampilkan halaman form edit section
exports.editSectionPage = async (req, res) => {
  const sectionId = req.params.sectionId;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM module_sections WHERE id = ?',
      [sectionId]
    );
    await connection.end();
    if (rows.length === 0) {
      return res.send('Section tidak ditemukan.');
    }
    res.render('admin/materi/editSection', { title: 'Edit Section', section: rows[0], user: req.session.user });
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat mengambil data section.');
  }
};

// Proses update section
exports.updateSection = async (req, res) => {
  const sectionId = req.params.sectionId;
  const { section_order, section_title, section_content } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'UPDATE module_sections SET section_order = ?, section_title = ?, section_content = ? WHERE id = ?',
      [section_order, section_title, section_content, sectionId]
    );
    await connection.end();
    // Setelah update, redirect kembali ke halaman edit modul
    res.redirect('back');
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat mengupdate section.');
  }
};

// Proses penghapusan section
exports.deleteSection = async (req, res) => {
  const sectionId = req.params.sectionId;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'DELETE FROM module_sections WHERE id = ?',
      [sectionId]
    );
    await connection.end();
    res.redirect('back');
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat menghapus section.');
  }
};
