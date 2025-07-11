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

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
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
            
            // Resume if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('🔊 AudioContext resumed - state:', this.audioContext.state);
            }
        } catch (error) {
            console.error('❌ Failed to initialize audio:', error);
        }
    }

    createSoundEffects() {
        // Jump sound
        this.sounds.jump = () => this.playSound(
            [{ freq: 200, time: 0 }, { freq: 400, time: 0.1 }],
            0.3,
            0.1
        );
        
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

    playEffect(effectName) {
        if (this.sounds[effectName] && this.audioContext && 
            this.audioContext.state === 'running') {
            this.sounds[effectName]();
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
    
    // Create sky background
    sky = this.add.rectangle(0, 300, 8000, 600, 0x87CEEB);
    sky.setOrigin(0, 0.5);
    
    // Create ground
    ground = this.physics.add.staticGroup();
    for (let i = 0; i < 20; i++) {
        ground.create(400 + i * 800, 550, 'ground');
    }
    
    // Create cat
    cat = this.physics.add.sprite(200, 450, 'cat');
    cat.setBounce(0.2);
    cat.body.setGravityY(0);
    cat.body.setSize(45, 50, true);
    
    // Create groups
    obstacles = this.physics.add.group();
    fish = this.physics.add.group();
    
    // Add colliders
    this.physics.add.collider(cat, ground);
    this.physics.add.overlap(cat, obstacles, hitObstacle, null, this);
    this.physics.add.overlap(cat, fish, collectFish, null, this);
    
    // Create UI
    scoreText = this.add.text(16, 16, 'Score: 0', { 
        fontSize: '32px', 
        fill: '#000',
        backgroundColor: '#fff',
        padding: { x: 10, y: 5 }
    });
    
    distanceText = this.add.text(16, 60, 'Distance: 0m', { 
        fontSize: '24px', 
        fill: '#000',
        backgroundColor: '#fff',
        padding: { x: 10, y: 5 }
    });
    
    // Show start screen
    if (!gameStarted) {
        showStartScreen(this);
    }
    
    // Input handling
    this.input.on('pointerdown', () => {
        if (!gameStarted) {
            startGame(this);
        } else if (!gameOver && !gameWon) {
            jump.call(this);
        }
    }, this);
    
    this.input.keyboard.on('keydown-SPACE', () => {
        if (!gameStarted) {
            startGame(this);
        } else if (!gameOver && !gameWon) {
            jump.call(this);
        }
    }, this);
}

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
    
    // Camera follows cat
    this.cameras.main.scrollX = cat.x - 200;
    
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
    
    const obstacleY = 475;
    const spawnX = game.scene.scenes[0].cameras.main.scrollX + 850;
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
    
    const fishY = Phaser.Math.Between(300, 450);
    const spawnX = game.scene.scenes[0].cameras.main.scrollX + 850;
    const f = fish.create(spawnX, fishY, 'fish');
    
    if (f) {
        f.setActive(true);
        f.setVisible(true);
        f.body.setAllowGravity(false);
        f.body.setImmovable(true);
        f.body.setSize(30, 20, true);
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
    audioManager.playEffect('gameOver');
    audioManager.stopMusic();
    
    showGameOverScreen(this);
}

function showStartScreen(scene) {
    scene.physics.pause();
    startScreenElements = [];
    
    const overlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
    overlay.setDepth(100);
    startScreenElements.push(overlay);
    
    const title = scene.add.text(400, 200, 'MEOW MI', {
        fontSize: '72px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
    });
    title.setOrigin(0.5);
    title.setDepth(101);
    startScreenElements.push(title);
    
    const catEmoji = scene.add.text(400, 280, '🐱', {
        fontSize: '80px'
    });
    catEmoji.setOrigin(0.5);
    catEmoji.setDepth(101);
    startScreenElements.push(catEmoji);
    
    const instructions = scene.add.text(400, 360, 'Tap or Press SPACE to Jump\nAvoid boxes, collect fish!', {
        fontSize: '24px',
        fill: '#ffffff',
        align: 'center',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
    });
    instructions.setOrigin(0.5);
    instructions.setDepth(101);
    startScreenElements.push(instructions);
    
    const startPrompt = scene.add.text(400, 450, 'CLICK OR TAP TO START', {
        fontSize: '32px',
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
    
    gameOverText = scene.add.text(cameraX + 400, 250, 'GAME OVER', {
        fontSize: '64px',
        fill: '#ff0000',
        fontStyle: 'bold'
    });
    gameOverText.setOrigin(0.5);
    
    restartText = scene.add.text(cameraX + 400, 350, 'Click or Tap to Restart', {
        fontSize: '32px',
        fill: '#000',
        backgroundColor: '#fff',
        padding: { x: 20, y: 10 }
    });
    restartText.setOrigin(0.5);
    restartText.setInteractive();
    
    restartText.on('pointerdown', () => restartGame(scene));
}

function showWinScreen(scene) {
    scene.physics.pause();
    audioManager.playEffect('win');
    audioManager.stopMusic();
    
    const cameraX = scene.cameras.main.scrollX;
    
    winText = scene.add.text(cameraX + 400, 250, 'YOU WIN!', {
        fontSize: '64px',
        fill: '#00ff00',
        fontStyle: 'bold'
    });
    winText.setOrigin(0.5);
    
    const finalScoreText = scene.add.text(cameraX + 400, 320, 'Final Score: ' + score, {
        fontSize: '32px',
        fill: '#000',
        backgroundColor: '#fff',
        padding: { x: 20, y: 10 }
    });
    finalScoreText.setOrigin(0.5);
    finalScoreText.setName('finalScore');
    
    restartText = scene.add.text(cameraX + 400, 400, 'Click or Tap to Play Again', {
        fontSize: '28px',
        fill: '#000',
        backgroundColor: '#fff',
        padding: { x: 20, y: 10 }
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
    
    // Reset cat
    if (cat) {
        cat.clearTint();
        cat.setPosition(200, 450);
        cat.setVelocity(0, 0);
        cat.angle = 0;
    }
    
    // Reset game state
    gameOver = false;
    gameWon = false;
    gameStarted = false;
    score = 0;
    distance = 0;
    
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