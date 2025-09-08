// Speech-to-text app with autosave, counters, robust start/stop, pause, and better UX
(() => {
  const els = {
    startStop: document.getElementById('startStopBtn'),
    pause: document.getElementById('pauseBtn'),
    clear: document.getElementById('clearBtn'),
    copy: document.getElementById('copyBtn'),
    download: document.getElementById('downloadBtn'),
    transcript: document.getElementById('transcript'),
    interim: document.getElementById('interim'),
    stopwatch: document.getElementById('stopwatch'),
    language: document.getElementById('language'),
    counters: document.getElementById('counters'),
    recStatus: document.getElementById('recStatus'),
    themeToggle: document.getElementById('themeToggle'),
  };

  // ---------- Theme ----------
  (function initTheme(){
    const saved = localStorage.getItem('stt-theme');
    if(saved === 'light') document.documentElement.classList.add('light');
    if(saved === 'dark') document.documentElement.classList.remove('light'); // dark is default
    els.themeToggle.textContent = document.documentElement.classList.contains('light') ? '🌙' : '☀️';
  })();
  els.themeToggle.addEventListener('click', () => {
    const root = document.documentElement;
    const light = root.classList.toggle('light');
    localStorage.setItem('stt-theme', light ? 'light' : 'dark');
    els.themeToggle.textContent = light ? '🌙' : '☀️';
  });

  // ---------- Populate languages (common set + persist selection) ----------
  const languages = [
    'en-US','en-GB','ru-RU','es-ES','es-MX','fr-FR','de-DE','it-IT','ja-JP','ko-KR','zh-CN','zh-TW','nl-NL','pt-BR',
    'pt-PT','hi-IN','ar-SA','th-TH','tr-TR','da-DK','sv-SE','fi-FI','he-IL','pl-PL','el-GR','hu-HU','nb-NO','cs-CZ',
    'sk-SK','bn-IN','ca-ES','uk-UA','ka-GE'
  ];
  const langFrag = document.createDocumentFragment();
  languages.forEach(code => {
    const opt = document.createElement('option');
    opt.value = code; opt.textContent = code;
    langFrag.appendChild(opt);
  });
  els.language.appendChild(langFrag);
  const savedLang = localStorage.getItem('stt-lang') || 'en-US';
  els.language.value = savedLang;

  // ---------- Autosave load ----------
  const savedText = localStorage.getItem('stt-transcript') || '';
  if(savedText) {
    els.transcript.textContent = savedText;
    updateCounters();
    els.clear.disabled = false;
    els.copy.disabled = false;
    els.download.disabled = savedText.trim().length === 0;
  }

  // ---------- Stopwatch ----------
  let t0 = 0, timerId = null, elapsedMs = 0;
  function fmt(n){ return n.toString().padStart(2, '0'); }
  function startTimer(){
    if(timerId) return;
    t0 = performance.now() - elapsedMs;
    timerId = setInterval(() => {
      const t = performance.now() - t0;
      const sec = Math.floor(t/1000);
      const h = Math.floor(sec/3600);
      const m = Math.floor((sec%3600)/60);
      const s = sec%60;
      els.stopwatch.textContent = `${fmt(h)}:${fmt(m)}:${fmt(s)}`;
    }, 250);
  }
  function stopTimer(){
    if(timerId){ clearInterval(timerId); timerId = null; }
    elapsedMs = performance.now() - t0;
  }
  function resetTimer(){
    if(timerId){ clearInterval(timerId); timerId = null; }
    elapsedMs = 0;
    els.stopwatch.textContent = '00:00:00';
  }

  // ---------- Speech Recognition ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isRecording = false;
  let isPaused = false;
  let restartOnEnd = false;

  function setStatus(txt, recording=false){
    els.recStatus.textContent = txt;
    els.recStatus.className = `pill ${recording ? 'recording' : 'idle'}`;
  }

  if(!SR){
    setStatus('Unsupported');
    els.startStop.disabled = true;
    els.pause.disabled = true;
    console.warn('Web Speech API is not supported in this browser.');
  } else {
    recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = savedLang;

    recognition.onresult = (evt) => {
      let interim = '';
      for(let i = evt.resultIndex; i < evt.results.length; i++){
        const res = evt.results[i];
        const text = res[0].transcript;
        if(res.isFinal){
          appendText(text);
        } else {
          interim += text;
        }
      }
      els.interim.textContent = interim;
    };

    recognition.onend = () => {
      setStatus('Idle');
      if(isRecording && restartOnEnd && !isPaused){
        try { recognition.start(); setStatus('Listening…', true); } catch(e){ /* ignore */ }
      }
    };

    recognition.onerror = (e) => {
      console.error('recognition error', e);
      // Auto-recover on "no-speech" or "network" or "aborted"
      if(['no-speech','aborted','network'].includes(e.error)){
        if(isRecording && !isPaused){
          try { recognition.start(); setStatus('Listening…', true); } catch(err){ /* ignore */ }
        }
      } else {
        setStatus(`Error: ${e.error}`);
      }
    };
  }

  function appendText(t){
    // Simple end-punctuation if missing
    const trimmed = t.trim();
    const needsDot = trimmed && !/[.!?…]$/.test(trimmed);
    const finalText = trimmed + (needsDot ? '.' : '');
    const sep = els.transcript.textContent.endsWith('\n') || els.transcript.textContent.length === 0 ? '' : ' ';
    els.transcript.textContent += (sep + finalText);
    els.interim.textContent = '';
    autosave();
    updateCounters();
    els.clear.disabled = els.transcript.textContent.trim().length === 0;
    els.copy.disabled = els.clear.disabled;
    els.download.disabled = els.clear.disabled;
  }

  function autosave(){
    localStorage.setItem('stt-transcript', els.transcript.textContent);
  }

  function updateCounters(){
    const t = els.transcript.textContent;
    const words = t.trim() ? t.trim().split(/\s+/).length : 0;
    const chars = t.length;
    els.counters.textContent = `${words} words • ${chars} chars`;
  }

  els.transcript.addEventListener('input', () => {
    autosave();
    updateCounters();
    const empty = els.transcript.textContent.trim().length === 0;
    els.clear.disabled = empty;
    els.copy.disabled = empty;
    els.download.disabled = empty;
  });

  // ---------- Controls ----------
  function start(){
    if(!recognition || isRecording) return;
    recognition.lang = els.language.value;
    restartOnEnd = true;
    isPaused = false;
    try{
      recognition.start();
      isRecording = true;
      startTimer();
      setStatus('Listening…', true);
      els.startStop.textContent = 'Stop';
      els.pause.disabled = false;
      els.clear.disabled = false;
      els.copy.disabled = false;
    }catch(e){
      setStatus('Permission denied?');
      console.warn(e);
    }
  }

  function stop(){
    if(!recognition || !isRecording) return;
    restartOnEnd = false;
    isRecording = false;
    isPaused = false;
    try { recognition.stop(); } catch(e){/* ignore */}
    stopTimer();
    setStatus('Stopped');
    els.startStop.textContent = 'Start';
    els.pause.disabled = true;
  }

  function pause(){
    if(!recognition || !isRecording || isPaused) return;
    isPaused = true;
    restartOnEnd = false;
    try { recognition.stop(); } catch(e){/* ignore */}
    stopTimer();
    setStatus('Paused');
    els.pause.disabled = true;
    els.startStop.textContent = 'Resume';
  }

  function resume(){
    if(!recognition || !isRecording || !isPaused) return;
    isPaused = false;
    restartOnEnd = true;
    try { recognition.start(); setStatus('Listening…', true); } catch(e){/* ignore */}
    startTimer();
    els.pause.disabled = false;
    els.startStop.textContent = 'Stop';
  }

  els.startStop.addEventListener('click', () => {
    if(!isRecording) {
      start();
    } else {
      if(isPaused) resume(); else stop();
    }
  });

  els.pause.addEventListener('click', () => {
    if(isPaused) resume(); else pause();
  });

  els.language.addEventListener('change', () => {
    localStorage.setItem('stt-lang', els.language.value);
    if(isRecording && !isPaused && recognition){
      recognition.lang = els.language.value;
    }
  });

  els.clear.addEventListener('click', () => {
    if(confirm('Clear transcript?')){
      els.transcript.textContent = '';
      els.interim.textContent = '';
      localStorage.removeItem('stt-transcript');
      updateCounters();
      els.clear.disabled = true;
      els.copy.disabled = true;
      els.download.disabled = true;
      resetTimer();
    }
  });

  els.copy.addEventListener('click', async () => {
    try{
      await navigator.clipboard.writeText(els.transcript.textContent);
      els.copy.textContent = 'Copied!';
      setTimeout(() => els.copy.textContent = 'Copy', 1200);
    }catch(e){
      alert('Copy failed.');
    }
  });

  els.download.addEventListener('click', () => {
    const blob = new Blob([els.transcript.textContent], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g,'-');
    a.href = url; a.download = `transcript-${stamp}.txt`;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
  });

  // Keyboard shortcut Ctrl/Cmd + Enter to toggle
  window.addEventListener('keydown', (e) => {
    if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
      els.startStop.click();
    }
  });
})();
