// Game variables
let cat;
let cursors;
let obstacles;
let fish;
let ground;
let sky;
let score = 0;
let scoreText;
let gameOver = false;
let gameWon = false;
let distance = 0;
let distanceText;
let gameOverText;
let restartText;
let winText;
let debugMode = false;
let debugGraphics = null;
let gameStarted = false;
let startScreen = null;
let startScreenElements = [];

// Jump mechanics variables
let isPressingJump = false;
let jumpPressStartTime = 0;
let jumpChargeIndicator = null;
let maxJumpPressTime = 800; // Maximum press time in milliseconds
let minJumpVelocity = -400; // Minimum jump velocity
let maxJumpVelocity = -700; // Maximum jump velocity
let minChargeIndicatorTime = 150; // Minimum press time to show charge indicator (ms)
let lastIgnoredFeedbackTime = 0; // Throttle feedback to prevent spam
let chargingSoundOscillator = null; // Continuous charging sound oscillator
let chargingSoundGain = null; // Gain node for charging sound

// Mobile detection and screen size calculation
function getGameDimensions() {
    const isMobile = window.innerWidth <= 820;
    const isIPhone = /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    if (isMobile) {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    } else {
        return {
            width: 800,
            height: 600
        };
    }
}

const gameDimensions = getGameDimensions();

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: gameDimensions.width,
    height: gameDimensions.height,
    parent: 'game',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameDimensions.width,
        height: gameDimensions.height
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Constants
const SCROLL_SPEED = 3;
const JUMP_VELOCITY = -500;
const OBSTACLE_SPAWN_TIME = 2000;
const FISH_SPAWN_TIME = 3000;
const WIN_DISTANCE = 5000;

