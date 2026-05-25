import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeStorage } from '../utils/safeStorage';
import { getSqliteDb, saveDbState } from '../utils/sqliteDb';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user session already exists
    const storedUser = safeStorage.getItem('studyhive_active_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    }
    
    // Pre-initialize SQLite database to make sure tables/admin are set up
    getSqliteDb().then(() => {
      setLoading(false);
    }).catch(err => {
      console.error('Failed to pre-initialize SQLite:', err);
      setLoading(false);
    });
  }, []);

  const login = async (usernameOrEmail, password) => {
    try {
      const db = await getSqliteDb();
      const stmt = db.prepare("SELECT * FROM users WHERE username = ? OR email = ?");
      stmt.bind([usernameOrEmail, usernameOrEmail]);
      let userRow = null;
      if (stmt.step()) {
        userRow = stmt.getAsObject();
      }
      stmt.free();

      if (userRow && userRow.password === password) {
        const activeUser = { 
          username: userRow.username, 
          email: userRow.email,
          progress: JSON.parse(userRow.progress || '{}'),
          bookmarks: JSON.parse(userRow.bookmarks || '[]')
        };
        safeStorage.setItem('studyhive_active_user', JSON.stringify(activeUser));
        setUser(activeUser);
        return { success: true };
      } else {
        return { success: false, message: 'Invalid credentials' };
      }
    } catch (e) {
      console.error('SQL Login error:', e);
      return { success: false, message: 'Database connection or query error' };
    }
  };

  const register = async (username, email, password) => {
    if (!username || !email || !password) {
      return { success: false, message: 'All fields are required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Please enter a valid email address' };
    }
    if (username.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters long' };
    }
    if (password.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long' };
    }

    try {
      const db = await getSqliteDb();
      
      // Check if user exists
      const stmt = db.prepare("SELECT COUNT(*) as count FROM users WHERE username = ? OR email = ?");
      stmt.bind([username, email]);
      let count = 0;
      if (stmt.step()) {
        count = stmt.getAsObject().count;
      }
      stmt.free();

      if (count > 0) {
        return { success: false, message: 'Username or email is already taken' };
      }

      // Insert new user record
      db.run("INSERT INTO users (username, email, password, progress, bookmarks) VALUES (?, ?, ?, ?, ?)", [username, email, password, '{}', '[]']);
      saveDbState();
      
      // Automatically log in
      const activeUser = { 
        username, 
        email,
        progress: {},
        bookmarks: []
      };
      safeStorage.setItem('studyhive_active_user', JSON.stringify(activeUser));
      setUser(activeUser);
      
      return { success: true };
    } catch (e) {
      console.error('SQL Register error:', e);
      return { success: false, message: 'Database insertion error' };
    }
  };

  const socialLogin = async (provider) => {
    try {
      const db = await getSqliteDb();
      const simulatedEmail = `${provider}_user@${provider}.com`;
      const simulatedUsername = `${provider}_user`;
      
      // Check if exists
      const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
      stmt.bind([simulatedEmail]);
      let userRow = null;
      if (stmt.step()) {
        userRow = stmt.getAsObject();
      }
      stmt.free();

      if (!userRow) {
        // register
        db.run("INSERT INTO users (username, email, password, progress, bookmarks) VALUES (?, ?, ?, ?, ?)", [simulatedUsername, simulatedEmail, 'social_auth_placeholder', '{}', '[]']);
        saveDbState();
        userRow = {
          username: simulatedUsername,
          email: simulatedEmail,
          progress: '{}',
          bookmarks: '[]'
        };
      }
      
      const activeUser = { 
        username: userRow.username || simulatedUsername, 
        email: userRow.email || simulatedEmail, 
        provider,
        progress: JSON.parse(userRow.progress || '{}'),
        bookmarks: JSON.parse(userRow.bookmarks || '[]')
      };
      safeStorage.setItem('studyhive_active_user', JSON.stringify(activeUser));
      setUser(activeUser);
      return { success: true };
    } catch (e) {
      console.error('Social Login error:', e);
      return { success: false, message: 'Social login failed' };
    }
  };

  const logout = () => {
    safeStorage.removeItem('studyhive_active_user');
    setUser(null);
  };

  const updateUserMetrics = async (progress, bookmarks) => {
    if (!user) return;
    try {
      const db = await getSqliteDb();
      const progressStr = JSON.stringify(progress);
      const bookmarksStr = JSON.stringify(bookmarks);
      
      db.run("UPDATE users SET progress = ?, bookmarks = ? WHERE username = ?", [progressStr, bookmarksStr, user.username]);
      saveDbState();
      
      const updatedUser = { ...user, progress, bookmarks };
      safeStorage.setItem('studyhive_active_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (e) {
      console.error('SQL Update metrics error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, socialLogin, logout, updateUserMetrics }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

