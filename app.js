/**
 * Dyslexia Aid - Multiple Choice Strategies Application
 * An accessible web application to help dyslexic children navigate multiple-choice questions
 */

// ============================================
// Global Variables and State
// ============================================
let currentScreen = 1;
let isSpeaking = false;
let speechSynthesis = window.speechSynthesis;
let selectedVoice = null;

// Screen 4 Demo State
let demoRunning = false;
let demoStopped = false;

// Screen 5 Practice State
let selectedPracticeColor = null;
let selectedPracticeWord = null;
let highlightedWords = new Set(); // Track which word instances have been highlighted
let totalWordsToHighlight = 0; // Will be calculated on init

// Screen 6 State
let screen6SelectedColor = null;
let screen6EraserMode = false;
let screen6WordColors = {}; // Maps word element index to its highlight color

// Screen 7 State
let screen7SelectedColor = null;
let screen7EraserMode = false;
let screen7WordColors = {}; // Maps word element index to its highlight color

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize voice
    initializeVoice();

    // Initialize font selector
    initializeFontSelector();

    // Initialize font color swatches
    initializeFontColorSwatches();

    // Initialize background color swatches
    initializeBackgroundColorSwatches();

    // Initialize listen buttons
    initializeListenButtons();

    // Initialize practice color picker (Screen 5)
    initializePracticeColorPicker();

    // Initialize Screen 6
    initializeScreen6();

    // Initialize Screen 7
    initializeScreen7();

    // Set initial font color (dark blue)
    document.body.style.color = '#31579B';

    // Set initial background swatch as active
    document.querySelector('.bg-swatch[data-color="#DCEAF6"]').classList.add('active');
    document.body.style.backgroundColor = '#DCEAF6';
}

// ============================================
// Voice / Speech Synthesis
// ============================================
function initializeVoice() {
    // Wait for voices to load
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = selectAustralianVoice;
    }
    // Also try immediately in case voices are already loaded
    setTimeout(selectAustralianVoice, 100);
}

function selectAustralianVoice() {
    const voices = speechSynthesis.getVoices();

    // Log all available voices for debugging
    console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));

    // Priority list for Australian female voices, with British as fallback
    const priorityChecks = [
        // Microsoft Windows Australian female voices (Natural/Online voices)
        v => v.name.toLowerCase().includes('natasha') && v.name.toLowerCase().includes('australia'),
        v => v.name.toLowerCase().includes('natasha'),
        // Microsoft Catherine (older Australian voice)
        v => v.name.toLowerCase().includes('catherine') && v.name.toLowerCase().includes('australia'),
        // Any voice with en-AU language code
        v => v.lang === 'en-AU',
        // Any voice mentioning Australia
        v => v.name.toLowerCase().includes('australia'),
        // Google/Cloud voices
        v => v.name.includes('en-AU'),
        // British female voices as fallback (closer to Australian accent)
        v => v.name.toLowerCase().includes('hazel') && v.lang === 'en-GB',
        v => v.name.toLowerCase().includes('libby'),
        v => v.name.toLowerCase().includes('sonia'),
        v => v.lang === 'en-GB',
        // US female voices as last resort
        v => v.name.toLowerCase().includes('zira'),
        v => v.name.toLowerCase().includes('samantha'),
        v => v.lang === 'en-US',
        v => v.lang.startsWith('en')
    ];

    for (const check of priorityChecks) {
        const voice = voices.find(check);
        if (voice) {
            selectedVoice = voice;
            console.log('Selected voice:', voice.name, voice.lang);
            return;
        }
    }

    // Fallback to first available voice
    selectedVoice = voices[0];
    if (selectedVoice) {
        console.log('Fallback voice:', selectedVoice.name, selectedVoice.lang);
    }
}

