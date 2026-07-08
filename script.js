// ===== Configuration =====
const CONFIG = {
    username: 'GunLolUser',
    bioMessages: [
        'Professional Developer | Creating Amazing Things',
        'Building the future with code',
        'Passionate about technology and innovation'
    ],
    startMessage: 'WELCOME TO MY PROFILE',
    startSubtitle: 'Click anywhere to enter',
    visitorCount: 1234567,
    followersCount: '10K',
    projectsCount: '25',
    yearsCount: '5+',
    skills: {
        python: 95,
        cpp: 88,
        csharp: 82,
        javascript: 90,
        html: 98,
        git: 85
    }
};

// ===== State =====
let state = {
    hasUserInteracted: false,
    currentAudio: null,
    isMuted: false,
    isMusicOn: true,
    isShowingSkills: false,
    isShowingProjects: false,
    currentTheme: 'home-theme',
    username: CONFIG.username,
    bio: CONFIG.bioMessages[0],
    bioMessageIndex: 0
};

// ===== DOM Elements =====
let elements = {};

// ===== Initialization =====
function initMedia() {
    console.log('Initializing media...');
    
    // Get all DOM elements
    elements = {
        background: document.getElementById('background'),
        backgroundMusic: document.getElementById('background-music'),
        hackerMusic: document.getElementById('hacker-music'),
        rainMusic: document.getElementById('rain-music'),
        animeMusic: document.getElementById('anime-music'),
        carMusic: document.getElementById('car-music'),
        startScreen: document.getElementById('start-screen'),
        startText: document.getElementById('start-text'),
        startSubtitle: document.querySelector('.start-subtitle'),
        profileBlock: document.getElementById('profile-block'),
        skillsBlock: document.getElementById('skills-block'),
        projectsBlock: document.getElementById('projects-block'),
        profileName: document.getElementById('profile-name'),
        profileBio: document.getElementById('profile-bio'),
        visitorCount: document.getElementById('visitor-count'),
        followersCount: document.getElementById('followers-count'),
        projectsCount: document.getElementById('projects-count'),
        yearsCount: document.getElementById('years-count'),
        resultsButtonContainer: document.getElementById('results-button-container'),
        resultsButton: document.getElementById('results-theme'),
        resultsHint: document.getElementById('results-hint'),
        homeButton: document.getElementById('home-theme'),
        hackerButton: document.getElementById('hacker-theme'),
        rainButton: document.getElementById('rain-theme'),
        animeButton: document.getElementById('anime-theme'),
        carButton: document.getElementById('car-theme'),
        volumeIcon: document.getElementById('volume-icon'),
        volumeSlider: document.getElementById('volume-slider'),
        transparencySlider: document.getElementById('transparency-slider'),
        musicIcon: document.getElementById('music-icon'),
        musicStatus: document.getElementById('music-status'),
        hackerOverlay: document.getElementById('hacker-overlay'),
        snowOverlay: document.getElementById('snow-overlay'),
        glitchOverlay: document.querySelector('.glitch-overlay'),
        profilePicture: document.querySelector('.profile-picture'),
        profileContainer: document.querySelector('.profile-container'),
        cursor: document.querySelector('.custom-cursor'),
        settingsButton: document.getElementById('settings-button'),
        settingsPanel: document.getElementById('settings-panel'),
        closeSettings: document.getElementById('close-settings'),
        saveSettings: document.getElementById('save-settings'),
        usernameInput: document.getElementById('username-input'),
        bioInput: document.getElementById('bio-input'),
        themeColorInput: document.getElementById('theme-color-input'),
        pythonBar: document.getElementById('python-bar'),
        cppBar: document.getElementById('cpp-bar'),
        csharpBar: document.getElementById('csharp-bar'),
        javascriptBar: document.getElementById('javascript-bar'),
        htmlBar: document.getElementById('html-bar'),
        gitBar: document.getElementById('git-bar')
    };

    // Check if elements exist
    if (!elements.background || !elements.backgroundMusic) {
        console.error('Media elements not found');
        return;
    }

    // Set initial volume
    elements.backgroundMusic.volume = 0.3;
    elements.background.volume = 0;
    elements.background.muted = true;

    // Try to play background video
    elements.background.play().catch(err => {
        console.error('Failed to play background video:', err);
    });

    // Initialize visitor counter
    initializeVisitorCounter();

    // Initialize stats
    updateStats();

    // Set up event listeners
    setupEventListeners();

    // Set up cursor
    setupCursor();

    // Start typing animations
    typeWriterStart();

    console.log('Media initialized');
}