// Enhanced Audio System with proper state management
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.musicGainNode = null;
        this.sounds = {};
        this.currentMusicTrack = 1;
        this.musicState = 'stopped'; // stopped, starting, playing, stopping
        this.musicLoopTimeout = null;
        this.initPromise = null;
    }

    async init() {
        if (this.audioContext) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 AudioContext created - state:', this.audioContext.state);
            
            // Create sound effects
            this.createSoundEffects();
            
            // Mobile devices require user interaction before audio can play
            if (this.audioContext.state === 'suspended') {
                console.log('🔊 AudioContext suspended, will resume on user interaction');
                
                // Try to resume immediately (works on some devices)
                try {
                    await this.audioContext.resume();
                    console.log('🔊 AudioContext resumed - state:', this.audioContext.state);
                } catch (e) {
                    console.log('🔊 Will resume on first user interaction');
                }
            }
        } catch (error) {
            console.error('❌ Failed to initialize audio:', error);
        }
    }

    createSoundEffects() {
        // Jump sound (default/fallback)
        this.sounds.jump = () => this.playSound(
            [{ freq: 200, time: 0 }, { freq: 400, time: 0.1 }],
            0.3,
            0.1
        );
        
        // Variable jump sound based on charge level - duration reflects charge
        this.sounds.jumpCharged = (chargeRatio) => {
            // Keep consistent pitch and volume, vary duration
            const startFreq = 200;
            const endFreq = 400;
            const volume = 0.3; // Consistent volume
            
            // Scale duration based on charge level
            const baseDuration = 0.1;  // Quick tap duration
            const maxDuration = 0.35;  // Fully charged duration
            const duration = baseDuration + (maxDuration - baseDuration) * chargeRatio;
            
            // Create extended sound with consistent pitch rise
            this.playSound(
                [{ freq: startFreq, time: 0 }, { freq: endFreq, time: duration * 0.3 }],
                volume,
                duration
            );
        };
        
        // Collect sound
        this.sounds.collect = () => this.playSound(
            [{ freq: 523.25, time: 0 }, { freq: 659.25, time: 0.05 }, { freq: 783.99, time: 0.1 }],
            0.3,
            0.2
        );
        
        // Game over sound
        this.sounds.gameOver = () => this.playSound(
            [{ freq: 400, time: 0 }, { freq: 100, time: 0.5 }],
            0.3,
            0.5
        );
        
        // Win sound
        this.sounds.win = () => {
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                setTimeout(() => this.playTone(freq, 0.3, 0.3), i * 100);
            });
        };
        
        // Jump ignored/blocked sound (more noticeable negative feedback)
        this.sounds.jumpBlocked = () => this.playSound(
            [{ freq: 200, time: 0 }, { freq: 100, time: 0.08 }, { freq: 80, time: 0.15 }],
            0.4,
            0.2
        );
        
        // Continuous charging sound
        this.sounds.startChargingSound = () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            
            try {
                // Stop any existing charging sound
                this.sounds.stopChargingSound();
                
                // Create oscillator for continuous charging sound
                chargingSoundOscillator = this.audioContext.createOscillator();
                chargingSoundGain = this.audioContext.createGain();
                
                // Set up a low, subtle charging tone
                chargingSoundOscillator.frequency.setValueAtTime(120, this.audioContext.currentTime);
                chargingSoundOscillator.type = 'sine';
                
                // Start with very low volume and fade in
                chargingSoundGain.gain.setValueAtTime(0, this.audioContext.currentTime);
                chargingSoundGain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1);
                
                // Connect nodes
                chargingSoundOscillator.connect(chargingSoundGain);
                chargingSoundGain.connect(this.audioContext.destination);
                
                // Start the oscillator
                chargingSoundOscillator.start();
                
                console.log('🔊 Charging sound started');
            } catch (error) {
                console.error('Error starting charging sound:', error);
            }
        };
        
        this.sounds.stopChargingSound = () => {
            if (chargingSoundOscillator && chargingSoundGain) {
                try {
                    // Fade out quickly
                    chargingSoundGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.05);
                    
                    // Stop after fade out
                    setTimeout(() => {
                        if (chargingSoundOscillator) {
                            chargingSoundOscillator.stop();
                            chargingSoundOscillator = null;
                        }
                        if (chargingSoundGain) {
                            chargingSoundGain.disconnect();
                            chargingSoundGain = null;
                        }
                    }, 60);
                    
                    console.log('🔊 Charging sound stopped');
                } catch (error) {
                    console.error('Error stopping charging sound:', error);
                }
            }
        };
        
        this.sounds.updateChargingSound = (chargeRatio) => {
            if (chargingSoundOscillator && chargingSoundGain && this.audioContext) {
                try {
                    // Gradually increase frequency and volume as charge builds
                    const baseFreq = 120;
                    const maxFreq = 180;
                    const targetFreq = baseFreq + (maxFreq - baseFreq) * chargeRatio;
                    
                    const baseVolume = 0.08;
                    const maxVolume = 0.15;
                    const targetVolume = baseVolume + (maxVolume - baseVolume) * chargeRatio;
                    
                    // Smooth transitions
                    chargingSoundOscillator.frequency.linearRampToValueAtTime(targetFreq, this.audioContext.currentTime + 0.1);
                    chargingSoundGain.gain.linearRampToValueAtTime(targetVolume, this.audioContext.currentTime + 0.1);
                } catch (error) {
                    console.error('Error updating charging sound:', error);
                }
            }
        };
    }

    playSound(frequencies, volume, duration) {
        if (!this.audioContext || this.audioContext.state !== 'running') return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Set frequency changes
            frequencies.forEach(({ freq, time }) => {
                if (time === 0) {
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                } else {
                    oscillator.frequency.exponentialRampToValueAtTime(freq, this.audioContext.currentTime + time);
                }
            });
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    playTone(frequency, volume, duration) {
        this.playSound([{ freq: frequency, time: 0 }], volume, duration);
    }

    async startMusic(trackNumber = null) {
        console.log('🎵 startMusic called - current state:', this.musicState);
        
        // Prevent multiple simultaneous starts
        if (this.musicState === 'starting' || this.musicState === 'stopping') {
            console.log('⏳ Music is transitioning, waiting...');
            setTimeout(() => this.startMusic(trackNumber), 200);
            return;
        }
        
        // Stop existing music if playing
        if (this.musicState === 'playing') {
            console.log('🛑 Stopping existing music first...');
            await this.stopMusic();
            // Small delay to ensure clean transition
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.musicState = 'starting';
        
        try {
            // Ensure audio context is ready
            if (!this.audioContext) {
                await this.init();
            }
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Use provided track or current track
            const track = trackNumber || this.currentMusicTrack;
            this.currentMusicTrack = track;
            
            // Create fresh gain node
            this.musicGainNode = this.audioContext.createGain();
            this.musicGainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            this.musicGainNode.connect(this.audioContext.destination);
            
            this.musicState = 'playing';
            console.log('✅ Music started - track:', track);
            
            // Start the music loop
            this.playMusicLoop(track);
            
        } catch (error) {
            console.error('❌ Failed to start music:', error);
            this.musicState = 'stopped';
        }
    }

    playMusicLoop(track) {
        if (this.musicState !== 'playing') return;
        
        const tracks = {
            1: {
                tempo: 120,
                bassNotes: [130.81, 146.83, 164.81, 146.83],
                melodyNotes: [523.25, 0, 659.25, 0, 783.99, 0, 659.25, 0],
                bassType: 'triangle',
                melodyType: 'square'
            },
            2: {
                tempo: 140,
                bassNotes: [174.61, 196.00, 220.00, 196.00],
                melodyNotes: [698.46, 0, 783.99, 0, 880.00, 0, 783.99, 0],
                bassType: 'sawtooth',
                melodyType: 'triangle'
            },
            3: {
                tempo: 100,
                bassNotes: [110.00, 123.47, 130.81, 123.47],
                melodyNotes: [440.00, 0, 493.88, 0, 523.25, 0, 493.88, 0],
                bassType: 'triangle',
                melodyType: 'sine'
            }
        };
        
        const currentTrack = tracks[track] || tracks[1];
        const now = this.audioContext.currentTime;
        const beatLength = 60 / currentTrack.tempo;
        
        try {
            // Bass line
            currentTrack.bassNotes.forEach((freq, i) => {
                this.scheduleNote(freq, currentTrack.bassType, 
                    now + i * beatLength, beatLength, 0.2);
            });
            
            // Melody
            currentTrack.melodyNotes.forEach((freq, i) => {
                if (freq > 0) {
                    this.scheduleNote(freq, currentTrack.melodyType,
                        now + i * beatLength * 0.5, beatLength * 0.5, 0.1);
                }
            });
            
            // Schedule next loop
            const loopDuration = currentTrack.bassNotes.length * beatLength * 1000;
            this.musicLoopTimeout = setTimeout(() => {
                if (this.musicState === 'playing') {
                    this.playMusicLoop(track);
                }
            }, loopDuration);
            
        } catch (error) {
            console.error('Error in music loop:', error);
            this.musicState = 'stopped';
        }
    }

    scheduleNote(frequency, type, startTime, duration, volume) {
        if (!this.musicGainNode) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.8);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.musicGainNode);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    async stopMusic() {
        console.log('🛑 stopMusic called - current state:', this.musicState);
        
        if (this.musicState === 'stopped' || this.musicState === 'stopping') {
            return;
        }
        
        this.musicState = 'stopping';
        
        // Clear any pending loops
        if (this.musicLoopTimeout) {
            clearTimeout(this.musicLoopTimeout);
            this.musicLoopTimeout = null;
        }
        
        // Fade out and disconnect
        if (this.musicGainNode) {
            try {
                this.musicGainNode.gain.exponentialRampToValueAtTime(0.01, 
                    this.audioContext.currentTime + 0.3);
                
                // Wait for fade out then disconnect
                await new Promise(resolve => setTimeout(resolve, 350));
                
                this.musicGainNode.disconnect();
                this.musicGainNode = null;
            } catch (error) {
                console.error('Error stopping music:', error);
            }
        }
        
        this.musicState = 'stopped';
        console.log('✅ Music stopped');
    }

    changeTrack() {
        this.currentMusicTrack = (this.currentMusicTrack % 3) + 1;
    }

    playEffect(effectName, ...args) {
        if (this.sounds[effectName] && this.audioContext && 
            this.audioContext.state === 'running') {
            this.sounds[effectName](...args);
        }
    }
}

