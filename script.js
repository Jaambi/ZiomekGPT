document.addEventListener('DOMContentLoaded', () => {
  // Status banner
  const status = document.createElement('div');
  status.id = 'status';
  status.textContent = 'Sprawdzam status...';
  document.body.appendChild(status);
  (async () => {
    try{
      const r = await fetch('/.netlify/functions/health');
      if(!r.ok) throw new Error('HTTP '+r.status);
      const j = await r.json();
      status.textContent = 'OK • model: '+j.model+(j.openai_key_present?' • KEY ✓':' • KEY ✗');
      status.className = 'ok';
    }catch(e){
      status.textContent = 'BŁĄD zdrowia API';
      status.className = 'err';
    }
  })();

  const form = document.getElementById('chat-form');
  const temp = document.getElementById('temp');
  const maxtok = document.getElementById('maxtok');
  const input = document.getElementById('message');
  const messages = document.getElementById('messages');
  const sendButton = document.getElementById('send-button');

  function addMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    const senderSpan = document.createElement('span');
    senderSpan.className = 'sender';
    senderSpan.textContent = `${sender}:`;
    msgDiv.appendChild(senderSpan);
    const textSpan = document.createElement('span');
    textSpan.textContent = ` ${text}`;
    msgDiv.appendChild(textSpan);
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userText = input.value.trim();
    if (!userText) return;
    addMessage('Ty', userText);
    input.value = '';
    sendButton.disabled = true;
    try {
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        addMessage('Błąd', errorData.error || 'Nieznany błąd');
      } else {
        const data = await response.json();
        addMessage('AI', data.reply);
      }
    } catch (err) {
      addMessage('Błąd', err.message || err.toString());
    } finally {
      sendButton.disabled = false;
    }
  });
});