// ===== Visitor Counter =====
function initializeVisitorCounter() {
    let totalVisitors = localStorage.getItem('totalVisitorCount');
    if (!totalVisitors) {
        totalVisitors = CONFIG.visitorCount;
        localStorage.setItem('totalVisitorCount', totalVisitors);
    } else {
        totalVisitors = parseInt(totalVisitors);
    }

    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
        totalVisitors++;
        localStorage.setItem('totalVisitorCount', totalVisitors);
        localStorage.setItem('hasVisited', 'true');
    }

    if (elements.visitorCount) {
        elements.visitorCount.textContent = totalVisitors.toLocaleString();
    }
}

// ===== Update Stats =====
function updateStats() {
    if (elements.followersCount) elements.followersCount.textContent = CONFIG.followersCount;
    if (elements.projectsCount) elements.projectsCount.textContent = CONFIG.projectsCount;
    if (elements.yearsCount) elements.yearsCount.textContent = CONFIG.yearsCount;
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Start screen click
    if (elements.startScreen) {
        elements.startScreen.addEventListener('click', handleStartClick);
        elements.startScreen.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleStartClick();
        });
    }

    // Theme buttons
    if (elements.homeButton) elements.homeButton.addEventListener('click', () => switchTheme('home'));
    if (elements.hackerButton) elements.hackerButton.addEventListener('click', () => switchTheme('hacker'));
    if (elements.rainButton) elements.rainButton.addEventListener('click', () => switchTheme('rain'));
    if (elements.animeButton) elements.animeButton.addEventListener('click', () => switchTheme('anime'));
    if (elements.carButton) elements.carButton.addEventListener('click', () => switchTheme('car'));

    // Touch support for theme buttons
    const themeButtons = [elements.homeButton, elements.hackerButton, elements.rainButton, elements.animeButton, elements.carButton];
    themeButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const theme = btn.id.replace('-theme', '');
                switchTheme(theme);
            });
        }
    });

    // Volume controls
    if (elements.volumeIcon) {
        elements.volumeIcon.addEventListener('click', toggleMute);
        elements.volumeIcon.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleMute();
        });
    }

    if (elements.volumeSlider) {
        elements.volumeSlider.addEventListener('input', (e) => {
            const volume = parseFloat(e.target.value);
            if (state.currentAudio) {
                state.currentAudio.volume = volume;
                state.isMuted = false;
                state.currentAudio.muted = false;
                updateMusicStatus();
            }
        });
    }

    // Transparency slider
    if (elements.transparencySlider) {
        elements.transparencySlider.addEventListener('input', (e) => {
            const opacity = parseFloat(e.target.value);
            updateTransparency(opacity);
        });
    }

    // Music toggle
    if (elements.musicIcon) {
        elements.musicIcon.addEventListener('click', toggleMusic);
        elements.musicIcon.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleMusic();
        });
    }

    // Results button
    if (elements.resultsButton) {
        elements.resultsButton.addEventListener('click', toggleResults);
        elements.resultsButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleResults();
        });
    }

    // Profile picture click
    if (elements.profilePicture) {
        elements.profilePicture.addEventListener('click', animateProfilePicture);
        elements.profilePicture.addEventListener('touchstart', (e) => {
            e.preventDefault();
            animateProfilePicture();
        });
    }

    // Settings button
    if (elements.settingsButton) {
        elements.settingsButton.addEventListener('click', () => {
            elements.settingsPanel.classList.remove('hidden');
        });
    }

    // Close settings
    if (elements.closeSettings) {
        elements.closeSettings.addEventListener('click', () => {
            elements.settingsPanel.classList.add('hidden');
        });
    }

    // Save settings
    if (elements.saveSettings) {
        elements.saveSettings.addEventListener('click', saveSettings);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC to close settings
        if (e.key === 'Escape' && elements.settingsPanel && !elements.settingsPanel.classList.contains('hidden')) {
            elements.settingsPanel.classList.add('hidden');
        }
        
        // Number keys for themes
        if (e.key >= '1' && e.key <= '5') {
            const themes = ['home', 'hacker', 'rain', 'anime', 'car'];
            const theme = themes[parseInt(e.key) - 1];
            switchTheme(theme);
        }
        
        // M key for mute
        if (e.key === 'm' || e.key === 'M') {
            toggleMute();
        }
        
        // S key for settings
        if (e.key === 's' || e.key === 'S') {
            if (elements.settingsPanel) {
                elements.settingsPanel.classList.toggle('hidden');
            }
        }
    });
}