// Create global audio manager instance
const audioManager = new AudioManager();

// Initialize the game
const game = new Phaser.Game(config);

function preload() {
    // We'll create all graphics in the create function instead
}

function createGameSprites(scene) {
    // Create cat sprite using emoji
    if (scene.textures.exists('cat')) {
        scene.textures.remove('cat');
    }
    
    const catGraphics = scene.make.graphics({ x: 0, y: 0 }, false);
    catGraphics.fillStyle(0xFFFFFF, 0);
    catGraphics.fillRect(0, 0, 60, 60);
    
    const style = { font: '50px Arial', fill: '#000000' };
    const catEmoji = scene.make.text({
        x: 30,
        y: 30,
        text: '🐱',
        style: style,
        origin: { x: 0.5, y: 0.5 }
    }, false);
    
    const rt = scene.make.renderTexture({ x: 0, y: 0, width: 60, height: 60 }, false);
    rt.clear();
    rt.draw(catEmoji, 30, 30);
    rt.saveTexture('cat');
    
    catGraphics.destroy();
    catEmoji.destroy();
    rt.destroy();
    
    // Create obstacle texture
    if (scene.textures.exists('obstacle')) {
        scene.textures.remove('obstacle');
    }
    const obstacleGraphics = scene.make.graphics({ x: 0, y: 0 }, false);
    obstacleGraphics.fillStyle(0x8B4513);
    obstacleGraphics.fillRect(0, 0, 50, 50);
    obstacleGraphics.lineStyle(2, 0x654321);
    obstacleGraphics.strokeRect(0, 0, 50, 50);
    obstacleGraphics.generateTexture('obstacle', 50, 50);
    obstacleGraphics.destroy();
    
    // Create fish texture
    if (scene.textures.exists('fish')) {
        scene.textures.remove('fish');
    }
    const fishGraphics = scene.make.graphics({ x: 0, y: 0 }, false);
    fishGraphics.fillStyle(0x1E90FF);
    fishGraphics.fillEllipse(20, 15, 40, 30);
    fishGraphics.fillStyle(0x4169E1);
    fishGraphics.fillTriangle(35, 15, 45, 10, 45, 20);
    fishGraphics.fillStyle(0xFFFFFF);
    fishGraphics.fillCircle(10, 12, 3);
    fishGraphics.fillStyle(0x000000);
    fishGraphics.fillCircle(10, 12, 1);
    fishGraphics.generateTexture('fish', 50, 30);
    fishGraphics.destroy();
    
    // Create ground texture
    if (scene.textures.exists('ground')) {
        scene.textures.remove('ground');
    }
    const groundGraphics = scene.make.graphics({ x: 0, y: 0 }, false);
    groundGraphics.fillStyle(0x228B22);
    groundGraphics.fillRect(0, 0, 800, 100);
    groundGraphics.fillStyle(0x006400);
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * 800;
        const y = Math.random() * 100;
        groundGraphics.fillRect(x, y, 3, 8);
    }
    groundGraphics.generateTexture('ground', 800, 100);
    groundGraphics.destroy();
}

