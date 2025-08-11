// Main Application Logic
import { ScraperController } from './controllers/ScraperController.js';
import { UIManager } from './managers/UIManager.js';
import { DataManager } from './managers/DataManager.js';
import { ExportManager } from './managers/ExportManager.js';

class ScholarScraperApp {
  constructor() {
    this.scraperController = new ScraperController();
    this.uiManager = new UIManager();
    this.dataManager = new DataManager();
    this.exportManager = new ExportManager();
    
    this.currentUser = null;
    this.isRunning = false;
    this.isPaused = false;
    
    this.init();
  }

  async init() {
    // Get user info from localStorage (set during login)
    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Update UI with user info
    document.getElementById('currentUser').textContent = this.currentUser.username || 'User';
    
    // Initialize popular sites
    this.initializePopularSites();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load saved data
    await this.loadSavedData();
    
    // Initialize browser
    this.initializeBrowser();
  }

  initializePopularSites() {
    const sites = [
      { name: 'ACS Publications', url: 'https://pubs.acs.org/' },
      { name: 'Hindawi', url: 'https://www.hindawi.com/' },
      { name: 'Research Square', url: 'https://www.researchsquare.com/' },
      { name: 'Oxford Academic', url: 'https://academic.oup.com/' },
      { name: 'SAGE Journals', url: 'https://journals.sagepub.com/' },
      { name: 'Cureus', url: 'https://www.cureus.com/' },
      { name: 'Wiley Online Library', url: 'https://onlinelibrary.wiley.com/' },
      { name: 'Taylor & Francis', url: 'https://www.tandfonline.com/' },
      { name: 'Springer', url: 'https://link.springer.com/' },
      { name: 'PLOS ONE', url: 'https://journals.plos.org/plosone/' },
      { name: 'ScienceDirect', url: 'https://www.sciencedirect.com/' }
    ];

    const siteSelect = document.getElementById('siteSelect');
    sites.forEach(site => {
      const option = document.createElement('option');
      option.value = site.url;
      option.textContent = site.name;
      siteSelect.appendChild(option);
    });
  }

