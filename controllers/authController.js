// controllers/authController.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const dbConfig = {
  host: process.env.DB_HOST,       // "localhost"
  user: process.env.DB_USER,       // "root"
  password: process.env.DB_PASS,   // "123"
  database: process.env.DB_NAME    // "literasi_keuangan_remaja"
};

exports.loginPage = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.loginProcess = async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Cari user berdasarkan username
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    await connection.end();

    if (rows.length === 0) {
      return res.send('Username tidak terdaftar.');
    }

    const user = rows[0];
    // Bandingkan password input dengan password yang di-hash di database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.send('Password salah.');
    }

    // Set session user
    req.session.user = { id: user.id, username: user.username, role: user.role };

    // Redirect berdasarkan role
    if (user.role === 'admin') {
      res.redirect('/admin-dashboard');
    } else {
      res.redirect('/dashboard');
    }
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat login.');
  }
};

exports.registerPage = (req, res) => {
  res.render('register', { title: 'Register' });
};

exports.registerProcess = async (req, res) => {
  const { username, email, password, confirm_password } = req.body;

  // Validasi sederhana
  if (password !== confirm_password) {
    return res.send('Password tidak cocok.');
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Periksa apakah username sudah terdaftar
    const [rows] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (rows.length > 0) {
      await connection.end();
      return res.send('Username sudah terdaftar.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Masukkan data ke tabel users dengan role default 'user'
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'user']
    );

    req.session.user = { id: result.insertId, username, role: 'user' };

    await connection.end();
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.send('Terjadi kesalahan saat registrasi.');
  }
};

exports.dashboard = (req, res) => {
  res.render('dashboard', { title: 'Dashboard User', user: req.session.user });
};

exports.adminDashboard = (req, res) => {
  res.render('dashboard', { title: 'Dashboard Admin', user: req.session.user });
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};