// ===== Cursor Setup =====
function setupCursor() {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    
    if (isTouchDevice) {
        document.body.classList.add('touch-device');
        
        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            updateCursorPosition(touch.clientX, touch.clientY);
        });

        document.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            updateCursorPosition(touch.clientX, touch.clientY);
        });

        document.addEventListener('touchend', () => {
            if (elements.cursor) {
                elements.cursor.style.display = 'none';
            }
        });
    } else {
        document.addEventListener('mousemove', (e) => {
            updateCursorPosition(e.clientX, e.clientY);
        });

        document.addEventListener('mousedown', () => {
            if (elements.cursor) {
                elements.cursor.style.transform = 'scale(0.8) translate(-50%, -50%)';
            }
        });

        document.addEventListener('mouseup', () => {
            if (elements.cursor) {
                elements.cursor.style.transform = 'scale(1) translate(-50%, -50%)';
            }
        });

        document.addEventListener('mouseleave', () => {
            if (elements.cursor) {
                elements.cursor.style.display = 'none';
            }
        });

        document.addEventListener('mouseenter', () => {
            if (elements.cursor) {
                elements.cursor.style.display = 'block';
            }
        });
    }
}

function updateCursorPosition(x, y) {
    if (elements.cursor) {
        elements.cursor.style.left = x + 'px';
        elements.cursor.style.top = y + 'px';
        elements.cursor.style.display = 'block';
    }
}

// ===== Start Click Handler =====
function handleStartClick() {
    if (elements.startScreen) {
        elements.startScreen.classList.add('hidden');
    }
    
    if (state.currentAudio) {
        state.currentAudio.muted = false;
        state.currentAudio.play().catch(err => {
            console.error('Failed to play music after start screen click:', err);
        });
    }
    
    if (elements.profileBlock) {
        elements.profileBlock.classList.remove('hidden');
    }
    
    if (elements.resultsButtonContainer) {
        elements.resultsButtonContainer.classList.remove('hidden');
    }
    
    if (elements.profileContainer) {
        elements.profileContainer.classList.add('orbit');
    }
    
    // Start typing animations
    typeWriterName();
    typeWriterBio();
    
    state.hasUserInteracted = true;
}

// ===== Typing Animations =====
let startTextContent = '';
let startIndex = 0;
let startCursorVisible = true;

function typeWriterStart() {
    if (startIndex < CONFIG.startMessage.length) {
        startTextContent = CONFIG.startMessage.slice(0, startIndex + 1);
        startIndex++;
    }
    
    if (elements.startText) {
        elements.startText.textContent = startTextContent + (startCursorVisible ? '|' : ' ');
    }
    
    if (startIndex < CONFIG.startMessage.length) {
        setTimeout(typeWriterStart, 100);
    }
}

setInterval(() => {
    startCursorVisible = !startCursorVisible;
    if (elements.startText) {
        elements.startText.textContent = startTextContent + (startCursorVisible ? '|' : ' ');
    }
}, 500);

let nameText = '';
let nameIndex = 0;
let isNameDeleting = false;
let nameCursorVisible = true;

