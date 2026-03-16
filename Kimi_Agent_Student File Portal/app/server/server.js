const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const JSZip = require('jszip');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 uploads per windowMs
  message: { error: 'Too many uploads, please try again later' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again later' }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
  if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.zip') || file.originalname.endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and ZIP files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  // Simple token validation (in production, use JWT)
  const session = db.prepare('SELECT * FROM users WHERE id = ?').get(token);
  if (!session) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  req.user = session;
  next();
};

// Routes

// Login
app.post('/api/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Return user ID as token (simplified)
  res.json({ 
    token: user.id.toString(), 
    email: user.email,
    role: user.role 
  });
});

// Upload file
app.post('/api/upload', uploadLimiter, upload.single('file'), (req, res) => {
  try {
    const { studentName, subject } = req.body;

    if (!studentName || !subject) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Student name and subject are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if student already has a file for this subject
    const existingFile = db.prepare(
      'SELECT * FROM files WHERE student_name = ? AND subject = ?'
    ).get(studentName, subject);

    if (existingFile) {
      // Delete old file
      if (fs.existsSync(existingFile.file_path)) {
        fs.unlinkSync(existingFile.file_path);
      }
      // Delete old record
      db.prepare('DELETE FROM files WHERE id = ?').run(existingFile.id);
    }

    // Insert new file record
    const result = db.prepare(
      `INSERT INTO files (student_name, subject, filename, original_name, file_path, file_size, file_type, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      studentName,
      subject,
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      req.ip
    );

    res.json({
      success: true,
      message: existingFile ? 'File replaced successfully' : 'File uploaded successfully',
      fileId: result.lastInsertRowid,
      replaced: !!existingFile
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get all files (admin only)
app.get('/api/files', (req, res) => {
  try {
    const { search, subject, page = 1, limit = 50 } = req.query;
    let query = 'SELECT * FROM files WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (student_name LIKE ? OR original_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (subject && subject !== 'all') {
      query += ' AND subject = ?';
      params.push(subject);
    }

    query += ' ORDER BY uploaded_at DESC';

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const files = db.prepare(query).all(...params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM files WHERE 1=1';
    const countParams = [];

    if (search) {
      countQuery += ' AND (student_name LIKE ? OR original_name LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (subject && subject !== 'all') {
      countQuery += ' AND subject = ?';
      countParams.push(subject);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      files,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
});

// Get file by ID
app.get('/api/files/:id', (req, res) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(file);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// Get file content (for preview)
app.get('/api/files/:id/content', async (req, res) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    if (file.file_type === 'application/pdf' || file.original_name.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      fs.createReadStream(file.file_path).pipe(res);
    } else if (file.file_type.includes('zip') || file.original_name.endsWith('.zip')) {
      // Read ZIP contents
      const data = fs.readFileSync(file.file_path);
      const zip = await JSZip.loadAsync(data);
      const files = [];

      zip.forEach((relativePath, zipEntry) => {
        files.push({
          name: zipEntry.name,
          size: zipEntry._data.uncompressedSize,
          isDirectory: zipEntry.dir
        });
      });

      res.json({ type: 'zip', files });
    } else {
      res.status(400).json({ error: 'Unsupported file type' });
    }
  } catch (error) {
    console.error('Get file content error:', error);
    res.status(500).json({ error: 'Failed to get file content' });
  }
});

// Download file
app.get('/api/files/:id/download', (req, res) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.setHeader('Content-Type', file.file_type);
    fs.createReadStream(file.file_path).pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Delete file
app.delete('/api/files/:id', (req, res) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from disk
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    // Delete from database
    db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Get subjects list
app.get('/api/subjects', (req, res) => {
  const subjects = [
    'Professional Ethics',
    'Artificial Intelligence',
    'Artificial Intelligence LAB',
    'Networks Programming',
    'Networks Programming LAB',
    'Modern Networks Technologies',
    'Arabic Language III',
    'Digital Signal Processing',
    'Digital Signal Processing LAB',
    'Operating Systems',
    'Operating Systems LAB'
  ];
  res.json(subjects);
});

// Get stats
app.get('/api/stats', (req, res) => {
  try {
    const totalFiles = db.prepare('SELECT COUNT(*) as count FROM files').get().count;
    const todayFiles = db.prepare(
      "SELECT COUNT(*) as count FROM files WHERE date(uploaded_at) = date('now')"
    ).get().count;
    const uniqueStudents = db.prepare('SELECT COUNT(DISTINCT student_name) as count FROM files').get().count;

    res.json({ totalFiles, todayFiles, uniqueStudents });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Check for new files (for notifications)
app.get('/api/check-new', (req, res) => {
  try {
    const { lastCheck } = req.query;
    const newFiles = db.prepare(
      'SELECT COUNT(*) as count FROM files WHERE uploaded_at > ?'
    ).get(lastCheck || new Date(0).toISOString());

    res.json({ newFiles: newFiles.count });
  } catch (error) {
    console.error('Check new error:', error);
    res.status(500).json({ error: 'Failed to check new files' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 50MB limit' });
    }
  }
  res.status(500).json({ error: error.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
