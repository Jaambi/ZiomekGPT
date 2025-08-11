const chatContainer = document.getElementById('chat');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const imgBtn = document.getElementById('imgBtn');
const micBtn = document.getElementById('micBtn');

function appendMessage(content, sender) {
    const div = document.createElement('div');
    div.className = 'message ' + sender;
    div.textContent = content;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    appendMessage(text, 'user');
    userInput.value = '';
    const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    appendMessage(data.message || 'Brak odpowiedzi', 'bot');
}

sendBtn.onclick = sendMessage;
