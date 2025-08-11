// UI Manager - Handles UI updates and interactions
export class UIManager {
  constructor() {
    this.elements = this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    return {
      // Status and progress
      statusText: document.getElementById('statusText'),
      progressText: document.getElementById('progressText'),
      progressFill: document.getElementById('progressFill'),
      
      // URL management
      urlList: document.getElementById('urlList'),
      urlInput: document.getElementById('urlInput'),
      totalUrls: document.getElementById('totalUrls'),
      processedUrls: document.getElementById('processedUrls'),
      
      // Data display
      dataList: document.getElementById('dataList'),
      
      // Statistics
      todayData: document.getElementById('todayData'),
      todayPages: document.getElementById('todayPages'),
      sessionData: document.getElementById('sessionData'),
      sessionPages: document.getElementById('sessionPages'),
      
      // Controls
      startBtn: document.getElementById('startBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      stopBtn: document.getElementById('stopBtn'),
      rateSlider: document.getElementById('rateSlider'),
      rateValue: document.getElementById('rateValue'),
      
      // Browser
      addressBar: document.getElementById('addressBar'),
      searchInput: document.getElementById('searchInput'),
      linkCount: document.getElementById('linkCount')
    };
  }

  setupEventListeners() {
    // Rate slider
    this.elements.rateSlider.addEventListener('input', (e) => {
      this.elements.rateValue.textContent = e.target.value;
    });
  }

  updateStatus(message) {
    if (this.elements.statusText) {
      this.elements.statusText.textContent = message;
    }
  }

  updateProgress(current, total) {
    if (this.elements.progressText) {
      this.elements.progressText.textContent = `${current}/${total}`;
    }
    
    if (this.elements.progressFill) {
      const percentage = total > 0 ? (current / total) * 100 : 0;
      this.elements.progressFill.style.width = `${percentage}%`;
    }
  }

  addUrlToQueue(url, status = 'pending') {
    if (!this.elements.urlList) return;

    const urlItem = document.createElement('div');
    urlItem.className = `url-item ${status}`;
    urlItem.dataset.url = url;
    urlItem.innerHTML = `
      <div class="url-text" title="${url}">${this.truncateUrl(url)}</div>
      <div class="url-status ${status}">${status}</div>
      <button class="btn btn-sm btn-danger" onclick="this.parentElement.remove(); window.app?.uiManager?.updateUrlStats();">×</button>
    `;
    
    this.elements.urlList.appendChild(urlItem);
    this.updateUrlStats();
  }

  updateUrlStatus(url, status) {
    const urlItems = this.elements.urlList?.querySelectorAll('.url-item') || [];
    
    urlItems.forEach(item => {
      if (item.dataset.url === url) {
        const statusElement = item.querySelector('.url-status');
        if (statusElement) {
          statusElement.textContent = status;
          statusElement.className = `url-status ${status}`;
        }
        item.className = `url-item ${status}`;
      }
    });
    
    this.updateUrlStats();
  }

  updateUrlStats() {
    if (!this.elements.urlList) return;

    const urlItems = this.elements.urlList.querySelectorAll('.url-item');
    const total = urlItems.length;
    const processed = this.elements.urlList.querySelectorAll('.url-item.completed, .url-item.error').length;
    
    if (this.elements.totalUrls) {
      this.elements.totalUrls.textContent = total;
    }
    
    if (this.elements.processedUrls) {
      this.elements.processedUrls.textContent = processed;
    }
  }

  addEmailToResults(emailData) {
    if (!this.elements.dataList) return;

    const dataItem = document.createElement('div');
    dataItem.className = 'data-item';
    dataItem.innerHTML = `
      <div class="data-email">${emailData.email}</div>
      <div class="data-meta">
        <div>Name: ${emailData.name || 'Unknown'}</div>
        <div>Journal: ${emailData.journal || 'Unknown'}</div>
        <div>Source: ${this.truncateUrl(emailData.source_url)}</div>
        <div class="${emailData.verified ? 'data-verified' : 'data-unverified'}">
          ${emailData.verified ? '✓ Verified' : '✗ Unverified'}
        </div>
      </div>
    `;
    
    this.elements.dataList.appendChild(dataItem);
    this.updateStats();
  }

  updateStats() {
    const emailItems = this.elements.dataList?.querySelectorAll('.data-item') || [];
    const completedPages = this.elements.urlList?.querySelectorAll('.url-item.completed') || [];
    
    const sessionData = emailItems.length;
    const sessionPages = completedPages.length;
    
    // Update session stats
    if (this.elements.sessionData) {
      this.elements.sessionData.textContent = sessionData;
    }
    
    if (this.elements.sessionPages) {
      this.elements.sessionPages.textContent = sessionPages;
    }
    
    // For demo, use session data as today's data
    if (this.elements.todayData) {
      this.elements.todayData.textContent = sessionData;
    }
    
    if (this.elements.todayPages) {
      this.elements.todayPages.textContent = sessionPages;
    }
  }

  clearData() {
    if (this.elements.dataList) {
      this.elements.dataList.innerHTML = '';
    }
    this.updateStats();
  }

  clearUrls() {
    if (this.elements.urlList) {
      this.elements.urlList.innerHTML = '';
    }
    this.updateUrlStats();
  }

  setScrapingState(isRunning, isPaused = false) {
    if (this.elements.startBtn) {
      this.elements.startBtn.disabled = isRunning;
    }
    
    if (this.elements.pauseBtn) {
      this.elements.pauseBtn.disabled = !isRunning;
      this.elements.pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    }
    
    if (this.elements.stopBtn) {
      this.elements.stopBtn.disabled = !isRunning;
    }
  }

  getQueuedUrls() {
    if (!this.elements.urlList) return [];
    
    const urlItems = this.elements.urlList.querySelectorAll('.url-item');
    return Array.from(urlItems).map(item => item.dataset.url).filter(Boolean);
  }

  getRateLimit() {
    return parseInt(this.elements.rateSlider?.value || '3000');
  }

  getSearchTerm() {
    return this.elements.searchInput?.value?.trim() || '';
  }

  getLinkCount() {
    return parseInt(this.elements.linkCount?.value || '50');
  }

  getCurrentUrl() {
    return this.elements.addressBar?.value?.trim() || '';
  }

  truncateUrl(url, maxLength = 50) {
    if (!url || url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
  }

  showNotification(message, type = 'info') {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
      color: white;
      border-radius: 4px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}