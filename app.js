import { buildSystemPrompt, expandUserPrompt } from '/prompts.js';

const el = (q) => document.querySelector(q);
const messagesEl = el('#messages');
const promptEl = el('#prompt');
const modeEl = el('#mode');
const ttsToggle = el('#ttsToggle');
const micBtn = el('#micBtn');
const imgBtn = el('#imgBtn');
const clearBtn = el('#clearBtn');
const imageFile = el('#imageFile');
const installBtn = el('#installBtn');
const pwaStatus = el('#pwaStatus');

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  installBtn.hidden = true;
});

function addMsg(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = `<div class="meta">${role === 'user' ? 'Ty' : 'Ziomek'}</div>${sanitize(text)}`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
function sanitize(s) {
  return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}

async function chat(prompt, opts = {}) {
  const mode = modeEl.value;
  const sys = buildSystemPrompt(mode);
  const user = expandUserPrompt(prompt, mode);

  const form = new FormData();
  form.append('route', 'chat');
  form.append('mode', mode);
  form.append('system', sys);
  form.append('user', user);

  if (opts.imageBlob) {
    form.append('image', opts.imageBlob, 'image.png');
  }

  const r = await fetch('/api/chat', { method:'POST', body: form });
  if (!r.ok) throw new Error('Błąd API');
  const data = await r.json();
  return data;
}

async function generateImage(prompt) {
  const r = await fetch('/api/image', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ prompt })
  });
  if (!r.ok) throw new Error('Błąd obrazów');
  const data = await r.json();
  return data; // { url }
}

async function speak(text) {
  if (!ttsToggle.checked) return;
  try {
    // Client TTS
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pl-PL';
      window.speechSynthesis.speak(u);
      return;
    }
  } catch {}
  // Server TTS
  const r = await fetch('/api/tts', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ text })
  });
  const { audioBase64 } = await r.json();
  const a = new Audio('data:audio/mp3;base64,'+audioBase64);
  a.play();
}

let recording = false;
let mediaRecorder, audioChunks = [];
async function toggleMic() {
  if (recording) {
    mediaRecorder.stop();
    recording = false;
    micBtn.textContent = '🎙️';
    return;
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];
  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  mediaRecorder.onstop = async () => {
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    const form = new FormData();
    form.append('audio', blob, 'speech.webm');
    const r = await fetch('/api/transcribe', { method:'POST', body: form });
    const { text } = await r.json();
    promptEl.value = (promptEl.value ? promptEl.value + ' ' : '') + text;
  };
  mediaRecorder.start();
  recording = true;
  micBtn.textContent = '⏹️';
}

micBtn.addEventListener('click', toggleMic);
imageFile.addEventListener('change', () => {
  // preview optional
});

clearBtn.addEventListener('click', () => {
  messagesEl.innerHTML = '';
});

el('#promptForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = promptEl.value.trim();
  if (!input) return;
  const file = imageFile.files?.[0];
  addMsg('user', input);
  promptEl.value = '';
  try {
    const res = await chat(input, { imageBlob: file });
    addMsg('bot', res.text);
    speak(res.text);
    if (res.visionNotes) addMsg('bot', 'Vision: ' + res.visionNotes);
  } catch (err) {
    addMsg('bot', 'Błąd: ' + err.message);
  }
});

imgBtn.addEventListener('click', async () => {
  const input = promptEl.value.trim() || 'Mroczny portret futurystycznego mentora biznesu';
  addMsg('user', '[Obraz] ' + input);
  try {
    const res = await generateImage(input);
    const div = document.createElement('div');
    div.className = 'msg bot';
    div.innerHTML = `<div class="meta">Ziomek</div><img src="${res.url}" alt="image" style="max-width:100%;border-radius:12px;border:1px solid #202030">`;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch (e) {
    addMsg('bot', 'Błąd: ' + e.message);
  }
});

// SW status
navigator.serviceWorker?.addEventListener('message', e => {
  if (e.data && e.data.type === 'SW_STATUS') {
    pwaStatus.textContent = e.data.online ? 'online' : 'offline';
  }
});