function speakText(text, callback) {
    if (isSpeaking) {
        return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    isSpeaking = true;

    utterance.onend = function() {
        isSpeaking = false;
        if (callback) callback();
    };

    utterance.onerror = function(event) {
        // Ignore 'interrupted' error - this happens when speech is intentionally stopped
        if (event.error !== 'interrupted') {
            console.error('Speech error:', event);
        }
        isSpeaking = false;
        if (callback) callback();
    };

    speechSynthesis.speak(utterance);
}

function speakTextWithPromise(text) {
    return new Promise((resolve) => {
        speakText(text, resolve);
    });
}

// ============================================
// Font Selector
// ============================================
function initializeFontSelector() {
    const fontSelect = document.getElementById('font-select');

    fontSelect.addEventListener('change', function() {
        document.body.style.fontFamily = this.value;
    });
}

// ============================================
// Font Color Swatches
// ============================================
function initializeFontColorSwatches() {
    const fontSwatches = document.querySelectorAll('.font-swatch');

    fontSwatches.forEach(swatch => {
        swatch.addEventListener('click', function() {
            // Remove active class from all font swatches
            fontSwatches.forEach(s => s.classList.remove('active'));

            // Add active class to clicked swatch
            this.classList.add('active');

            // Change font color
            const color = this.dataset.color;
            document.body.style.color = color;
            document.documentElement.style.setProperty('--text-dark', color);
        });
    });
}

// ============================================
// Background Color Swatches
// ============================================
function initializeBackgroundColorSwatches() {
    const bgSwatches = document.querySelectorAll('.bg-swatch');

    bgSwatches.forEach(swatch => {
        swatch.addEventListener('click', function() {
            // Remove active class from all background swatches
            bgSwatches.forEach(s => s.classList.remove('active'));

            // Add active class to clicked swatch
            this.classList.add('active');

            // Change background color
            const color = this.dataset.color;
            document.body.style.backgroundColor = color;
            document.documentElement.style.setProperty('--bg-color', color);
        });
    });
}

// ============================================
// Listen Buttons
// ============================================
function initializeListenButtons() {
    const listenButtons = document.querySelectorAll('.listen-btn');

    listenButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled) return;

            const screenId = this.closest('.screen').id;
            let textToRead = '';

            switch(screenId) {
                case 'screen1':
                    textToRead = 'Multiple Choice Predicting Strategies. ' +
                        'Educated predicting strategies are not a substitute for good study habits and test preparation. ' +
                        'They are not foolproof and will not guarantee the correct answer. ' +
                        'Predictive strategies, however, help when you are not completely sure of the answer, ' +
                        'and will assist you to either narrow down the choices or to choose between two reasonably good answers. ' +
                        'Using these strategies will assist to improve your test results.';
                    break;
                case 'screen2':
                    textToRead = 'Strategy 1: Frequency of occurrence strategy. ' +
                        'Look for items that appear in more than one of the multiple choices even if you may not know the answer.';
                    break;
                case 'screen3':
                    textToRead = 'Let\'s have a look at how this strategy works. ' +
                        'Listen to the question and follow the instructions to work out the answer.';
                    break;
            }

            // Disable button during speech
            this.disabled = true;

            speakText(textToRead, () => {
                this.disabled = false;
            });
        });
    });
}

