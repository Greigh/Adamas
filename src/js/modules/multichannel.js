// Multi-Channel Support Module
export function initializeMultiChannel() {
  const channelTabs = document.querySelectorAll('.channel-tab');
  const channelContents = document.querySelectorAll('.channel-content');

  channelTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      channelTabs.forEach(t => t.classList.remove('active'));
      channelContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(tab.dataset.channel + '-channel').classList.add('active');
    });
  });

  // Initialize different channel interfaces
  initializePhoneChannel();
  initializeChatChannel();
  initializeEmailChannel();
  initializeSocialChannel();
}

function initializePhoneChannel() {
  // Phone channel is already handled by existing call logging
  const phoneChannel = document.getElementById('phone-channel');
  phoneChannel.innerHTML = `
    <div class="phone-interface">
      <div class="active-call">
        <h4>Active Call</h4>
        <div id="active-call-info">No active call</div>
      </div>
      <div class="call-controls">
        <button class="button" id="answer-call">Answer</button>
        <button class="button" id="hold-call">Hold</button>
        <button class="button" id="transfer-call">Transfer</button>
        <button class="button btn-danger" id="end-call">End Call</button>
      </div>
      <div class="recent-calls">
        <h4>Recent Calls</h4>
        <ul id="multichannel-call-list"></ul>
      </div>
    </div>
  `;

  // Add event listeners for call controls
  document.getElementById('answer-call').addEventListener('click', () => {
    document.getElementById('active-call-info').textContent = 'Call answered - Customer on line';
  });

  document.getElementById('hold-call').addEventListener('click', () => {
    document.getElementById('active-call-info').textContent = 'Call on hold';
  });

  document.getElementById('transfer-call').addEventListener('click', () => {
    const extension = prompt('Enter extension to transfer to:');
    if (extension) {
      document.getElementById('active-call-info').textContent = `Call transferred to extension ${extension}`;
    }
  });

  document.getElementById('end-call').addEventListener('click', () => {
    document.getElementById('active-call-info').textContent = 'Call ended';
  });
}

function initializeChatChannel() {
  const chatChannel = document.getElementById('chat-channel');
  chatChannel.innerHTML = `
    <div class="chat-interface">
      <div class="chat-queue">
        <h4>Waiting Chats</h4>
        <ul id="chat-queue"></ul>
      </div>
      <div class="active-chat">
        <h4>Active Chat</h4>
        <div id="chat-messages" class="chat-messages"></div>
        <div class="chat-input-area">
          <input type="text" id="chat-reply" placeholder="Type your reply..." />
          <button class="button" id="send-reply">Send</button>
        </div>
      </div>
      <div class="chat-templates">
        <h4>Quick Replies</h4>
        <div class="template-buttons">
          <button class="button btn-sm" onclick="sendTemplate('greeting')">Greeting</button>
          <button class="button btn-sm" onclick="sendTemplate('closing')">Closing</button>
          <button class="button btn-sm" onclick="sendTemplate('transfer')">Transfer</button>
        </div>
      </div>
    </div>
  `;

  // Mock chat queue
  const chatQueue = document.getElementById('chat-queue');
  chatQueue.innerHTML = `
    <li class="chat-item">Customer A - Waiting 2 min</li>
    <li class="chat-item">Customer B - Waiting 5 min</li>
  `;

  document.getElementById('send-reply').addEventListener('click', () => {
    const reply = document.getElementById('chat-reply').value;
    if (reply.trim()) {
      addChatMessage('Agent', reply);
      document.getElementById('chat-reply').value = '';
    }
  });
}

function initializeEmailChannel() {
  const emailChannel = document.getElementById('email-channel');
  emailChannel.innerHTML = `
    <div class="email-interface">
      <div class="email-inbox">
        <h4>Email Inbox</h4>
        <ul id="email-list">
          <li class="email-item">
            <div class="email-subject">Order Inquiry</div>
            <div class="email-from">customer@example.com</div>
            <div class="email-time">2 hours ago</div>
          </li>
          <li class="email-item">
            <div class="email-subject">Technical Support</div>
            <div class="email-from">user@company.com</div>
            <div class="email-time">4 hours ago</div>
          </li>
        </ul>
      </div>
      <div class="email-composer">
        <h4>Compose Email</h4>
        <input type="email" id="email-to" placeholder="To:" />
        <input type="text" id="email-subject" placeholder="Subject:" />
        <textarea id="email-body" placeholder="Email content..."></textarea>
        <button class="button" id="send-email">Send Email</button>
      </div>
    </div>
  `;

  document.getElementById('send-email').addEventListener('click', () => {
    alert('Email sent! (Demo)');
  });
}

function initializeSocialChannel() {
  const socialChannel = document.getElementById('social-channel');
  socialChannel.innerHTML = `
    <div class="social-interface">
      <div class="social-feeds">
        <h4>Social Media Feeds</h4>
        <div class="social-tabs">
          <button class="social-tab active" data-platform="twitter">Twitter</button>
          <button class="social-tab" data-platform="facebook">Facebook</button>
          <button class="social-tab" data-platform="instagram">Instagram</button>
        </div>
        <div id="social-posts" class="social-posts">
          <div class="social-post">
            <div class="post-author">@customer123</div>
            <div class="post-content">Having issues with my order #12345</div>
            <div class="post-time">1 hour ago</div>
            <button class="button btn-sm" onclick="respondToPost()">Respond</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function addChatMessage(sender, message) {
  const chatMessages = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message';
  messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Template functions
window.sendTemplate = function(type) {
  const templates = {
    greeting: 'Hello! Thank you for contacting us. How can I help you today?',
    closing: 'Thank you for your patience. Is there anything else I can help you with?',
    transfer: 'I\'m transferring you to a specialist who can better assist you.'
  };

  if (templates[type]) {
    addChatMessage('Agent', templates[type]);
  }
};

window.respondToPost = function() {
  alert('Social media response functionality would be implemented here.');
};