const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, 'scholar_scraper.db');
    this.db = new sqlite3.Database(dbPath);
    this.initTables();
  }

  initTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        pwd_hash TEXT NOT NULL,
        role TEXT DEFAULT 'operator',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
      )`,
      `CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_key TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        seats INTEGER DEFAULT 1,
        features_json TEXT DEFAULT '{}',
        last_checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        revoked BOOLEAN DEFAULT 0,
        FOREIGN KEY (username) REFERENCES users(username)
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        counts_json TEXT DEFAULT '{}',
        FOREIGN KEY (username) REFERENCES users(username)
      )`,
      `CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT NOT NULL,
        journal TEXT,
        topic TEXT,
        verified BOOLEAN DEFAULT 0,
        duplicate BOOLEAN DEFAULT 0,
        source_url TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'pending',
        depth INTEGER DEFAULT 0,
        last_visited DATETIME,
        error TEXT
      )`
    ];

    tables.forEach(sql => {
      this.db.run(sql, (err) => {
        if (err) console.error('Error creating table:', err);
      });
    });

    // Create default admin user
    this.createDefaultAdmin();
  }

  createDefaultAdmin() {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    this.db.run(
      `INSERT OR IGNORE INTO users (username, pwd_hash, role) VALUES (?, ?, ?)`,
      ['admin', adminPassword, 'admin'],
      (err) => {
        if (err) console.error('Error creating admin user:', err);
      }
    );
  }

  // User management
  async createUser(username, password, role = 'operator') {
    return new Promise((resolve, reject) => {
      const pwd_hash = bcrypt.hashSync(password, 10);
      this.db.run(
        `INSERT INTO users (username, pwd_hash, role) VALUES (?, ?, ?)`,
        [username, pwd_hash, role],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM users WHERE username = ? AND is_active = 1`,
        [username],
        (err, row) => {
          if (err) reject(err);
          else if (row && bcrypt.compareSync(password, row.pwd_hash)) {
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id, username, role, created_at, updated_at, is_active FROM users`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // License management
  async createLicense(licenseKey, username, expiresAt, seats = 1, features = {}) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO licenses (license_key, username, expires_at, seats, features_json) 
         VALUES (?, ?, ?, ?, ?)`,
        [licenseKey, username, expiresAt, seats, JSON.stringify(features)],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async validateLicense(licenseKey) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM licenses WHERE license_key = ? AND revoked = 0`,
        [licenseKey],
        (err, row) => {
          if (err) reject(err);
          else if (row && new Date(row.expires_at) > new Date()) {
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  // Results management
  async saveResult(data) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO results (name, email, journal, topic, verified, duplicate, source_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data.name, data.email, data.journal, data.topic, data.verified, data.duplicate, data.source_url],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getResults(limit = 1000) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM results ORDER BY timestamp DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async clearResults() {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM results`, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;