// ============================================
// Screen Navigation
// ============================================
function goToScreen(screenNum) {
    // Stop any ongoing speech when navigating
    stopSpeech();

    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById('screen' + screenNum);
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenNum;

        // Reset Screen 6 when navigating to it
        if (screenNum === 6) {
            resetScreen6();
        }

        // Reset Screen 7 when navigating to it
        if (screenNum === 7) {
            resetScreen7();
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============================================
// Stop Speech
// ============================================
function stopSpeech() {
    speechSynthesis.cancel();
    isSpeaking = false;
}

// ============================================
// Screen 4 - Demo Animation
// ============================================
async function startDemo() {
    const startBtn = document.getElementById('start-demo-btn');
    const stopBtn = document.getElementById('stop-demo-btn');

    // Set demo state
    demoRunning = true;
    demoStopped = false;

    startBtn.disabled = true;
    startBtn.textContent = 'Demo in progress...';
    stopBtn.disabled = false;

    // Clear any previous highlights (for replay)
    const allWords = document.querySelectorAll('#demo-options .word');
    allWords.forEach(word => {
        word.style.backgroundColor = '';
        word.classList.remove('highlighted', 'flash');
    });

    // Clear previous result and uncheck answers
    const resultDiv = document.getElementById('demo-result');
    resultDiv.classList.add('hidden');
    resultDiv.innerHTML = '';
    document.querySelectorAll('input[name="demo-answer"]').forEach(cb => cb.checked = false);

    // Show color picker
    const colorPicker = document.getElementById('demo-color-picker');
    colorPicker.classList.remove('hidden');

    // Show cursor
    const cursor = document.getElementById('demo-cursor');
    cursor.classList.remove('hidden');

    // Color assignments (using new pastel colors)
    const colorAssignments = [
        { color: '#f5d3ed', word: 'Spanish', text: 'Let\'s choose the colour pink for Spanish' },
        { color: '#dcf5d3', word: 'Greek', text: 'Let\'s choose the colour green for Greek' },
        { color: '#f6f7b9', word: 'English', text: 'Let\'s choose the colour yellow for English' },
        { color: '#cee6ff', word: 'Chinese', text: 'Let\'s choose the colour blue for Chinese' },
        { color: '#9abecc', word: 'Dutch', text: 'Let\'s choose the colour teal for Dutch' },
        { color: '#f9a2a2', word: 'Italian', text: 'Let\'s choose the colour red for Italian' }
    ];

    // Process each color assignment
    for (const assignment of colorAssignments) {
        if (demoStopped) break;
        await animateColorSelection(assignment.color, assignment.word, assignment.text);
        if (demoStopped) break;
        await delay(500);
    }

    if (demoStopped) {
        endDemo();
        return;
    }

    // Hide cursor
    cursor.classList.add('hidden');

    // Show frequency explanation
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = '<p>The frequency of occurrence strategy is when the answer appears in more than one of the answers.</p>';

    if (!demoStopped) {
        await speakTextWithPromise('The frequency of occurrence strategy is when the answer appears in more than one of the answers.');
    }
    if (demoStopped) { endDemo(); return; }
    await delay(500);

    // Highlight Spanish occurrences (appears in options a and b)
    if (!demoStopped) {
        const spanishWords = document.querySelectorAll('#demo-options .word[data-word="Spanish"]');
        spanishWords.forEach(word => {
            word.classList.add('flash');
            setTimeout(() => word.classList.remove('flash'), 1000);
        });
    }

    if (demoStopped) { endDemo(); return; }
    await delay(1200);

    // Highlight English occurrences (appears in options b and d)
    if (!demoStopped) {
        const englishWords = document.querySelectorAll('#demo-options .word[data-word="English"]');
        englishWords.forEach(word => {
            word.classList.add('flash');
            setTimeout(() => word.classList.remove('flash'), 1000);
        });
    }

    if (demoStopped) { endDemo(); return; }
    await delay(1200);

    // Show final answer
    if (!demoStopped) {
        resultDiv.innerHTML += '<p style="margin-top: 16px;">Using this strategy the answer is b. Spanish and English.</p>';
        await speakTextWithPromise('Using this strategy the answer is b. Spanish and English.');
    }

    // Check the correct answer
    if (!demoStopped) {
        document.getElementById('demo-b').checked = true;
    }

    endDemo();
}

function stopDemo() {
    demoStopped = true;
    speechSynthesis.cancel();
    isSpeaking = false;
}

function endDemo() {
    const startBtn = document.getElementById('start-demo-btn');
    const stopBtn = document.getElementById('stop-demo-btn');
    const cursor = document.getElementById('demo-cursor');

    demoRunning = false;
    cursor.classList.add('hidden');

    startBtn.disabled = false;
    startBtn.textContent = 'Replay the demo';
    stopBtn.disabled = true;
}

async function animateColorSelection(color, word, spokenText) {
    const cursor = document.getElementById('demo-cursor');
    const colorBtn = document.querySelector(`#demo-color-picker .color-btn[data-color="${color}"]`);

    // Speak the instruction
    await speakTextWithPromise(spokenText);

    // Get color button position
    const btnRect = colorBtn.getBoundingClientRect();

    // Move cursor to color button
    cursor.style.left = (btnRect.left + btnRect.width / 2) + 'px';
    cursor.style.top = (btnRect.top + btnRect.height / 2) + 'px';

    await delay(800);

    // Simulate click on color button
    colorBtn.classList.add('selected');
    await delay(300);
    colorBtn.classList.remove('selected');

    // Find and highlight the word
    const words = document.querySelectorAll(`#demo-options .word[data-word="${word}"]`);

    for (const wordEl of words) {
        const wordRect = wordEl.getBoundingClientRect();

        // Move cursor to word
        cursor.style.left = (wordRect.left + wordRect.width / 2) + 'px';
        cursor.style.top = (wordRect.top + wordRect.height / 2) + 'px';

        await delay(600);

        // Highlight the word
        wordEl.style.backgroundColor = color;
        wordEl.classList.add('highlighted');

        await delay(300);
    }
}

// ============================================
// Screen 5 - Practice Interactive (User-Driven)
// ============================================

// Track word colors for results display
let wordColorMap = {};

function initializePracticeColorPicker() {
    const colorButtons = document.querySelectorAll('.practice-color');
    const practiceWords = document.querySelectorAll('#practice-options .word');
    const practiceCheckboxes = document.querySelectorAll('input[name="practice-answer"]');

    // Count total words to highlight
    totalWordsToHighlight = practiceWords.length;

    // Disable checkboxes initially - they should only be enabled after highlighting is complete
    practiceCheckboxes.forEach(checkbox => {
        checkbox.disabled = true;
    });

    // Make checkboxes function as radio buttons (when enabled)
    practiceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                // Uncheck all other checkboxes
                practiceCheckboxes.forEach(cb => {
                    if (cb !== this) {
                        cb.checked = false;
                    }
                });

                // Show check answers button
                document.getElementById('check-answers-btn').classList.remove('hidden');
            }
        });
    });

    // Color button click - select color and speak instruction
    colorButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled || isSpeaking) return;

            const color = this.dataset.color;
            const word = this.dataset.word;

            // Remove selected class from all color buttons
            colorButtons.forEach(b => b.classList.remove('selected'));

            // Add selected class to this button
            this.classList.add('selected');

            // Store selected color and word
            selectedPracticeColor = color;
            selectedPracticeWord = word;

            // Store color mapping for this word
            wordColorMap[word] = color;

            // Speak instruction
            speakText(`Highlight the word ${word} with ${getColorName(color)}.`);
        });
    });

    // Word click - highlight if color is selected and word matches
    practiceWords.forEach((wordEl, index) => {
        // Make words clickable
        wordEl.style.cursor = 'pointer';
        wordEl.setAttribute('tabindex', '0');
        wordEl.setAttribute('role', 'button');

        const handleWordClick = function() {
            // Check if a color is selected
            if (!selectedPracticeColor || !selectedPracticeWord) {
                speakText('Please select a colour from the colour picker first.');
                return;
            }

            // Check if this word is already highlighted
            const wordId = `${wordEl.dataset.word}-${index}`;
            if (highlightedWords.has(wordId)) {
                return; // Already highlighted
            }

            const clickedWord = wordEl.dataset.word;

            // Check if the clicked word matches the expected word for the selected color
            if (clickedWord === selectedPracticeWord) {
                // Correct! Highlight this word
                wordEl.style.backgroundColor = selectedPracticeColor;
                wordEl.classList.add('highlighted');
                highlightedWords.add(wordId);

                // Check if all instances of this word are highlighted
                const allInstancesOfWord = document.querySelectorAll(`#practice-options .word[data-word="${clickedWord}"]`);
                let allHighlighted = true;
                allInstancesOfWord.forEach((w, i) => {
                    const wId = `${w.dataset.word}-${Array.from(practiceWords).indexOf(w)}`;
                    if (!highlightedWords.has(wId)) {
                        allHighlighted = false;
                    }
                });

                // If all instances of this word are highlighted, disable the color button
                if (allHighlighted) {
                    const colorBtn = document.querySelector(`.practice-color[data-word="${clickedWord}"]`);
                    if (colorBtn) {
                        colorBtn.disabled = true;
                        colorBtn.classList.remove('selected');
                    }
                    // Clear selection
                    selectedPracticeColor = null;
                    selectedPracticeWord = null;
                }

                // Check if all words have been highlighted
                if (highlightedWords.size >= totalWordsToHighlight) {
                    setTimeout(() => {
                        // Show strategy instruction
                        document.getElementById('strategy-instruction').classList.remove('hidden');

                        // Enable checkboxes now that highlighting is complete
                        const checkboxes = document.querySelectorAll('input[name="practice-answer"]');
                        checkboxes.forEach(cb => {
                            cb.disabled = false;
                        });
                    }, 500);
                }
            } else {
                // Wrong word - give feedback
                speakText(`That's ${clickedWord}. Please highlight ${selectedPracticeWord}.`);
            }
        };

        wordEl.addEventListener('click', handleWordClick);
        wordEl.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleWordClick();
            }
        });
    });
}

