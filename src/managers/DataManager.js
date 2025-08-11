// Data Manager - Handles data storage and retrieval
export class DataManager {
  constructor() {
    this.results = [];
    this.duplicateMap = new Map();
    this.loadFromStorage();
  }

  addResult(emailData) {
    // Check for duplicates
    const key = `${emailData.email}|${emailData.source_url}`;
    
    if (this.duplicateMap.has(key)) {
      emailData.duplicate = true;
      return false; // Don't add duplicate
    }
    
    this.duplicateMap.set(key, true);
    emailData.duplicate = false;
    emailData.id = this.generateId();
    emailData.timestamp = emailData.timestamp || new Date().toISOString();
    
    this.results.push(emailData);
    this.saveToStorage();
    
    return true;
  }

  addResults(emailDataArray) {
    const added = [];
    
    emailDataArray.forEach(emailData => {
      if (this.addResult(emailData)) {
        added.push(emailData);
      }
    });
    
    return added;
  }

  getAllResults() {
    return [...this.results];
  }

  getResultsByEmail(email) {
    return this.results.filter(result => result.email === email);
  }

  getResultsBySource(sourceUrl) {
    return this.results.filter(result => result.source_url === sourceUrl);
  }

  getVerifiedResults() {
    return this.results.filter(result => result.verified);
  }

  getUnverifiedResults() {
    return this.results.filter(result => !result.verified);
  }

  getUniqueEmails() {
    const uniqueEmails = new Set();
    return this.results.filter(result => {
      if (uniqueEmails.has(result.email)) {
        return false;
      }
      uniqueEmails.add(result.email);
      return true;
    });
  }

  getStats() {
    const total = this.results.length;
    const verified = this.results.filter(r => r.verified).length;
    const unique = this.getUniqueEmails().length;
    const duplicates = total - unique;
    
    const journalStats = {};
    this.results.forEach(result => {
      const journal = result.journal || 'Unknown';
      journalStats[journal] = (journalStats[journal] || 0) + 1;
    });
    
    return {
      total,
      verified,
      unverified: total - verified,
      unique,
      duplicates,
      journalStats
    };
  }

  searchResults(query) {
    const lowerQuery = query.toLowerCase();
    
    return this.results.filter(result => 
      result.email.toLowerCase().includes(lowerQuery) ||
      (result.name && result.name.toLowerCase().includes(lowerQuery)) ||
      (result.journal && result.journal.toLowerCase().includes(lowerQuery)) ||
      (result.topic && result.topic.toLowerCase().includes(lowerQuery))
    );
  }

  filterResults(filters) {
    let filtered = [...this.results];
    
    if (filters.verified !== undefined) {
      filtered = filtered.filter(result => result.verified === filters.verified);
    }
    
    if (filters.journal) {
      filtered = filtered.filter(result => 
        result.journal && result.journal.toLowerCase().includes(filters.journal.toLowerCase())
      );
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(result => new Date(result.timestamp) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(result => new Date(result.timestamp) <= toDate);
    }
    
    if (filters.excludeDuplicates) {
      filtered = this.removeDuplicatesFromArray(filtered);
    }
    
    return filtered;
  }

  removeDuplicatesFromArray(results) {
    const seen = new Set();
    return results.filter(result => {
      if (seen.has(result.email)) {
        return false;
      }
      seen.add(result.email);
      return true;
    });
  }

  updateResult(id, updates) {
    const index = this.results.findIndex(result => result.id === id);
    
    if (index !== -1) {
      this.results[index] = { ...this.results[index], ...updates };
      this.saveToStorage();
      return this.results[index];
    }
    
    return null;
  }

  deleteResult(id) {
    const index = this.results.findIndex(result => result.id === id);
    
    if (index !== -1) {
      const deleted = this.results.splice(index, 1)[0];
      
      // Remove from duplicate map
      const key = `${deleted.email}|${deleted.source_url}`;
      this.duplicateMap.delete(key);
      
      this.saveToStorage();
      return deleted;
    }
    
    return null;
  }

  clearResults() {
    this.results = [];
    this.duplicateMap.clear();
    this.saveToStorage();
  }

  exportToCSV() {
    if (this.results.length === 0) {
      return '';
    }
    
    const headers = ['name', 'email', 'journal', 'topic', 'verified', 'duplicate', 'source_url', 'timestamp'];
    const csvRows = [headers.join(',')];
    
    this.results.forEach(result => {
      const row = headers.map(header => {
        const value = result[header] || '';
        // Escape commas and quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  exportToJSON() {
    return JSON.stringify(this.results, null, 2);
  }

  importFromJSON(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      
      if (Array.isArray(imported)) {
        const added = this.addResults(imported);
        return {
          success: true,
          imported: imported.length,
          added: added.length,
          duplicates: imported.length - added.length
        };
      } else {
        throw new Error('Invalid JSON format');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  saveToStorage() {
    try {
      localStorage.setItem('scraperResults', JSON.stringify(this.results));
      localStorage.setItem('scraperDuplicateMap', JSON.stringify([...this.duplicateMap.entries()]));
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  }

  loadFromStorage() {
    try {
      const savedResults = localStorage.getItem('scraperResults');
      if (savedResults) {
        this.results = JSON.parse(savedResults);
      }
      
      const savedDuplicateMap = localStorage.getItem('scraperDuplicateMap');
      if (savedDuplicateMap) {
        const entries = JSON.parse(savedDuplicateMap);
        this.duplicateMap = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
      this.results = [];
      this.duplicateMap = new Map();
    }
  }

  // Validation methods
  async validateEmail(email) {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Invalid format' };
    }
    
    // Check against common invalid patterns
    const invalidPatterns = [
      /noreply/i,
      /no-reply/i,
      /donotreply/i,
      /support@/i,
      /admin@/i,
      /info@/i,
      /webmaster@/i
    ];
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(email)) {
        return { valid: false, reason: 'System email' };
      }
    }
    
    return { valid: true };
  }

  async validateMX(email) {
    // This would perform actual MX record validation in a real implementation
    // For now, we'll simulate it
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 85% success rate
        const valid = Math.random() > 0.15;
        resolve({ valid, reason: valid ? 'MX record found' : 'No MX record' });
      }, Math.random() * 1000 + 500);
    });
  }
}