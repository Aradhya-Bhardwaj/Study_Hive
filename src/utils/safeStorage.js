export const safeStorage = (function() {
  let isSupported = false;
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    isSupported = true;
  } catch (e) {
    isSupported = false;
  }
  
  let memoryStorage = {};
  
  if (!isSupported) {
    try {
      if (window.name && window.name.indexOf('{') === 0) {
        memoryStorage = JSON.parse(window.name);
      }
    } catch (e) {
      memoryStorage = {};
    }
  }

  function saveMemory() {
    if (!isSupported) {
      try {
        window.name = JSON.stringify(memoryStorage);
      } catch (e) {}
    }
  }

  return {
    getItem(key) {
      if (isSupported) {
        try {
          return localStorage.getItem(key);
        } catch (e) {}
      }
      return memoryStorage.hasOwnProperty(key) ? memoryStorage[key] : null;
    },
    setItem(key, value) {
      if (isSupported) {
        try {
          localStorage.setItem(key, value);
          return;
        } catch (e) {}
      }
      memoryStorage[key] = String(value);
      saveMemory();
    },
    removeItem(key) {
      if (isSupported) {
        try {
          localStorage.removeItem(key);
          return;
        } catch (e) {}
      }
      delete memoryStorage[key];
      saveMemory();
    }
  };
})();
