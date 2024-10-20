import { executeCommand } from './scripts/commands.js';
import { getSuggestions, getHelpText, enhancedParseCommand } from './scripts/advancednlp.js';

document.addEventListener('DOMContentLoaded', async () => {
  const debugInfo = document.createElement('div');
  debugInfo.id = 'debug-info';
  debugInfo.style.cssText = 'background-color: #f0f0f0; padding: 10px; margin-top: 10px; border: 1px solid #ccc; font-size: 12px;';
  document.body.appendChild(debugInfo);

  function addDebugInfo(message) {
    debugInfo.innerHTML += `${new Date().toISOString()}: ${message}<br>`;
    console.log(message);
  }

  addDebugInfo('DOMContentLoaded event fired');

  const signInButton = document.getElementById('sign-in-button');
  const signOutButton = document.getElementById('sign-out-button');
  const commandContainer = document.getElementById('command-container');
  const commandInput = document.getElementById('command-input');
  const suggestionsContainer = document.getElementById('suggestions-container');
  const responseContainer = document.getElementById('response-container');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');
  const greetingContainer = document.getElementById('greeting-container');

  addDebugInfo('Elements retrieved');

  const showLoading = (show) => {
    loadingIndicator.style.display = show ? 'block' : 'none';
  };

  const showError = (message) => {
    addDebugInfo(`Error: ${message}`);
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
      errorMessage.style.display = 'none';
    }, 5000);
  };

  const updateUI = (user) => {
    addDebugInfo(`Updating UI, user: ${user ? user.name : 'null'}`);
    signInButton.style.display = user ? 'none' : 'block';
    signOutButton.style.display = user ? 'block' : 'none';
    commandContainer.style.display = user ? 'block' : 'none';
    if (user) {
      greetingContainer.textContent = `Hi ${user.name}, what would you like to do?`;
    } else {
      greetingContainer.textContent = '';
    }
  };

  const signIn = () => {
    addDebugInfo('Sign in button clicked');
    showLoading(true);
    chrome.runtime.sendMessage({ action: 'signIn' }, (response) => {
      addDebugInfo(`Sign in response received: ${JSON.stringify(response)}`);
      showLoading(false);
      if (chrome.runtime.lastError) {
        addDebugInfo(`Sign in error: ${chrome.runtime.lastError.message}`);
        showError(`Sign in failed: ${chrome.runtime.lastError.message}`);
      } else if (response && response.success) {
        addDebugInfo('Sign in successful');
        updateUI(response.user);
      } else {
        addDebugInfo('Sign in failed');
        showError('Sign in failed. Please try again.');
      }
    });
  };

  const signOut = () => {
    addDebugInfo('Sign out button clicked');
    showLoading(true);
    chrome.runtime.sendMessage({ action: 'signOut' }, (response) => {
      addDebugInfo(`Sign out response received: ${JSON.stringify(response)}`);
      showLoading(false);
      if (chrome.runtime.lastError) {
        addDebugInfo(`Sign out error: ${chrome.runtime.lastError.message}`);
        showError(`Sign out failed: ${chrome.runtime.lastError.message}`);
      } else if (response && response.success) {
        addDebugInfo('Sign out successful');
        updateUI(null);
      } else {
        addDebugInfo('Sign out failed');
        showError('Sign out failed. Please try again.');
      }
    });
  };

  signInButton.addEventListener('click', signIn);
  signOutButton.addEventListener('click', signOut);

  addDebugInfo('Event listeners added to sign in and sign out buttons');

  commandInput.addEventListener('input', () => {
    const suggestions = getSuggestions(commandInput.value);
    suggestionsContainer.innerHTML = suggestions.map(s => `<div class="suggestion">${s}</div>`).join('');
  });

  suggestionsContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('suggestion')) {
      commandInput.value = event.target.textContent;
      suggestionsContainer.innerHTML = '';
    }
  });

  commandInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      try {
        showLoading(true);
        const parsedCommand = enhancedParseCommand(commandInput.value);
        if (parsedCommand) {
          addDebugInfo(`Executing command: ${parsedCommand.command}`);
          const result = await executeCommand(parsedCommand.command, parsedCommand.args);
          responseContainer.textContent = result;
        } else {
          responseContainer.textContent = "I'm sorry, I didn't understand that command. Type 'help' for a list of available commands.";
        }
        commandInput.value = '';
        suggestionsContainer.innerHTML = '';
      } catch (error) {
        showError(error.message);
      } finally {
        showLoading(false);
      }
    } else if (event.key === 'Escape') {
      window.close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      window.close();
    }
  });

  try {
    addDebugInfo('Checking auth status');
    showLoading(true);
    chrome.runtime.sendMessage({ action: 'checkAuthStatus' }, (response) => {
      addDebugInfo(`Auth status response: ${JSON.stringify(response)}`);
      showLoading(false);
      if (chrome.runtime.lastError) {
        addDebugInfo(`Failed to check auth status: ${chrome.runtime.lastError.message}`);
        showError(`Failed to check auth status: ${chrome.runtime.lastError.message}`);
      } else if (response && response.isSignedIn !== undefined) {
        addDebugInfo(`Auth status checked: ${response.isSignedIn}`);
        updateUI(response.isSignedIn ? response.user : null);
      } else {
        addDebugInfo('Invalid response for auth status check');
        showError('Failed to get user information. Please try refreshing.');
      }
    });
  } catch (error) {
    addDebugInfo(`Error checking auth status: ${error.message}`);
    showError(`Failed to get user information: ${error.message}`);
    showLoading(false);
  }

  addDebugInfo('main.js initialization complete');
});