function create() {
    createGameSprites(this);
    
    // Create sky background (responsive to screen size)
    sky = this.add.rectangle(0, gameDimensions.height/2, 8000, gameDimensions.height, 0x87CEEB);
    sky.setOrigin(0, 0.5);
    
    // Create ground (responsive to screen size)
    ground = this.physics.add.staticGroup();
    const groundY = gameDimensions.height - 50; // 50px from bottom
    for (let i = 0; i < 20; i++) {
        ground.create(400 + i * 800, groundY, 'ground');
    }
    
    // Create cat (responsive positioning) - positioned left for more reaction time
    const catY = gameDimensions.height - 150; // 150px from bottom
    const catX = gameDimensions.width <= 820 ? 80 : 120; // Further left on mobile
    cat = this.physics.add.sprite(catX, catY, 'cat');
    cat.setBounce(0.1); // Reduced from 0.2 to 0.1 (50% less wiggle)
    cat.body.setGravityY(0);
    cat.body.setSize(45, 50, true);
    
    // Create groups
    obstacles = this.physics.add.group();
    fish = this.physics.add.group();
    
    // Add colliders
    this.physics.add.collider(cat, ground);
    this.physics.add.overlap(cat, obstacles, hitObstacle, null, this);
    this.physics.add.overlap(cat, fish, collectFish, null, this);
    
    // Create UI (mobile-responsive)
    const isMobile = gameDimensions.width <= 820;
    const uiScale = isMobile ? 0.8 : 1.0;
    const scoreFontSize = isMobile ? '28px' : '32px';
    const distanceFontSize = isMobile ? '20px' : '24px';
    
    scoreText = this.add.text(16, 16, 'Score: 0', { 
        fontSize: scoreFontSize, 
        fill: '#000',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: { x: 10, y: 5 },
        fontWeight: 'bold'
    });
    scoreText.setScrollFactor(0); // Make it stay fixed to camera
    
    distanceText = this.add.text(16, isMobile ? 50 : 60, 'Distance: 0m', { 
        fontSize: distanceFontSize, 
        fill: '#000',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: { x: 10, y: 5 },
        fontWeight: 'bold'
    });
    distanceText.setScrollFactor(0); // Make it stay fixed to camera
    
    // Show start screen
    if (!gameStarted) {
        showStartScreen(this);
    }
    
    // Input handling (mobile-optimized with variable jump)
    this.input.on('pointerdown', (pointer) => {
        // Prevent default touch behavior
        pointer.event.preventDefault();
        
        if (!gameStarted) {
            startGame(this);
        } else if (!gameOver && !gameWon) {
            startJumpCharge.call(this);
        }
    }, this);
    
    this.input.on('pointerup', (pointer) => {
        if (gameStarted && !gameOver && !gameWon) {
            executeJump.call(this);
        }
    }, this);
    
    // Keep keyboard support for desktop
    this.input.keyboard.on('keydown-SPACE', (event) => {
        if (!gameStarted) {
            startGame(this);
        } else if (!gameOver && !gameWon && !event.repeat) {
            startJumpCharge.call(this);
        }
    }, this);
    
    this.input.keyboard.on('keyup-SPACE', () => {
        if (gameStarted && !gameOver && !gameWon) {
            executeJump.call(this);
        }
    }, this);
}

