// Export Manager - Handles data export functionality
export class ExportManager {
  constructor() {
    this.supportedFormats = ['csv', 'xlsx', 'json', 'txt'];
  }

  async exportData(data, format, filename = null) {
    if (!this.supportedFormats.includes(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `scholar_scraper_export_${timestamp}`;

    switch (format) {
      case 'csv':
        return this.exportCSV(data, filename || `${defaultFilename}.csv`);
      case 'xlsx':
        return this.exportXLSX(data, filename || `${defaultFilename}.xlsx`);
      case 'json':
        return this.exportJSON(data, filename || `${defaultFilename}.json`);
      case 'txt':
        return this.exportTXT(data, filename || `${defaultFilename}.txt`);
      default:
        throw new Error(`Export format ${format} not implemented`);
    }
  }

  generateCSV(data) {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = [
      'name',
      'email', 
      'journal',
      'topic',
      'verified',
      'duplicate',
      'source_url',
      'timestamp'
    ];

    const csvRows = [headers.join(',')];

    data.forEach(item => {
      const row = headers.map(header => {
        let value = item[header] || '';
        
        // Convert boolean to string
        if (typeof value === 'boolean') {
          value = value.toString();
        }
        
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (typeof value === 'string') {
          value = value.replace(/"/g, '""');
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value}"`;
          }
        }
        
        return value;
      });
      
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  async exportCSV(data, filename) {
    const csvContent = this.generateCSV(data);
    return this.downloadFile(csvContent, filename, 'text/csv');
  }

  async exportXLSX(data, filename) {
    // For web version, we'll create a CSV and suggest using Excel to open it
    // In the Electron version, this would use a proper XLSX library
    const csvContent = this.generateCSV(data);
    
    // Create a more Excel-friendly format
    const excelContent = '\ufeff' + csvContent; // Add BOM for proper UTF-8 handling
    
    return this.downloadFile(excelContent, filename.replace('.xlsx', '.csv'), 'text/csv');
  }

  async exportJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    return this.downloadFile(jsonContent, filename, 'application/json');
  }

  async exportTXT(data, filename) {
    const txtContent = data.map(item => {
      return [
        `Name: ${item.name || 'N/A'}`,
        `Email: ${item.email}`,
        `Journal: ${item.journal || 'N/A'}`,
        `Topic: ${item.topic || 'N/A'}`,
        `Verified: ${item.verified ? 'Yes' : 'No'}`,
        `Source: ${item.source_url}`,
        `Date: ${new Date(item.timestamp).toLocaleString()}`,
        '---'
      ].join('\n');
    }).join('\n\n');

    return this.downloadFile(txtContent, filename, 'text/plain');
  }

  downloadFile(content, filename, mimeType) {
    return new Promise((resolve, reject) => {
      try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        resolve({ success: true, filename });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate export statistics
  generateExportStats(data) {
    const stats = {
      totalRecords: data.length,
      verifiedEmails: data.filter(item => item.verified).length,
      unverifiedEmails: data.filter(item => !item.verified).length,
      duplicates: data.filter(item => item.duplicate).length,
      uniqueEmails: new Set(data.map(item => item.email)).size,
      journals: {},
      dateRange: {
        earliest: null,
        latest: null
      }
    };

    // Count by journal
    data.forEach(item => {
      const journal = item.journal || 'Unknown';
      stats.journals[journal] = (stats.journals[journal] || 0) + 1;
    });

    // Find date range
    const dates = data.map(item => new Date(item.timestamp)).filter(date => !isNaN(date));
    if (dates.length > 0) {
      stats.dateRange.earliest = new Date(Math.min(...dates));
      stats.dateRange.latest = new Date(Math.max(...dates));
    }

    return stats;
  }

  // Create export with statistics
  async exportWithStats(data, format, filename = null) {
    const stats = this.generateExportStats(data);
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'json') {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0.0',
          statistics: stats
        },
        data: data
      };
      
      const jsonContent = JSON.stringify(exportData, null, 2);
      const defaultFilename = filename || `scholar_scraper_export_with_stats_${timestamp}.json`;
      
      return this.downloadFile(jsonContent, defaultFilename, 'application/json');
    }
    
    // For other formats, create a separate stats file
    const statsContent = this.formatStatsAsText(stats);
    const statsFilename = `scholar_scraper_stats_${timestamp}.txt`;
    
    // Download stats file
    await this.downloadFile(statsContent, statsFilename, 'text/plain');
    
    // Download main data file
    return this.exportData(data, format, filename);
  }

  formatStatsAsText(stats) {
    const lines = [
      'Scholar Summit Email Scraper - Export Statistics',
      '=' .repeat(50),
      '',
      `Export Date: ${new Date().toLocaleString()}`,
      `Total Records: ${stats.totalRecords}`,
      `Verified Emails: ${stats.verifiedEmails}`,
      `Unverified Emails: ${stats.unverifiedEmails}`,
      `Unique Emails: ${stats.uniqueEmails}`,
      `Duplicates: ${stats.duplicates}`,
      ''
    ];

    if (stats.dateRange.earliest && stats.dateRange.latest) {
      lines.push(`Date Range: ${stats.dateRange.earliest.toLocaleDateString()} - ${stats.dateRange.latest.toLocaleDateString()}`);
      lines.push('');
    }

    lines.push('Journals:');
    lines.push('-'.repeat(20));
    
    Object.entries(stats.journals)
      .sort(([,a], [,b]) => b - a)
      .forEach(([journal, count]) => {
        lines.push(`${journal}: ${count}`);
      });

    return lines.join('\n');
  }

  // Validate export data
  validateExportData(data) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(data)) {
      errors.push('Data must be an array');
      return { valid: false, errors, warnings };
    }

    if (data.length === 0) {
      warnings.push('No data to export');
    }

    const requiredFields = ['email'];
    const recommendedFields = ['name', 'journal', 'source_url', 'timestamp'];

    data.forEach((item, index) => {
      requiredFields.forEach(field => {
        if (!item[field]) {
          errors.push(`Missing required field '${field}' in record ${index + 1}`);
        }
      });

      recommendedFields.forEach(field => {
        if (!item[field]) {
          warnings.push(`Missing recommended field '${field}' in record ${index + 1}`);
        }
      });

      // Validate email format
      if (item.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) {
        warnings.push(`Invalid email format in record ${index + 1}: ${item.email}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}