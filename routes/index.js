const express = require('express');
const router = express.Router();

const homeController = require('../controllers/homeController');
const authController = require('../controllers/authController');
const materiController = require('../controllers/materiController');
const quizController = require('../controllers/quizController'); // Tambahkan ini
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
router.get('/admin/materi/:moduleId/section/create', authMiddleware, materiController.createSectionPage);
router.post('/admin/materi/:moduleId/section/create', authMiddleware, materiController.createSection);
router.get('/admin/materi/section/edit/:sectionId', authMiddleware, materiController.editSectionPage);
router.post('/admin/materi/section/edit/:sectionId', authMiddleware, materiController.updateSection);
router.get('/admin/materi/section/delete/:sectionId', authMiddleware, materiController.deleteSection);

// Route untuk user: Materi
router.get('/materi', materiController.userListMateri);
router.get('/materi/:id', materiController.userDetailMateri);

// QUIZ ROUTES
router.get('/admin/quiz', authMiddleware, quizController.adminListModules);
router.get('/admin/quiz/module/:moduleId', authMiddleware, quizController.adminModuleDetail);
router.get('/admin/quiz/create', authMiddleware, quizController.adminCreateQuestionPage);
router.post('/admin/quiz/create', authMiddleware, quizController.adminCreateQuestion);
router.get('/admin/quiz/edit/:questionId', authMiddleware, quizController.adminEditQuestionPage);
router.post('/admin/quiz/update/:questionId', authMiddleware, quizController.adminUpdateQuestion);
router.get('/admin/quiz/delete/:questionId', authMiddleware, quizController.adminDeleteQuestion);

// routes/index.js

// User Quiz Routes
router.get('/quiz', authMiddleware, quizController.userListQuizzes);
router.get('/quiz/attempt/:moduleId', authMiddleware, quizController.userAttemptQuiz);
router.post('/quiz/submit', authMiddleware, quizController.userSubmitQuiz);
router.get('/quiz/results/:attemptId', authMiddleware, quizController.userQuizResults);



// Di routes/index.js
router.post('/quiz/submit', authMiddleware, (req, res) => {
    quizController.userSubmitQuiz(req, res).catch(error => {
      console.error('Error submitting quiz:', error);
      res.status(500).send('Terjadi kesalahan sistem');
    });
  });


// Route untuk update urutan section (admin)
router.post('/admin/materi/section/updateOrder', authMiddleware, materiController.updateSectionOrder);

module.exports = router;