function startJumpCharge() {
    // Only start charging if cat is on the ground
    if (cat.body.touching.down && !isPressingJump) {
        isPressingJump = true;
        jumpPressStartTime = Date.now();
        
        // Don't create indicator immediately - wait for minimum time
        // Start the charging animation which will create indicator if needed
        updateJumpChargeIndicator();
    } else if (!cat.body.touching.down) {
        // Provide feedback when jump attempt is ignored (cat not on ground)
        // Throttle feedback to prevent spam (max once per 300ms)
        const now = Date.now();
        if (now - lastIgnoredFeedbackTime > 300) {
            showJumpIgnoredFeedback();
            lastIgnoredFeedbackTime = now;
        }
    }
}

function executeJump() {
    if (isPressingJump && cat.body.touching.down) {
        // Calculate jump power based on press duration
        const pressDuration = Date.now() - jumpPressStartTime;
        const chargeRatio = Math.min(pressDuration / maxJumpPressTime, 1.0);
        
        // Calculate jump velocity (linear interpolation between min and max)
        const jumpVelocity = minJumpVelocity + (maxJumpVelocity - minJumpVelocity) * chargeRatio;
        
        // Apply the jump
        cat.setVelocityY(jumpVelocity);
        
        // Stop charging sound and play jump sound
        audioManager.playEffect('stopChargingSound');
        audioManager.playEffect('jumpCharged', chargeRatio);
        
        // Clean up charge indicator
        if (jumpChargeIndicator) {
            jumpChargeIndicator.destroy();
            jumpChargeIndicator = null;
        }
        
        const showedIndicator = pressDuration >= minChargeIndicatorTime;
        const soundDuration = 0.1 + (0.25 * chargeRatio); // 0.1s to 0.35s
        console.log(`Jump: duration=${pressDuration}ms, charge=${(chargeRatio * 100).toFixed(1)}%, velocity=${jumpVelocity.toFixed(1)}, sound=${(soundDuration * 1000).toFixed(0)}ms, indicator=${showedIndicator ? 'shown' : 'hidden'}`);
    }
    
    // Stop charging sound and reset jump state
    audioManager.playEffect('stopChargingSound');
    isPressingJump = false;
}

function updateJumpChargeIndicator() {
    if (!isPressingJump) return;
    
    const scene = game.scene.scenes[0];
    const pressDuration = Date.now() - jumpPressStartTime;
    const chargeRatio = Math.min(pressDuration / maxJumpPressTime, 1.0);
    
    // Only create and show indicator if press duration exceeds minimum threshold
    if (pressDuration >= minChargeIndicatorTime) {
        // Create indicator if it doesn't exist
        if (!jumpChargeIndicator) {
            jumpChargeIndicator = scene.add.graphics();
            jumpChargeIndicator.setScrollFactor(0);
            jumpChargeIndicator.setDepth(200);
            
            // Start continuous charging sound
            audioManager.playEffect('startChargingSound');
            console.log('Charge mode started - continuous charging sound began');
        }
        
        // Update charging sound based on charge ratio
        audioManager.playEffect('updateChargingSound', chargeRatio);
        
        // Update indicator position to follow cat
        const catScreenX = cat.x - scene.cameras.main.scrollX;
        const catScreenY = cat.y - scene.cameras.main.scrollY;
        jumpChargeIndicator.x = catScreenX;
        jumpChargeIndicator.y = catScreenY + 40;
        
        // Draw charge indicator
        jumpChargeIndicator.clear();
        
        // Background bar
        jumpChargeIndicator.fillStyle(0x000000, 0.5);
        jumpChargeIndicator.fillRect(-25, 0, 50, 8);
        
        // Charge bar (color changes from green to yellow to red)
        let color;
        if (chargeRatio < 0.5) {
            color = 0x00ff00; // Green
        } else if (chargeRatio < 0.8) {
            color = 0xffff00; // Yellow
        } else {
            color = 0xff0000; // Red
        }
        
        jumpChargeIndicator.fillStyle(color, 0.8);
        jumpChargeIndicator.fillRect(-24, 1, 48 * chargeRatio, 6);
    }
    
    // Continue updating if still pressing
    if (isPressingJump) {
        setTimeout(updateJumpChargeIndicator, 16); // ~60fps
    }
}

