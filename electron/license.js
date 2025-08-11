const NodeRSA = require('node-rsa');
const fs = require('fs');
const path = require('path');

class LicenseManager {
  constructor() {
    // In production, this would be your actual public key
    this.publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2Z3QX0EXAMPLE_KEY_HERE
-----END PUBLIC KEY-----`;
    
    this.key = new NodeRSA(this.publicKey, 'public');
    this.offlineGracePeriod = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
  }

  generateLicenseKey(username, expiresAt, seats = 1, features = {}) {
    const licenseData = {
      username,
      expires_at: expiresAt,
      seats,
      features,
      issued_at: new Date().toISOString()
    };

    // In production, this would be signed with your private key
    const licenseString = JSON.stringify(licenseData);
    const encoded = Buffer.from(licenseString).toString('base64');
    
    // For demo purposes, we'll use a simple format
    return `SLS-${encoded}`;
  }

  validateLicenseKey(licenseKey) {
    try {
      if (!licenseKey.startsWith('SLS-')) {
        return { valid: false, error: 'Invalid license format' };
      }

      const encoded = licenseKey.substring(4);
      const licenseString = Buffer.from(encoded, 'base64').toString();
      const licenseData = JSON.parse(licenseString);

      // Check expiration
      const expiresAt = new Date(licenseData.expires_at);
      const now = new Date();

      if (expiresAt < now) {
        return { valid: false, error: 'License expired' };
      }

      return {
        valid: true,
        data: licenseData
      };
    } catch (error) {
      return { valid: false, error: 'Invalid license key' };
    }
  }

  checkOfflineGrace(lastCheckedAt) {
    if (!lastCheckedAt) return false;
    
    const lastCheck = new Date(lastCheckedAt);
    const now = new Date();
    const timeDiff = now - lastCheck;
    
    return timeDiff <= this.offlineGracePeriod;
  }

  async validateOnline(licenseKey) {
    // In production, this would make an API call to your license server
    // For now, we'll simulate an online check
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          valid: true,
          revoked: false,
          seatUsage: 1
        });
      }, 1000);
    });
  }
}

module.exports = LicenseManager;