function getColorName(hex) {
    const colorNames = {
        '#f5d3ed': 'pink',
        '#dcf5d3': 'green',
        '#f6f7b9': 'yellow',
        '#c5c5c5': 'grey',
        '#cee6ff': 'blue',
        '#9abecc': 'teal',
        '#f9a2a2': 'red'
    };
    return colorNames[hex] || 'this colour';
}

async function checkPracticeAnswers() {
    const checkBtn = document.getElementById('check-answers-btn');
    checkBtn.disabled = true;

    const resultDiv = document.getElementById('practice-result');
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = '';

    // Word data: word name, count, color, color name (using new pastel colors)
    const wordData = [
        { word: 'Id', count: 3, color: '#f5d3ed', colorName: 'pink' },
        { word: 'Ego', count: 3, color: '#dcf5d3', colorName: 'green' },
        { word: 'Superego', count: 2, color: '#f9a2a2', colorName: 'red' },
        { word: 'Conscious', count: 1, color: '#f6f7b9', colorName: 'yellow' },
        { word: 'Unconscious', count: 1, color: '#c5c5c5', colorName: 'grey' },
        { word: 'Aware', count: 1, color: '#cee6ff', colorName: 'blue' },
        { word: 'Brain', count: 1, color: '#9abecc', colorName: 'teal' }
    ];

    // Process each word
    for (const data of wordData) {
        const resultText = data.count === 1
            ? `There is ${data.count} answer that is coloured ${data.colorName} for ${data.word}.`
            : `There are ${data.count} answers that are coloured ${data.colorName} for ${data.word}.`;

        // Add to result div
        const p = document.createElement('p');
        p.innerHTML = resultText;
        resultDiv.appendChild(p);

        // Speak the result
        await speakTextWithPromise(resultText);

        // Flash the words
        const words = document.querySelectorAll(`#practice-options .word[data-word="${data.word}"]`);
        words.forEach(w => {
            w.classList.add('flash');
        });
        await delay(1200);
        words.forEach(w => w.classList.remove('flash'));

        await delay(300);
    }

    // Check the correct answer (d) BEFORE the final speech
    const practiceCheckboxes = document.querySelectorAll('input[name="practice-answer"]');
    practiceCheckboxes.forEach(cb => cb.checked = false);
    document.getElementById('practice-d').checked = true;

    // Add final explanation
    const finalText = document.createElement('p');
    finalText.style.marginTop = '16px';
    finalText.style.fontWeight = 'bold';
    finalText.innerHTML = 'Based on the strategy, the answer is d as the words Id, Ego, and Superego appear most frequently across the options.';
    resultDiv.appendChild(finalText);

    await speakTextWithPromise('Based on the strategy, the answer is d as the words Id, Ego, and Superego appear most frequently across the options.');

    // Show congratulations
    const congratsBox = document.getElementById('congratulations-box');
    congratsBox.classList.remove('hidden');

    // Scroll to congratulations
    congratsBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

    checkBtn.disabled = false;
}

// ============================================
// Utility Functions
// ============================================
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle page visibility for speech synthesis
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        speechSynthesis.pause();
    } else {
        speechSynthesis.resume();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    speechSynthesis.cancel();
});

// ============================================
// Screen 6 - Planet Question Interactive
// ============================================

