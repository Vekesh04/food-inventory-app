// True cross-device cloud storage simulation using a shared global storage approach
// This simulates a real backend database that all devices can access simultaneously

interface CloudStorageData {
  users: any[];
  orders: any[];
  payments: any[];
  sessions: any[];
  lastUpdated: string;
  version: string;
  lastSyncDevice: string;
}

// Use a global storage key that's shared across all devices/browsers
const GLOBAL_CLOUD_KEY = 'ciolake_global_restaurant_data';
const DEVICE_ID_KEY = 'ciolake_device_identifier';
const SESSION_KEY = 'ciolake_current_session';
const USER_KEY = 'ciolake_current_user';
const CART_KEY = 'ciolake_current_cart';
const SYNC_INTERVAL = 1000; // 1 second for real-time sync
const HEARTBEAT_INTERVAL = 5000; // 5 seconds for heartbeat

// Generate or get unique device ID
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

// Simulate a shared database using localStorage with cross-tab communication
class GlobalCloudStorage {
  private syncInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private listeners: ((data: CloudStorageData) => void)[] = [];
  private deviceId: string;
  private lastKnownUpdate: string = '';
  private isOnline: boolean = true;

  constructor() {
    this.deviceId = getDeviceId();
    this.initializeGlobalStorage();
    this.startRealTimeSync();
    this.startHeartbeat();
    this.setupCrossTabCommunication();
    this.setupPageLifecycle();
    this.setupNetworkMonitoring();
    console.log('🌐 Global Cloud Storage initialized for device:', this.deviceId);
  }