function showJumpIgnoredFeedback() {
    const scene = game.scene.scenes[0];
    
    // Play enhanced blocked jump sound (more noticeable)
    audioManager.playEffect('jumpBlocked');
    
    // Add subtle visual feedback to cat to show input was detected but invalid
    scene.tweens.add({
        targets: cat,
        scaleX: 1.1,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        ease: 'Power2'
    });
    
    console.log('Jump attempt ignored - cat not on ground');
}

// Legacy function for backward compatibility
function jump() {
    if (cat.body.touching.down) {
        cat.setVelocityY(JUMP_VELOCITY);
        audioManager.playEffect('jump');
    }
}

function update() {
    if (!gameStarted || gameOver || gameWon) return;
    
    // Move cat forward
    cat.x += SCROLL_SPEED;
    
    // Camera follows cat (adjusted for new cat position)
    const cameraOffset = gameDimensions.width <= 820 ? 80 : 120;
    this.cameras.main.scrollX = cat.x - cameraOffset;
    
    // Update distance
    distance = Math.floor(cat.x / 10);
    distanceText.setText('Distance: ' + distance + 'm');
    
    // Cat rotation based on velocity
    if (!cat.body.touching.down) {
        cat.angle = Math.min(30, Math.max(-30, cat.body.velocity.y * 0.05));
    } else {
        cat.angle = 0;
    }
    
    // Check win condition
    if (distance >= WIN_DISTANCE / 10) {
        gameWon = true;
        showWinScreen(this);
    }
    
    // Cleanup off-screen objects
    obstacles.children.entries.forEach(obstacle => {
        if (obstacle.x < this.cameras.main.scrollX - 100) {
            obstacle.destroy();
        }
    });
    
    fish.children.entries.forEach(f => {
        if (f.x < this.cameras.main.scrollX - 100) {
            f.destroy();
        }
    });
}

function spawnObstacle() {
    if (!gameStarted || gameOver || gameWon || !obstacles) return;
    
    const obstacleY = gameDimensions.height - 125; // Responsive obstacle position
    const spawnX = game.scene.scenes[0].cameras.main.scrollX + gameDimensions.width + 50;
    const obstacle = obstacles.create(spawnX, obstacleY, 'obstacle');
    
    if (obstacle) {
        obstacle.setActive(true);
        obstacle.setVisible(true);
        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.body.setSize(40, 40, true);
        obstacle.body.setOffset(5, 5);
    }
}

function spawnFish() {
    if (!gameStarted || gameOver || gameWon || !fish) return;
    
    const spawnX = game.scene.scenes[0].cameras.main.scrollX + gameDimensions.width + 50;
    const groundY = gameDimensions.height - 120; // Ground level
    const catY = groundY - 80; // Cat's approximate jump start height
    
    // Create a parabolic jump trajectory with 5-7 fish
    const fishCount = Phaser.Math.Between(5, 7);
    const horizontalSpread = 300; // Total horizontal distance of the arc
    const baseJumpHeight = 155; // Base height of the arc
    const heightVariation = Phaser.Math.Between(-115, 115); // Random height variation
    const maxJumpHeight = baseJumpHeight + heightVariation; // Final randomized height (40-270px)
    
    for (let i = 0; i < fishCount; i++) {
        // Calculate position along the arc (0 to 1)
        const t = i / (fishCount - 1);
        
        // Parabolic trajectory: y = start + height * (4*t*(1-t))
        // This creates a downward curve that peaks at t=0.5
        const arcHeight = maxJumpHeight * 4 * t * (1 - t);
        const fishX = spawnX + (t * horizontalSpread);
        const fishY = catY - arcHeight;
        
        // Make sure fish don't go below ground or too high
        const clampedY = Math.max(gameDimensions.height * 0.2, Math.min(fishY, groundY - 30));
        
        const f = fish.create(fishX, clampedY, 'fish');
        
        if (f) {
            f.setActive(true);
            f.setVisible(true);
            f.body.setAllowGravity(false);
            f.body.setImmovable(true);
            f.body.setSize(30, 20, true);
        }
    }
}

