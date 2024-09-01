const multer = require('multer');

// Set up multer storage configuration
const storage = multer.memoryStorage(); // Store files in memory to be uploaded to S3

// Create the multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Adjust this filter based on your requirements
    if (!file.mimetype.startsWith('application/pdf')) {
      return cb(new Error('Only PDF files are allowed!'), false);
    }
    cb(null, true);
  },
});

module.exports = upload;