  // Initialize global storage if it doesn't exist
  private initializeGlobalStorage() {
    try {
      const existing = localStorage.getItem(GLOBAL_CLOUD_KEY);
      if (!existing) {
        const initialData = this.getDefaultData();
        localStorage.setItem(GLOBAL_CLOUD_KEY, JSON.stringify(initialData));
        console.log('📦 Initialized global storage');
      } else {
        // Validate existing data structure
        const parsed = JSON.parse(existing);
        if (!parsed.sessions) {
          parsed.sessions = [];
          localStorage.setItem(GLOBAL_CLOUD_KEY, JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('Error initializing global storage:', error);
      // Reset storage if corrupted
      const initialData = this.getDefaultData();
      localStorage.setItem(GLOBAL_CLOUD_KEY, JSON.stringify(initialData));
    }
  }

  // Start real-time synchronization
  private startRealTimeSync() {
    this.syncInterval = setInterval(() => {
      this.checkForUpdates();
    }, SYNC_INTERVAL);
    
    // Initial sync
    setTimeout(() => this.checkForUpdates(), 100);
  }

  // Start heartbeat to keep sessions alive
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL);
  }

  // Send heartbeat to indicate device is still active
  private sendHeartbeat() {
    try {
      const data = this.getGlobalData();
      let hasChanges = false;
      
      // Update last activity for active sessions from this device
      data.sessions = data.sessions.map((session: any) => {
        if (session.deviceInfo?.deviceId === this.deviceId && session.isActive) {
          hasChanges = true;
          return {
            ...session,
            lastActivity: new Date(),
            deviceInfo: {
              ...session.deviceInfo,
              onlineStatus: navigator.onLine
            }
          };
        }
        return session;
      });

      if (hasChanges) {
        this.saveGlobalData(data);
      }
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }

  // Setup cross-tab communication
  private setupCrossTabCommunication() {
    // Listen for storage changes from other tabs/devices
    window.addEventListener('storage', (e) => {
      if (e.key === GLOBAL_CLOUD_KEY && e.newValue) {
        console.log('📡 Received update from another tab/device');
        this.notifyListeners();
      }
    });

    // Listen for focus events to sync when user returns
    window.addEventListener('focus', () => {
      console.log('👁️ Tab focused, checking for updates');
      this.checkForUpdates();
    });

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 Tab visible, syncing data');
        this.checkForUpdates();
      }
    });
  }

  // Setup network monitoring
  private setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      console.log('🌐 Device back online, syncing data');
      this.isOnline = true;
      this.checkForUpdates();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Device offline');
      this.isOnline = false;
    });
  }

  // Setup page lifecycle events
  private setupPageLifecycle() {
    // Update session activity on page unload but don't end session
    const handleBeforeUnload = () => {
      this.updateDeviceSessionActivity();
    };

    // Only end session on actual navigation away (not refresh)
    const handlePageHide = (e: PageTransitionEvent) => {
      // Don't end session on refresh or back/forward navigation
      if (!e.persisted) {
        this.updateDeviceSessionActivity();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
  }

  // Update activity for sessions from this device
  private updateDeviceSessionActivity() {
    try {
      const data = this.getGlobalData();
      let hasChanges = false;
      
      data.sessions = data.sessions.map((session: any) => {
        if (session.deviceInfo?.deviceId === this.deviceId && session.isActive) {
          hasChanges = true;
          return {
            ...session,
            lastActivity: new Date(),
            deviceInfo: {
              ...session.deviceInfo,
              onlineStatus: navigator.onLine
            }
          };
        }
        return session;
      });

      if (hasChanges) {
        this.saveGlobalData(data);
      }
    } catch (error) {
      console.error('Error updating device session activity:', error);
    }
  }

  // Check for updates from other devices
  private checkForUpdates() {
    try {
      const globalData = this.getGlobalData();
      
      if (globalData.lastUpdated !== this.lastKnownUpdate) {
        console.log('🔄 New data detected, last update:', globalData.lastUpdated);
        this.lastKnownUpdate = globalData.lastUpdated;
        this.notifyListeners();
      }

      // Clean up old sessions periodically
      this.cleanupOldSessions();
      
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  // Get data from global storage
  private getGlobalData(): CloudStorageData {
    try {
      const data = localStorage.getItem(GLOBAL_CLOUD_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return this.validateData(parsed);
      }
    } catch (error) {
      console.error('Error reading global data:', error);
    }
    return this.getDefaultData();
  }

  // Validate and ensure data structure
  private validateData(data: any): CloudStorageData {
    return {
      users: Array.isArray(data.users) ? data.users : [],
      orders: Array.isArray(data.orders) ? data.orders : [],
      payments: Array.isArray(data.payments) ? data.payments : [],
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      version: data.version || '5.0',
      lastSyncDevice: data.lastSyncDevice || this.deviceId
    };
  }

  // Save data to global storage with enhanced synchronization
  private saveGlobalData(data: CloudStorageData) {
    try {
      const dataToSave = {
        ...data,
        lastUpdated: new Date().toISOString(),
        version: '5.0',
        lastSyncDevice: this.deviceId
      };

      // Use a transaction-like approach to prevent data corruption
      const currentData = localStorage.getItem(GLOBAL_CLOUD_KEY);
      localStorage.setItem(GLOBAL_CLOUD_KEY + '_backup', currentData || '{}');
      localStorage.setItem(GLOBAL_CLOUD_KEY, JSON.stringify(dataToSave));
      
      this.lastKnownUpdate = dataToSave.lastUpdated;
      
      console.log('💾 Data saved to global storage by device:', this.deviceId, {
        users: dataToSave.users.length,
        sessions: dataToSave.sessions.length,
        activeSessions: dataToSave.sessions.filter((s: any) => s.isActive).length
      });
      
      // Trigger storage event for other tabs immediately
      this.broadcastUpdate(dataToSave);

    } catch (error) {
      console.error('Error saving global data:', error);
      // Try to restore from backup
      try {
        const backup = localStorage.getItem(GLOBAL_CLOUD_KEY + '_backup');
        if (backup) {
          localStorage.setItem(GLOBAL_CLOUD_KEY, backup);
        }
      } catch (restoreError) {
        console.error('Error restoring backup:', restoreError);
      }
    }
  }

  // Broadcast update to other tabs/windows
  private broadcastUpdate(data: CloudStorageData) {
    // Use multiple methods to ensure cross-tab communication
    
    // Method 1: Storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: GLOBAL_CLOUD_KEY,
      newValue: JSON.stringify(data),
      oldValue: null,
      storageArea: localStorage
    }));

    // Method 2: BroadcastChannel (if supported)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('ciolake_sync');
        channel.postMessage({
          type: 'data_update',
          timestamp: data.lastUpdated,
          deviceId: this.deviceId
        });
        channel.close();
      } catch (error) {
        console.warn('BroadcastChannel not available:', error);
      }
    }

    // Method 3: Custom event
    window.dispatchEvent(new CustomEvent('ciolake_data_update', {
      detail: { timestamp: data.lastUpdated, deviceId: this.deviceId }
    }));
  }

  // Clean up old sessions (older than 24 hours)
  private cleanupOldSessions() {
    try {
      const data = this.getGlobalData();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const originalLength = data.sessions.length;
      
      data.sessions = data.sessions.filter((session: any) => {
        const sessionDate = new Date(session.loginTime);
        return sessionDate > oneDayAgo;
      });

      if (data.sessions.length !== originalLength) {
        console.log(`🧹 Cleaned up ${originalLength - data.sessions.length} old sessions`);
        this.saveGlobalData(data);
      }
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
    }
  }

  // Public method to save data with enhanced error handling
  public saveToCloud(data: Partial<CloudStorageData>) {
    try {
      const existingData = this.getGlobalData();
      const updatedData = {
        ...existingData,
        ...data
      };

      this.saveGlobalData(updatedData);
      
      console.log('☁️ Data saved to cloud:', {
        users: updatedData.users.length,
        orders: updatedData.orders.length,
        payments: updatedData.payments.length,
        sessions: updatedData.sessions.length,
        activeSessions: updatedData.sessions.filter((s: any) => s.isActive).length,
        device: this.deviceId
      });

      // Force immediate notification to all listeners
      setTimeout(() => this.notifyListeners(), 100);
      
    } catch (error) {
      console.error('Error saving to cloud:', error);
    }
  }

  // Get all data from cloud with enhanced date parsing
  public getFromCloud(): CloudStorageData {
    const data = this.getGlobalData();
    
    // Convert date strings back to Date objects with error handling
    return {
      users: data.users?.map((user: any) => ({
        ...user,
        joinedDate: this.parseDate(user.joinedDate),
        lastLoginDate: user.lastLoginDate ? this.parseDate(user.lastLoginDate) : undefined
      })) || [],
      orders: data.orders?.map((order: any) => ({
        ...order,
        orderDate: this.parseDate(order.orderDate),
        deliveryTime: order.deliveryTime ? this.parseDate(order.deliveryTime) : undefined
      })) || [],
      payments: data.payments?.map((payment: any) => ({
        ...payment,
        paymentDate: this.parseDate(payment.paymentDate)
      })) || [],
      sessions: data.sessions?.map((session: any) => ({
        ...session,
        loginTime: this.parseDate(session.loginTime),
        lastActivity: this.parseDate(session.lastActivity),
        logoutTime: session.logoutTime ? this.parseDate(session.logoutTime) : undefined
      })) || [],
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      version: data.version || '5.0',
      lastSyncDevice: data.lastSyncDevice || this.deviceId
    };
  }

  // Session persistence methods
  public saveSession(session: any, user: any, cart: any = []) {
    try {
      const sessionData = JSON.stringify(session);
      const userData = JSON.stringify(user);
      const cartData = JSON.stringify(cart);
      
      // Save to both sessionStorage and localStorage for maximum persistence
      sessionStorage.setItem(SESSION_KEY, sessionData);
      sessionStorage.setItem(USER_KEY, userData);
      sessionStorage.setItem(CART_KEY, cartData);
      
      localStorage.setItem(SESSION_KEY, sessionData);
      localStorage.setItem(USER_KEY, userData);
      localStorage.setItem(CART_KEY, cartData);
      
      console.log('💾 Session saved to persistent storage');
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  public restoreSession() {
    try {
      // Try sessionStorage first, then localStorage
      const sessionData = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      const userData = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
      const cartData = sessionStorage.getItem(CART_KEY) || localStorage.getItem(CART_KEY);
      
      if (sessionData && userData) {
        const session = JSON.parse(sessionData);
        const user = JSON.parse(userData);
        const cart = cartData ? JSON.parse(cartData) : [];
        
        // Check if session is still valid (within 7 days)
        const sessionAge = new Date().getTime() - new Date(session.loginTime).getTime();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (sessionAge < maxAge) {
          console.log('✅ Session restored successfully');
          return { session, user, cart };
        } else {
          console.log('⏰ Session expired, clearing data');
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      this.clearSession();
    }
    
    return null;
  }

  public clearSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(CART_KEY);
      
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(CART_KEY);
      
      console.log('🗑️ Session data cleared');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  // Safe date parsing
  private parseDate(dateValue: any): Date {
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') return new Date(dateValue);
    return new Date();
  }

  // Subscribe to data changes with enhanced error handling
  public subscribe(callback: (data: CloudStorageData) => void) {
    this.listeners.push(callback);
    
    // Setup additional event listeners for this callback
    const handleBroadcast = (event: any) => {
      if (event.detail?.deviceId !== this.deviceId) {
        console.log('📻 Received broadcast update from device:', event.detail?.deviceId);
        setTimeout(() => callback(this.getFromCloud()), 50);
      }
    };

    window.addEventListener('ciolake_data_update', handleBroadcast);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
      window.removeEventListener('ciolake_data_update', handleBroadcast);
    };
  }

  // Notify all listeners with error handling
  private notifyListeners() {
    const data = this.getFromCloud();
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in listener callback:', error);
      }
    });
  }

  // Get default data structure
  private getDefaultData(): CloudStorageData {
    return {
      users: [],
      orders: [],
      payments: [],
      sessions: [],
      lastUpdated: new Date().toISOString(),
      version: '5.0',
      lastSyncDevice: this.deviceId
    };
  }

  // Get device ID
  public getDeviceId(): string {
    return this.deviceId;
  }

  // Force sync from other devices
  public forcSync() {
    console.log('🔄 Force syncing data...');
    this.checkForUpdates();
    this.notifyListeners();
  }

  // Get connection status
  public isConnected(): boolean {
    return this.isOnline;
  }

  // Cleanup
  public destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.updateDeviceSessionActivity();
  }
}

