const log = document.getElementById('log');
const q = document.getElementById('q');
const send = document.getElementById('send');

function write(line, cls='sys'){
  const div=document.createElement('div');
  div.className=cls;
  div.textContent=line;
  log.appendChild(div);
  log.scrollTop=log.scrollHeight;
}

async function ask(){
  const msg = q.value.trim();
  if(!msg) return;
  write('Ty: ' + msg, 'you');
  q.value='';
  try{
    const res = await fetch('/api/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message: msg })
    });
    if(!res.ok){
      const text = await res.text();
      write('Błąd API ' + res.status + ': ' + text, 'sys');
      return;
    }
    const data = await res.json();
    write('Ziomek: ' + (data.reply || '[brak odpowiedzi]'), 'ai');
  }catch(e){
    write('Błąd sieci: ' + e.message, 'sys');
  }
}

send.onclick = ask;
q.addEventListener('keydown', e=>{ if(e.key==='Enter') ask(); });

write('Gotowe. Wpisz wiadomość i kliknij Wyślij.','sys');
