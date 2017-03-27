let storage = {
  getStorage: function() {
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get(function(items) {
        resolve(items);
      });
    });
  },
  setStorage: function(key, value) {
    return new Promise(function(resolve, reject) {
      let obj = {};
      obj[key] = value;
      chrome.storage.local.set(obj, function() { resolve(); });
    });
  },
  removeStorage: function(key) {
    return new Promise(function(resolve, reject) {
      chrome.storage.local.remove(key, function() { resolve(); });
    });
  }
};

module.exports = storage;
