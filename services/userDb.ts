// User Database Service - Persistent storage for user accounts using IndexedDB

interface UserAccount {
  id?: number;
  name: string;
  email: string;
  password: string;
  createdAt: number;
  lastLogin: number;
  isActive?: boolean;
}

interface UserSession {
  name: string;
  email: string;
  loginTime: number;
}

const DB_NAME = 'NaturalQuerySystemDB';
const DB_VERSION = 1;
const USERS_STORE = 'users';
const SESSION_KEY = 'user_session';

class UserDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(USERS_STORE)) {
          const store = db.createObjectStore(USERS_STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('email', 'email', { unique: true });
        }
      };
    });
  }

  async registerUser(name: string, email: string, password: string): Promise<UserAccount> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readwrite');
      const store = transaction.objectStore(USERS_STORE);
      
      const now = Date.now();
      const user: UserAccount = {
        name,
        email: email.toLowerCase(),
        password,
        createdAt: now,
        lastLogin: now
      };

      const request = store.add(user);
      
      request.onsuccess = () => {
        user.id = request.result as number;
        this.setSession({ name, email: user.email, loginTime: now });
        // Fire-and-forget sync to Express mirror (silently ignore if server is down)
        fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email: user.email, createdAt: now, lastLogin: now }),
        }).catch(() => {});
        resolve(user);
      };
      
      request.onerror = () => {
        if (request.error?.name === 'ConstraintError') {
          reject(new Error('Email already registered'));
        } else {
          reject(request.error);
        }
      };
    });
  }

  async login(email: string, password: string): Promise<UserAccount> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readwrite');
      const store = transaction.objectStore(USERS_STORE);
      const index = store.index('email');
      
      const request = index.get(email.toLowerCase());
      
      request.onsuccess = () => {
        const user = request.result as UserAccount | undefined;
        
        if (!user) {
          reject(new Error('USER_NOT_FOUND'));
          return;
        }
        
        if (user.password !== password) {
          reject(new Error('Invalid password. Please try again.'));
          return;
        }

        if (user.isActive === false) {
          reject(new Error('Your account has been suspended. Please contact an administrator.'));
          return;
        }

        // Update last login time
        user.lastLogin = Date.now();
        store.put(user);
        
        this.setSession({ name: user.name, email: user.email, loginTime: user.lastLogin });
        // Fire-and-forget sync to Express mirror (silently ignore if server is down)
        fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: user.name, email: user.email, createdAt: user.createdAt, lastLogin: user.lastLogin }),
        }).catch(() => {});
        resolve(user);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getUserByEmail(email: string): Promise<UserAccount | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readonly');
      const store = transaction.objectStore(USERS_STORE);
      const index = store.index('email');
      
      const request = index.get(email.toLowerCase());
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  setSession(session: UserSession): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  getSession(): UserSession | null {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }

  clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
  }

  async getAllUsers(): Promise<UserAccount[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readonly');
      const store = transaction.objectStore(USERS_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const userDb = new UserDatabase();
