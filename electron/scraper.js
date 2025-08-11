const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const dns = require('dns').promises;

class ScholarScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isRunning = false;
    this.isPaused = false;
    this.currentJob = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set random user agent
    await this.page.setUserAgent(this.getRandomUserAgent());
  }

  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  async navigateToSite(url) {
    if (!this.page) await this.initialize();
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      return true;
    } catch (error) {
      console.error('Navigation error:', error);
      return false;
    }
  }

  async searchAndCollectLinks(searchTerm, maxLinks = 50) {
    try {
      // This is a generic implementation - would need site-specific rules
      const searchSelector = 'input[type="search"], input[name="q"], input[name="search"]';
      await this.page.waitForSelector(searchSelector, { timeout: 10000 });
      
      await this.page.type(searchSelector, searchTerm);
      await this.page.keyboard.press('Enter');
      
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Extract links from search results
      const links = await this.page.evaluate((max) => {
        const linkElements = document.querySelectorAll('a[href*="/article"], a[href*="/paper"], a[href*="/publication"]');
        const urls = [];
        
        for (let i = 0; i < Math.min(linkElements.length, max); i++) {
          const href = linkElements[i].href;
          if (href && !urls.includes(href)) {
            urls.push(href);
          }
        }
        
        return urls;
      }, maxLinks);
      
      return links;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async scrapeEmailsFromPage(url) {
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const pageContent = await this.page.content();
      const $ = cheerio.load(pageContent);
      
      // Extract emails using regex
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const text = $.text();
      const emails = text.match(emailRegex) || [];
      
      // Extract additional metadata
      const title = $('title').text().trim();
      const journal = this.extractJournal($);
      const authors = this.extractAuthors($);
      
      const results = [];
      const uniqueEmails = [...new Set(emails)];
      
      for (const email of uniqueEmails) {
        if (this.isValidEmail(email)) {
          const verified = await this.verifyEmailMX(email);
          results.push({
            name: authors.length > 0 ? authors[0] : '',
            email: email,
            journal: journal,
            topic: title,
            verified: verified,
            duplicate: false,
            source_url: url
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Scraping error:', error);
      return [];
    }
  }

  extractJournal($) {
    // Try various selectors for journal name
    const selectors = [
      '.journal-title',
      '.publication-title',
      '[data-journal]',
      '.journal-name'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        return element.text().trim();
      }
    }
    
    return '';
  }

  extractAuthors($) {
    const authors = [];
    const selectors = [
      '.author-name',
      '.author',
      '[data-author]',
      '.contributor'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, el) => {
        const name = $(el).text().trim();
        if (name && !authors.includes(name)) {
          authors.push(name);
        }
      });
      if (authors.length > 0) break;
    }
    
    return authors;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const excludePatterns = [
      /noreply/i,
      /no-reply/i,
      /donotreply/i,
      /support@/i,
      /admin@/i,
      /info@/i
    ];
    
    if (!emailRegex.test(email)) return false;
    
    return !excludePatterns.some(pattern => pattern.test(email));
  }

  async verifyEmailMX(email) {
    try {
      const domain = email.split('@')[1];
      const mxRecords = await dns.resolveMx(domain);
      return mxRecords && mxRecords.length > 0;
    } catch (error) {
      return false;
    }
  }

  async clearCookies() {
    if (this.page) {
      const client = await this.page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');
      await client.send('Network.clearBrowserCache');
    }
  }

  async pause() {
    this.isPaused = true;
  }

  async resume() {
    this.isPaused = false;
  }

  async stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.currentJob) {
      this.currentJob = null;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

module.exports = ScholarScraper;