function collectFish(cat, fish) {
    fish.destroy();
    score += 10;
    scoreText.setText('Score: ' + score);
    audioManager.playEffect('collect');
}

function hitObstacle(cat, obstacle) {
    if (gameOver || gameWon) return;
    
    this.physics.pause();
    cat.setTint(0xff0000);
    gameOver = true;
    
    // Clean up jump charge indicator and stop charging sound
    isPressingJump = false;
    audioManager.playEffect('stopChargingSound');
    if (jumpChargeIndicator) {
        jumpChargeIndicator.destroy();
        jumpChargeIndicator = null;
    }
    
    audioManager.playEffect('gameOver');
    audioManager.stopMusic();
    
    showGameOverScreen(this);
}

function showStartScreen(scene) {
    scene.physics.pause();
    startScreenElements = [];
    
    const isMobile = gameDimensions.width <= 820;
    const centerX = gameDimensions.width / 2;
    const centerY = gameDimensions.height / 2;
    
    const overlay = scene.add.rectangle(centerX, centerY, gameDimensions.width, gameDimensions.height, 0x000000, 0.7);
    overlay.setDepth(100);
    startScreenElements.push(overlay);
    
    const titleSize = isMobile ? '48px' : '72px';
    const title = scene.add.text(centerX, centerY - 120, 'MEOW MI', {
        fontSize: titleSize,
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
    });
    title.setOrigin(0.5);
    title.setDepth(101);
    startScreenElements.push(title);
    
    const emojiSize = isMobile ? '60px' : '80px';
    const catEmoji = scene.add.text(centerX, centerY - 60, '🐱', {
        fontSize: emojiSize
    });
    catEmoji.setOrigin(0.5);
    catEmoji.setDepth(101);
    startScreenElements.push(catEmoji);
    
    const instructionSize = isMobile ? '18px' : '24px';
    const instructions = scene.add.text(centerX, centerY + 20, 'Quick tap = small jump\nHold = charge jump power!\nAvoid boxes, collect fish!', {
        fontSize: instructionSize,
        fill: '#ffffff',
        align: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 20, y: 10 }
    });
    instructions.setOrigin(0.5);
    instructions.setDepth(101);
    startScreenElements.push(instructions);
    
    const promptSize = isMobile ? '24px' : '32px';
    const startPrompt = scene.add.text(centerX, centerY + 100, 'TAP TO START', {
        fontSize: promptSize,
        fill: '#ffff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
    });
    startPrompt.setOrigin(0.5);
    startPrompt.setDepth(101);
    startScreenElements.push(startPrompt);
    
    scene.tweens.add({
        targets: startPrompt,
        alpha: 0.3,
        duration: 800,
        yoyo: true,
        repeat: -1
    });
}

function showGameOverScreen(scene) {
    const cameraX = scene.cameras.main.scrollX;
    const isMobile = gameDimensions.width <= 820;
    const centerX = cameraX + gameDimensions.width / 2;
    const centerY = gameDimensions.height / 2;
    
    const gameOverSize = isMobile ? '48px' : '64px';
    gameOverText = scene.add.text(centerX, centerY - 50, 'GAME OVER', {
        fontSize: gameOverSize,
        fill: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
    });
    gameOverText.setOrigin(0.5);
    
    const restartSize = isMobile ? '24px' : '32px';
    restartText = scene.add.text(centerX, centerY + 30, 'Tap to Restart', {
        fontSize: restartSize,
        fill: '#000',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: { x: 20, y: 10 },
        fontWeight: 'bold'
    });
    restartText.setOrigin(0.5);
    restartText.setInteractive();
    
    restartText.on('pointerdown', () => restartGame(scene));
}

