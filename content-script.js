// This script will be injected into web pages

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageInfo') {
    // Get page information safely
    const pageInfo = {
      title: document.title,
      url: window.location.href,
    };
    sendResponse(pageInfo);
  }
});

// Avoid exposing sensitive information to the page
window.gautomate = {
  getPageInfo: () => {
    return {
      title: document.title,
      url: window.location.href,
    };
  }
};