# ZiomekGPT – Fix2
- `OPENAI_API_KEY` + `NODE_VERSION=20` w Netlify.
- Deploy, potem testy w konsoli:
  1) fetch('/api/').then(r=>r.json())
  2) fetch('/.netlify/functions/ziomek/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:'test',text:'Powiedz cześć'})}).then(r=>r.json())
  3) fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:'test',text:'Powiedz cześć'})}).then(r=>r.json())
