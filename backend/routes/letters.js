const express = require('express');
const router = express.Router();
const letterController = require('../controllers/letterController');
const pdfController = require('../controllers/pdfController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Dashboard statistics — must be before /:id to avoid being shadowed
router.get('/stats/dashboard', letterController.getDashboardStats);

// Letter CRUD routes
router.post('/', letterController.createLetter);
router.get('/', letterController.getUserLetters);
router.get('/:id', letterController.getLetter);
router.put('/:id', letterController.updateLetter);
router.delete('/:id', letterController.deleteLetter);

// Publish a letter to the public site
router.post('/:id/publish-to-site', letterController.publishToSite);

// PDF generation route
router.get('/:id/pdf', pdfController.generateLetterPDF);

module.exports = router;
