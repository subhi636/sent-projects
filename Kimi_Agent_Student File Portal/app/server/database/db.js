const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'sentprojects.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin'
  );

  CREATE INDEX IF NOT EXISTS idx_files_student ON files(student_name);
  CREATE INDEX IF NOT EXISTS idx_files_subject ON files(subject);
  CREATE INDEX IF NOT EXISTS idx_files_uploaded ON files(uploaded_at);
`);

// Insert default admin user if not exists
const adminEmail = 'subhi20102005@gmail.com';
const adminPassword = 'Qw07750783066w2005/4/15S';

const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);

if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync(adminPassword, 10);
  db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(adminEmail, hashedPassword, 'admin');
  console.log('Default admin user created');
}

module.exports = db;
