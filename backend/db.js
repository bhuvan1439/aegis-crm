const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'crm.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Helper function to run DB queries as promises
const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Initialize database tables
const initDb = async () => {
  try {
    // 1. Create Users Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin'
      )
    `);

    // 2. Create Leads Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        source TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create Notes Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables verified/created successfully.');

    // Seed default admin if none exists
    const adminUser = await dbGet('SELECT * FROM users WHERE username = ?', ['admin']);
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await dbRun('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [
        'admin',
        hashedPassword,
        'admin',
      ]);
      console.log('Default admin seeded (username: admin, password: admin123).');
    }

    // Seed some initial leads if table is empty
    const leadCount = await dbGet('SELECT count(*) as count FROM leads');
    if (leadCount.count === 0) {
      const sampleLeads = [
        { name: 'Sarah Connor', email: 's.connor@cyberdyne.com', phone: '555-0199', company: 'Cyberdyne Systems', source: 'Contact Form', status: 'new' },
        { name: 'John Doe', email: 'john.doe@example.com', phone: '555-1234', company: 'Acme Corp', source: 'LinkedIn Ads', status: 'contacted' },
        { name: 'Bruce Wayne', email: 'bwayne@wayneenterprises.com', phone: '555-1939', company: 'Wayne Enterprises', source: 'Referral', status: 'converted' },
        { name: 'Alice Smith', email: 'alice@techstart.io', phone: '555-9876', company: 'TechStart Inc', source: 'Contact Form', status: 'new' }
      ];

      for (const lead of sampleLeads) {
        const result = await dbRun(
          'INSERT INTO leads (name, email, phone, company, source, status) VALUES (?, ?, ?, ?, ?, ?)',
          [lead.name, lead.email, lead.phone, lead.company, lead.source, lead.status]
        );
        
        // Add an initial note for john and bruce
        if (lead.status !== 'new') {
          await dbRun(
            'INSERT INTO notes (lead_id, content) VALUES (?, ?)',
            [result.lastID, `Lead created and marked as ${lead.status}. Initial contact initiated.`]
          );
        }
      }
      console.log('Sample leads seeded.');
    }

  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet,
  initDb
};