function initializeScreen6() {
    const colorButtons = document.querySelectorAll('.s6-color');
    const eraserBtn = document.getElementById('screen6-eraser');
    const screen6Words = document.querySelectorAll('#screen6-options .s6-word');
    const screen6Checkboxes = document.querySelectorAll('input[name="screen6-answer"]');

    // Color button click - select color
    colorButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (isSpeaking) return;

            // Remove selected class from all buttons including eraser
            colorButtons.forEach(b => b.classList.remove('selected'));
            eraserBtn.classList.remove('selected');

            // Add selected class to this button
            this.classList.add('selected');

            // Store selected color and exit eraser mode
            screen6SelectedColor = this.dataset.color;
            screen6EraserMode = false;
        });
    });

    // Eraser button click
    eraserBtn.addEventListener('click', function() {
        if (isSpeaking) return;

        // Remove selected class from all color buttons
        colorButtons.forEach(b => b.classList.remove('selected'));

        // Toggle eraser selection
        this.classList.add('selected');
        screen6EraserMode = true;
        screen6SelectedColor = null;
    });

    // Word click - highlight or erase
    screen6Words.forEach((wordEl, index) => {
        wordEl.style.cursor = 'pointer';
        wordEl.setAttribute('tabindex', '0');
        wordEl.setAttribute('role', 'button');

        const handleWordClick = function(e) {
            // Stop propagation and prevent default to stop checkbox from being triggered
            e.stopPropagation();
            e.preventDefault();

            if (isSpeaking) return;

            if (screen6EraserMode) {
                // Erase the highlight
                if (screen6WordColors[index]) {
                    wordEl.style.backgroundColor = '';
                    wordEl.classList.remove('highlighted');
                    delete screen6WordColors[index];
                }
            } else if (screen6SelectedColor) {
                // Highlight with selected color
                wordEl.style.backgroundColor = screen6SelectedColor;
                wordEl.classList.add('highlighted');
                screen6WordColors[index] = screen6SelectedColor;
            } else {
                // No color selected
                showScreen6Modal('Please select a colour from the colour picker first.', 'warning');
            }
        };

        wordEl.addEventListener('click', handleWordClick);
        wordEl.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                handleWordClick(e);
            }
        });
    });

    // Make checkboxes behave like radio buttons and show/hide check button
    screen6Checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkBtn = document.getElementById('screen6-check-btn');

            if (this.checked) {
                // Uncheck all other checkboxes
                screen6Checkboxes.forEach(cb => {
                    if (cb !== this) {
                        cb.checked = false;
                    }
                });
                // Show the check button
                checkBtn.classList.remove('hidden');
            } else {
                // If no checkbox is selected, hide the button
                const anyChecked = Array.from(screen6Checkboxes).some(cb => cb.checked);
                if (!anyChecked) {
                    checkBtn.classList.add('hidden');
                }
            }
        });
    });
}

function checkScreen6Answer() {
    const checkBtn = document.getElementById('screen6-check-btn');
    const screen6Words = document.querySelectorAll('#screen6-options .s6-word');
    const totalWords = screen6Words.length;

    // Check if all words are highlighted
    const highlightedCount = Object.keys(screen6WordColors).length;

    if (highlightedCount < totalWords) {
        // Not all words are highlighted
        showScreen6Modal('Please finish colour coding all options.', 'warning');
        return;
    }

    // Check if a checkbox is selected
    const selectedAnswer = document.querySelector('input[name="screen6-answer"]:checked');

    if (!selectedAnswer) {
        showScreen6Modal('Please select an answer by ticking one of the checkboxes.', 'warning');
        return;
    }

    // Check if color coding is correct
    const colorCodingCorrect = isColorCodingCorrect();
    const answerCorrect = selectedAnswer.value === 'c';

    if (answerCorrect && colorCodingCorrect) {
        // Correct answer + correct color coding
        showScreen6Modal('That is the correct answer. Good job!', 'success');
        checkBtn.disabled = true;
    } else if (answerCorrect && !colorCodingCorrect) {
        // Correct answer + wrong color coding
        showScreen6Modal('That is the correct answer. But the colour coding was a bit mixed up.', 'success');
        checkBtn.disabled = true;
    } else if (!answerCorrect && colorCodingCorrect) {
        // Wrong answer + correct color coding
        showScreen6Modal('Sorry! That is the wrong answer.', 'error');
        // Change button to "Explanation"
        checkBtn.textContent = 'Explanation';
        checkBtn.onclick = showScreen6Explanation;
    } else {
        // Wrong answer + wrong color coding
        showScreen6Modal('Sorry! That is the wrong answer. Also, the colour coding was a bit mixed up.', 'error');
        // Change button to "Reset and try again"
        checkBtn.textContent = 'Reset and try again';
        checkBtn.onclick = resetScreen6;
    }
}

function isColorCodingCorrect() {
    const screen6Words = document.querySelectorAll('#screen6-options .s6-word');

    // Build a map of word name to colors used
    const wordToColors = {};
    const colorToWords = {};

    screen6Words.forEach((wordEl, index) => {
        const word = wordEl.dataset.word;
        const color = screen6WordColors[index];

        // Track colors used for each word
        if (!wordToColors[word]) {
            wordToColors[word] = new Set();
        }
        wordToColors[word].add(color);

        // Track words using each color
        if (!colorToWords[color]) {
            colorToWords[color] = new Set();
        }
        colorToWords[color].add(word);
    });

    // Check 1: Same word should have the same color (only one color per word)
    for (const word in wordToColors) {
        if (wordToColors[word].size > 1) {
            return false; // Same word has different colors
        }
    }

    // Check 2: Different words should have different colors (each color used for only one word)
    for (const color in colorToWords) {
        if (colorToWords[color].size > 1) {
            return false; // Same color used for different words
        }
    }

    return true;
}