function typeWriterName() {
    const name = state.username || CONFIG.username;
    
    if (!isNameDeleting && nameIndex < name.length) {
        nameText = name.slice(0, nameIndex + 1);
        nameIndex++;
    } else if (isNameDeleting && nameIndex > 0) {
        nameText = name.slice(0, nameIndex - 1);
        nameIndex--;
    } else if (nameIndex === name.length) {
        isNameDeleting = true;
        setTimeout(typeWriterName, 10000);
        return;
    } else if (nameIndex === 0) {
        isNameDeleting = false;
    }
    
    if (elements.profileName) {
        elements.profileName.textContent = nameText + (nameCursorVisible ? '|' : ' ');
    }
    
    if (Math.random() < 0.1) {
        if (elements.profileName) {
            elements.profileName.classList.add('glitch');
            setTimeout(() => {
                if (elements.profileName) {
                    elements.profileName.classList.remove('glitch');
                }
            }, 200);
        }
    }
    
    setTimeout(typeWriterName, isNameDeleting ? 150 : 300);
}

setInterval(() => {
    nameCursorVisible = !nameCursorVisible;
    if (elements.profileName) {
        elements.profileName.textContent = nameText + (nameCursorVisible ? '|' : ' ');
    }
}, 500);

let bioText = '';
let bioIndex = 0;
let isBioDeleting = false;
let bioCursorVisible = true;

function typeWriterBio() {
    const bioMessages = CONFIG.bioMessages;
    const currentBio = bioMessages[state.bioMessageIndex] || bioMessages[0];
    
    if (!isBioDeleting && bioIndex < currentBio.length) {
        bioText = currentBio.slice(0, bioIndex + 1);
        bioIndex++;
    } else if (isBioDeleting && bioIndex > 0) {
        bioText = currentBio.slice(0, bioIndex - 1);
        bioIndex--;
    } else if (bioIndex === currentBio.length) {
        isBioDeleting = true;
        setTimeout(typeWriterBio, 2000);
        return;
    } else if (bioIndex === 0 && isBioDeleting) {
        isBioDeleting = false;
        state.bioMessageIndex = (state.bioMessageIndex + 1) % bioMessages.length;
    }
    
    if (elements.profileBio) {
        elements.profileBio.textContent = bioText + (bioCursorVisible ? '|' : ' ');
    }
    
    if (Math.random() < 0.1) {
        if (elements.profileBio) {
            elements.profileBio.classList.add('glitch');
            setTimeout(() => {
                if (elements.profileBio) {
                    elements.profileBio.classList.remove('glitch');
                }
            }, 200);
        }
    }
    
    setTimeout(typeWriterBio, isBioDeleting ? 75 : 150);
}

setInterval(() => {
    bioCursorVisible = !bioCursorVisible;
    if (elements.profileBio) {
        elements.profileBio.textContent = bioText + (bioCursorVisible ? '|' : ' ');
    }
}, 500);

