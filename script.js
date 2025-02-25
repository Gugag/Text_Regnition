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
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        alert('Your browser does not support speech recognition.');
        return;
    }

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true; // Enable interim results for real-time feedback

    const selectedLanguage = languageSelect.value;
    recognition.lang = selectedLanguage; // Set recognition language based on selection

    try {
        recognition.start();
    } catch (e) {
        console.error('Speech recognition start error:', e);
        alert('Microphone permission denied or an error occurred.');
        return;
    }

    recognition.onstart = function() {
        console.log('Speech recognition started');
    };

    recognition.onresult = function(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptSegment = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcriptSegment;
            } else {
                interimTranscript += transcriptSegment;
            }
        }
        if (finalTranscript) {
            appendTranscript(finalTranscript);
            // Clear interim display after finalizing text
            displayInterimTranscript('');
        }
        // Continuously update interim results
        displayInterimTranscript(interimTranscript);
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            alert('Microphone access is not allowed. Please enable microphone permissions in your browser.');
        } else if (event.error === 'service-not-allowed') {
            alert(`The selected language (${selectedLanguage}) is not supported by the speech recognition service.`);
        } else {
            alert(`Speech recognition error: ${event.error}`);
        }
    };

    recognition.onend = function() {
        console.log('Speech recognition ended');
        // Automatically restart recognition if the stopwatch is still running.
        if (running) {
            try {
                recognition.start();
            } catch (e) {
                console.error('Error restarting speech recognition:', e);
            }
        }
    };
}

function stopSpeechRecognition() {
    if (recognition) {
        recognition.stop();
    }
    // Clear interim transcript if it exists
    displayInterimTranscript('');
}

// Function to display interim transcript text in a dedicated element
function displayInterimTranscript(text) {
    let interimElement = document.getElementById("interimTranscript");
    if (!interimElement) {
        // Create an interim transcript element if it doesn't exist
        interimElement = document.createElement("div");
        interimElement.id = "interimTranscript";
        interimElement.style.color = "gray"; // Style interim text differently
        interimElement.style.fontStyle = "italic";
        // Insert the interim element after the main transcript element
        transcript.parentNode.insertBefore(interimElement, transcript.nextSibling);
    }
    interimElement.innerText = text;
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
