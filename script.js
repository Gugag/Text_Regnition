// Stopwatch Logic
let startTime, updatedTime, difference, tInterval;
let running = false;

const stopwatch = document.getElementById("stopwatch");
const startStopBtn = document.getElementById("startStopBtn");
const downloadBtn = document.getElementById("downloadBtn");
const transcript = document.getElementById("transcript");
const languageSelect = document.getElementById("language"); // Get the language selection dropdown

startStopBtn.addEventListener("click", startStop);
downloadBtn.addEventListener("click", downloadTXT);

function startStop() {
    if (!running) {
        startStopBtn.innerHTML = "Stop";
        downloadBtn.style.display = "none";
        startTime = new Date().getTime();
        tInterval = setInterval(getShowTime, 1);
        running = true;
        startSpeechRecognition();
    } else {
        startStopBtn.innerHTML = "Start";
        clearInterval(tInterval);
        running = false;
        stopSpeechRecognition();
        downloadBtn.style.display = "inline-block";
    }
}

function getShowTime() {
    updatedTime = new Date().getTime();
    difference = updatedTime - startTime;
    let hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((difference % (1000 * 60)) / 1000);
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    stopwatch.innerHTML = hours + ":" + minutes + ":" + seconds;
}

// Speech Recognition Logic
let recognition;

function startSpeechRecognition() {
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.speechHandler) {
        const selectedLanguage = languageSelect.value;
        window.webkit.messageHandlers.speechHandler.postMessage({
            command: "start",
            language: selectedLanguage
        });
    } else {
        alert("Speech recognition is not available in this environment.");
    }
}

function stopSpeechRecognition() {
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.speechHandler) {
        window.webkit.messageHandlers.speechHandler.postMessage({
            command: "stop"
        });
    }
}

// Function to append new transcript text and highlight it
function appendTranscript(text) {
    const newSpan = document.createElement('span');
    newSpan.innerHTML = text + "<br>";
    newSpan.classList.add('highlight');  // Highlight new text
    transcript.appendChild(newSpan);
    
    // Scroll to the new text
    transcript.scrollTop = transcript.scrollHeight;
    
    // Remove the highlight after 2 seconds
    setTimeout(() => {
        newSpan.classList.remove('highlight');
    }, 2000);
}

// Download TXT Logic
function downloadTXT() {
    const text = transcript.innerText;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
