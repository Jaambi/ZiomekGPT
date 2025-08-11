const log = document.getElementById('log');
const q = document.getElementById('q');
const send = document.getElementById('send');
const clearBtn = document.getElementById('clear');
const modeSel = document.getElementById('mode');
const temp = document.getElementById('temp');
const tempVal = document.getElementById('tempVal');
const maxTok = document.getElementById('max');

// Restore prefs
(function(){
  const saved = JSON.parse(localStorage.getItem('ziomek:prefs')||'{}');
  if(saved.mode) modeSel.value = saved.mode;
  if(saved.temp!=null) { temp.value = saved.temp; tempVal.textContent = saved.temp; }
  if(saved.max) maxTok.value = saved.max;
})();

function write(line, cls='sys'){
  const div=document.createElement('div');
  div.className=cls;
  div.textContent=line;
  log.appendChild(div);
  log.scrollTop=log.scrollHeight;
}
temp.addEventListener('input', ()=> tempVal.textContent = temp.value);
clearBtn.onclick = ()=>{ log.innerHTML=''; write('Czyszczenie historii.','sys'); };

async function ask(){
  const msg = q.value.trim();
  if(!msg) return;
  const payload = {
    message: msg,
    mode: modeSel.value,
    temperature: Number(temp.value),
    max_tokens: Number(maxTok.value)
  };
  // Save prefs
  localStorage.setItem('ziomek:prefs', JSON.stringify({mode:payload.mode,temp:payload.temperature,max:payload.max_tokens}));
  write('Ty: ' + msg, 'you');
  q.value='';
  try{
    const res = await fetch('/api/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
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
q.addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey) ask(); });

write('Gotowe. Wpisz wiadomość i kliknij Wyślij.','sys');