// ===== Theme Switching =====
function switchTheme(theme) {
    const themeMap = {
        home: {
            video: 'assets/background.mp4',
            audio: elements.backgroundMusic,
            class: 'home-theme',
            color: '#00CED1'
        },
        hacker: {
            video: 'assets/hacker_background.mp4',
            audio: elements.hackerMusic,
            class: 'hacker-theme',
            color: '#22C55E'
        },
        rain: {
            video: 'assets/rain_background.mov',
            audio: elements.rainMusic,
            class: 'rain-theme',
            color: '#1E3A8A'
        },
        anime: {
            video: 'assets/anime_background.mp4',
            audio: elements.animeMusic,
            class: 'anime-theme',
            color: '#DC2626'
        },
        car: {
            video: 'assets/car_background.mp4',
            audio: elements.carMusic,
            class: 'car-theme',
            color: '#EAB308'
        }
    };

    const themeData = themeMap[theme];
    if (!themeData) return;

    // Update primary color
    document.documentElement.style.setProperty('--primary-color', themeData.color);

    // Fade out current video
    if (elements.background) {
        elements.background.style.opacity = '0';
    }

    setTimeout(() => {
        // Change video source
        if (elements.background) {
            elements.background.src = themeData.video;
        }

        // Switch audio
        if (state.currentAudio) {
            state.currentAudio.pause();
            state.currentAudio.currentTime = 0;
        }
        
        state.currentAudio = themeData.audio;
        
        if (state.currentAudio) {
            state.currentAudio.volume = elements.volumeSlider ? parseFloat(elements.volumeSlider.value) : 0.3;
            state.currentAudio.muted = state.isMuted;
            
            if (!state.isMuted && state.isMusicOn) {
                state.currentAudio.play().catch(err => {
                    console.error('Failed to play theme music:', err);
                });
            }
        }

        // Update theme class
        document.body.classList.remove('home-theme', 'hacker-theme', 'rain-theme', 'anime-theme', 'car-theme');
        document.body.classList.add(themeData.class);
        state.currentTheme = themeData.class;

        // Hide overlays
        if (elements.hackerOverlay) elements.hackerOverlay.classList.add('hidden');
        if (elements.snowOverlay) elements.snowOverlay.classList.add('hidden');

        // Show results button only for hacker theme
        if (themeData.class === 'hacker-theme') {
            if (elements.resultsButtonContainer) {
                elements.resultsButtonContainer.classList.remove('hidden');
            }
        } else {
            if (elements.resultsButtonContainer) {
                elements.resultsButtonContainer.classList.add('hidden');
            }
            if (elements.skillsBlock) {
                elements.skillsBlock.classList.add('hidden');
            }
            if (elements.projectsBlock) {
                elements.projectsBlock.classList.add('hidden');
            }
            if (elements.resultsHint) {
                elements.resultsHint.classList.add('hidden');
            }
            if (elements.profileBlock) {
                elements.profileBlock.classList.remove('hidden');
            }
            state.isShowingSkills = false;
            state.isShowingProjects = false;
        }

        // Fade in new video
        if (elements.background) {
            elements.background.style.opacity = '1';
        }

        // Restart profile animation
        if (elements.profileContainer) {
            elements.profileContainer.classList.remove('orbit');
            void elements.profileContainer.offsetWidth;
            elements.profileContainer.classList.add('orbit');
        }
        
        updateMusicStatus();
    }, 500);
}

// ===== Toggle Mute =====
function toggleMute() {
    state.isMuted = !state.isMuted;
    
    if (state.currentAudio) {
        state.currentAudio.muted = state.isMuted;
    }
    
    updateMusicStatus();
}

// ===== Toggle Music =====
function toggleMusic() {
    state.isMusicOn = !state.isMusicOn;
    
    if (state.currentAudio) {
        if (state.isMusicOn && !state.isMuted) {
            state.currentAudio.play().catch(err => {
                console.error('Failed to play music:', err);
            });
        } else {
            state.currentAudio.pause();
        }
    }
    
    updateMusicStatus();
}

// ===== Update Music Status =====
function updateMusicStatus() {
    if (elements.musicStatus) {
        if (state.isMusicOn && !state.isMuted) {
            elements.musicStatus.textContent = 'ON';
            elements.musicStatus.style.color = 'var(--primary-color)';
        } else {
            elements.musicStatus.textContent = 'OFF';
            elements.musicStatus.style.color = '#ff4444';
        }
    }
}

// ===== Update Transparency =====
function updateTransparency(opacity) {
    const blocks = [elements.profileBlock, elements.skillsBlock, elements.projectsBlock];
    
    blocks.forEach(block => {
        if (block) {
            if (opacity === 0) {
                block.style.background = 'rgba(0, 0, 0, 0)';
                block.style.backdropFilter = 'none';
            } else {
                block.style.background = `rgba(0, 0, 0, ${opacity})`;
                block.style.backdropFilter = `blur(${10 * opacity}px)`;
            }
        }
    });
}

