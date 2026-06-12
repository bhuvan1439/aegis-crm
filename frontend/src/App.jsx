import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  MessageSquare, 
  Clock, 
  ArrowRight, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Briefcase, 
  Globe, 
  Calendar, 
  LogOut, 
  LogIn, 
  AlertCircle, 
  Filter,
  Loader2,
  TrendingUp,
  UserCheck,
  Trash2,
  Download,
  X
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

// Detect if running on GitHub Pages static sandbox
const IS_GITHUB_PAGES = window.location.hostname.includes('github.io') || window.location.hash.includes('static');

// Initial seed data for LocalStorage fallback mode
const initialLeads = [
  { id: 1, name: 'Sarah Connor', email: 's.connor@cyberdyne.com', phone: '555-0199', company: 'Cyberdyne Systems', source: 'Website Contact Form', status: 'new', created_at: new Date(Date.now() - 3600000 * 2).toISOString(), updated_at: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 2, name: 'John Doe', email: 'john.doe@example.com', phone: '555-1234', company: 'Acme Corp', source: 'LinkedIn Referral', status: 'contacted', created_at: new Date(Date.now() - 3600000 * 5).toISOString(), updated_at: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: 3, name: 'Bruce Wayne', email: 'bwayne@wayneenterprises.com', phone: '555-1939', company: 'Wayne Enterprises', source: 'Partner Network', status: 'converted', created_at: new Date(Date.now() - 3600000 * 24).toISOString(), updated_at: new Date(Date.now() - 3600000 * 24).toISOString() },
  { id: 4, name: 'Alice Smith', email: 'alice@techstart.io', phone: '555-9876', company: 'TechStart Inc', source: 'Website Contact Form', status: 'new', created_at: new Date(Date.now() - 3600000 * 12).toISOString(), updated_at: new Date(Date.now() - 3600000 * 12).toISOString() }
];

const initialNotes = [
  { id: 1, lead_id: 2, content: 'Lead created and marked as contacted. Initial contact initiated.', created_at: new Date(Date.now() - 3600000 * 4).toISOString() },
  { id: 2, lead_id: 3, content: 'Lead created and marked as converted. Partner onboarding checklist completed.', created_at: new Date(Date.now() - 3600000 * 23).toISOString() }
];

