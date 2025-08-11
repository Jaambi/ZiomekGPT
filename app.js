const chatEl=document.getElementById('chat');
const userInput=document.getElementById('userInput');
const sendBtn=document.getElementById('sendBtn');
const imgBtn=document.getElementById('imgBtn');
const micBtn=document.getElementById('micBtn');
const clearBtn=document.getElementById('clearBtn');
const modeEl=document.getElementById('mode');
const ttsToggle=document.getElementById('ttsToggle');

function escapeHtml(s){return (s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function addMsg(role,text){
  const div=document.createElement('div');
  div.className='message '+(role==='user'?'user':'bot');
  div.innerHTML=`<div class="meta">${role==='user'?'Ty':'Ziomek'}</div>`+escapeHtml(text||'');
  chatEl.appendChild(div); chatEl.scrollTop=chatEl.scrollHeight;
}
function addImg(url){
  const div=document.createElement('div'); div.className='message bot';
  div.innerHTML=`<div class="meta">Ziomek</div><img src="${url}" alt="image" style="max-width:100%;border-radius:10px;border:1px solid #d0d0d0">`;
  chatEl.appendChild(div); chatEl.scrollTop=chatEl.scrollHeight;
}

async function sendChat(){
  const raw=userInput.value.trim();
  if(!raw) return;
  const mode=modeEl.value;
  const system=window.buildSystemPrompt(mode);
  const text=window.expandUserPrompt(raw,mode);
  addMsg('user',raw); userInput.value='';
  try{
    const res=await fetch('/api/chat',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ system, text, mode })
    });
    if(!res.ok){ throw new Error(await res.text()); }
    const data=await res.json();
    addMsg('bot',data.text||'[brak odpowiedzi]');
    if(ttsToggle && ttsToggle.checked){ speak(data.text||''); }
  }catch(err){ addMsg('bot','Błąd: '+err.message); }
}

async function genImage(){
  const raw=userInput.value.trim()||'Futurystyczny mentor biznesu, realistyczny portret, wysoki kontrast';
  addMsg('user','[Obraz] '+raw);
  try{
    const res=await fetch('/api/image',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ prompt: raw, size:'1024x1024' })
    });
    if(!res.ok){ throw new Error(await res.text()); }
    const data=await res.json();
    if(data.url) addImg(data.url); else addMsg('bot','Błąd generacji obrazu');
  }catch(err){ addMsg('bot','Błąd: '+err.message); }
}

async function speak(text){
  try{
    if('speechSynthesis' in window){
      const u=new SpeechSynthesisUtterance(text); u.lang='pl-PL'; speechSynthesis.speak(u); return;
    }
    const res=await fetch('/api/tts',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ text }) });
    if(!res.ok) return;
    const buf=await res.arrayBuffer();
    const url=URL.createObjectURL(new Blob([buf],{type:'audio/mpeg'}));
    new Audio(url).play();
  }catch(_){}
}

let recorder=null, chunks=[];
async function toggleMic(){
  if(recorder && recorder.state==='recording'){ recorder.stop(); return; }
  const stream=await navigator.mediaDevices.getUserMedia({ audio:true });
  recorder=new MediaRecorder(stream); chunks=[];
  recorder.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
  recorder.onstop=async()=>{
    const blob=new Blob(chunks,{type:'audio/webm'});
    const buf=await blob.arrayBuffer();
    const res=await fetch('/api/transcribe',{ method:'POST', body: buf });
    const data=await res.json().catch(()=>({}));
    if(data && data.text){ userInput.value=(userInput.value?userInput.value+' ':'')+data.text; }
  };
  recorder.start();
}

sendBtn.addEventListener('click',sendChat);
if (imgBtn) imgBtn.addEventListener('click',genImage);
if (micBtn) micBtn.addEventListener('click',toggleMic);
if (clearBtn) clearBtn.addEventListener('click',()=> chatEl.innerHTML='');
userInput.addEventListener('keydown',e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendChat(); } });
