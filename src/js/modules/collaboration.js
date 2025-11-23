// Team Collaboration Module
export function initializeCollaboration() {
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-message');
  const teamMembersList = document.getElementById('team-members-list');

  let messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
  let teamMembers = JSON.parse(localStorage.getItem('teamMembers')) || getDefaultTeamMembers();

  function getDefaultTeamMembers() {
    return [
      { id: 1, name: 'Alice Johnson', status: 'online', role: 'Supervisor' },
      { id: 2, name: 'Bob Smith', status: 'online', role: 'Agent' },
      { id: 3, name: 'Carol Davis', status: 'away', role: 'Agent' },
      { id: 4, name: 'David Wilson', status: 'offline', role: 'Agent' }
    ];
  }

  function sendMessage() {
    const content = chatInput.value.trim();
    if (!content) return;

    const message = {
      id: Date.now(),
      sender: 'Current User', // In real app, get from auth
      content,
      timestamp: new Date()
    };

    messages.push(message);
    localStorage.setItem('chatMessages', JSON.stringify(messages));

    chatInput.value = '';
    updateChat();
  }

  function updateChat() {
    chatMessages.innerHTML = '';

    messages.slice(-50).forEach(message => {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message';
      messageDiv.innerHTML = `
        <div class="message-header">
          <strong>${message.sender}</strong>
          <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="message-content">${message.content}</div>
      `;
      chatMessages.appendChild(messageDiv);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function updateTeamMembers() {
    teamMembersList.innerHTML = '';

    teamMembers.forEach(member => {
      const li = document.createElement('li');
      li.className = `team-member ${member.status}`;
      li.innerHTML = `
        <div class="member-info">
          <span class="member-name">${member.name}</span>
          <span class="member-role">${member.role}</span>
        </div>
        <span class="member-status">${member.status}</span>
      `;
      teamMembersList.appendChild(li);
    });
  }

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  updateChat();
  updateTeamMembers();

  // Simulate real-time updates (in real app, use WebSocket)
  setInterval(() => {
    // Randomly update member status
    if (Math.random() < 0.1) {
      const member = teamMembers[Math.floor(Math.random() * teamMembers.length)];
      const statuses = ['online', 'away', 'offline'];
      member.status = statuses[Math.floor(Math.random() * statuses.length)];
      localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
      updateTeamMembers();
    }
  }, 10000);
}