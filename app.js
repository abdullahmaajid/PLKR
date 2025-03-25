// app.js
const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Setup session middleware
app.use(session({
  secret: 'secret-key', // ganti dengan secret yang lebih kuat di produksi
  resave: false,
  saveUninitialized: true
}));

// Tambahkan di bawah session middleware
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Middleware untuk parsing request body
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Set view engine EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Static folder (jika ada file statis)
app.use(express.static(path.join(__dirname, 'public')));

// Routing
const routes = require('./routes/index');
app.use('/', routes);

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
