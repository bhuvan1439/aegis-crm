const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { initDb, dbAll, dbGet, dbRun } = require('./db');
const { authenticateToken, JWT_SECRET } = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- PUBLIC ROUTES ---

// 1. Submit lead from contact form (Public endpoint)
app.post('/api/leads', async (req, res) => {
  const { name, email, phone, company, source, status } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required fields.' });
  }

  const leadSource = source || 'Website Contact Form';
  const leadStatus = status || 'new';

  try {
    const result = await dbRun(
      'INSERT INTO leads (name, email, phone, company, source, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone || null, company || null, leadSource, leadStatus]
    );

    // Get the created lead
    const newLead = await dbGet('SELECT * FROM leads WHERE id = ?', [result.lastID]);
    
    // Add an initial log note
    await dbRun(
      'INSERT INTO notes (lead_id, content) VALUES (?, ?)',
      [result.lastID, `Lead submitted via contact form (Source: ${leadSource}).`]
    );

    // Dispatch simulated auto-responder email
    await dbRun(
      'INSERT INTO notes (lead_id, content) VALUES (?, ?)',
      [result.lastID, `[Auto-Responder] Email dispatched to ${email}: "Hello ${name}, thank you for contacting us. We have received your message and will follow up shortly."`]
    );

    res.status(201).json(newLead);
  } catch (err) {
    console.error('Error creating lead:', err.message);
    res.status(500).json({ error: 'Failed to submit contact form.' });
  }
});

// 2. Admin Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- PROTECTED ROUTES (Requires Admin Auth) ---

// 3. Get all leads (with search, filtering, and sorting)
app.get('/api/leads', authenticateToken, async (req, res) => {
  const { status, source, search, sort } = req.query;

  let query = 'SELECT * FROM leads WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  // Sorting
  if (sort === 'oldest') {
    query += ' ORDER BY created_at ASC';
  } else if (sort === 'name_asc') {
    query += ' ORDER BY name ASC';
  } else if (sort === 'name_desc') {
    query += ' ORDER BY name DESC';
  } else {
    // Default to newest first
    query += ' ORDER BY created_at DESC';
  }

  try {
    const leads = await dbAll(query, params);
    res.json(leads);
  } catch (err) {
    console.error('Error fetching leads:', err.message);
    res.status(500).json({ error: 'Failed to retrieve leads.' });
  }
});

// 4. Get lead by ID
app.get('/api/leads/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    res.json(lead);
  } catch (err) {
    console.error('Error fetching lead details:', err.message);
    res.status(500).json({ error: 'Failed to retrieve lead details.' });
  }
});

// 5. Update lead status or details
app.patch('/api/leads/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, name, email, phone, company, source } = req.body;

  try {
    // Check if lead exists
    const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const updatedName = name !== undefined ? name : lead.name;
    const updatedEmail = email !== undefined ? email : lead.email;
    const updatedPhone = phone !== undefined ? phone : lead.phone;
    const updatedCompany = company !== undefined ? company : lead.company;
    const updatedSource = source !== undefined ? source : lead.source;
    const updatedStatus = status !== undefined ? status : lead.status;

    await dbRun(
      `UPDATE leads 
       SET name = ?, email = ?, phone = ?, company = ?, source = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [updatedName, updatedEmail, updatedPhone, updatedCompany, updatedSource, updatedStatus, id]
    );

    // If status changed, log a note automatically
    if (status !== undefined && status !== lead.status) {
      await dbRun(
        'INSERT INTO notes (lead_id, content) VALUES (?, ?)',
        [id, `Status updated from "${lead.status}" to "${status}" by admin.`]
      );
    }

    const updatedLead = await dbGet('SELECT * FROM leads WHERE id = ?', [id]);
    res.json(updatedLead);
  } catch (err) {
    console.error('Error updating lead:', err.message);
    res.status(500).json({ error: 'Failed to update lead.' });
  }
});

// 6. Get notes for a lead
app.get('/api/leads/:id/notes', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify lead exists
    const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const notes = await dbAll('SELECT * FROM notes WHERE lead_id = ? ORDER BY created_at DESC', [id]);
    res.json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err.message);
    res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
});

// 7. Add a note to a lead
app.post('/api/leads/:id/notes', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Note content cannot be empty.' });
  }

  try {
    // Verify lead exists
    const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    await dbRun('INSERT INTO notes (lead_id, content) VALUES (?, ?)', [id, content.trim()]);
    
    // Fetch and return the updated lists of notes
    const notes = await dbAll('SELECT * FROM notes WHERE lead_id = ? ORDER BY created_at DESC', [id]);
    res.status(201).json(notes);
  } catch (err) {
    console.error('Error adding note:', err.message);
    res.status(500).json({ error: 'Failed to add note.' });
  }
});

// 8. Delete a lead (Protected)
app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    // Delete lead (cascading automatically deletes associated notes)
    await dbRun('DELETE FROM leads WHERE id = ?', [id]);
    res.json({ message: 'Lead successfully deleted.' });
  } catch (err) {
    console.error('Error deleting lead:', err.message);
    res.status(500).json({ error: 'Failed to delete lead.' });
  }
});

// Initialize database and listen
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
  });
});
