// Admin Panel functionality
class AdminPanel {
  constructor() {
    this.currentTab = 'users';
    this.users = [];
    this.licenses = [];
    this.stats = {};
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadData();
    this.renderCurrentTab();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Close button
    document.getElementById('closeAdminBtn').addEventListener('click', () => {
      window.close();
    });

    // Add user button
    document.getElementById('addUserBtn').addEventListener('click', () => {
      this.showAddUserModal();
    });

    // Generate license button
    document.getElementById('generateLicenseBtn').addEventListener('click', () => {
      this.showGenerateLicenseModal();
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.closeModal(e.target.closest('.modal'));
      });
    });

    // Form submissions
    document.getElementById('addUserForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddUser();
    });

    document.getElementById('generateLicenseForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleGenerateLicense();
    });

    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal);
        }
      });
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');

    this.currentTab = tabName;
    this.renderCurrentTab();
  }

  async loadData() {
    // Mock data loading - in real app, this would fetch from database
    this.users = [
      {
        id: 1,
        username: 'admin',
        role: 'admin',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_active: true
      },
      {
        id: 2,
        username: 'operator',
        role: 'operator',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        is_active: true
      },
      {
        id: 3,
        username: 'demo',
        role: 'operator',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        is_active: true
      }
    ];

    this.licenses = [
      {
        id: 1,
        license_key: 'SLS-DEMO123456789',
        username: 'demo',
        expires_at: '2024-12-31T23:59:59Z',
        seats: 1,
        features_json: '{"ocr": true, "mx": true, "export": true}',
        last_checked_at: '2024-01-15T10:00:00Z',
        revoked: false
      },
      {
        id: 2,
        license_key: 'SLS-OPERATOR987654321',
        username: 'operator',
        expires_at: '2024-06-30T23:59:59Z',
        seats: 1,
        features_json: '{"ocr": true, "mx": true, "export": true}',
        last_checked_at: '2024-01-15T09:30:00Z',
        revoked: false
      }
    ];

    this.stats = {
      totalUsers: this.users.length,
      activeUsers: this.users.filter(u => u.is_active).length,
      totalLicenses: this.licenses.length,
      activeLicenses: this.licenses.filter(l => !l.revoked && new Date(l.expires_at) > new Date()).length,
      totalSessions: 45,
      totalEmails: 1250
    };
  }

  renderCurrentTab() {
    switch (this.currentTab) {
      case 'users':
        this.renderUsersTab();
        break;
      case 'licenses':
        this.renderLicensesTab();
        break;
      case 'stats':
        this.renderStatsTab();
        break;
    }
  }

  renderUsersTab() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    this.users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.role}</td>
        <td>${new Date(user.created_at).toLocaleDateString()}</td>
        <td>
          <span class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">
            ${user.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-secondary action-btn" onclick="adminPanel.editUser(${user.id})">Edit</button>
          <button class="btn btn-sm btn-danger action-btn" onclick="adminPanel.deleteUser(${user.id})">Delete</button>
          <button class="btn btn-sm btn-warning action-btn" onclick="adminPanel.resetPassword(${user.id})">Reset Pwd</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  renderLicensesTab() {
    const tbody = document.getElementById('licensesTableBody');
    tbody.innerHTML = '';

    this.licenses.forEach(license => {
      const expiresAt = new Date(license.expires_at);
      const isExpired = expiresAt < new Date();
      const isRevoked = license.revoked;
      
      let statusClass = 'status-active';
      let statusText = 'Active';
      
      if (isRevoked) {
        statusClass = 'status-inactive';
        statusText = 'Revoked';
      } else if (isExpired) {
        statusClass = 'status-expired';
        statusText = 'Expired';
      }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${license.license_key}</td>
        <td>${license.username}</td>
        <td>${expiresAt.toLocaleDateString()}</td>
        <td>${license.seats}</td>
        <td>
          <span class="status-badge ${statusClass}">
            ${statusText}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-warning action-btn" onclick="adminPanel.revokeLicense(${license.id})">
            ${isRevoked ? 'Restore' : 'Revoke'}
          </button>
          <button class="btn btn-sm btn-secondary action-btn" onclick="adminPanel.extendLicense(${license.id})">Extend</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  renderStatsTab() {
    document.getElementById('totalUsersCount').textContent = this.stats.totalUsers;
    document.getElementById('activeLicensesCount').textContent = this.stats.activeLicenses;
    document.getElementById('totalSessionsCount').textContent = this.stats.totalSessions;
    document.getElementById('totalEmailsCount').textContent = this.stats.totalEmails;

    // Render recent activity
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';

    const activities = [
      'User "demo" logged in at 10:30 AM',
      'License SLS-DEMO123456789 validated',
      'User "operator" exported 25 emails',
      'New scraping session started by "demo"',
      'License SLS-OPERATOR987654321 expires in 30 days'
    ];

    activities.forEach(activity => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      item.textContent = activity;
      activityList.appendChild(item);
    });
  }

  showAddUserModal() {
    const modal = document.getElementById('addUserModal');
    modal.classList.add('show');
    document.getElementById('newUsername').focus();
  }

  showGenerateLicenseModal() {
    // Populate username dropdown
    const usernameSelect = document.getElementById('licenseUsername');
    usernameSelect.innerHTML = '';
    
    this.users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.username;
      option.textContent = user.username;
      usernameSelect.appendChild(option);
    });

    // Set default expiry date (1 year from now)
    const expiryInput = document.getElementById('licenseExpiry');
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    expiryInput.value = nextYear.toISOString().split('T')[0];

    const modal = document.getElementById('generateLicenseModal');
    modal.classList.add('show');
  }

  closeModal(modal) {
    modal.classList.remove('show');
    
    // Reset forms
    const forms = modal.querySelectorAll('form');
    forms.forEach(form => form.reset());
  }

  async handleAddUser() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;

    if (!username || !password) {
      alert('Please fill in all fields');
      return;
    }

    // Check if username already exists
    if (this.users.find(u => u.username === username)) {
      alert('Username already exists');
      return;
    }

    // Add new user
    const newUser = {
      id: Math.max(...this.users.map(u => u.id)) + 1,
      username,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    };

    this.users.push(newUser);
    this.stats.totalUsers = this.users.length;
    this.stats.activeUsers = this.users.filter(u => u.is_active).length;

    this.closeModal(document.getElementById('addUserModal'));
    this.renderCurrentTab();
    
    alert(`User "${username}" created successfully`);
  }

  async handleGenerateLicense() {
    const username = document.getElementById('licenseUsername').value;
    const expiryDate = document.getElementById('licenseExpiry').value;
    const seats = parseInt(document.getElementById('licenseSeats').value);
    
    const features = {};
    document.querySelectorAll('input[name="features"]:checked').forEach(checkbox => {
      features[checkbox.value] = true;
    });

    // Generate license key
    const licenseKey = this.generateLicenseKey();

    const newLicense = {
      id: Math.max(...this.licenses.map(l => l.id)) + 1,
      license_key: licenseKey,
      username,
      expires_at: new Date(expiryDate + 'T23:59:59Z').toISOString(),
      seats,
      features_json: JSON.stringify(features),
      last_checked_at: new Date().toISOString(),
      revoked: false
    };

    this.licenses.push(newLicense);
    this.stats.totalLicenses = this.licenses.length;
    this.stats.activeLicenses = this.licenses.filter(l => !l.revoked && new Date(l.expires_at) > new Date()).length;

    this.closeModal(document.getElementById('generateLicenseModal'));
    this.renderCurrentTab();
    
    // Show the generated license key
    alert(`License generated successfully!\n\nLicense Key: ${licenseKey}\n\nPlease save this key securely.`);
  }

  generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'SLS-';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  editUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      const newRole = prompt(`Edit role for ${user.username}:`, user.role);
      if (newRole && ['admin', 'operator'].includes(newRole)) {
        user.role = newRole;
        user.updated_at = new Date().toISOString();
        this.renderCurrentTab();
        alert('User updated successfully');
      }
    }
  }

  deleteUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (user && confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      this.users = this.users.filter(u => u.id !== userId);
      this.stats.totalUsers = this.users.length;
      this.stats.activeUsers = this.users.filter(u => u.is_active).length;
      this.renderCurrentTab();
      alert('User deleted successfully');
    }
  }

  resetPassword(userId) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      const newPassword = prompt(`Enter new password for ${user.username}:`);
      if (newPassword) {
        // In real app, this would hash and store the password
        user.updated_at = new Date().toISOString();
        alert('Password reset successfully');
      }
    }
  }

  revokeLicense(licenseId) {
    const license = this.licenses.find(l => l.id === licenseId);
    if (license) {
      license.revoked = !license.revoked;
      this.stats.activeLicenses = this.licenses.filter(l => !l.revoked && new Date(l.expires_at) > new Date()).length;
      this.renderCurrentTab();
      alert(`License ${license.revoked ? 'revoked' : 'restored'} successfully`);
    }
  }

  extendLicense(licenseId) {
    const license = this.licenses.find(l => l.id === licenseId);
    if (license) {
      const months = prompt('Extend license by how many months?', '12');
      if (months && !isNaN(months)) {
        const currentExpiry = new Date(license.expires_at);
        currentExpiry.setMonth(currentExpiry.getMonth() + parseInt(months));
        license.expires_at = currentExpiry.toISOString();
        this.renderCurrentTab();
        alert('License extended successfully');
      }
    }
  }
}

// Initialize admin panel
window.adminPanel = new AdminPanel();