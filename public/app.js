async function loadSystemPrompt(){
  const el = document.getElementById('systemPrompt');
  try{
    const txt = await fetch('/system_prompt.txt').then(r=>r.text());
    el.textContent = txt;
  }catch(e){
    el.textContent = 'Nie udało się wczytać system_prompt.txt';
  }
}
loadSystemPrompt();

const messagesEl = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');

function addMsg(role, text){
  const div = document.createElement('div');
  div.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const text = input.value.trim();
  if(!text) return;
  addMsg('user', text);
  input.value='';
  form.querySelector('button').disabled = true;

  try{
    const payload = { messages: [{role:'user', content:text}] };
    const res = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Błąd');
    addMsg('assistant', data.reply || '(brak odpowiedzi)');
  }catch(err){
    addMsg('assistant', 'Błąd: ' + err.message);
  }finally{
    form.querySelector('button').disabled = false;
  }
});
