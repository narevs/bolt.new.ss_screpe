// Scraper Controller - Manages scraping operations
export class ScraperController {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentJob = null;
    this.queue = [];
    this.results = [];
    this.stats = {
      processed: 0,
      errors: 0,
      emailsFound: 0
    };
  }

  async startScraping(urls, options = {}) {
    if (this.isRunning) {
      throw new Error('Scraping already in progress');
    }

    this.isRunning = true;
    this.isPaused = false;
    this.queue = [...urls];
    this.stats = { processed: 0, errors: 0, emailsFound: 0 };

    const {
      rateLimit = 3000,
      maxRetries = 3,
      onProgress = () => {},
      onResult = () => {},
      onError = () => {}
    } = options;

    try {
      for (let i = 0; i < this.queue.length && this.isRunning; i++) {
        // Handle pause
        while (this.isPaused && this.isRunning) {
          await this.sleep(100);
        }

        if (!this.isRunning) break;

        const url = this.queue[i];
        
        try {
          onProgress({ current: i + 1, total: this.queue.length, url });
          
          const results = await this.scrapeUrl(url, maxRetries);
          
          this.results.push(...results);
          this.stats.processed++;
          this.stats.emailsFound += results.length;
          
          onResult(results);
          
          // Rate limiting
          if (i < this.queue.length - 1) {
            await this.sleep(rateLimit);
          }
          
        } catch (error) {
          this.stats.errors++;
          onError({ url, error: error.message });
        }
      }
    } finally {
      this.isRunning = false;
      this.isPaused = false;
    }

    return {
      results: this.results,
      stats: this.stats
    };
  }

  async scrapeUrl(url, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.performScrape(url);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  async performScrape(url) {
    // This would be replaced with actual scraping logic using Puppeteer
    // For now, we'll simulate the scraping process
    
    await this.sleep(Math.random() * 2000 + 1000); // Simulate processing time
    
    // Mock email extraction
    const mockEmails = this.generateMockEmails(url);
    
    return mockEmails.map(email => ({
      ...email,
      source_url: url,
      timestamp: new Date().toISOString(),
      verified: false, // Would be set by MX validation
      duplicate: false // Would be set by deduplication
    }));
  }

  generateMockEmails(url) {
    const domains = ['university.edu', 'research.org', 'institute.ac.uk', 'lab.com'];
    const firstNames = ['John', 'Jane', 'Robert', 'Mary', 'David', 'Sarah', 'Michael', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    
    const emailCount = Math.floor(Math.random() * 5) + 1;
    const emails = [];
    
    for (let i = 0; i < emailCount; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
      
      emails.push({
        name: `${firstName} ${lastName}`,
        email: email,
        journal: this.extractJournalFromUrl(url),
        topic: 'Research Topic',
        verified: Math.random() > 0.3,
        duplicate: false
      });
    }
    
    return emails;
  }

  extractJournalFromUrl(url) {
    const journalMap = {
      'pubs.acs.org': 'ACS Publications',
      'hindawi.com': 'Hindawi',
      'researchsquare.com': 'Research Square',
      'academic.oup.com': 'Oxford Academic',
      'journals.sagepub.com': 'SAGE Journals',
      'cureus.com': 'Cureus',
      'onlinelibrary.wiley.com': 'Wiley Online Library',
      'tandfonline.com': 'Taylor & Francis',
      'link.springer.com': 'Springer',
      'journals.plos.org': 'PLOS ONE',
      'sciencedirect.com': 'ScienceDirect'
    };

    for (const [domain, journal] of Object.entries(journalMap)) {
      if (url.includes(domain)) {
        return journal;
      }
    }

    return 'Unknown Journal';
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
  }

  getStats() {
    return { ...this.stats };
  }

  getResults() {
    return [...this.results];
  }

  clearResults() {
    this.results = [];
    this.stats = { processed: 0, errors: 0, emailsFound: 0 };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}