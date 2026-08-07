const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Ensure uploads directory exists on the server
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 2. Configure Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename to prevent overwriting
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 3. Strict Validation: 10MB limit and specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

// Middleware to intercept the file upload
exports.uploadMiddleware = upload.single('media');

// Controller to handle the successful upload
exports.handleUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No file uploaded or invalid file type.' });
    }
    
    // Return the safe filename so the frontend can save it in the JSON submission
    res.status(200).json({
      status: 'success',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: `/api/uploads/${req.file.filename}` 
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ status: 'error', message: 'File upload failed.' });
  }
};

// Controller to securely serve the file back to authorized users
exports.getFile = (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, '../uploads', filename);

  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ status: 'fail', message: 'File not found.' });
  }
};