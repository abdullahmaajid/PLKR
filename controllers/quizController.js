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