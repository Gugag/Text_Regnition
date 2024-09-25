
        // Stopwatch Logic
        let startTime, updatedTime, difference, tInterval;
        let running = false;

        const stopwatch = document.getElementById("stopwatch");
        const startStopBtn = document.getElementById("startStopBtn");

        startStopBtn.addEventListener("click", startStop);

        function startStop() {
            if (!running) {
                startStopBtn.innerHTML = "Stop";
                startTime = new Date().getTime();
                tInterval = setInterval(getShowTime, 1);
                running = true;
                startSpeechRecognition();
            } else {
                startStopBtn.innerHTML = "Start";
                clearInterval(tInterval);
                running = false;
                stopSpeechRecognition();
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
        const transcript = document.getElementById("transcript");
        let recognition;

        function startSpeechRecognition() {
            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.start();

            recognition.onresult = function(event) {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                transcript.innerHTML += finalTranscript + "<br>";
            };

            recognition.onerror = function(event) {
                console.error(event.error);
            };
        }

        function stopSpeechRecognition() {
            if (recognition) {
                recognition.stop();
            }
        }
    