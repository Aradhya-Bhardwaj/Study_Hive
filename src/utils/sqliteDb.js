import initSqlJs from 'sql.js';
import { safeStorage } from './safeStorage';

let dbInstance = null;
let sqlEngine = null;

export async function getSqliteDb() {
  if (dbInstance) return dbInstance;

  try {
    const SQL = await initSqlJs({
      locateFile: (file) => {
        return `./${file}`;
      }
    });
    sqlEngine = SQL;

    const savedDbBase64 = safeStorage.getItem('studyhive_sqlite_db');
    if (savedDbBase64) {
      try {
        const binaryString = window.atob(savedDbBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        dbInstance = new SQL.Database(bytes);
      } catch (e) {
        console.error('Failed to load saved SQLite binary, starting fresh:', e);
        dbInstance = new SQL.Database();
      }
    } else {
      dbInstance = new SQL.Database();
    }

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password TEXT,
        progress TEXT DEFAULT '{}',
        bookmarks TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      dbInstance.run("ALTER TABLE users ADD COLUMN email TEXT UNIQUE;");
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      dbInstance.run("ALTER TABLE users ADD COLUMN progress TEXT DEFAULT '{}';");
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      dbInstance.run("ALTER TABLE users ADD COLUMN bookmarks TEXT DEFAULT '[]';");
    } catch (e) {
      // Ignore if column already exists
    }

    // Insert default admin user if not exists
    const stmt = dbInstance.prepare("SELECT COUNT(*) as count FROM users WHERE username = 'admin'");
    if (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.count === 0) {
        dbInstance.run("INSERT INTO users (username, email, password) VALUES ('admin', 'admin@studyhive.com', 'admin')");
        saveDbState();
      }
    }
    stmt.free();

    return dbInstance;
  } catch (error) {
    console.warn('SQLite (sql.js) WebAssembly failed to initialize (e.g. running via file:// protocol without CORS support). Falling back to mock SQL storage layer.', error);
    dbInstance = createMockSqliteDb();
    return dbInstance;
  }
}

export function saveDbState() {
  if (!dbInstance) return;
  
  try {
    if (dbInstance.export) {
      const binaryData = dbInstance.export();
      let binaryString = '';
      const len = binaryData.byteLength;
      const chunkSize = 8192;
      for (let i = 0; i < len; i += chunkSize) {
        const chunk = binaryData.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, chunk);
      }
      const base64 = window.btoa(binaryString);
      safeStorage.setItem('studyhive_sqlite_db', base64);
    } else if (dbInstance.isMock) {
      dbInstance.save();
    }
  } catch (e) {
    console.error('Failed to save SQLite state:', e);
  }
}

function createMockSqliteDb() {
  let usersList = [];
  try {
    const data = safeStorage.getItem('studyhive_sqlite_mock_users');
    if (data) {
      usersList = JSON.parse(data).map(u => ({
        ...u,
        progress: u.progress || '{}',
        bookmarks: u.bookmarks || '[]'
      }));
    } else {
      usersList = [{ id: 1, username: 'admin', email: 'admin@studyhive.com', password: 'admin', progress: '{}', bookmarks: '[]', created_at: new Date().toISOString() }];
      safeStorage.setItem('studyhive_sqlite_mock_users', JSON.stringify(usersList));
    }
  } catch (e) {
    usersList = [{ id: 1, username: 'admin', email: 'admin@studyhive.com', password: 'admin', progress: '{}', bookmarks: '[]', created_at: new Date().toISOString() }];
  }

  return {
    isMock: true,
    save() {
      safeStorage.setItem('studyhive_sqlite_mock_users', JSON.stringify(usersList));
    },
    run(query, params = []) {
      const normalized = query.trim().toLowerCase();
      if (normalized.startsWith('insert into users')) {
        let username = '';
        let email = '';
        let password = '';
        if (params && params.length >= 3) {
          username = params[0];
          email = params[1];
          password = params[2];
        } else if (params && params.length === 2) {
           // fallback if 2 params
           username = params[0];
           password = params[1];
        } else {
          const match = query.match(/values\s*\(\s*['"](.*?)['"]\s*,\s*['"](.*?)['"]\s*(?:,\s*['"](.*?)['"])?\s*\)/i);
          if (match) {
            username = match[1];
            if (match[3]) {
               email = match[2];
               password = match[3];
            } else {
               password = match[2];
            }
          }
        }
        if (username) {
          const exists = usersList.some(u => u.username.toLowerCase() === username.toLowerCase() || (email && u.email && u.email.toLowerCase() === email.toLowerCase()));
          if (exists) {
            throw new Error('UNIQUE constraint failed: users.username or users.email');
          }
          usersList.push({
            id: usersList.length + 1,
            username,
            email,
            password,
            progress: params[3] || '{}',
            bookmarks: params[4] || '[]',
            created_at: new Date().toISOString()
          });
          this.save();
        }
      } else if (normalized.startsWith('update users')) {
        if (params && params.length === 3) {
          const [progress, bookmarks, username] = params;
          const userIdx = usersList.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
          if (userIdx !== -1) {
            usersList[userIdx].progress = progress;
            usersList[userIdx].bookmarks = bookmarks;
            this.save();
          }
        }
      }
    },
    prepare(query) {
      let stmtIndex = 0;
      let filteredRows = [];
      const normalized = query.trim().toLowerCase();

      if (normalized.includes('select count(*)')) {
        const usernameMatch = query.match(/username\s*=\s*(?:\?|['"](.*?)['"])/i);
        let targetUsername = '';
        if (usernameMatch) {
          targetUsername = usernameMatch[1] || '';
        }
        
        filteredRows = [{ count: 0 }];
        
        return {
          bind(params) {
            const username = params[0];
            const count = usersList.filter(u => u.username.toLowerCase() === username.toLowerCase()).length;
            filteredRows = [{ count }];
            return this;
          },
          step() {
            if (stmtIndex < filteredRows.length) {
              stmtIndex++;
              return true;
            }
            return false;
          },
          getAsObject() {
            return filteredRows[stmtIndex - 1] || { count: 0 };
          },
          free() {}
        };
      } else if (normalized.includes('select * from users') || normalized.includes('select id, username, password')) {
        return {
          currentParams: [],
          bind(params) {
            this.currentParams = params;
            return this;
          },
          step() {
            const usernameOrEmail = this.currentParams[0] || '';
            const match = usersList.find(u => 
              u.username.toLowerCase() === usernameOrEmail.toLowerCase() || 
              (u.email && u.email.toLowerCase() === usernameOrEmail.toLowerCase())
            );
            if (match && stmtIndex === 0) {
              filteredRows = [match];
              stmtIndex++;
              return true;
            }
            return false;
          },
          getAsObject() {
            return filteredRows[0] || {};
          },
          free() {}
        };
      }
      
      return {
        bind() { return this; },
        step() { return false; },
        getAsObject() { return {}; },
        free() {}
      };
    }
  };
}