async function showScreen6Explanation() {
    const checkBtn = document.getElementById('screen6-check-btn');
    const resultDiv = document.getElementById('screen6-result');

    checkBtn.disabled = true;

    // Hide modal if visible
    closeScreen6ModalSilent();

    // Tick the correct answer (c)
    const screen6Checkboxes = document.querySelectorAll('input[name="screen6-answer"]');
    screen6Checkboxes.forEach(cb => cb.checked = false);
    document.getElementById('screen6-c').checked = true;

    // Show result div
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = '';

    // Get all words and their colors
    const screen6Words = document.querySelectorAll('#screen6-options .s6-word');

    // Build word data - unique words and their occurrences with colors
    const wordOccurrences = {};
    screen6Words.forEach((wordEl, index) => {
        const word = wordEl.dataset.word;
        const color = screen6WordColors[index];

        if (!wordOccurrences[word]) {
            wordOccurrences[word] = [];
        }
        wordOccurrences[word].push({ index, color, element: wordEl });
    });

    // Process each unique word
    for (const word in wordOccurrences) {
        const occurrences = wordOccurrences[word];
        const count = occurrences.length;

        // Get the color(s) used - take the first one for display
        const colorUsed = occurrences[0].color;
        const colorName = getScreen6ColorName(colorUsed);

        // Create the text with proper grammar
        const resultText = count === 1
            ? `There is ${count} answer that is coloured ${colorName} for ${word}.`
            : `There are ${count} answers that are coloured ${colorName} for ${word}.`;

        // Add to result div
        const p = document.createElement('p');
        p.innerHTML = resultText;
        resultDiv.appendChild(p);

        // Speak the result
        await speakTextWithPromise(resultText);

        // Flash all instances of this word
        occurrences.forEach(occ => {
            occ.element.classList.add('flash');
        });
        await delay(1200);
        occurrences.forEach(occ => {
            occ.element.classList.remove('flash');
        });

        await delay(300);
    }

    // Add final explanation
    const finalText = document.createElement('p');
    finalText.style.marginTop = '16px';
    finalText.style.fontWeight = 'bold';
    finalText.innerHTML = 'Based on the strategy, the answer is c as all the words have been coloured multiple times.';
    resultDiv.appendChild(finalText);

    await speakTextWithPromise('Based on the strategy, the answer is c as all the words have been coloured multiple times.');

    // Scroll to result
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    checkBtn.disabled = false;
}

function getScreen6ColorName(hex) {
    const colorNames = {
        '#f5d3ed': 'pink',
        '#dcf5d3': 'green',
        '#f6f7b9': 'yellow',
        '#cee6ff': 'blue',
        '#f9a2a2': 'red',
        '#9abecc': 'teal'
    };
    return colorNames[hex] || 'this colour';
}

function showScreen6Modal(message, type) {
    const modal = document.getElementById('screen6-modal');
    const modalContent = document.getElementById('screen6-modal-content');
    const modalText = document.getElementById('screen6-modal-text');

    // Set message
    modalText.textContent = message;

    // Set type class
    modalContent.className = 'modal-content';
    if (type) {
        modalContent.classList.add(type);
    }

    // Show modal
    modal.classList.add('visible');

    // Speak the message
    speakText(message);
}

function closeScreen6Modal(event) {
    // If clicking on the overlay (not the content), close
    if (event && event.target !== event.currentTarget) {
        return;
    }

    const modal = document.getElementById('screen6-modal');
    modal.classList.remove('visible');
}

function closeScreen6ModalSilent() {
    const modal = document.getElementById('screen6-modal');
    if (modal) {
        modal.classList.remove('visible');
    }
}

function resetScreen6() {
    // Reset state
    screen6SelectedColor = null;
    screen6EraserMode = false;
    screen6WordColors = {};

    // Clear word highlights
    const screen6Words = document.querySelectorAll('#screen6-options .s6-word');
    screen6Words.forEach(word => {
        word.style.backgroundColor = '';
        word.classList.remove('highlighted', 'flash');
    });

    // Clear color button selections
    const colorButtons = document.querySelectorAll('.s6-color');
    colorButtons.forEach(btn => btn.classList.remove('selected'));
    const eraserBtn = document.getElementById('screen6-eraser');
    if (eraserBtn) eraserBtn.classList.remove('selected');

    // Reset checkboxes
    const screen6Checkboxes = document.querySelectorAll('input[name="screen6-answer"]');
    screen6Checkboxes.forEach(cb => cb.checked = false);

    // Reset and hide check button
    const checkBtn = document.getElementById('screen6-check-btn');
    if (checkBtn) {
        checkBtn.textContent = 'Check your answer';
        checkBtn.onclick = checkScreen6Answer;
        checkBtn.disabled = false;
        checkBtn.classList.add('hidden');
    }

    // Hide modal
    closeScreen6ModalSilent();

    // Hide result
    const resultDiv = document.getElementById('screen6-result');
    if (resultDiv) {
        resultDiv.classList.add('hidden');
        resultDiv.innerHTML = '';
    }
}

// ============================================
// Screen 7 - Animal Mammals Question Interactive
// ============================================