function App() {
  const [page, setPage] = useState('contact'); // 'contact' | 'login' | 'dashboard'
  const [token, setToken] = useState(localStorage.getItem('crm_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('crm_user')) || null);
  
  // Leads & notes data
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  
  // Controls & Loading
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  
  // Modals & Panels
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  
  // Toast notifications
  const [toast, setToast] = useState(null);
  
  // Form States
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'Website Contact Form'
  });
  
  const [adminAddLeadForm, setAdminAddLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'Manual Insertion',
    status: 'new'
  });

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  
  const [submittingLead, setSubmittingLead] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [addingAdminLead, setAddingAdminLead] = useState(false);

  // Initialize LocalStorage Database if on GitHub Pages / Static Mode
  useEffect(() => {
    if (IS_GITHUB_PAGES) {
      if (!localStorage.getItem('crm_local_leads')) {
        localStorage.setItem('crm_local_leads', JSON.stringify(initialLeads));
      }
      if (!localStorage.getItem('crm_local_notes')) {
        localStorage.setItem('crm_local_notes', JSON.stringify(initialNotes));
      }
      console.log("Aegis CRM running in LocalStorage fallback mode (GitHub Pages).");
    }
  }, []);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch leads when dashboard is loaded or filters change
  useEffect(() => {
    if (token && page === 'dashboard') {
      fetchLeads();
    }
  }, [token, page, statusFilter, sourceFilter, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads();
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Auth Operations
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    
    if (IS_GITHUB_PAGES) {
      // Simulate login delay
      setTimeout(() => {
        if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
          const mockUser = { username: 'admin', role: 'admin' };
          const mockToken = 'mock_jwt_token_for_static_hosting';
          localStorage.setItem('crm_token', mockToken);
          localStorage.setItem('crm_user', JSON.stringify(mockUser));
          setToken(mockToken);
          setUser(mockUser);
          showToast(`Welcome back, admin! (Static Demo Mode)`);
          setPage('dashboard');
          setLoginForm({ username: '', password: '' });
        } else {
          showToast('Invalid username or password.', 'error');
        }
        setLoggingIn(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      localStorage.setItem('crm_token', data.token);
      localStorage.setItem('crm_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome back, ${data.user.username}!`);
      setPage('dashboard');
      setLoginForm({ username: '', password: '' });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setToken(null);
    setUser(null);
    setLeads([]);
    setSelectedLead(null);
    setNotes([]);
    showToast('Logged out successfully.');
    setPage('login');
  };

  // Lead Operations
  const fetchLeads = async () => {
    setLoadingLeads(true);

    if (IS_GITHUB_PAGES) {
      setTimeout(() => {
        try {
          let localLeads = JSON.parse(localStorage.getItem('crm_local_leads')) || [];
          
          // Apply Filters
          if (statusFilter) {
            localLeads = localLeads.filter(l => l.status === statusFilter);
          }
          if (sourceFilter) {
            localLeads = localLeads.filter(l => l.source === sourceFilter);
          }
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            localLeads = localLeads.filter(l => 
              l.name.toLowerCase().includes(term) || 
              l.email.toLowerCase().includes(term) || 
              (l.company && l.company.toLowerCase().includes(term))
            );
          }

          // Apply Sorting
          if (sortOrder === 'oldest') {
            localLeads.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          } else if (sortOrder === 'name_asc') {
            localLeads.sort((a, b) => a.name.localeCompare(b.name));
          } else if (sortOrder === 'name_desc') {
            localLeads.sort((a, b) => b.name.localeCompare(a.name));
          } else {
            // Newest first
            localLeads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          }

          setLeads(localLeads);
          
          if (localLeads.length > 0) {
            if (!selectedLead) {
              setSelectedLead(localLeads[0]);
              // Fetch notes for selected lead
              const allNotes = JSON.parse(localStorage.getItem('crm_local_notes')) || [];
              setNotes(allNotes.filter(n => n.lead_id === localLeads[0].id).reverse());
            } else {
              const updatedSelected = localLeads.find(l => l.id === selectedLead.id);
              if (updatedSelected) {
                setSelectedLead(updatedSelected);
              } else {
                setSelectedLead(localLeads[0]);
                const allNotes = JSON.parse(localStorage.getItem('crm_local_notes')) || [];
                setNotes(allNotes.filter(n => n.lead_id === localLeads[0].id).reverse());
              }
            }
          } else {
            setSelectedLead(null);
            setNotes([]);
          }
        } catch (e) {
          showToast('Failed to retrieve mock database leads.', 'error');
        } finally {
          setLoadingLeads(false);
        }
      }, 300);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (sortOrder) params.append('sort', sortOrder);

      const res = await fetch(`${API_BASE}/leads?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        throw new Error('Session expired. Please log in again.');
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch leads');
      
      setLeads(data);
      
      if (data.length > 0) {
        if (!selectedLead) {
          selectLead(data[0]);
        } else {
          const updatedSelected = data.find(l => l.id === selectedLead.id);
          if (updatedSelected) {
            setSelectedLead(updatedSelected);
          } else {
            selectLead(data[0]);
          }
        }
      } else {
        setSelectedLead(null);
        setNotes([]);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingLeads(false);
    }
  };

  const selectLead = (lead) => {
    setSelectedLead(lead);
    fetchNotes(lead.id);
  };

  const fetchNotes = async (leadId) => {
    setLoadingNotes(true);

    if (IS_GITHUB_PAGES) {
      setTimeout(() => {
        const allNotes = JSON.parse(localStorage.getItem('crm_local_notes')) || [];
        const leadNotes = allNotes.filter(n => n.lead_id === leadId);
        // Sort descending by date (newest note first)
        leadNotes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setNotes(leadNotes);
        setLoadingNotes(false);
      }, 100);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/leads/${leadId}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch notes');
      setNotes(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    if (IS_GITHUB_PAGES) {
      const allLeads = JSON.parse(localStorage.getItem('crm_local_leads')) || [];
      const index = allLeads.findIndex(l => l.id === leadId);
      if (index === -1) return;

      const oldStatus = allLeads[index].status;
      allLeads[index].status = newStatus;
      allLeads[index].updated_at = new Date().toISOString();
      localStorage.setItem('crm_local_leads', JSON.stringify(allLeads));

      // Append status change note
      const allNotes = JSON.parse(localStorage.getItem('crm_local_notes')) || [];
      const newNote = {
        id: Date.now(),
        lead_id: leadId,
        content: `Status updated from "${oldStatus}" to "${newStatus}" by admin.`,
        created_at: new Date().toISOString()
      };
      allNotes.push(newNote);
      localStorage.setItem('crm_local_notes', JSON.stringify(allNotes));

      showToast(`Status updated to ${newStatus}`);
      fetchLeads();
      fetchNotes(leadId);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      
      showToast(`Status updated to ${newStatus}`);
      fetchLeads();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !selectedLead) return;

    if (IS_GITHUB_PAGES) {
      const allNotes = JSON.parse(localStorage.getItem('crm_local_notes')) || [];
      const newNote = {
        id: Date.now(),
        lead_id: selectedLead.id,
        content: newNoteContent.trim(),
        created_at: new Date().toISOString()
      };
      allNotes.push(newNote);
      localStorage.setItem('crm_local_notes', JSON.stringify(allNotes));

      setNewNoteContent('');
      showToast('Note added successfully');
      fetchNotes(selectedLead.id);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/leads/${selectedLead.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newNoteContent })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add note');
      
      setNotes(data);
      setNewNoteContent('');
      showToast('Note added successfully');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Lead
  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to permanently delete this lead? All note logs will be lost.')) return;
    
    if (IS_GITHUB_PAGES) {
      const allLeads = JSON.parse(localStorage.getItem('crm_local_leads')) || [];
      const filteredLeads = allLeads.filter(l => l.id !== leadId);
      localStorage.setItem('crm_local_leads', JSON.stringify(filteredLeads));

      // Cascade delete notes
      const allNotes = JSON.parse(localStorage.getItem('crm_local_notes')) || [];
      const filteredNotes = allNotes.filter(n => n.lead_id !== leadId);
      localStorage.setItem('crm_local_notes', JSON.stringify(filteredNotes));

      showToast('Lead deleted successfully.');
      setSelectedLead(null);
      fetchLeads();
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/leads/${leadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete lead');
      }
      showToast('Lead deleted successfully.');
      setSelectedLead(null);
      fetchLeads();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Public Contact Form Submit
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmittingLead(true);

    if (IS_GITHUB_PAGES) {
      setTimeout(() => {
        const allLeads = JSON.parse(localStorage.getItem('crm_local_leads')) || [];
        const newId = allLeads.length > 0 ? Math.max(...allLeads.map(l => l.id)) + 1 : 1;
        const newLead = {
          id: newId,
          name: contactForm.name,
          email: contactForm.email,
          phone: contactForm.phone || null,
          company: contactForm.company || null,
          source: contactForm.source || 'Website Contact Form',
          status: 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        allLeads.push(newLead);
        localStorage.setItem('crm_local_leads', JSON.stringify(allLeads));

        // Create log notes
        const allNotes = JSON.parse(localStorage.getItem('crm_local_notes')) || [];
        allNotes.push({
          id: Date.now(),
          lead_id: newId,
          content: `Lead submitted via contact form (Source: ${newLead.source}).`,
          created_at: new Date().toISOString()
        });
        
        // Auto responder log
        allNotes.push({
          id: Date.now() + 1,
          lead_id: newId,
          content: `[Auto-Responder] Email dispatched to ${newLead.email}: "Hello ${newLead.name}, thank you for contacting us. We have received your message and will follow up shortly."`,
          created_at: new Date().toISOString()
        });

        localStorage.setItem('crm_local_notes', JSON.stringify(allNotes));

        showToast('Contact form submitted successfully! Admin notified.');
        setContactForm({
          name: '',
          email: '',
          phone: '',
          company: '',
          source: 'Website Contact Form'
        });
        setSubmittingLead(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit contact form');
      
      showToast('Contact form submitted successfully! Admin notified.');
      setContactForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: 'Website Contact Form'
      });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingLead(false);
    }
  };

  // Admin Manual Lead Submit
  const handleAdminAddLeadSubmit = async (e) => {
    e.preventDefault();
    setAddingAdminLead(true);

    if (IS_GITHUB_PAGES) {
      setTimeout(() => {
        const allLeads = JSON.parse(localStorage.getItem('crm_local_leads')) || [];
        const newId = allLeads.length > 0 ? Math.max(...allLeads.map(l => l.id)) + 1 : 1;
        const newLead = {
          id: newId,
          name: adminAddLeadForm.name,
          email: adminAddLeadForm.email,
          phone: adminAddLeadForm.phone || null,
          company: adminAddLeadForm.company || null,
          source: adminAddLeadForm.source || 'Manual Insertion',
          status: adminAddLeadForm.status || 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        allLeads.push(newLead);
        localStorage.setItem('crm_local_leads', JSON.stringify(allLeads));

        // Create initial log notes
        const allNotes = JSON.parse(localStorage.getItem('crm_local_notes')) || [];
        allNotes.push({
          id: Date.now(),
          lead_id: newId,
          content: `Lead created manually by Administrator. (Status initialized as: ${newLead.status})`,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('crm_local_notes', JSON.stringify(allNotes));

        showToast('Lead added successfully!');
        setShowAddLeadModal(false);
        setAdminAddLeadForm({
          name: '',
          email: '',
          phone: '',
          company: '',
          source: 'Manual Insertion',
          status: 'new'
        });
        setAddingAdminLead(false);
        fetchLeads();
      }, 400);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminAddLeadForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add lead');
      
      showToast('Lead added successfully!');
      setShowAddLeadModal(false);
      setAdminAddLeadForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: 'Manual Insertion',
        status: 'new'
      });
      fetchLeads();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAddingAdminLead(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      showToast('No leads available to export.', 'error');
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Created At'];
    const rows = leads.map(l => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      l.email,
      l.phone || '',
      `"${(l.company || '').replace(/"/g, '""')}"`,
      l.source,
      l.status,
      l.created_at
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aegis_leads_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Leads exported as CSV file.');
  };

  // Metrics
  const totalLeadsCount = leads.length;
  const newLeadsCount = leads.filter(l => l.status === 'new').length;
  const contactedLeadsCount = leads.filter(l => l.status === 'contacted').length;
  const convertedLeadsCount = leads.filter(l => l.status === 'converted').length;
  const conversionRate = totalLeadsCount > 0 
    ? Math.round((convertedLeadsCount / totalLeadsCount) * 100) 
    : 0;

  const newPercent = totalLeadsCount > 0 ? (newLeadsCount / totalLeadsCount) * 100 : 0;
  const contactedPercent = totalLeadsCount > 0 ? (contactedLeadsCount / totalLeadsCount) * 100 : 0;
  const convertedPercent = totalLeadsCount > 0 ? (convertedLeadsCount / totalLeadsCount) * 100 : 0;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.type === 'error' && <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="app-header glass">
        <div className="logo-container">
          <div className="logo-icon">
            <Users size={18} color="white" />
          </div>
          <span>AEGIS CRM</span>
        </div>
        <nav className="nav-links">
          <button 
            className={`nav-btn ${page === 'contact' ? 'active' : ''}`}
            onClick={() => setPage('contact')}
          >
            <Globe size={16} /> Contact Form
          </button>
          
          {token ? (
            <>
              <button 
                className={`nav-btn ${page === 'dashboard' ? 'active' : ''}`}
                onClick={() => setPage('dashboard')}
              >
                <TrendingUp size={16} /> Admin Panel
              </button>
              <button className="nav-btn" onClick={handleLogout}>
                <LogOut size={16} /> Logout ({user?.username})
              </button>
            </>
          ) : (
            <button 
              className={`nav-btn ${page === 'login' ? 'active' : ''}`}
              onClick={() => setPage('login')}
            >
              <LogIn size={16} /> Admin Login
            </button>
          )}
        </nav>
      </header>

      {/* Main Container */}
      <main className="main-content">
        
        {/* PUBLIC CONTACT FORM PAGE */}
        {page === 'contact' && (
          <div className="contact-form-card glass">
            <h1 className="contact-title">Contact Us</h1>
            <p className="contact-subtitle">
              Need assistance? Fill out the form below, and our business development team will follow up within 24 hours.
            </p>
            <form onSubmit={handleContactSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name *</label>
                <input 
                  type="text" 
                  id="name" 
                  required
                  placeholder="e.g. Eleanor Vance"
                  className="form-input" 
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address *</label>
                <input 
                  type="email" 
                  id="email" 
                  required
                  placeholder="e.g. eleanor.vance@company.com"
                  className="form-input" 
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input 
                  type="tel" 
                  id="phone" 
                  placeholder="e.g. +1 (555) 019-2834"
                  className="form-input" 
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="company">Company Name</label>
                <input 
                  type="text" 
                  id="company" 
                  placeholder="e.g. Hill House Technologies"
                  className="form-input" 
                  value={contactForm.company}
                  onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="source">Lead Source</label>
                <select 
                  id="source"
                  className="form-select"
                  value={contactForm.source}
                  onChange={(e) => setContactForm({ ...contactForm, source: e.target.value })}
                >
                  <option value="Website Contact Form">Website Contact Form</option>
                  <option value="Google Search">Google Search</option>
                  <option value="LinkedIn Referral">LinkedIn Referral</option>
                  <option value="Partner Network">Partner Network</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submittingLead}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {submittingLead ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Submitting...
                  </>
                ) : (
                  <>
                    Send Message <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ADMIN LOGIN PAGE */}
        {page === 'login' && (
          <div className="login-card glass">
            <h1 className="login-title">Aegis Login</h1>
            <p className="login-subtitle">Provide your credentials to access the client lead CRM dashboard.</p>
            {IS_GITHUB_PAGES && (
              <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: '#c084fc', marginBottom: '1.25rem', textAlign: 'left' }}>
                🚀 <strong>Running on GitHub Pages (Static Demo Mode)</strong>. Database functions run inside your browser's localStorage. You can save/update leads live!
              </div>
            )}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="username">Username</label>
                <input 
                  type="text" 
                  id="username" 
                  required
                  placeholder="admin"
                  className="form-input" 
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  required
                  placeholder="admin123"
                  className="form-input" 
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loggingIn}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {loggingIn ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Authenticating...
                  </>
                ) : (
                  <>
                    Unlock Console <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
            <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Demo access: <code style={{ color: 'var(--status-new)', background: 'rgba(255,255,255,0.05)' }}>admin</code> / <code style={{ color: 'var(--status-new)', background: 'rgba(255,255,255,0.05)' }}>admin123</code>
            </div>
          </div>
        )}

        {/* ADMIN DASHBOARD PAGE */}
        {page === 'dashboard' && token && (
          <div>
            {/* Top Metrics Cards */}
            <div className="metrics-grid">
              <div className="metric-card glass">
                <div className="metric-info">
                  <h3>Total Leads</h3>
                  <div className="value">{totalLeadsCount}</div>
                </div>
                <div className="metric-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
                  <Users size={22} />
                </div>
              </div>

              <div className="metric-card glass">
                <div className="metric-info">
                  <h3>Contacted</h3>
                  <div className="value">{contactedLeadsCount}</div>
                </div>
                <div className="metric-icon" style={{ background: 'rgba(251, 191, 36, 0.15)', color: 'var(--status-contacted)' }}>
                  <Clock size={22} />
                </div>
              </div>

              <div className="metric-card glass">
                <div className="metric-info">
                  <h3>Converted</h3>
                  <div className="value">{convertedLeadsCount}</div>
                </div>
                <div className="metric-icon" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--status-converted)' }}>
                  <UserCheck size={22} />
                </div>
              </div>

              <div className="metric-card glass">
                <div className="metric-info">
                  <h3>Conversion Rate</h3>
                  <div className="value">{conversionRate}%</div>
                </div>
                <div className="metric-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple)' }}>
                  <CheckCircle2 size={22} />
                </div>
              </div>
            </div>

            {/* Visual Status Distributions */}
            <div className="glass" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
                  Lead Status Distribution
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {newLeadsCount} New | {contactedLeadsCount} Contacted | {convertedLeadsCount} Converted
                </span>
              </div>
              <div style={{ height: '10px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${newPercent}%`, background: 'var(--status-new)', transition: 'var(--transition)' }} title={`New: ${Math.round(newPercent)}%`} />
                <div style={{ width: `${contactedPercent}%`, background: 'var(--status-contacted)', transition: 'var(--transition)' }} title={`Contacted: ${Math.round(contactedPercent)}%`} />
                <div style={{ width: `${convertedPercent}%`, background: 'var(--status-converted)', transition: 'var(--transition)' }} title={`Converted: ${Math.round(convertedPercent)}%`} />
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--status-new)', borderRadius: '50%' }} />
                  New ({Math.round(newPercent)}%)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--status-contacted)', borderRadius: '50%' }} />
                  Contacted ({Math.round(contactedPercent)}%)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--status-converted)', borderRadius: '50%' }} />
                  Converted ({Math.round(convertedPercent)}%)
                </div>
              </div>
            </div>

            {/* Control & Table Grid */}
            <div className="dashboard-grid">
              
              {/* Table Column */}
              <div className="glass" style={{ padding: '1.5rem' }}>
                <div className="control-bar" style={{ marginBottom: '1.5rem' }}>
                  <form onSubmit={handleSearchSubmit} className="search-container">
                    <Search className="search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search leads by name, email..."
                      className="form-input search-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </form>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                      onClick={() => setShowAddLeadModal(true)}
                    >
                      <Plus size={16} /> New Lead
                    </button>
                    <button 
                      className="btn btn-secondary"
                      style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                      title="Export CSV"
                      onClick={handleExportCSV}
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <Filter size={14} /> Filter:
                  </div>
                  <select 
                    className="form-select"
                    style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                  </select>

                  <select 
                    className="form-select"
                    style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                  >
                    <option value="">All Sources</option>
                    <option value="Website Contact Form">Website Form</option>
                    <option value="Google Search">Google Search</option>
                    <option value="LinkedIn Referral">LinkedIn</option>
                    <option value="Partner Network">Partner Network</option>
                    <option value="Manual Insertion">Manual Insertion</option>
                  </select>

                  <select 
                    className="form-select"
                    style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginLeft: 'auto' }}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name_asc">Name A-Z</option>
                    <option value="name_desc">Name Z-A</option>
                  </select>
                </div>

                {loadingLeads ? (
                  <div className="empty-state">
                    <Loader2 className="animate-spin empty-state-icon" style={{ color: 'var(--primary)' }} />
                    <p>Loading database records...</p>
                  </div>
                ) : leads.length === 0 ? (
                  <div className="empty-state">
                    <Users className="empty-state-icon" />
                    <p>No leads found matching current filters.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="leads-table">
                      <thead>
                        <tr>
                          <th>Lead</th>
                          <th>Company / Source</th>
                          <th>Status</th>
                          <th>Received</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((lead) => (
                          <tr 
                            key={lead.id} 
                            onClick={() => selectLead(lead)}
                            className={selectedLead?.id === lead.id ? 'active' : ''}
                          >
                            <td>
                              <div className="lead-name-cell">{lead.name}</div>
                              <div className="lead-meta-cell">{lead.email}</div>
                            </td>
                            <td>
                              <div>{lead.company || <span style={{ color: 'var(--text-muted)' }}>No Company</span>}</div>
                              <div className="lead-meta-cell">{lead.source}</div>
                            </td>
                            <td>
                              <span className={`badge badge-${lead.status}`}>
                                {lead.status === 'new' && <AlertCircle size={10} />}
                                {lead.status === 'contacted' && <Clock size={10} />}
                                {lead.status === 'converted' && <CheckCircle2 size={10} />}
                                {lead.status}
                              </span>
                            </td>
                            <td className="lead-meta-cell">
                              {formatDate(lead.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Detail Pane Column */}
              <div>
                {selectedLead ? (
                  <div className="detail-pane glass">
                    <div className="detail-header" style={{ position: 'relative' }}>
                      <button 
                        onClick={() => handleDeleteLead(selectedLead.id)}
                        style={{ position: 'absolute', right: 0, top: 0, background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
                        title="Delete Lead"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="detail-title">{selectedLead.name}</div>
                      <div className="detail-company">{selectedLead.company || 'Private Individual'}</div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button 
                          className={`btn btn-secondary badge-${selectedLead.status === 'new' ? 'new' : ''}`}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', flex: 1 }}
                          onClick={() => handleStatusChange(selectedLead.id, 'new')}
                        >
                          New
                        </button>
                        <button 
                          className={`btn btn-secondary badge-${selectedLead.status === 'contacted' ? 'contacted' : ''}`}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', flex: 1 }}
                          onClick={() => handleStatusChange(selectedLead.id, 'contacted')}
                        >
                          Contacted
                        </button>
                        <button 
                          className={`btn btn-secondary badge-${selectedLead.status === 'converted' ? 'converted' : ''}`}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', flex: 1 }}
                          onClick={() => handleStatusChange(selectedLead.id, 'converted')}
                        >
                          Converted
                        </button>
                      </div>
                    </div>

                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label"><Mail size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Email</span>
                        <span className="info-val">{selectedLead.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label"><Phone size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Phone</span>
                        <span className="info-val">{selectedLead.phone || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label"><Globe size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Source</span>
                        <span className="info-val">{selectedLead.source}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label"><Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Created</span>
                        <span className="info-val">{formatDate(selectedLead.created_at)}</span>
                      </div>
                    </div>

                    <div className="timeline-section">
                      <h4>Notes & Follow-ups</h4>
                      
                      <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          placeholder="Type follow-up details..."
                          className="form-input"
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>
                          <Plus size={18} />
                        </button>
                      </form>

                      {loadingNotes ? (
                        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                          <Loader2 className="animate-spin" style={{ display: 'inline', marginRight: '6px' }} size={16} /> Retrieving activity...
                        </div>
                      ) : notes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          No activity logged.
                        </div>
                      ) : (
                        <div className="timeline">
                          {notes.map((note) => (
                            <div key={note.id} className="timeline-item">
                              <div className="timeline-date">{formatDate(note.created_at)}</div>
                              <div className="timeline-content">{note.content}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="glass detail-pane" style={{ justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                    <Users size={32} />
                    <p>Select a lead from the registry table to view logs and perform follow-up operations.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Manual Insert Modal */}
      {showAddLeadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass" style={{ maxWidth: '500px', width: '100%', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setShowAddLeadModal(false)}
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>Insert New Lead Record</h2>
            
            <form onSubmit={handleAdminAddLeadSubmit}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Eleanor Vance"
                  className="form-input" 
                  value={adminAddLeadForm.name}
                  onChange={(e) => setAdminAddLeadForm({ ...adminAddLeadForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input 
                  type="email" 
                  required
                  placeholder="eleanor@company.com"
                  className="form-input" 
                  value={adminAddLeadForm.email}
                  onChange={(e) => setAdminAddLeadForm({ ...adminAddLeadForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input 
                  type="tel" 
                  placeholder="+1 (555) 019-2834"
                  className="form-input" 
                  value={adminAddLeadForm.phone}
                  onChange={(e) => setAdminAddLeadForm({ ...adminAddLeadForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company</label>
                <input 
                  type="text" 
                  placeholder="Hill House Tech"
                  className="form-input" 
                  value={adminAddLeadForm.company}
                  onChange={(e) => setAdminAddLeadForm({ ...adminAddLeadForm, company: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Source</label>
                <select 
                  className="form-select"
                  value={adminAddLeadForm.source}
                  onChange={(e) => setAdminAddLeadForm({ ...adminAddLeadForm, source: e.target.value })}
                >
                  <option value="Manual Insertion">Manual Insertion</option>
                  <option value="Website Contact Form">Website Contact Form</option>
                  <option value="Google Search">Google Search</option>
                  <option value="LinkedIn Referral">LinkedIn Referral</option>
                  <option value="Partner Network">Partner Network</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-select"
                  value={adminAddLeadForm.status}
                  onChange={(e) => setAdminAddLeadForm({ ...adminAddLeadForm, status: e.target.value })}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={addingAdminLead}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {addingAdminLead ? <Loader2 className="animate-spin" size={16} /> : 'Save Lead'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
