// controllers/homeController.js
exports.index = (req, res) => {
  res.render('home', { title: 'Landing Page' });
};
