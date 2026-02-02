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

// Screen 5 Practice State
let selectedPracticeColor = null;
let selectedPracticeWord = null;
let highlightedWords = new Set(); // Track which word instances have been highlighted
let totalWordsToHighlight = 0; // Will be calculated on init

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

    // Initialize Screen 4 instruction speaker button
    initializeScreen4InstructionSpeaker();

    // Initialize practice color picker (Screen 5)
    initializePracticeColorPicker();

    // Set initial background swatch as active
    document.querySelector('.swatch[data-color="#FFF9E6"]').classList.add('active');
}

// Screen 4 instruction speaker button
function initializeScreen4InstructionSpeaker() {
    const btn = document.getElementById('screen4-instruction-speaker');
    if (btn) {
        btn.addEventListener('click', function() {
            speakText("Colour coding is important for processing information easier and allows those to identity the answer faster. So, let's colour code each language.");
        });
    }
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
    // Looking for en-AU voices first, preferring female voices
    const priorityChecks = [
        // Google/Cloud voices (Neural2-A is female Australian)
        v => v.name.includes('en-AU') && v.name.includes('Neural2-A'),
        v => v.name.includes('en-AU') && v.name.toLowerCase().includes('female'),
        v => v.name.includes('en-AU-Wavenet') && v.name.includes('-A'),
        v => v.name.includes('en-AU-Wavenet') && v.name.includes('-C'),
        // Microsoft voices
        v => v.name.includes('Catherine') || v.name.includes('Natasha'),
        // Any Australian voice
        v => v.lang === 'en-AU',
        v => v.name.toLowerCase().includes('australia'),
        // Female English voices as fallback
        v => v.name.toLowerCase().includes('karen'),
        v => v.name.toLowerCase().includes('samantha'),
        v => v.name.toLowerCase().includes('victoria'),
        v => v.name.toLowerCase().includes('female') && v.lang.startsWith('en'),
        // Any English voice
        v => v.lang === 'en-GB',
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
    resultDiv.innerHTML = '';

    // Word data: word name, count, color, color name
    const wordData = [
        { word: 'Id', count: 3, color: '#FF6699', colorName: 'pink' },
        { word: 'Ego', count: 3, color: '#00CC66', colorName: 'green' },
        { word: 'Superego', count: 2, color: '#FF4343', colorName: 'red' },
        { word: 'Conscious', count: 1, color: '#FFFF00', colorName: 'yellow' },
        { word: 'Unconscious', count: 1, color: '#808080', colorName: 'grey' },
        { word: 'Aware', count: 1, color: '#0E6FFE', colorName: 'blue' },
        { word: 'Brain', count: 1, color: '#069494', colorName: 'teal' }
    ];

    // Process each word
    for (const data of wordData) {
        const resultText = `There are ${data.count} answers that are coloured ${data.colorName} for ${data.word}.`;

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

    // Add final explanation
    const finalText = document.createElement('p');
    finalText.style.marginTop = '16px';
    finalText.style.fontWeight = 'bold';
    finalText.innerHTML = 'Based on the strategy, the answer is d as the words Id, Ego, and Superego appear most frequently across the options.';
    resultDiv.appendChild(finalText);

    await speakTextWithPromise('Based on the strategy, the answer is d as the words Id, Ego, and Superego appear most frequently across the options.');

    // Check the correct answer (d)
    const practiceCheckboxes = document.querySelectorAll('input[name="practice-answer"]');
    practiceCheckboxes.forEach(cb => cb.checked = false);
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