  setupEventListeners() {
    // Header controls
    document.getElementById('adminBtn').addEventListener('click', () => {
      if (this.currentUser.role === 'admin') {
        this.showAdminPanel();
      } else {
        alert('Admin access required');
      }
    });

    document.getElementById('clearCookiesBtn').addEventListener('click', () => {
      this.clearCookies();
    });

    // Site selection
    document.getElementById('siteSelect').addEventListener('change', (e) => {
      if (e.target.value) {
        document.getElementById('addressBar').value = e.target.value;
        this.navigateToUrl(e.target.value);
      }
    });

    // Browser controls
    document.getElementById('goBtn').addEventListener('click', () => {
      const url = document.getElementById('addressBar').value;
      if (url) this.navigateToUrl(url);
    });

    document.getElementById('backBtn').addEventListener('click', () => {
      this.browserGoBack();
    });

    document.getElementById('reloadBtn').addEventListener('click', () => {
      this.browserReload();
    });

    // Scraping controls
    document.getElementById('scrapeLinksBtn').addEventListener('click', () => {
      this.scrapeLinks();
    });

    document.getElementById('startBtn').addEventListener('click', () => {
      this.startScraping();
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
      this.pauseScraping();
    });

    document.getElementById('stopBtn').addEventListener('click', () => {
      this.stopScraping();
    });

    // URL management
    document.getElementById('addUrlBtn').addEventListener('click', () => {
      this.addUrl();
    });

    document.getElementById('importUrlsBtn').addEventListener('click', () => {
      this.importUrls();
    });

    document.getElementById('exportUrlsBtn').addEventListener('click', () => {
      this.exportUrls();
    });

    document.getElementById('clearUrlsBtn').addEventListener('click', () => {
      this.clearUrls();
    });

    // Data export
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
      this.exportData('csv');
    });

    document.getElementById('exportXlsxBtn').addEventListener('click', () => {
      this.exportData('xlsx');
    });

    document.getElementById('copyBtn').addEventListener('click', () => {
      this.copyData();
    });

    document.getElementById('clearDataBtn').addEventListener('click', () => {
      this.clearData();
    });

    // Rate control
    document.getElementById('rateSlider').addEventListener('input', (e) => {
      document.getElementById('rateValue').textContent = e.target.value;
    });
  }

  initializeBrowser() {
    const browserView = document.getElementById('browserView');
    if (browserView) {
      browserView.addEventListener('dom-ready', () => {
        console.log('Browser ready');
      });
    }
  }

  async navigateToUrl(url) {
    try {
      const browserView = document.getElementById('browserView');
      if (browserView) {
        browserView.src = url;
        this.updateStatus(`Navigating to ${url}`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      this.updateStatus('Navigation failed');
    }
  }

  browserGoBack() {
    const browserView = document.getElementById('browserView');
    if (browserView && browserView.canGoBack()) {
      browserView.goBack();
    }
  }

  browserReload() {
    const browserView = document.getElementById('browserView');
    if (browserView) {
      browserView.reload();
    }
  }

  async clearCookies() {
    try {
      // In Electron, this would clear the webview cookies
      this.updateStatus('Cookies cleared');
      
      // Simulate cookie clearing
      setTimeout(() => {
        this.updateStatus('Ready');
      }, 1000);
    } catch (error) {
      console.error('Error clearing cookies:', error);
      this.updateStatus('Failed to clear cookies');
    }
  }

  async scrapeLinks() {
    const searchTerm = document.getElementById('searchInput').value;
    const linkCount = parseInt(document.getElementById('linkCount').value) || 50;
    
    if (!searchTerm) {
      alert('Please enter search keywords');
      return;
    }

    this.updateStatus('Scraping links...');
    
    try {
      // Simulate link scraping
      const mockLinks = this.generateMockLinks(searchTerm, linkCount);
      
      mockLinks.forEach(url => {
        this.addUrlToQueue(url, 'pending');
      });
      
      this.updateStatus(`Found ${mockLinks.length} links`);
      this.updateUrlStats();
    } catch (error) {
      console.error('Error scraping links:', error);
      this.updateStatus('Failed to scrape links');
    }
  }

  generateMockLinks(searchTerm, count) {
    const baseUrls = [
      'https://pubs.acs.org/doi/',
      'https://www.hindawi.com/journals/',
      'https://academic.oup.com/article/',
      'https://journals.sagepub.com/doi/',
      'https://onlinelibrary.wiley.com/doi/'
    ];
    
    const links = [];
    for (let i = 0; i < count; i++) {
      const baseUrl = baseUrls[Math.floor(Math.random() * baseUrls.length)];
      const id = Math.random().toString(36).substring(7);
      links.push(`${baseUrl}${id}`);
    }
    
    return links;
  }

  addUrl() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();
    
    if (url) {
      this.addUrlToQueue(url, 'pending');
      urlInput.value = '';
      this.updateUrlStats();
    }
  }

  addUrlToQueue(url, status = 'pending') {
    const urlList = document.getElementById('urlList');
    const urlItem = document.createElement('div');
    urlItem.className = 'url-item';
    urlItem.innerHTML = `
      <div class="url-text" title="${url}">${url}</div>
      <div class="url-status ${status}">${status}</div>
      <button class="btn btn-sm btn-danger" onclick="this.parentElement.remove(); app.updateUrlStats();">×</button>
    `;
    
    urlList.appendChild(urlItem);
  }

  async startScraping() {
    if (this.isRunning) return;
    
    const urls = this.getQueuedUrls();
    if (urls.length === 0) {
      alert('No URLs in queue');
      return;
    }
    
    this.isRunning = true;
    this.isPaused = false;
    
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('stopBtn').disabled = false;
    
    this.updateStatus('Starting scraping...');
    
    await this.processUrls(urls);
  }

  async processUrls(urls) {
    const rateLimit = parseInt(document.getElementById('rateSlider').value);
    let processed = 0;
    
    for (const url of urls) {
      if (!this.isRunning) break;
      
      while (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await this.processUrl(url);
      processed++;
      
      this.updateProgress(processed, urls.length);
      
      // Rate limiting
      if (processed < urls.length) {
        await new Promise(resolve => setTimeout(resolve, rateLimit));
      }
    }
    
    this.stopScraping();
  }

  async processUrl(url) {
    try {
      this.updateUrlStatus(url, 'processing');
      this.updateStatus(`Processing: ${url}`);
      
      // Simulate email extraction
      const mockEmails = this.generateMockEmails(url);
      
      mockEmails.forEach(emailData => {
        this.addEmailToResults(emailData);
      });
      
      this.updateUrlStatus(url, 'completed');
      this.updateStats();
      
    } catch (error) {
      console.error('Error processing URL:', error);
      this.updateUrlStatus(url, 'error');
    }
  }

  generateMockEmails(url) {
    const domains = ['university.edu', 'research.org', 'institute.ac.uk', 'lab.com'];
    const names = ['john.smith', 'jane.doe', 'robert.johnson', 'mary.williams', 'david.brown'];
    
    const emailCount = Math.floor(Math.random() * 5) + 1;
    const emails = [];
    
    for (let i = 0; i < emailCount; i++) {
      const name = names[Math.floor(Math.random() * names.length)];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      
      emails.push({
        name: name.replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: `${name}@${domain}`,
        journal: 'Sample Journal',
        topic: 'Research Topic',
        verified: Math.random() > 0.3,
        duplicate: false,
        source_url: url,
        timestamp: new Date().toISOString()
      });
    }
    
    return emails;
  }

  addEmailToResults(emailData) {
    const dataList = document.getElementById('dataList');
    const dataItem = document.createElement('div');
    dataItem.className = 'data-item';
    dataItem.innerHTML = `
      <div class="data-email">${emailData.email}</div>
      <div class="data-meta">
        <div>Name: ${emailData.name}</div>
        <div>Journal: ${emailData.journal}</div>
        <div class="${emailData.verified ? 'data-verified' : 'data-unverified'}">
          ${emailData.verified ? '✓ Verified' : '✗ Unverified'}
        </div>
      </div>
    `;
    
    dataList.appendChild(dataItem);
    
    // Store in data manager
    this.dataManager.addResult(emailData);
  }

  pauseScraping() {
    this.isPaused = !this.isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
    this.updateStatus(this.isPaused ? 'Paused' : 'Resuming...');
  }

  stopScraping() {
    this.isRunning = false;
    this.isPaused = false;
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('pauseBtn').textContent = 'Pause';
    
    this.updateStatus('Stopped');
    this.updateProgress(0, 0);
  }

  getQueuedUrls() {
    const urlItems = document.querySelectorAll('.url-item');
    return Array.from(urlItems).map(item => {
      const urlText = item.querySelector('.url-text').textContent;
      return urlText;
    });
  }

  updateUrlStatus(url, status) {
    const urlItems = document.querySelectorAll('.url-item');
    urlItems.forEach(item => {
      const urlText = item.querySelector('.url-text').textContent;
      if (urlText === url) {
        const statusElement = item.querySelector('.url-status');
        statusElement.textContent = status;
        statusElement.className = `url-status ${status}`;
        item.className = `url-item ${status}`;
      }
    });
  }

  updateUrlStats() {
    const urlItems = document.querySelectorAll('.url-item');
    const total = urlItems.length;
    const processed = document.querySelectorAll('.url-item.completed, .url-item.error').length;
    
    document.getElementById('totalUrls').textContent = total;
    document.getElementById('processedUrls').textContent = processed;
  }

  updateStats() {
    const emailItems = document.querySelectorAll('.data-item');
    const sessionData = emailItems.length;
    
    document.getElementById('sessionData').textContent = sessionData;
    document.getElementById('sessionPages').textContent = document.querySelectorAll('.url-item.completed').length;
    
    // For demo, use session data as today's data
    document.getElementById('todayData').textContent = sessionData;
    document.getElementById('todayPages').textContent = document.querySelectorAll('.url-item.completed').length;
  }

  updateProgress(current, total) {
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    
    progressText.textContent = `${current}/${total}`;
    
    if (total > 0) {
      const percentage = (current / total) * 100;
      progressFill.style.width = `${percentage}%`;
    } else {
      progressFill.style.width = '0%';
    }
  }

  updateStatus(message) {
    document.getElementById('statusText').textContent = message;
  }

  async exportData(format) {
    const results = this.dataManager.getAllResults();
    if (results.length === 0) {
      alert('No data to export');
      return;
    }
    
    try {
      await this.exportManager.exportData(results, format);
      this.updateStatus(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      this.updateStatus('Export failed');
    }
  }

  copyData() {
    const results = this.dataManager.getAllResults();
    if (results.length === 0) {
      alert('No data to copy');
      return;
    }
    
    const csvData = this.exportManager.generateCSV(results);
    navigator.clipboard.writeText(csvData).then(() => {
      this.updateStatus('Data copied to clipboard');
    }).catch(err => {
      console.error('Copy failed:', err);
      this.updateStatus('Copy failed');
    });
  }

  clearData() {
    if (confirm('Are you sure you want to clear all collected data?')) {
      document.getElementById('dataList').innerHTML = '';
      this.dataManager.clearResults();
      this.updateStats();
      this.updateStatus('Data cleared');
    }
  }

  clearUrls() {
    if (confirm('Are you sure you want to clear all URLs?')) {
      document.getElementById('urlList').innerHTML = '';
      this.updateUrlStats();
      this.updateStatus('URLs cleared');
    }
  }

  importUrls() {
    // In Electron, this would open a file dialog
    alert('Import URLs functionality would open a file dialog in the desktop app');
  }

  exportUrls() {
    const urls = this.getQueuedUrls();
    if (urls.length === 0) {
      alert('No URLs to export');
      return;
    }
    
    const urlText = urls.join('\n');
    const blob = new Blob([urlText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'urls.txt';
    a.click();
    
    URL.revokeObjectURL(url);
  }

  showAdminPanel() {
    // In Electron, this would open the admin window
    window.open('admin.html', '_blank', 'width=800,height=600');
  }

  async loadSavedData() {
    // Load any saved data from localStorage or database
    const savedResults = localStorage.getItem('scraperResults');
    if (savedResults) {
      const results = JSON.parse(savedResults);
      results.forEach(result => {
        this.addEmailToResults(result);
      });
      this.updateStats();
    }
  }
}

// Initialize the application
window.app = new ScholarScraperApp();