// ===== Toggle Results =====
function toggleResults() {
    if (!state.isShowingSkills && !state.isShowingProjects) {
        // Show skills
        if (elements.profileBlock) {
            elements.profileBlock.style.opacity = '0';
            elements.profileBlock.style.transform = 'translate(-50%, -50%) translateX(-100px)';
        }
        
        setTimeout(() => {
            if (elements.profileBlock) {
                elements.profileBlock.classList.add('hidden');
            }
            if (elements.skillsBlock) {
                elements.skillsBlock.classList.remove('hidden');
                elements.skillsBlock.style.opacity = '0';
                elements.skillsBlock.style.transform = 'translate(-50%, -50%) translateX(100px)';
                
                setTimeout(() => {
                    if (elements.skillsBlock) {
                        elements.skillsBlock.style.opacity = '1';
                        elements.skillsBlock.style.transform = 'translate(-50%, -50%)';
                    }
                }, 50);
            }
            
            // Animate skill bars
            animateSkillBars();
            
            if (elements.resultsHint) {
                elements.resultsHint.classList.remove('hidden');
            }
            
            state.isShowingSkills = true;
        }, 500);
    } else if (state.isShowingSkills && !state.isShowingProjects) {
        // Show projects
        if (elements.skillsBlock) {
            elements.skillsBlock.style.opacity = '0';
            elements.skillsBlock.style.transform = 'translate(-50%, -50%) translateX(-100px)';
        }
        
        setTimeout(() => {
            if (elements.skillsBlock) {
                elements.skillsBlock.classList.add('hidden');
            }
            if (elements.projectsBlock) {
                elements.projectsBlock.classList.remove('hidden');
                elements.projectsBlock.style.opacity = '0';
                elements.projectsBlock.style.transform = 'translate(-50%, -50%) translateX(100px)';
                
                setTimeout(() => {
                    if (elements.projectsBlock) {
                        elements.projectsBlock.style.opacity = '1';
                        elements.projectsBlock.style.transform = 'translate(-50%, -50%)';
                    }
                }, 50);
            }
            
            state.isShowingSkills = false;
            state.isShowingProjects = true;
        }, 500);
    } else {
        // Return to profile
        if (elements.projectsBlock) {
            elements.projectsBlock.style.opacity = '0';
            elements.projectsBlock.style.transform = 'translate(-50%, -50%) translateX(-100px)';
        }
        
        setTimeout(() => {
            if (elements.projectsBlock) {
                elements.projectsBlock.classList.add('hidden');
            }
            if (elements.profileBlock) {
                elements.profileBlock.classList.remove('hidden');
                elements.profileBlock.style.opacity = '0';
                elements.profileBlock.style.transform = 'translate(-50%, -50%) translateX(100px)';
                
                setTimeout(() => {
                    if (elements.profileBlock) {
                        elements.profileBlock.style.opacity = '1';
                        elements.profileBlock.style.transform = 'translate(-50%, -50%)';
                    }
                }, 50);
            }
            
            if (elements.resultsHint) {
                elements.resultsHint.classList.add('hidden');
            }
            
            state.isShowingSkills = false;
            state.isShowingProjects = false;
        }, 500);
    }
}

// ===== Animate Skill Bars =====
function animateSkillBars() {
    const skills = CONFIG.skills;
    
    setTimeout(() => {
        if (elements.pythonBar) elements.pythonBar.style.width = skills.python + '%';
    }, 100);
    
    setTimeout(() => {
        if (elements.cppBar) elements.cppBar.style.width = skills.cpp + '%';
    }, 300);
    
    setTimeout(() => {
        if (elements.csharpBar) elements.csharpBar.style.width = skills.csharp + '%';
    }, 500);
    
    setTimeout(() => {
        if (elements.javascriptBar) elements.javascriptBar.style.width = skills.javascript + '%';
    }, 700);
    
    setTimeout(() => {
        if (elements.htmlBar) elements.htmlBar.style.width = skills.html + '%';
    }, 900);
    
    setTimeout(() => {
        if (elements.gitBar) elements.gitBar.style.width = skills.git + '%';
    }, 1100);
}

// ===== Animate Profile Picture =====
function animateProfilePicture() {
    if (elements.profileContainer) {
        elements.profileContainer.classList.remove('fast-orbit');
        elements.profileContainer.classList.remove('orbit');
        void elements.profileContainer.offsetWidth;
        elements.profileContainer.classList.add('fast-orbit');
        
        setTimeout(() => {
            if (elements.profileContainer) {
                elements.profileContainer.classList.remove('fast-orbit');
                void elements.profileContainer.offsetWidth;
                elements.profileContainer.classList.add('orbit');
            }
        }, 500);
    }
    
    // Trigger glitch overlay
    if (elements.glitchOverlay) {
        elements.glitchOverlay.style.opacity = '1';
        setTimeout(() => {
            if (elements.glitchOverlay) {
                elements.glitchOverlay.style.opacity = '0';
            }
        }, 500);
    }
}