function initializeScreen7() {
    const colorButtons = document.querySelectorAll('.s7-color');
    const eraserBtn = document.getElementById('screen7-eraser');
    const screen7Words = document.querySelectorAll('#screen7-options .s7-word');
    const screen7Checkboxes = document.querySelectorAll('input[name="screen7-answer"]');

    // Color button click - select color
    colorButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (isSpeaking) return;

            // Remove selected class from all buttons including eraser
            colorButtons.forEach(b => b.classList.remove('selected'));
            eraserBtn.classList.remove('selected');

            // Add selected class to this button
            this.classList.add('selected');

            // Store selected color and exit eraser mode
            screen7SelectedColor = this.dataset.color;
            screen7EraserMode = false;
        });
    });

    // Eraser button click
    eraserBtn.addEventListener('click', function() {
        if (isSpeaking) return;

        // Remove selected class from all color buttons
        colorButtons.forEach(b => b.classList.remove('selected'));

        // Toggle eraser selection
        this.classList.add('selected');
        screen7EraserMode = true;
        screen7SelectedColor = null;
    });

    // Word click - highlight or erase
    screen7Words.forEach((wordEl, index) => {
        wordEl.style.cursor = 'pointer';
        wordEl.setAttribute('tabindex', '0');
        wordEl.setAttribute('role', 'button');

        const handleWordClick = function(e) {
            // Stop propagation and prevent default to stop checkbox from being triggered
            e.stopPropagation();
            e.preventDefault();

            if (isSpeaking) return;

            if (screen7EraserMode) {
                // Erase the highlight
                if (screen7WordColors[index]) {
                    wordEl.style.backgroundColor = '';
                    wordEl.classList.remove('highlighted');
                    delete screen7WordColors[index];
                }
            } else if (screen7SelectedColor) {
                // Highlight with selected color
                wordEl.style.backgroundColor = screen7SelectedColor;
                wordEl.classList.add('highlighted');
                screen7WordColors[index] = screen7SelectedColor;
            } else {
                // No color selected
                showScreen7Modal('Please select a colour from the colour picker first.', 'warning');
            }
        };

        wordEl.addEventListener('click', handleWordClick);
        wordEl.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                handleWordClick(e);
            }
        });
    });

    // Make checkboxes behave like radio buttons and show/hide check button
    screen7Checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkBtn = document.getElementById('screen7-check-btn');

            if (this.checked) {
                // Uncheck all other checkboxes
                screen7Checkboxes.forEach(cb => {
                    if (cb !== this) {
                        cb.checked = false;
                    }
                });
                // Show the check button
                checkBtn.classList.remove('hidden');
            } else {
                // If no checkbox is selected, hide the button
                const anyChecked = Array.from(screen7Checkboxes).some(cb => cb.checked);
                if (!anyChecked) {
                    checkBtn.classList.add('hidden');
                }
            }
        });
    });
}

function checkScreen7Answer() {
    const checkBtn = document.getElementById('screen7-check-btn');
    const screen7Words = document.querySelectorAll('#screen7-options .s7-word');
    const totalWords = screen7Words.length;

    // Check if all words are highlighted
    const highlightedCount = Object.keys(screen7WordColors).length;

    if (highlightedCount < totalWords) {
        // Not all words are highlighted
        showScreen7Modal('Please finish colour coding all options.', 'warning');
        return;
    }

    // Check if a checkbox is selected
    const selectedAnswer = document.querySelector('input[name="screen7-answer"]:checked');

    if (!selectedAnswer) {
        showScreen7Modal('Please select an answer by ticking one of the checkboxes.', 'warning');
        return;
    }

    // Check if color coding is correct
    const colorCodingCorrect = isScreen7ColorCodingCorrect();
    const answerCorrect = selectedAnswer.value === 'b';

    if (answerCorrect && colorCodingCorrect) {
        // Correct answer + correct color coding
        showScreen7Modal('That is the correct answer. Good job!', 'success');
        checkBtn.disabled = true;
    } else if (answerCorrect && !colorCodingCorrect) {
        // Correct answer + wrong color coding
        showScreen7Modal('That is the correct answer. But the colour coding was a bit mixed up.', 'success');
        checkBtn.disabled = true;
    } else if (!answerCorrect && colorCodingCorrect) {
        // Wrong answer + correct color coding
        showScreen7Modal('Sorry! That is the wrong answer.', 'error');
        // Change button to "Explanation"
        checkBtn.textContent = 'EXPLANATION';
        checkBtn.onclick = showScreen7Explanation;
    } else {
        // Wrong answer + wrong color coding
        showScreen7Modal('Sorry! That is the wrong answer. Also, the colour coding was a bit mixed up.', 'error');
        // Change button to "Reset and try again"
        checkBtn.textContent = 'RESET AND TRY AGAIN';
        checkBtn.onclick = resetScreen7;
    }
}

function isScreen7ColorCodingCorrect() {
    const screen7Words = document.querySelectorAll('#screen7-options .s7-word');

    // Build a map of word name to colors used
    const wordToColors = {};
    const colorToWords = {};

    screen7Words.forEach((wordEl, index) => {
        const word = wordEl.dataset.word;
        const color = screen7WordColors[index];

        // Track colors used for each word
        if (!wordToColors[word]) {
            wordToColors[word] = new Set();
        }
        wordToColors[word].add(color);

        // Track words using each color
        if (!colorToWords[color]) {
            colorToWords[color] = new Set();
        }
        colorToWords[color].add(word);
    });

    // Check 1: Same word should have the same color (only one color per word)
    for (const word in wordToColors) {
        if (wordToColors[word].size > 1) {
            return false; // Same word has different colors
        }
    }

    // Check 2: Different words should have different colors (each color used for only one word)
    for (const color in colorToWords) {
        if (colorToWords[color].size > 1) {
            return false; // Same color used for different words
        }
    }

    return true;
}

