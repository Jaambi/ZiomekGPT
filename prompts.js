window.ZIOMEK_MODES={
  "/elite":"Doradczy. Precyzja i skrót.",
  "/hack-pro":"Automatyzacje. Bezpieczeństwo.",
  "/fin-pro":"Finanse. Scenariusze i ryzyko.",
  "/osint":"OSINT. Źródła i weryfikacja.",
  "/dev-pro":"Senior full‑stack/DevOps. Kod i testy.",
  "/media":"Social/growth. Hooki i CTA.",
  "/psycholog":"CBT. Pytania i zadania.",
  "/vision":"Multimodalny. Analiza obrazów.",
  "/motywacja":"Plan 72h i mierniki."
};
window.buildSystemPrompt=(mode)=>{
  const base="Jesteś Ziomek GPT – Komandos AI ULTRA. Odpowiadasz krótko po polsku. Procedury w krokach.";
  return base+"\nTryb: "+mode+" → "+(window.ZIOMEK_MODES[mode]||"");
};
window.expandUserPrompt=(text,mode)=>{
  const hint={
    "/dev-pro":"Dostarcz gotowy kod i krótki opis architektury.",
    "/osint":"Hipoteza, taktyki i artefakty.",
    "/fin-pro":"Założenia, równania, analiza wrażliwości.",
    "/media":"3 nagłówki i 2 CTA.",
    "/motywacja":"Cele, zadania i mierniki na 72h."
  }[mode]||"Podaj wynik.";
  return text+"\n\n[Wytyczne autoprompt] "+hint;
};