// ===== Save Settings =====
function saveSettings() {
    if (elements.usernameInput) {
        state.username = elements.usernameInput.value;
        localStorage.setItem('username', state.username);
    }
    
    if (elements.bioInput) {
        CONFIG.bioMessages[0] = elements.bioInput.value;
        localStorage.setItem('bio', elements.bioInput.value);
    }
    
    if (elements.themeColorInput) {
        const color = elements.themeColorInput.value;
        document.documentElement.style.setProperty('--primary-color', color);
        localStorage.setItem('themeColor', color);
    }
    
    // Update display
    if (elements.profileName) {
        elements.profileName.textContent = state.username + (nameCursorVisible ? '|' : ' ');
    }
    
    // Close settings
    if (elements.settingsPanel) {
        elements.settingsPanel.classList.add('hidden');
    }
    
    // Restart name animation
    nameText = '';
    nameIndex = 0;
    isNameDeleting = false;
    typeWriterName();
}

// ===== Load Settings =====
function loadSettings() {
    const savedUsername = localStorage.getItem('username');
    const savedBio = localStorage.getItem('bio');
    const savedColor = localStorage.getItem('themeColor');
    
    if (savedUsername) {
        state.username = savedUsername;
        if (elements.usernameInput) {
            elements.usernameInput.value = savedUsername;
        }
    }
    
    if (savedBio) {
        CONFIG.bioMessages[0] = savedBio;
        if (elements.bioInput) {
            elements.bioInput.value = savedBio;
        }
    }
    
    if (savedColor) {
        document.documentElement.style.setProperty('--primary-color', savedColor);
        if (elements.themeColorInput) {
            elements.themeColorInput.value = savedColor;
        }
    }
}

// ===== DOM Content Loaded =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    
    // Initialize
    initMedia();
    loadSettings();
    
    // Add loading animation
    document.body.classList.add('loaded');
});

// ===== Window Load =====
window.addEventListener('load', () => {
    console.log('Window loaded');
    
    // Preload assets
    preloadAssets();
});

// ===== Preload Assets =====
function preloadAssets() {
    const assetFiles = [
        'assets/background.mp4',
        'assets/hacker_background.mp4',
        'assets/rain_background.mov',
        'assets/anime_background.mp4',
        'assets/car_background.mp4',
        'assets/background_music.mp3',
        'assets/hacker_music.mp3',
        'assets/rain_music.mp3',
        'assets/anime_music.mp3',
        'assets/car_music.mp3',
        'assets/profile.gif',
        'assets/developer.png',
        'assets/verified.gif',
        'assets/partner.gif',
        'assets/owner.gif',
        'assets/github.png',
        'assets/discord.png',
        'assets/youtube.png',
        'assets/tiktok.png',
        'assets/twitter.png',
        'assets/python.png',
        'assets/cpp.png',
        'assets/csharp.png',
        'assets/javascript.png'
    ];
    
    assetFiles.forEach(file => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = file;
        document.head.appendChild(link);
    });
}

// ===== Error Handling =====
window.addEventListener('error', (e) => {
    console.error('Error:', e.message, e.filename, e.lineno, e.colno);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled rejection:', e.reason);
});

// ===== Console Welcome Message =====
console.log(`
%c Gun.Lol Clone %c v1.0 
%c================
%c
%c Keyboard Shortcuts:
%c 1-5: Switch themes
%c M: Toggle mute
%c S: Toggle settings
%c ESC: Close settings
%c
%c Enjoy! 
`,
'background: linear-gradient(to right, #00CED1, #FF6B9E); color: #000; font-size: 20px; font-weight: bold; padding: 10px 20px;',
'',
'',
'',
'color: #00CED1; font-weight: bold;',
'color: #fff;',
'color: #fff;',
'color: #fff;',
'color: #fff;',
'color: #00CED1; font-style: italic;'
);
