const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
};

// ADMIN: List Modul dengan Card
exports.adminListModules = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [modules] = await connection.execute(`
      SELECT 
        m.id,
        m.title,
        COUNT(qq.id) AS total_questions,
        m.created_at
      FROM modules m
      LEFT JOIN quiz_questions qq ON m.id = qq.module_id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `);
    
    await connection.end();
    
    res.render('admin/quiz/list', {
      title: 'Kelola Kuis per Modul',
      modules,
      user: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.send('Gagal memuat daftar modul');
  }
};

// ADMIN: Detail Kuis per Modul
exports.adminModuleDetail = async (req, res) => {
  const { moduleId } = req.params;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [module] = await connection.execute(
      'SELECT * FROM modules WHERE id = ?',
      [moduleId]
    );
    
    const [questions] = await connection.execute(
      `SELECT * FROM quiz_questions 
      WHERE module_id = ?
      ORDER BY created_at DESC`,
      [moduleId]
    );
    
    await connection.end();
    
    res.render('admin/quiz/detail', {
      title: 'Kelola Pertanyaan',
      module: module[0],
      questions,
      user: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.send('Gagal memuat detail modul');
  }
};

// ADMIN: Halaman Buat Pertanyaan
exports.adminCreateQuestionPage = async (req, res) => {
  const { moduleId } = req.query;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [module] = await connection.execute(
      'SELECT id, title FROM modules WHERE id = ?',
      [moduleId]
    );
    
    await connection.end();
    
    res.render('admin/quiz/create', {
      title: 'Buat Pertanyaan Baru',
      module: module[0],
      user: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.send('Gagal memuat form');
  }
};

// ADMIN: Proses Buat Pertanyaan
exports.adminCreateQuestion = async (req, res) => {
  const { module_id, question, option_a, option_b, option_c, option_d, correct_answer, difficulty } = req.body;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `INSERT INTO quiz_questions 
      (module_id, question, option_a, option_b, option_c, option_d, correct_answer, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [module_id, question, option_a, option_b, option_c, option_d, correct_answer, difficulty]
    );
    
    await connection.end();
    
    res.redirect(`/admin/quiz/module/${module_id}`);
  } catch (error) {
    console.error(error);
    res.send('Gagal menyimpan pertanyaan');
  }
};

// ADMIN: Halaman Edit Pertanyaan
exports.adminEditQuestionPage = async (req, res) => {
    const { questionId } = req.params;
    
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      // Dapatkan data pertanyaan dan modul
      const [[question]] = await connection.execute(
        'SELECT qq.*, m.id AS module_id ' +
        'FROM quiz_questions qq ' +
        'JOIN modules m ON qq.module_id = m.id ' +
        'WHERE qq.id = ?',
        [questionId]
      );
      
      await connection.end();
      
      res.render('admin/quiz/edit', {
        title: 'Edit Pertanyaan',
        question,
        user: req.session.user,
        flash: req.session.flash
      });
      
      // Hapus flash message setelah ditampilkan
      delete req.session.flash;
      
    } catch (error) {
      console.error(error);
      res.send('Gagal memuat form edit');
    }
  };

// ADMIN: Proses Update Pertanyaan
exports.adminUpdateQuestion = async (req, res) => {
    const { questionId } = req.params;
    const { question, option_a, option_b, option_c, option_d, correct_answer, difficulty } = req.body;
    
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      // Dapatkan module_id sebelum update
      const [[currentQuestion]] = await connection.execute(
        'SELECT module_id FROM quiz_questions WHERE id = ?',
        [questionId]
      );
      
      // Update pertanyaan
      await connection.execute(
        `UPDATE quiz_questions SET
        question = ?, 
        option_a = ?, 
        option_b = ?, 
        option_c = ?, 
        option_d = ?, 
        correct_answer = ?, 
        difficulty = ?
        WHERE id = ?`,
        [question, option_a, option_b, option_c, option_d, correct_answer, difficulty, questionId]
      );
      
      await connection.end();
      
      req.session.flash = {
        type: 'success',
        message: 'Pertanyaan berhasil diupdate!'
      };
      
      res.redirect(`/admin/quiz/module/${currentQuestion.module_id}`);
      
    } catch (error) {
      console.error(error);
      req.session.flash = {
        type: 'error',
        message: 'Gagal mengupdate pertanyaan'
      };
      res.redirect(`/admin/quiz/edit/${questionId}`);
    }
  };

// ADMIN: Hapus Pertanyaan
exports.adminDeleteQuestion = async (req, res) => {
  const { questionId } = req.params;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'DELETE FROM quiz_questions WHERE id = ?',
      [questionId]
    );
    
    await connection.end();
    
    res.redirect('back');
  } catch (error) {
    console.error(error);
    res.send('Gagal menghapus pertanyaan');
  }
};


// controllers/quizController.js

// USER: List Modul dengan Kuis
exports.userListQuizzes = async (req, res) => {
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      const [modules] = await connection.execute(`
        SELECT 
          m.id,
          m.title,
          m.description,
          COUNT(qq.id) AS total_questions
        FROM modules m
        INNER JOIN quiz_questions qq ON m.id = qq.module_id
        GROUP BY m.id
        HAVING total_questions > 0
        ORDER BY m.created_at DESC
      `);
      
      await connection.end();
      
      res.render('user/quiz/list', {
        title: 'Daftar Kuis',
        modules,
        user: req.session.user
      });
    } catch (error) {
      console.error(error);
      res.send('Gagal memuat daftar kuis');
    }
  };
  
  // USER: Halaman Mulai Kuis
  exports.userAttemptQuiz = async (req, res) => {
    const { moduleId } = req.params;
    
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      // Ambil pertanyaan acak
      const [questions] = await connection.execute(
        `SELECT * FROM quiz_questions 
        WHERE module_id = ?
        ORDER BY RAND() LIMIT 10`, // Ambil 10 soal acak
        [moduleId]
      );
      
      // Ambil info modul
      const [module] = await connection.execute(
        'SELECT title FROM modules WHERE id = ?',
        [moduleId]
      );
      
      await connection.end();
      
      res.render('user/quiz/attempt', {
        title: 'Mulai Kuis',
        module: module[0],
        questions,
        user: req.session.user
      });
    } catch (error) {
      console.error(error);
      res.send('Gagal memulai kuis');
    }
  };
  
  // USER: Proses Jawaban Kuis
  exports.userSubmitQuiz = async (req, res) => {
    const { module_id, answers } = req.body;
    const userId = req.session.user.id;
    
    try {
      const connection = await mysql.createConnection(dbConfig);
       // Validasi module_id
    const [moduleCheck] = await connection.execute(
        'SELECT id FROM modules WHERE id = ?',
        [module_id]
      );
  
      if (moduleCheck.length === 0) {
        await connection.end();
        return res.send('Modul tidak valid!');
      }
      // Buat attempt baru
      const [attempt] = await connection.execute(
        `INSERT INTO quiz_attempts 
        (user_id, module_id, score)
        VALUES (?, ?, 0)`,
        [userId, module_id]
      );
      const attemptId = attempt.insertId;
      
      // Proses jawaban
      let correctCount = 0;
      for (const questionId in answers) {
        const selectedAnswer = answers[questionId];
        
        // Cek jawaban benar
        const [question] = await connection.execute(
          'SELECT correct_answer FROM quiz_questions WHERE id = ?',
          [questionId]
        );
        
        const isCorrect = question[0].correct_answer === selectedAnswer;
        if (isCorrect) correctCount++;
        
        // Simpan jawaban user
        await connection.execute(
          `INSERT INTO user_quiz_answers
          (user_id, attempt_id, question_id, selected_answer)
          VALUES (?, ?, ?, ?)`,
          [userId, attemptId, questionId, selectedAnswer]
        );
      }
      
      // Hitung skor
      const totalQuestions = Object.keys(answers).length;
      const score = totalQuestions > 0 
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;
      
      // Update skor attempt
      await connection.execute(
        'UPDATE quiz_attempts SET score = ? WHERE attempt_id = ?',
        [score, attemptId]
      );
      
      await connection.end();
      
      res.redirect(`/quiz/results/${attemptId}`);
    } catch (error) {
      console.error(error);
      res.send('Gagal menyimpan hasil kuis');
    }
  };
  
  // USER: Hasil Kuis
  exports.userQuizResults = async (req, res) => {
    const { attemptId } = req.params;
    
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      // Ambil data attempt
      const [attempt] = await connection.execute(`
        SELECT 
          qa.*, 
          m.title AS module_title,
          u.username
        FROM quiz_attempts qa
        JOIN modules m ON qa.module_id = m.id
        JOIN users u ON qa.user_id = u.id
        WHERE attempt_id = ?
      `, [attemptId]);
      
      // Ambil jawaban user
      const [answers] = await connection.execute(`
        SELECT 
          uqa.*,
          qq.question,
          qq.correct_answer,
          qq.explanation
        FROM user_quiz_answers uqa
        JOIN quiz_questions qq ON uqa.question_id = qq.id
        WHERE attempt_id = ?
      `, [attemptId]);
      
      await connection.end();
      
      res.render('user/quiz/results', {
        title: 'Hasil Kuis',
        attempt: attempt[0],
        answers,
        user: req.session.user
      });
    } catch (error) {
      console.error(error);
      res.send('Gagal memuat hasil kuis');
    }
  };