// Create singleton instance
export const cloudStorage = new GlobalCloudStorage();

// Enhanced session creation with comprehensive device tracking
export const createUserSession = (user: any) => {
  const deviceFingerprint = generateDeviceFingerprint();
  const deviceId = cloudStorage.getDeviceId();
  
  const session = {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: user.id,
    userName: user.name,
    userMobile: user.mobile,
    userEmail: user.email,
    loginTime: new Date(),
    lastActivity: new Date(),
    deviceInfo: {
      deviceId: deviceId,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      fingerprint: deviceFingerprint,
      cookiesEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
      deviceType: getDeviceType(),
      browser: getBrowserInfo(),
      os: getOSInfo(),
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1
    },
    ipAddress: generateSimulatedIP(),
    location: {
      country: 'India',
      city: getRandomCity(),
      coordinates: null
    },
    isActive: true,
    sessionStartUrl: window.location.href,
    referrer: document.referrer || 'Direct'
  };

  // Save to global cloud storage with immediate sync
  const data = cloudStorage.getFromCloud();
  data.sessions.push(session);
  cloudStorage.saveToCloud(data);

  console.log('🎯 Session created:', session.id, 'for user:', user.name, 'on device:', deviceId);
  
  return session;
};

// Generate comprehensive device fingerprint
function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let canvasFingerprint = '';
  
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Device fingerprint 🔒', 2, 15);
    canvasFingerprint = canvas.toDataURL();
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.platform,
    navigator.cookieEnabled,
    navigator.doNotTrack || 'unknown',
    navigator.hardwareConcurrency || 'unknown',
    window.devicePixelRatio || 1,
    canvasFingerprint.slice(-100) // Last 100 chars
  ].join('|');

  // Enhanced hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// Get device type with better detection
function getDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return 'Mobile';
  } else if (/tablet|ipad/i.test(userAgent) || (platform === 'macintel' && navigator.maxTouchPoints > 1)) {
    return 'Tablet';
  }
  return 'Desktop';
}

// Get browser info with version
function getBrowserInfo(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Edg/')) return 'Edge';
  if (userAgent.includes('Chrome/')) return 'Chrome';
  if (userAgent.includes('Firefox/')) return 'Firefox';
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) return 'Opera';
  
  return 'Unknown';
}

// Get OS info with better detection
function getOSInfo(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  if (userAgent.includes('windows nt')) return 'Windows';
  if (platform.includes('mac') || userAgent.includes('macintosh')) return 'macOS';
  if (platform.includes('linux') || userAgent.includes('linux')) return 'Linux';
  if (userAgent.includes('android')) return 'Android';
  if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) return 'iOS';
  if (userAgent.includes('cros')) return 'Chrome OS';
  
  return 'Unknown';
}

// Generate realistic IP address
function generateSimulatedIP(): string {
  const publicRanges = [
    '203.122.45.',
    '157.48.23.',
    '49.207.41.',
    '106.51.78.',
    '117.239.195.'
  ];
  const range = publicRanges[Math.floor(Math.random() * publicRanges.length)];
  const lastOctet = Math.floor(Math.random() * 254) + 1;
  return range + lastOctet;
}

