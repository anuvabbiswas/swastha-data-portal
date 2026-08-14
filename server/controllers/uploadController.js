const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

exports.uploadMiddleware = upload.single('media');

exports.handleUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No file uploaded or invalid file type.' });
    }
    
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

exports.getFile = (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, '../uploads', filename);

  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ status: 'fail', message: 'File not found.' });
  }
};

exports.deleteFile = (req, res) => {
  const filename = req.params.filename;
  
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ status: 'fail', message: 'Invalid filename.' });
  }

  const filepath = path.join(__dirname, '../uploads', filename);

  if (fs.existsSync(filepath)) {
    fs.unlink(filepath, (err) => {
      if (err) {
        console.error("File deletion error:", err);
        return res.status(500).json({ status: 'error', message: 'Failed to delete file from server.' });
      }
      res.status(200).json({ status: 'success', message: 'File deleted successfully.' });
    });
  } else {
    res.status(200).json({ status: 'success', message: 'File not found, assumed deleted.' });
  }
};