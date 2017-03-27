import storage from './storage.js';

// Cache DOM
let $authMsg = $("#auth-msg");
let $authBtn = $authMsg.find("#auth-btn");

// Event handlers
$authBtn.on("click", () => {attemptAuthorize(true)});

// Attempt to authorize immediately
attemptAuthorize(false);

function attemptAuthorize(interactive) {
  chrome.identity.getAuthToken({'interactive': interactive}, checkToken);
}

function checkToken(token) {
  if (chrome.runtime.lastError || token === undefined) {
    $authMsg.fadeIn(800);
  } else {
    authorized(token);
  }
}

function authorized(token) {
  $authMsg.hide();
  storage.setStorage('token', token).then(function() {
    $(document).trigger("authorized");
  });
}
