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
let practiceColorsClicked = new Set();
const totalPracticeColors = 7;

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

    // Initialize background color swatches
    initializeColorSwatches();

    // Initialize listen buttons
    initializeListenButtons();

    // Initialize practice color picker (Screen 5)
    initializePracticeColorPicker();

    // Set initial background swatch as active
    document.querySelector('.swatch[data-color="#FFF9E6"]').classList.add('active');
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

    // Priority list for Australian female voices
    const priorityPatterns = [
        /australian.*female/i,
        /en-AU.*female/i,
        /australia/i,
        /en-AU/i,
        /karen/i,
        /female.*english/i,
        /en-.*female/i,
        /samantha/i,
        /victoria/i,
        /female/i,
        /en-GB/i,
        /en-US/i
    ];

    for (const pattern of priorityPatterns) {
        const voice = voices.find(v => pattern.test(v.name) || pattern.test(v.lang));
        if (voice) {
            selectedVoice = voice;
            console.log('Selected voice:', voice.name, voice.lang);
            return;
        }
    }

    // Fallback to first English voice
    selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
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
        console.error('Speech error:', event);
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
// Background Color Swatches
// ============================================
function initializeColorSwatches() {
    const swatches = document.querySelectorAll('.swatch');

    swatches.forEach(swatch => {
        swatch.addEventListener('click', function() {
            // Remove active class from all swatches
            swatches.forEach(s => s.classList.remove('active'));

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
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById('screen' + screenNum);
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenNum;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============================================
// Screen 4 - Demo Animation
// ============================================
async function startDemo() {
    const startBtn = document.getElementById('start-demo-btn');
    startBtn.disabled = true;
    startBtn.textContent = 'Demo in progress...';

    // Show color picker
    const colorPicker = document.getElementById('demo-color-picker');
    colorPicker.classList.remove('hidden');

    // Show cursor
    const cursor = document.getElementById('demo-cursor');
    cursor.classList.remove('hidden');

    // Color assignments
    const colorAssignments = [
        { color: '#FF6699', word: 'Spanish', text: 'Let\'s choose the colour pink for Spanish' },
        { color: '#00CC66', word: 'Greek', text: 'Let\'s choose the colour green for Greek' },
        { color: '#FFFF00', word: 'English', text: 'Let\'s choose the colour yellow for English' },
        { color: '#0E6FFE', word: 'Chinese', text: 'Let\'s choose the colour blue for Chinese' },
        { color: '#069494', word: 'Dutch', text: 'Let\'s choose the colour teal for Dutch' },
        { color: '#FF4343', word: 'Italian', text: 'Let\'s choose the colour red for Italian' }
    ];

    // Process each color assignment
    for (const assignment of colorAssignments) {
        await animateColorSelection(assignment.color, assignment.word, assignment.text);
        await delay(500);
    }

    // Hide cursor
    cursor.classList.add('hidden');

    // Show frequency explanation
    const resultDiv = document.getElementById('demo-result');
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = '<p>The frequency of occurrence strategy is when the answer appears in more than one of the answers.</p>';

    await speakTextWithPromise('The frequency of occurrence strategy is when the answer appears in more than one of the answers.');
    await delay(500);

    // Highlight Spanish occurrences (appears in options a and b)
    const spanishWords = document.querySelectorAll('#demo-options .word[data-word="Spanish"]');
    spanishWords.forEach(word => {
        word.classList.add('flash');
        setTimeout(() => word.classList.remove('flash'), 1000);
    });

    await delay(1200);

    // Highlight English occurrences (appears in options b and d)
    const englishWords = document.querySelectorAll('#demo-options .word[data-word="English"]');
    englishWords.forEach(word => {
        word.classList.add('flash');
        setTimeout(() => word.classList.remove('flash'), 1000);
    });

    await delay(1200);

    // Show final answer
    resultDiv.innerHTML += '<p style="margin-top: 16px;">Using this strategy the answer is b. Spanish and English.</p>';

    await speakTextWithPromise('Using this strategy the answer is b. Spanish and English.');

    // Check the correct answer
    document.getElementById('demo-b').checked = true;

    // Re-enable button
    startBtn.disabled = false;
    startBtn.textContent = 'Replay the demo';
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
// Screen 5 - Practice Interactive
// ============================================
function initializePracticeColorPicker() {
    const colorButtons = document.querySelectorAll('.practice-color');

    colorButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled) return;

            const color = this.dataset.color;
            const word = this.dataset.word;

            // Disable button after click
            this.disabled = true;

            // Speak instruction
            speakText(`Highlight the word ${word} with ${getColorName(color)}.`);

            // Highlight all instances of the word
            const words = document.querySelectorAll(`#practice-options .word[data-word="${word}"]`);
            words.forEach(w => {
                w.style.backgroundColor = color;
                w.classList.add('highlighted');
            });

            // Track clicked colors
            practiceColorsClicked.add(word);

            // Check if all colors have been clicked
            if (practiceColorsClicked.size >= totalPracticeColors) {
                setTimeout(() => {
                    document.getElementById('check-answers-btn').classList.remove('hidden');
                }, 1000);
            }
        });
    });
}

function getColorName(hex) {
    const colorNames = {
        '#FF6699': 'pink',
        '#00CC66': 'green',
        '#FFFF00': 'yellow',
        '#808080': 'grey',
        '#0E6FFE': 'blue',
        '#069494': 'teal',
        '#FF4343': 'red'
    };
    return colorNames[hex] || 'this colour';
}

async function checkPracticeAnswers() {
    const checkBtn = document.getElementById('check-answers-btn');
    checkBtn.disabled = true;

    const resultDiv = document.getElementById('practice-result');
    resultDiv.classList.remove('hidden');

    // Explain Id (appears 3 times: a, b, d)
    await speakTextWithPromise('There are 3 answers that are coloured pink for Id.');

    const idWords = document.querySelectorAll('#practice-options .word[data-word="Id"]');
    idWords.forEach(w => {
        w.classList.add('flash');
    });
    await delay(1200);
    idWords.forEach(w => w.classList.remove('flash'));

    // Explain Ego (appears 3 times: a, c, d)
    await speakTextWithPromise('There are 3 answers that are coloured green for Ego.');

    const egoWords = document.querySelectorAll('#practice-options .word[data-word="Ego"]');
    egoWords.forEach(w => {
        w.classList.add('flash');
    });
    await delay(1200);
    egoWords.forEach(w => w.classList.remove('flash'));

    // Explain Superego (appears 2 times: c, d)
    await speakTextWithPromise('There are 2 answers that are coloured red for Superego.');

    const superegoWords = document.querySelectorAll('#practice-options .word[data-word="Superego"]');
    superegoWords.forEach(w => {
        w.classList.add('flash');
    });
    await delay(1200);
    superegoWords.forEach(w => w.classList.remove('flash'));

    // Show final answer
    resultDiv.innerHTML = '<p>Based on the strategy, the answer is d as all the words have been coloured multiple times.</p>';

    await speakTextWithPromise('Based on the strategy, the answer is d as all the words have been coloured multiple times.');

    // Check the correct answer
    document.getElementById('practice-d').checked = true;

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
