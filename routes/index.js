// routes/index.js
const express = require('express');
const router = express.Router();

const homeController = require('../controllers/homeController');
const authController = require('../controllers/authController');
const materiController = require('../controllers/materiController');
const authMiddleware = require('../middleware/authMiddleware');

// Landing page
router.get('/', homeController.index);

// Login & Register
router.get('/login', authController.loginPage);
router.post('/login', authController.loginProcess);
router.get('/register', authController.registerPage);
router.post('/register', authController.registerProcess);

// Dashboard
router.get('/dashboard', authMiddleware, authController.dashboard);
router.get('/admin-dashboard', authMiddleware, authController.adminDashboard);

// Logout
router.get('/logout', authController.logout);

// CRUD Materi untuk admin
router.get('/admin/materi', authMiddleware, materiController.listMateri);
router.get('/admin/materi/create', authMiddleware, materiController.createMateriPage);
router.post('/admin/materi/create', authMiddleware, materiController.createMateri);
router.get('/admin/materi/edit/:id', authMiddleware, materiController.editMateriPage);
router.post('/admin/materi/edit/:id', authMiddleware, materiController.updateMateri);
router.get('/admin/materi/delete/:id', authMiddleware, materiController.deleteMateri);

// CRUD Module Sections (admin)
// Menambah section untuk suatu modul
router.get('/admin/materi/:moduleId/section/create', authMiddleware, materiController.createSectionPage);
router.post('/admin/materi/:moduleId/section/create', authMiddleware, materiController.createSection);
// Mengedit section
router.get('/admin/materi/section/edit/:sectionId', authMiddleware, materiController.editSectionPage);
router.post('/admin/materi/section/edit/:sectionId', authMiddleware, materiController.updateSection);
// Menghapus section
router.get('/admin/materi/section/delete/:sectionId', authMiddleware, materiController.deleteSection);

// Untuk user: daftar dan detail materi
router.get('/materi', materiController.userListMateri);
router.get('/materi/:id', materiController.userDetailMateri);

// Route untuk update urutan section (admin)
router.post('/admin/materi/section/updateOrder', authMiddleware, materiController.updateSectionOrder);

module.exports = router;