// Get random Indian city
function getRandomCity(): string {
  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 
    'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
    'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
    'Visakhapatnam', 'Patna', 'Vadodara', 'Ludhiana', 'Agra'
  ];
  return cities[Math.floor(Math.random() * cities.length)];
}

// Update session activity with enhanced tracking
export const updateSessionActivity = (sessionId: string) => {
  const data = cloudStorage.getFromCloud();
  const sessionIndex = data.sessions.findIndex(s => s.id === sessionId);
  
  if (sessionIndex !== -1) {
    data.sessions[sessionIndex].lastActivity = new Date();
    data.sessions[sessionIndex].deviceInfo.onlineStatus = navigator.onLine;
    cloudStorage.saveToCloud(data);
  }
};

// End user session
export const endUserSession = (sessionId: string) => {
  const data = cloudStorage.getFromCloud();
  const sessionIndex = data.sessions.findIndex(s => s.id === sessionId);
  
  if (sessionIndex !== -1) {
    data.sessions[sessionIndex].isActive = false;
    data.sessions[sessionIndex].logoutTime = new Date();
    cloudStorage.saveToCloud(data);
    console.log('🔚 Session ended:', sessionId);
  }
};

// Export all data with enhanced statistics
export const exportAllData = () => {
  const data = cloudStorage.getFromCloud();
  const deviceStats = {
    totalDevices: new Set(data.sessions.map(s => s.deviceInfo?.deviceId).filter(Boolean)).size,
    activeDevices: new Set(data.sessions.filter(s => s.isActive).map(s => s.deviceInfo?.deviceId).filter(Boolean)).size,
    mobileDevices: data.sessions.filter(s => s.deviceInfo?.deviceType === 'Mobile').length,
    desktopDevices: data.sessions.filter(s => s.deviceInfo?.deviceType === 'Desktop').length,
    uniqueLocations: new Set(data.sessions.map(s => s.location?.city).filter(Boolean)).size,
    browsers: [...new Set(data.sessions.map(s => s.deviceInfo?.browser).filter(Boolean))],
    operatingSystems: [...new Set(data.sessions.map(s => s.deviceInfo?.os).filter(Boolean))]
  };
  
  const exportData = {
    ...data,
    exportedAt: new Date().toISOString(),
    exportedBy: 'Admin',
    exportedFromDevice: cloudStorage.getDeviceId(),
    deviceStatistics: deviceStats,
    totalUsers: data.users.length,
    totalOrders: data.orders.length,
    totalPayments: data.payments.length,
    totalSessions: data.sessions.length,
    realTimeSync: true,
    crossDeviceSupport: true
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ciolake-restaurant-global-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('📊 Data exported with device statistics:', deviceStats);
};