function showWinScreen(scene) {
    scene.physics.pause();
    
    // Clean up jump charge indicator and stop charging sound
    isPressingJump = false;
    audioManager.playEffect('stopChargingSound');
    if (jumpChargeIndicator) {
        jumpChargeIndicator.destroy();
        jumpChargeIndicator = null;
    }
    
    audioManager.playEffect('win');
    audioManager.stopMusic();
    
    const cameraX = scene.cameras.main.scrollX;
    const isMobile = gameDimensions.width <= 820;
    const centerX = cameraX + gameDimensions.width / 2;
    const centerY = gameDimensions.height / 2;
    
    const winSize = isMobile ? '48px' : '64px';
    winText = scene.add.text(centerX, centerY - 80, 'YOU WIN!', {
        fontSize: winSize,
        fill: '#00ff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
    });
    winText.setOrigin(0.5);
    
    const scoreSize = isMobile ? '24px' : '32px';
    const finalScoreText = scene.add.text(centerX, centerY - 20, 'Final Score: ' + score, {
        fontSize: scoreSize,
        fill: '#000',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: { x: 20, y: 10 },
        fontWeight: 'bold'
    });
    finalScoreText.setOrigin(0.5);
    finalScoreText.setName('finalScore');
    
    const restartSize = isMobile ? '20px' : '28px';
    restartText = scene.add.text(centerX, centerY + 40, 'Tap to Play Again', {
        fontSize: restartSize,
        fill: '#000',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: { x: 20, y: 10 },
        fontWeight: 'bold'
    });
    restartText.setOrigin(0.5);
    restartText.setInteractive();
    
    restartText.on('pointerdown', () => restartGame(scene));
}

async function restartGame(scene) {
    console.log('🔄 Restarting game...');
    
    // Stop music first
    await audioManager.stopMusic();
    
    // Clean up UI elements
    if (gameOverText) gameOverText.destroy();
    if (winText) winText.destroy();
    if (restartText) restartText.destroy();
    
    const finalScore = scene.children.getByName('finalScore');
    if (finalScore) finalScore.destroy();
    
    // Reset cat (responsive positioning) - positioned left for more reaction time
    if (cat) {
        cat.clearTint();
        const catY = gameDimensions.height - 150; // 150px from bottom
        const catX = gameDimensions.width <= 820 ? 80 : 120; // Further left on mobile
        cat.setPosition(catX, catY);
        cat.setVelocity(0, 0);
        cat.angle = 0;
    }
    
    // Reset game state
    gameOver = false;
    gameWon = false;
    gameStarted = false;
    score = 0;
    distance = 0;
    
    // Reset jump state
    isPressingJump = false;
    jumpPressStartTime = 0;
    lastIgnoredFeedbackTime = 0;
    
    // Stop any charging sound
    audioManager.playEffect('stopChargingSound');
    
    if (jumpChargeIndicator) {
        jumpChargeIndicator.destroy();
        jumpChargeIndicator = null;
    }
    
    // Update UI
    scoreText.setText('Score: 0');
    distanceText.setText('Distance: 0m');
    
    // Change music track
    audioManager.changeTrack();
    
    // Resume physics
    scene.physics.resume();
    
    // Start game
    startGame(scene);
}

async function startGame(scene) {
    console.log('🚀 Starting game...');
    
    // Clear all timers
    scene.time.removeAllEvents();
    
    // Initialize audio
    await audioManager.init();
    
    // Ensure audio context is resumed (required for mobile)
    if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
        try {
            await audioManager.audioContext.resume();
            console.log('🔊 AudioContext resumed on game start');
        } catch (error) {
            console.log('🔊 Audio context resume failed:', error);
        }
    }
    
    // Start music
    await audioManager.startMusic();
    
    // Remove start screen
    startScreenElements.forEach(element => {
        if (element && element.destroy) {
            element.destroy();
        }
    });
    startScreenElements = [];
    
    scene.tweens.killAll();
    
    // Clear existing objects
    if (obstacles) obstacles.clear(true, true);
    if (fish) fish.clear(true, true);
    
    // Recreate groups
    obstacles = scene.physics.add.group();
    fish = scene.physics.add.group();
    
    // Recreate collisions
    scene.physics.add.overlap(cat, obstacles, hitObstacle, null, scene);
    scene.physics.add.overlap(cat, fish, collectFish, null, scene);
    
    // Start game
    gameStarted = true;
    scene.physics.resume();
    cat.clearTint();
    
    // Start spawning
    scene.time.addEvent({
        delay: OBSTACLE_SPAWN_TIME,
        callback: spawnObstacle,
        callbackScope: scene,
        loop: true
    });
    
    scene.time.addEvent({
        delay: FISH_SPAWN_TIME,
        callback: spawnFish,
        callbackScope: scene,
        loop: true
    });
    
    console.log('✅ Game started successfully');
}