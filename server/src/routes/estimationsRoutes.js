const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getEstimations, createEstimation, updateEstimation, deleteEstimation } = require('../controllers/EstimationsController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Setup multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get('/', authenticate, getEstimations);
router.post('/', authenticate, createEstimation);
router.patch('/:id', authenticate, authorizeAdmin, upload.single('attachmentUrl'), updateEstimation);
router.delete('/:id', authenticate, authorizeAdmin, deleteEstimation);

module.exports = router;
