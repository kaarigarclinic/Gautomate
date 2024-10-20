let authToken = null;
let userName = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Gautomate extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  openGautomateWindow();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "_execute_action") {
    openGautomateWindow();
  }
});

function openGautomateWindow() {
  const width = 600;
  const height = 500;

  chrome.windows.getAll({ windowTypes: ['normal'] }, (windows) => {
    if (windows.length > 0) {
      const currentWindow = windows[0];
      const left = Math.round((currentWindow.width - width) / 2 + currentWindow.left);
      const top = Math.round((currentWindow.height - height) / 2 + currentWindow.top);

      chrome.windows.create({
        url: chrome.runtime.getURL("main.html"),
        type: "popup",
        width: width,
        height: height,
        left: left,
        top: top
      });
    } else {
      // Fallback if no windows are found
      chrome.windows.create({
        url: chrome.runtime.getURL("main.html"),
        type: "popup",
        width: width,
        height: height
      });
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);
  if (request.action === 'signIn') {
    console.log('Sign-in action received');
    signIn().then(sendResponse).catch(error => {
      console.error('Sign-in error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'signOut') {
    signOut().then(sendResponse).catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'checkAuthStatus') {
    checkAuthStatus().then(sendResponse).catch(error => sendResponse({ isSignedIn: false, error: error.message }));
    return true;
  } else if (request.action === 'getAuthToken') {
    getAuthToken().then(sendResponse).catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

function signIn() {
  console.log('signIn function called');
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      console.log('getAuthToken callback received', token ? 'with token' : 'without token');
      if (chrome.runtime.lastError) {
        console.error('getAuthToken error:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else if (!token) {
        console.error('No token received');
        reject(new Error('No token received'));
      } else {
        authToken = token;
        fetchUserInfo(token).then(userInfo => {
          console.log('User info fetched:', userInfo);
          userName = userInfo.name;
          resolve({ success: true, user: { name: userName, email: userInfo.email } });
        }).catch(error => {
          console.error('Error fetching user info:', error);
          reject(error);
        });
      }
    });
  });
}

function signOut() {
  return new Promise((resolve, reject) => {
    if (!authToken) {
      resolve({ success: true });
      return;
    }
    chrome.identity.removeCachedAuthToken({ token: authToken }, function() {
      authToken = null;
      userName = null;
      resolve({ success: true });
    });
  });
}

function getAuthToken() {
  return new Promise((resolve, reject) => {
    if (authToken) {
      resolve({ token: authToken });
    } else {
      chrome.identity.getAuthToken({ interactive: false }, function(token) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          authToken = token;
          resolve({ token: authToken });
        }
      });
    }
  });
}

function checkAuthStatus() {
  return new Promise((resolve, reject) => {
    if (authToken && userName) {
      resolve({ isSignedIn: true, user: { name: userName } });
    } else {
      chrome.identity.getAuthToken({ interactive: false }, function(token) {
        if (chrome.runtime.lastError) {
          resolve({ isSignedIn: false });
        } else {
          authToken = token;
          fetchUserInfo(token).then(userInfo => {
            userName = userInfo.name;
            resolve({ isSignedIn: true, user: { name: userName } });
          }).catch(() => resolve({ isSignedIn: false }));
        }
      });
    }
  });
}

function fetchUserInfo(token) {
  return fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then(response => response.json());
}