function getScreen7ColorName(hex) {
    const colorNames = {
        '#f5d3ed': 'pink',
        '#dcf5d3': 'green',
        '#f6f7b9': 'yellow',
        '#cee6ff': 'blue',
        '#f9a2a2': 'red',
        '#9abecc': 'teal'
    };
    return colorNames[hex] || 'this colour';
}

async function showScreen7Explanation() {
    const checkBtn = document.getElementById('screen7-check-btn');
    const resultDiv = document.getElementById('screen7-result');

    checkBtn.disabled = true;

    // Hide modal if visible
    closeScreen7ModalSilent();

    // Tick the correct answer (b)
    const screen7Checkboxes = document.querySelectorAll('input[name="screen7-answer"]');
    screen7Checkboxes.forEach(cb => cb.checked = false);
    document.getElementById('screen7-b').checked = true;

    // Show result div
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = '';

    // Get all words and their colors
    const screen7Words = document.querySelectorAll('#screen7-options .s7-word');

    // Build word data - unique words and their occurrences with colors
    const wordOccurrences = {};
    screen7Words.forEach((wordEl, index) => {
        const word = wordEl.dataset.word;
        const color = screen7WordColors[index];

        if (!wordOccurrences[word]) {
            wordOccurrences[word] = [];
        }
        wordOccurrences[word].push({ index, color, element: wordEl });
    });

    // Process each unique word
    for (const word in wordOccurrences) {
        const occurrences = wordOccurrences[word];
        const count = occurrences.length;

        // Get the color(s) used - take the first one for display
        const colorUsed = occurrences[0].color;
        const colorName = getScreen7ColorName(colorUsed);

        // Create the text with proper grammar
        const resultText = count === 1
            ? `There is ${count} answer that is coloured ${colorName} for ${word}.`
            : `There are ${count} answers that are coloured ${colorName} for ${word}.`;

        // Add to result div
        const p = document.createElement('p');
        p.innerHTML = resultText;
        resultDiv.appendChild(p);

        // Speak the result
        await speakTextWithPromise(resultText);

        // Flash all instances of this word
        occurrences.forEach(occ => {
            occ.element.classList.add('flash');
        });
        await delay(1200);
        occurrences.forEach(occ => {
            occ.element.classList.remove('flash');
        });

        await delay(300);
    }

    // Add final explanation
    const finalText = document.createElement('p');
    finalText.style.marginTop = '16px';
    finalText.style.fontWeight = 'bold';
    finalText.innerHTML = 'Based on the strategy, the answer is B as all the words in it have been coloured multiple times.';
    resultDiv.appendChild(finalText);

    await speakTextWithPromise('Based on the strategy, the answer is B as all the words in it have been coloured multiple times.');

    // Scroll to result
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    checkBtn.disabled = false;
}

function showScreen7Modal(message, type) {
    const modal = document.getElementById('screen7-modal');
    const modalContent = document.getElementById('screen7-modal-content');
    const modalText = document.getElementById('screen7-modal-text');

    // Set message
    modalText.textContent = message;

    // Set type class
    modalContent.className = 'modal-content';
    if (type) {
        modalContent.classList.add(type);
    }

    // Show modal
    modal.classList.add('visible');

    // Speak the message
    speakText(message);
}

function closeScreen7Modal(event) {
    // If clicking on the overlay (not the content), close
    if (event && event.target !== event.currentTarget) {
        return;
    }

    const modal = document.getElementById('screen7-modal');
    modal.classList.remove('visible');
}

function closeScreen7ModalSilent() {
    const modal = document.getElementById('screen7-modal');
    if (modal) {
        modal.classList.remove('visible');
    }
}

function resetScreen7() {
    // Reset state
    screen7SelectedColor = null;
    screen7EraserMode = false;
    screen7WordColors = {};

    // Clear word highlights
    const screen7Words = document.querySelectorAll('#screen7-options .s7-word');
    screen7Words.forEach(word => {
        word.style.backgroundColor = '';
        word.classList.remove('highlighted', 'flash');
    });

    // Clear color button selections
    const colorButtons = document.querySelectorAll('.s7-color');
    colorButtons.forEach(btn => btn.classList.remove('selected'));
    const eraserBtn = document.getElementById('screen7-eraser');
    if (eraserBtn) eraserBtn.classList.remove('selected');

    // Reset checkboxes
    const screen7Checkboxes = document.querySelectorAll('input[name="screen7-answer"]');
    screen7Checkboxes.forEach(cb => cb.checked = false);

    // Reset and hide check button
    const checkBtn = document.getElementById('screen7-check-btn');
    if (checkBtn) {
        checkBtn.textContent = 'CHECK YOUR ANSWER';
        checkBtn.onclick = checkScreen7Answer;
        checkBtn.disabled = false;
        checkBtn.classList.add('hidden');
    }

    // Hide modal
    closeScreen7ModalSilent();

    // Hide result
    const resultDiv = document.getElementById('screen7-result');
    if (resultDiv) {
        resultDiv.classList.add('hidden');
        resultDiv.innerHTML = '';
    }
}
