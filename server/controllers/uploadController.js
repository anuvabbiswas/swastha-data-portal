const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Map validated MIME types to a fixed, safe extension
const mimeToExtension = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png'
};

const allowedTypes = Object.keys(mimeToExtension);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeExtension = mimeToExtension[file.mimetype] || '';
    cb(null, uniqueSuffix + safeExtension);
  }
});

const fileFilter = (req, file, cb) => {
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

// Helper: resolve a filename safely against uploadDir, rejecting any path-traversal attempt regardless of how it's encoded.
const resolveSafePath = (filename) => {
  if (!filename) return null;
  const safeName = path.basename(filename);
  const resolvedPath = path.resolve(uploadDir, safeName);

  // Ensure the resolved path is still actually inside uploadDir
  if (!resolvedPath.startsWith(path.resolve(uploadDir) + path.sep)) {
    return null;
  }
  return resolvedPath;
};

exports.getFile = (req, res) => {
  const filepath = resolveSafePath(req.params.filename);

  if (!filepath) {
    return res.status(400).json({ status: 'fail', message: 'Invalid filename.' });
  }

  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ status: 'fail', message: 'File not found.' });
  }
};

exports.deleteFile = (req, res) => {
  const filepath = resolveSafePath(req.params.filename);

  if (!filepath) {
    return res.status(400).json({ status: 'fail', message: 'Invalid filename.' });
  }

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