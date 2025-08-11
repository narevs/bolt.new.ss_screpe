// Login functionality
class LoginManager {
  constructor() {
    this.setupEventListeners();
    this.loadRememberedCredentials();
  }

  setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Enter key support
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLogin();
      }
    });
  }

  loadRememberedCredentials() {
    const remembered = localStorage.getItem('rememberedCredentials');
    if (remembered) {
      const credentials = JSON.parse(remembered);
      document.getElementById('username').value = credentials.username || '';
      document.getElementById('licenseKey').value = credentials.licenseKey || '';
      document.getElementById('rememberMe').checked = true;
    }
  }

  async handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const licenseKey = document.getElementById('licenseKey').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!username || !password || !licenseKey) {
      this.showError('Please fill in all fields');
      return;
    }

    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      // Simulate authentication
      const authResult = await this.authenticateUser(username, password, licenseKey);
      
      if (authResult.success) {
        // Save credentials if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            username,
            licenseKey
          }));
        } else {
          localStorage.removeItem('rememberedCredentials');
        }

        // Save current user info
        localStorage.setItem('currentUser', JSON.stringify({
          username: authResult.user.username,
          role: authResult.user.role,
          licenseKey: licenseKey
        }));

        // In Electron, this would trigger the main window to open
        if (window.require) {
          const { ipcRenderer } = window.require('electron');
          ipcRenderer.invoke('login-success');
        } else {
          // For web demo, redirect to main app
          window.location.href = 'index.html';
        }
      } else {
        this.showError(authResult.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Login failed. Please try again.');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }

  async authenticateUser(username, password, licenseKey) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock authentication logic
    const validUsers = {
      'admin': { password: 'admin123', role: 'admin' },
      'operator': { password: 'operator123', role: 'operator' },
      'demo': { password: 'demo123', role: 'operator' }
    };

    const user = validUsers[username];
    if (!user || user.password !== password) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Validate license key
    const licenseValidation = this.validateLicenseKey(licenseKey);
    if (!licenseValidation.valid) {
      return { success: false, error: licenseValidation.error };
    }

    return {
      success: true,
      user: {
        username,
        role: user.role
      },
      license: licenseValidation.data
    };
  }

  validateLicenseKey(licenseKey) {
    // Mock license validation
    if (!licenseKey.startsWith('SLS-')) {
      return { valid: false, error: 'Invalid license format' };
    }

    try {
      // For demo purposes, accept any SLS- prefixed key
      const mockLicenseData = {
        username: 'demo',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        seats: 1,
        features: {
          ocr: true,
          mx: true,
          export: true
        }
      };

      return {
        valid: true,
        data: mockLicenseData
      };
    } catch (error) {
      return { valid: false, error: 'Invalid license key' };
    }
  }

  showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    setTimeout(() => {
      errorElement.classList.remove('show');
    }, 5000);
  }
}

// Initialize login manager
new LoginManager();