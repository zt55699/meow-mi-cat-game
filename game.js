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
            debug: false // Always keep this false, we'll handle debug manually
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

// Sound system
let audioContext;
let sounds = {};
let musicSource = null;
let musicGainNode = null;
let isMusicPlaying = false;
let currentMusicTrack = 1;

// Initialize the game
const game = new Phaser.Game(config);

function preload() {
    // We'll create all graphics in the create function instead
}

// Create sound effects using Web Audio API
function createSounds() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    console.log('🔊 Audio context created - state:', audioContext.state);
    
    // Jump sound (rising pitch)
    sounds.jump = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    };
    
    // Collect fish sound (happy ding)
    sounds.collect = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.05); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.1); // G5
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    };
    
    // Game over sound (descending tone)
    sounds.gameOver = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    };
    
    // Win sound (victory fanfare)
    sounds.win = () => {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }, i * 100);
        });
    };
}

// Create background music with multiple tracks
function createBackgroundMusic(trackNumber = null) {
    console.log('🎵 createBackgroundMusic called - audioContext:', !!audioContext, 'isMusicPlaying:', isMusicPlaying);
    
    if (!audioContext) {
        console.log('❌ No audio context - cannot create music');
        return;
    }
    
    // Stop any existing music before starting new
    if (isMusicPlaying) {
        console.log('🛑 Music already playing - stopping first...');
        stopBackgroundMusic();
        // Add proper delay to ensure cleanup completes
        setTimeout(() => {
            console.log('🔄 Retrying music creation after stop...');
            createBackgroundMusic(trackNumber);
        }, 700); // Increased delay to ensure cleanup completes
        return;
    }
    
    // Use provided track number or current track
    const track = trackNumber || currentMusicTrack;
    
    // Create gain node for volume control
    musicGainNode = audioContext.createGain();
    musicGainNode.gain.setValueAtTime(0.15, audioContext.currentTime); // Lower volume for background
    musicGainNode.connect(audioContext.destination);
    
    // Define different music tracks
    const tracks = {
        1: {
            tempo: 120,
            bassNotes: [130.81, 146.83, 164.81, 146.83], // C3, D3, E3, D3
            melodyNotes: [523.25, 0, 659.25, 0, 783.99, 0, 659.25, 0], // C5, rest, E5, rest, G5, rest, E5, rest
            bassType: 'triangle',
            melodyType: 'square'
        },
        2: {
            tempo: 140,
            bassNotes: [174.61, 196.00, 220.00, 196.00], // F3, G3, A3, G3
            melodyNotes: [698.46, 0, 783.99, 0, 880.00, 0, 783.99, 0], // F5, rest, G5, rest, A5, rest, G5, rest
            bassType: 'sawtooth',
            melodyType: 'triangle'
        },
        3: {
            tempo: 100,
            bassNotes: [110.00, 123.47, 130.81, 123.47], // A2, B2, C3, B2
            melodyNotes: [440.00, 0, 493.88, 0, 523.25, 0, 493.88, 0], // A4, rest, B4, rest, C5, rest, B4, rest
            bassType: 'triangle',
            melodyType: 'sine'
        }
    };
    
    const currentTrack = tracks[track] || tracks[1];
    
    // Create the music pattern
    const playMusicLoop = () => {
        if (!isMusicPlaying) return;
        
        const now = audioContext.currentTime;
        const beatLength = 60 / currentTrack.tempo;
        
        // Bass line pattern
        currentTrack.bassNotes.forEach((freq, i) => {
            const bassOsc = audioContext.createOscillator();
            const bassGain = audioContext.createGain();
            
            bassOsc.type = currentTrack.bassType;
            bassOsc.frequency.setValueAtTime(freq, now + i * beatLength);
            
            bassGain.gain.setValueAtTime(0.2, now + i * beatLength);
            bassGain.gain.exponentialRampToValueAtTime(0.01, now + (i + 0.8) * beatLength);
            
            bassOsc.connect(bassGain);
            bassGain.connect(musicGainNode);
            
            bassOsc.start(now + i * beatLength);
            bassOsc.stop(now + (i + 1) * beatLength);
        });
        
        // Melody pattern
        currentTrack.melodyNotes.forEach((freq, i) => {
            if (freq > 0) {
                const melodyOsc = audioContext.createOscillator();
                const melodyGain = audioContext.createGain();
                
                melodyOsc.type = currentTrack.melodyType;
                melodyOsc.frequency.setValueAtTime(freq, now + i * beatLength * 0.5);
                
                melodyGain.gain.setValueAtTime(0.1, now + i * beatLength * 0.5);
                melodyGain.gain.exponentialRampToValueAtTime(0.01, now + (i + 0.4) * beatLength * 0.5);
                
                melodyOsc.connect(melodyGain);
                melodyGain.connect(musicGainNode);
                
                melodyOsc.start(now + i * beatLength * 0.5);
                melodyOsc.stop(now + (i + 0.5) * beatLength * 0.5);
            }
        });
        
        // Schedule next loop
        if (isMusicPlaying) {
            setTimeout(() => playMusicLoop(), currentTrack.bassNotes.length * beatLength * 1000);
        }
    };
    
    isMusicPlaying = true;
    console.log('✅ Music started - track:', track, 'isMusicPlaying:', isMusicPlaying);
    playMusicLoop();
}

// Stop background music
function stopBackgroundMusic() {
    console.log('🛑 stopBackgroundMusic called - isMusicPlaying:', isMusicPlaying);
    isMusicPlaying = false;
    if (musicGainNode) {
        console.log('🔇 Fading out music...');
        try {
            musicGainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            // Disconnect after fade out
            setTimeout(() => {
                if (musicGainNode) {
                    try {
                        musicGainNode.disconnect();
                        musicGainNode = null;
                        console.log('🔌 Music gain node disconnected');
                    } catch (e) {
                        console.log('⚠️ Error disconnecting gain node:', e);
                    }
                }
            }, 350); // Reduced to 350ms to match fade time
        } catch (e) {
            console.log('⚠️ Error stopping music:', e);
            musicGainNode = null;
        }
    }
}

function createGameSprites(scene) {
    // Remove existing textures if they exist (fixes restart issue)
    if (scene.textures.exists('cat')) {
        scene.textures.remove('cat');
    }
    
    // Create cat sprite using emoji with transparent background
    const catGraphics = scene.make.graphics({ x: 0, y: 0 }, false);
    catGraphics.fillStyle(0xFFFFFF, 0); // Fully transparent background
    catGraphics.fillRect(0, 0, 60, 60);
    
    // Add emoji as text on top
    const style = { font: '50px Arial', fill: '#000000' };
    const catEmoji = scene.make.text({
        x: 30,
        y: 30,
        text: '🐱',
        style: style,
        origin: { x: 0.5, y: 0.5 }
    }, false);
    
    // Render to texture with transparent background
    const rt = scene.make.renderTexture({ x: 0, y: 0, width: 60, height: 60 }, false);
    rt.clear(); // Ensure transparent background
    rt.draw(catEmoji, 30, 30); // Draw only the emoji
    rt.saveTexture('cat');
    
    // Clean up
    catGraphics.destroy();
    catEmoji.destroy();
    rt.destroy();
    
    // Remove existing textures if they exist
    if (scene.textures.exists('obstacle')) {
        scene.textures.remove('obstacle');
    }
    if (scene.textures.exists('fish')) {
        scene.textures.remove('fish');
    }
    if (scene.textures.exists('ground')) {
        scene.textures.remove('ground');
    }
    
    // Create obstacle (box)
    const obstacleGraphics = scene.make.graphics({ x: 0, y: 0 }, false);
    obstacleGraphics.fillStyle(0x8B4513); // Brown for box
    obstacleGraphics.fillRect(0, 0, 50, 50);
    obstacleGraphics.lineStyle(2, 0x654321);
    obstacleGraphics.strokeRect(0, 0, 50, 50);
    obstacleGraphics.generateTexture('obstacle', 50, 50);
    
    // Create fish
    const fishGraphics = scene.make.graphics({ x: 0, y: 0 }, false);
    fishGraphics.fillStyle(0x1E90FF); // Blue for fish
    fishGraphics.fillEllipse(20, 15, 40, 20);
    fishGraphics.fillTriangle(0, 15, 10, 5, 10, 25);
    fishGraphics.fillStyle(0xFFFFFF); // White for eye
    fishGraphics.fillCircle(30, 15, 3);
    fishGraphics.generateTexture('fish', 40, 30);
    
    // Create ground
    const groundGraphics = scene.make.graphics({ x: 0, y: 0 }, false);
    groundGraphics.fillStyle(0x228B22); // Green for ground
    groundGraphics.fillRect(0, 0, 800, 100);
    groundGraphics.generateTexture('ground', 800, 100);
    
    // Clean up graphics objects
    obstacleGraphics.destroy();
    fishGraphics.destroy();
    groundGraphics.destroy();
}

function create() {
    // Create all game sprites first
    createGameSprites(this);
    
    // Create sky background - make it large enough to cover scrolling
    sky = this.add.rectangle(0, 300, 8000, 600, 0x87CEEB);
    sky.setOrigin(0, 0.5); // Set origin to left center
    
    // Create ground - make it repeating for scrolling
    ground = this.physics.add.staticGroup();
    // Create multiple ground segments to cover the scrolling area
    for (let i = 0; i < 20; i++) {
        ground.create(400 + i * 800, 550, 'ground');
    }
    
    // Create cat
    cat = this.physics.add.sprite(200, 450, 'cat');
    cat.setBounce(0.2);
    // REMOVED: cat.setCollideWorldBounds(true); // This was preventing cat from moving right!
    cat.body.setGravityY(0); // Use default gravity
    
    // Adjust cat hitbox to be more forgiving
    // Cat sprite is 60x60, make hitbox 45x50 centered
    cat.body.setSize(45, 50, true);
    
    // Create groups for obstacles and fish
    obstacles = this.physics.add.group();
    fish = this.physics.add.group();
    
    // Add colliders
    this.physics.add.collider(cat, ground);
    // Removed collider for obstacles - they don't need physics
    
    // Add overlap detection
    this.physics.add.overlap(cat, obstacles, hitObstacle, null, this);
    // TEMPORARILY DISABLED: this.physics.add.overlap(cat, fish, collectFish, null, this);
    
    // Create score text
    scoreText = this.add.text(16, 16, 'Score: 0', { 
        fontSize: '32px', 
        fill: '#000',
        backgroundColor: '#fff',
        padding: { x: 10, y: 5 }
    });
    
    // Create distance text
    distanceText = this.add.text(16, 60, 'Distance: 0m', { 
        fontSize: '24px', 
        fill: '#000',
        backgroundColor: '#fff',
        padding: { x: 10, y: 5 }
    });
    
    // Create start screen
    if (!gameStarted) {
        showStartScreen(this);
    }
    
    // Input handling
    this.input.on('pointerdown', () => {
        if (!gameStarted) {
            startGame(this);
        } else {
            jump.call(this);
        }
    }, this);
    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-SPACE', () => {
        if (!gameStarted) {
            startGame(this);
        } else {
            jump.call(this);
        }
    }, this);
    
    // Debug mode toggle (press D key)
    this.input.keyboard.on('keydown-D', () => {
        debugMode = !debugMode;
        console.log('Debug mode:', debugMode ? 'ON' : 'OFF');
        
        if (debugMode && !debugGraphics) {
            // Create debug graphics manually
            debugGraphics = this.add.graphics();
            debugGraphics.setDepth(1000); // Make sure it's on top
        } else if (!debugMode && debugGraphics) {
            // Clean up debug graphics
            debugGraphics.destroy();
            debugGraphics = null;
        }
    });
    
    // Music toggle (press M key)
    this.input.keyboard.on('keydown-M', () => {
        if (audioContext) {
            if (isMusicPlaying) {
                stopBackgroundMusic();
                console.log('Music: OFF');
            } else {
                createBackgroundMusic();
                console.log('Music: ON');
            }
        }
    });
    
    // Spawn timers will be started when game begins
}

function update() {
    try {
        if (!gameStarted || gameOver || gameWon) {
            return;
        }
        
        // Debug: Check if update is being called
        if (Math.floor(distance) % 200 === 0) {
            console.log("🔄 Update called - gameStarted:", gameStarted, "gameOver:", gameOver, "distance:", Math.floor(distance));
        }
    
    // Update distance
    distance += SCROLL_SPEED;
    distanceText.setText('Distance: ' + Math.floor(distance / 10) + 'm');
    
    // Check win condition
    if (distance >= WIN_DISTANCE) {
        gameWon = true;
        showWinScreen(this);
        return;
    }
    
    // 场景移动方案：猫咪水平移动，摄像机跟随猫咪
    // 猫咪以恒定速度向右移动
    if (cat) {
        const oldX = cat.x;
        cat.x += SCROLL_SPEED;
        
        // DEBUG: Check if cat's position is being overridden
        const afterX = cat.x;
        if (Math.abs(afterX - (oldX + SCROLL_SPEED)) > 0.1) {
            console.log("⚠️ Cat position override detected!", {
                oldX, 
                expectedX: oldX + SCROLL_SPEED, 
                actualX: afterX,
                worldBounds: cat.body.world.bounds,
                collideWorldBounds: cat.body.collideWorldBounds
            });
        }
        
        // 摄像机跟随猫咪，保持猫咪在屏幕固定位置
        this.cameras.main.scrollX = cat.x - 200;
        
        // Debug movement - more frequent logging
        if (Math.floor(distance) % 50 === 0 || Math.floor(distance) > 580) {
            console.log("🐱 Cat movement - oldX:", oldX, "newX:", cat.x, "camera.scrollX:", this.cameras.main.scrollX, "distance:", Math.floor(distance));
            console.log("🔍 Cat details:", {
                x: cat.x, 
                y: cat.y, 
                velocityX: cat.body.velocity.x, 
                velocityY: cat.body.velocity.y,
                active: cat.active,
                visible: cat.visible
            });
        }
    }
    
    // 同时移动UI元素（分数、距离）保持固定在屏幕上
    if (scoreText) {
        scoreText.x = this.cameras.main.scrollX + 16;
    }
    if (distanceText) {
        distanceText.x = this.cameras.main.scrollX + 16;
    }
    
    // 清理屏幕外的对象（相对于摄像机位置）
    obstacles.children.entries.forEach(obstacle => {
        if (obstacle.x < this.cameras.main.scrollX - 100) {
            console.log("Destroying obstacle at x:", obstacle.x);
            obstacle.destroy();
        }
    });
    
    fish.children.entries.forEach(f => {
        if (f.x < this.cameras.main.scrollX - 100) {
            console.log("Destroying fish at x:", f.x);
            f.destroy();
        }
    });
    
    // Debug: Log counts every few seconds
    if (Math.floor(distance) % 300 === 0) {
        console.log("🐛 Current objects:", {
            obstacles: obstacles.children.entries.length,
            fish: fish.children.entries.length,
            distance: Math.floor(distance / 10) + 'm'
        });
    }
    
    // Cat idle animation (simple bobbing)
    if (cat.body.touching.down) {
        cat.angle = 0;
    } else {
        cat.angle = -15;
    }
    
    // Draw debug hitboxes manually
    if (debugMode && debugGraphics) {
        debugGraphics.clear();
        debugGraphics.lineStyle(2, 0x00ff00, 1);
        
        // Draw cat hitbox
        const catBody = cat.body;
        debugGraphics.strokeRect(catBody.x, catBody.y, catBody.width, catBody.height);
        
        // Draw obstacle hitboxes
        obstacles.children.entries.forEach(obstacle => {
            const body = obstacle.body;
            debugGraphics.strokeRect(body.x, body.y, body.width, body.height);
        });
        
        // Draw fish hitboxes
        fish.children.entries.forEach(f => {
            const body = f.body;
            debugGraphics.strokeRect(body.x, body.y, body.width, body.height);
        });
    }
    } catch (error) {
        console.error("❌ ERROR in update function:", error);
        console.log("🔍 Error details:", {
            gameStarted, gameOver, gameWon, distance,
            catExists: !!cat,
            catX: cat ? cat.x : 'no cat',
            message: error.message,
            stack: error.stack
        });
    }
}

function jump() {
    if ((cat.body.touching.down || cat.body.onFloor()) && !gameOver && !gameWon) {
        cat.setVelocityY(JUMP_VELOCITY);
        if (audioContext) sounds.jump();
    }
}

function spawnObstacle() {
    console.log("spawnObstacle called, state:", {gameStarted, gameOver, gameWon, obstaclesExists: !!obstacles});
    console.log("Current obstacles count:", obstacles ? obstacles.children.entries.length : 0);
    
    if (!gameStarted || gameOver || gameWon) {
        console.log("Spawn blocked by game state");
        return;
    }
    
    if (!obstacles) {
        console.error("Obstacles group not available!");
        return;
    }
    
    console.log("Creating obstacle...");
    
    // Check if obstacle texture exists
    if (!game.scene.scenes[0].textures.exists('obstacle')) {
        console.error("Obstacle texture not found! Recreating sprites...");
        createGameSprites(game.scene.scenes[0]);
    }
    
    // 生成障碍物在摄像机前方（相对于世界坐标）
    const spawnX = game.scene.scenes[0].cameras.main.scrollX + 850;
    const obstacle = obstacles.create(spawnX, 480, 'obstacle');
    console.log("Obstacle created:", !!obstacle);
    
    if (obstacle) {
        // Ensure the obstacle is visible and properly configured
        obstacle.setActive(true);
        obstacle.setVisible(true);
        obstacle.setPosition(spawnX, 480);
        obstacle.setDepth(15); // Higher depth to ensure visibility
        obstacle.setScale(1); // Ensure proper scale
        obstacle.setAlpha(1); // Ensure full opacity
        
        // Force add to scene display list if not already there
        const scene = game.scene.scenes[0];
        if (scene && scene.children && !scene.children.exists(obstacle)) {
            scene.children.add(obstacle);
            console.log("Force added obstacle to scene display list");
        }
        
        obstacle.body.setAllowGravity(false); // Disable gravity
        obstacle.body.setImmovable(true); // Prevent physics pushback
        
        // CRITICAL: Disable collision sides to prevent separation while keeping overlap detection
        obstacle.body.checkCollision.left = false;
        obstacle.body.checkCollision.right = false;
        obstacle.body.checkCollision.up = false;
        obstacle.body.checkCollision.down = false;
        
        // Adjust hitbox to be smaller than the visual box (more forgiving)
        // Original box is 50x50, make hitbox 40x40 with 5px offset
        obstacle.body.setSize(40, 40, true); // true centers the hitbox
        obstacle.body.setOffset(5, 5); // Offset from top-left
        
        console.log("Obstacle configured at position:", obstacle.x, obstacle.y, "visible:", obstacle.visible);
        console.log("Obstacle details:", {
            alpha: obstacle.alpha,
            scaleX: obstacle.scaleX,
            scaleY: obstacle.scaleY,
            depth: obstacle.depth,
            texture: obstacle.texture.key,
            active: obstacle.active
        });
        
        // CRITICAL: Verify object is in group
        console.log("🔍 Obstacle in group:", obstacles.children.entries.includes(obstacle));
        console.log("🔍 Group count after adding:", obstacles.children.entries.length);
    }
}

function spawnFish() {
    console.log("spawnFish called, state:", {gameStarted, gameOver, gameWon, fishExists: !!fish});
    console.log("Current fish count:", fish ? fish.children.entries.length : 0);
    
    if (!gameStarted || gameOver || gameWon) {
        console.log("Fish spawn blocked by game state");
        return;
    }
    
    if (!fish) {
        console.error("Fish group not available!");
        return;
    }
    
    console.log("Creating fish...");
    
    // Check if fish texture exists
    if (!game.scene.scenes[0].textures.exists('fish')) {
        console.error("Fish texture not found! Recreating sprites...");
        createGameSprites(game.scene.scenes[0]);
    }
    
    const fishY = Phaser.Math.Between(300, 450);
    // 生成鱼在摄像机前方（相对于世界坐标）
    const spawnX = game.scene.scenes[0].cameras.main.scrollX + 850;
    console.log("Fish spawn - cat.x:", cat.x, "camera.scrollX:", game.scene.scenes[0].cameras.main.scrollX, "spawnX:", spawnX);
    const f = fish.create(spawnX, fishY, 'fish');
    console.log("Fish created:", !!f);
    
    if (f) {
        // Ensure the fish is visible and properly configured
        f.setActive(true);
        f.setVisible(true);
        f.setPosition(spawnX, fishY);
        f.setDepth(15); // Higher depth to ensure visibility
        f.setScale(1); // Ensure proper scale
        f.setAlpha(1); // Ensure full opacity
        
        // Force add to scene display list if not already there
        const scene = game.scene.scenes[0];
        if (scene && scene.children && !scene.children.exists(f)) {
            scene.children.add(f);
            console.log("Force added fish to scene display list");
        }
        
        f.body.setAllowGravity(false); // Disable gravity
        f.body.setImmovable(true); // Prevent physics pushback
        
        // CRITICAL: Disable collision sides to prevent separation while keeping overlap detection
        f.body.checkCollision.left = false;
        f.body.checkCollision.right = false;
        f.body.checkCollision.up = false;
        f.body.checkCollision.down = false;
        
        // Adjust fish hitbox to match the ellipse shape better
        // Fish sprite is 40x30, make hitbox 30x20 centered
        f.body.setSize(30, 20, true);
        
        console.log("Fish configured at position:", f.x, f.y, "visible:", f.visible);
        console.log("Fish details:", {
            alpha: f.alpha,
            scaleX: f.scaleX,
            scaleY: f.scaleY,
            depth: f.depth,
            texture: f.texture.key,
            active: f.active
        });
        
        // CRITICAL: Verify object is in group
        console.log("🔍 Fish in group:", fish.children.entries.includes(f));
        console.log("🔍 Fish group count after adding:", fish.children.entries.length);
    }
}

function collectFish(cat, fish) {
    console.log("🐟 collectFish called - destroying fish at:", fish.x, fish.y);
    fish.destroy();
    score += 10;
    scoreText.setText('Score: ' + score);
    if (audioContext) sounds.collect();
    console.log("🐟 collectFish completed - new score:", score);
}

function hitObstacle(cat, obstacle) {
    console.log("💥 hitObstacle called - obstacle at:", obstacle.x, obstacle.y);
    // Prevent multiple hits during restart
    if (gameOver || gameWon) {
        console.log("🛡️ Hit blocked - already in end state");
        return;
    }
    
    console.log("💥 Obstacle hit detected");
    this.physics.pause();
    cat.setTint(0xff0000);
    gameOver = true;
    if (audioContext) sounds.gameOver();
    stopBackgroundMusic();
    
    showGameOverScreen(this);
}

function showGameOverScreen(scene) {
    // Position game over screen relative to camera
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
    
    restartText.on('pointerdown', () => {
        console.log("🔄 Starting manual restart process...");
        
        // Stop any existing music
        stopBackgroundMusic();
        
        // Clean up game over screen elements
        if (gameOverText) {
            gameOverText.destroy();
            gameOverText = null;
        }
        if (restartText) {
            restartText.destroy();
            restartText = null;
        }
        
        // Reset cat
        if (cat) {
            cat.clearTint();
            cat.setPosition(200, 450);
            cat.setVelocity(0, 0);
            cat.angle = 0;
        }
        
        // Reset ALL game state variables
        gameOver = false;
        gameWon = false;
        gameStarted = false;
        score = 0;
        distance = 0;
        
        console.log("🔧 State reset - gameOver:", gameOver, "gameWon:", gameWon, "gameStarted:", gameStarted);
        
        // Update UI
        if (scoreText) scoreText.setText('Score: 0');
        if (distanceText) distanceText.setText('Distance: 0m');
        
        // Change to next music track on restart
        currentMusicTrack = (currentMusicTrack % 3) + 1;
        
        // Resume physics
        scene.physics.resume();
        
        console.log("🚀 Manual restart complete, starting game directly...");
        
        // Start game immediately without scene restart
        startGame(scene);
    });
}

function showWinScreen(scene) {
    scene.physics.pause();
    if (audioContext) sounds.win();
    stopBackgroundMusic();
    
    // Position win screen relative to camera
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
    
    restartText.on('pointerdown', () => {
        console.log("🔄 Starting manual restart from win screen...");
        
        // Stop any existing music
        stopBackgroundMusic();
        
        // Clean up win screen elements
        if (winText) {
            winText.destroy();
            winText = null;
        }
        if (restartText) {
            restartText.destroy();
            restartText = null;
        }
        
        // Clean up final score text
        const finalScoreText = scene.children.getByName('finalScore');
        if (finalScoreText) {
            finalScoreText.destroy();
        }
        
        // Reset cat
        if (cat) {
            cat.clearTint();
            cat.setPosition(200, 450);
            cat.setVelocity(0, 0);
            cat.angle = 0;
        }
        
        // Reset ALL game state variables
        gameOver = false;
        gameWon = false;
        gameStarted = false;
        score = 0;
        distance = 0;
        
        console.log("🔧 Win state reset - gameOver:", gameOver, "gameWon:", gameWon, "gameStarted:", gameStarted);
        
        // Update UI
        if (scoreText) scoreText.setText('Score: 0');
        if (distanceText) distanceText.setText('Distance: 0m');
        
        // Change to next music track on restart
        currentMusicTrack = (currentMusicTrack % 3) + 1;
        
        // Resume physics
        scene.physics.resume();
        
        console.log("🚀 Manual restart from win complete, starting game directly...");
        
        // Start game immediately without scene restart
        startGame(scene);
    });
}
function showStartScreen(scene) {
    // Pause physics until game starts
    scene.physics.pause();
    
    // Clear any existing elements
    startScreenElements = [];
    
    // Semi-transparent overlay
    const overlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
    overlay.setDepth(100);
    startScreenElements.push(overlay);
    
    // Game title
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
    
    // Cat emoji
    const catEmoji = scene.add.text(400, 280, '🐱', {
        fontSize: '80px'
    });
    catEmoji.setOrigin(0.5);
    catEmoji.setDepth(101);
    startScreenElements.push(catEmoji);
    
    // Instructions
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
    
    // Start prompt
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
    
    // Blinking animation for start prompt
    scene.tweens.add({
        targets: startPrompt,
        alpha: 0.3,
        duration: 800,
        yoyo: true,
        repeat: -1
    });
}

function startGame(scene) {
    console.log("🚀 startGame called with scene:", !!scene);
    console.log("🔍 State at start of startGame - gameOver:", gameOver, "gameWon:", gameWon, "gameStarted:", gameStarted);
    
    // CRITICAL: Ensure proper state reset
    if (gameOver || gameWon) {
        console.log("⚠️ Found bad state in startGame, forcing reset...");
        gameOver = false;
        gameWon = false;
        console.log("🔧 Forced state reset - gameOver:", gameOver, "gameWon:", gameWon);
    }
    
    // CRITICAL: Clear ALL existing timers FIRST
    console.log("🧹 Clearing all existing timers...");
    scene.time.removeAllEvents();
    console.log("✅ All timers cleared");
    
    // Initialize audio and music
    if (!audioContext) {
        console.log('🎵 Creating audio context and sounds...');
        createSounds();
    }
    
    // Resume audio context if it's suspended (browser requirement)
    if (audioContext && audioContext.state === 'suspended') {
        console.log('🔊 Resuming suspended audio context...');
        audioContext.resume().then(() => {
            console.log('✅ Audio context resumed - state:', audioContext.state);
            // Start music after context is resumed
            console.log('🎵 Starting music for game - track:', currentMusicTrack);
            createBackgroundMusic(currentMusicTrack);
        }).catch(err => {
            console.error('❌ Failed to resume audio context:', err);
        });
    } else {
        // Always restart music on game start (including after restart)
        console.log('🎵 Starting music for game - track:', currentMusicTrack);
        createBackgroundMusic(currentMusicTrack);
    }
    
    // Remove start screen elements individually
    startScreenElements.forEach(element => {
        if (element && element.destroy) {
            element.destroy();
        }
    });
    startScreenElements = [];
    
    // Stop any active tweens
    scene.tweens.killAll();
    
    // CRITICAL FIX: Recreate groups with current scene reference
    console.log("🔧 Recreating groups with fresh scene reference...");
    
    // Clear existing objects first
    if (obstacles) {
        console.log("🧹 Clearing existing obstacles:", obstacles.children.entries.length);
        obstacles.clear(true, true);
    }
    if (fish) {
        console.log("🧹 Clearing existing fish:", fish.children.entries.length);
        fish.clear(true, true);
    }
    
    obstacles = scene.physics.add.group();
    fish = scene.physics.add.group();
    
    // Recreate collision detection with fresh groups
    scene.physics.add.overlap(cat, obstacles, hitObstacle, null, scene);
    scene.physics.add.overlap(cat, fish, collectFish, null, scene);
    
    console.log("✅ Groups recreated - obstacles:", !!obstacles, "fish:", !!fish);
    
    // Start the game
    gameStarted = true;
    scene.physics.resume();
    
    // Reset cat appearance in case it was tinted
    cat.clearTint();
    
    // Start spawning timers with delay to ensure timer system is clean
    console.log("🚀 Starting fresh spawn timers...");
    console.log("Groups available:", {obstacles: !!obstacles, fish: !!fish});
    console.log("Game state:", {gameStarted, gameOver, gameWon});
    
    // Create timers immediately - no delay needed
    console.log("⏱️ Creating spawn timers immediately...");
    console.log("🔍 State before timer creation - gameOver:", gameOver, "gameWon:", gameWon, "gameStarted:", gameStarted);
    console.log("Creating spawn timers with delays:", {obstacle: OBSTACLE_SPAWN_TIME, fish: FISH_SPAWN_TIME});
    createSpawnTimers(scene);
}

function createSpawnTimers(scene) {
    // Final state check before creating timers
    console.log("🔧 FINAL state check in createSpawnTimers - gameOver:", gameOver, "gameWon:", gameWon, "gameStarted:", gameStarted);
    
    // Force reset if state is still bad
    if (gameOver || gameWon) {
        console.log("🚨 CRITICAL: Bad state detected in createSpawnTimers, forcing reset!");
        gameOver = false;
        gameWon = false;
        console.log("🔧 Emergency state reset - gameOver:", gameOver, "gameWon:", gameWon);
    }
    
    console.log("🔧 Adding obstacle timer with current time:", scene.time.now);
    const obstacleTimer = scene.time.addEvent({
        delay: OBSTACLE_SPAWN_TIME,
        callback: function() {
            console.log("🔄 Timer-triggered obstacle spawn at time:", scene.time.now);
            console.log("🔄 Game state at timer fire:", {gameStarted, gameOver, gameWon});
            if (gameStarted && !gameOver && !gameWon) {
                spawnObstacle();
            } else {
                console.log("Timer callback blocked by game state:", {gameStarted, gameOver, gameWon});
            }
        },
        callbackScope: scene,
        loop: true
    });
    
    console.log("🔧 Adding fish timer with current time:", scene.time.now);
    const fishTimer = scene.time.addEvent({
        delay: FISH_SPAWN_TIME,
        callback: function() {
            console.log("🔄 Timer-triggered fish spawn at time:", scene.time.now);
            console.log("🔄 Game state at timer fire:", {gameStarted, gameOver, gameWon});
            if (gameStarted && !gameOver && !gameWon) {
                spawnFish();
            } else {
                console.log("Timer callback blocked by game state:", {gameStarted, gameOver, gameWon});
            }
        },
        callbackScope: scene,
        loop: true
    });
    
    console.log("Timers created:", {obstacle: !!obstacleTimer, fish: !!fishTimer});
    console.log("Timer details:", {
        obstacleDelay: obstacleTimer.delay,
        fishDelay: fishTimer.delay,
        obstacleLoop: obstacleTimer.loop,
        fishLoop: fishTimer.loop,
        currentTime: scene.time.now
    });
    
    // Also create a debug timer to check if the time system is working
    scene.time.addEvent({
        delay: 1000,
        callback: function() {
            console.log("⏰ Timer check - current time:", scene.time.now, "game running:", gameStarted && !gameOver && !gameWon);
            console.log("⏰ Timer counts - obstacles:", obstacles ? obstacles.children.entries.length : 'N/A', 
                       "fish:", fish ? fish.children.entries.length : 'N/A');
        },
        callbackScope: scene,
        loop: true
    });
    
    // Add a simple test timer that should always fire
    scene.time.addEvent({
        delay: 2500,
        callback: function() {
            console.log("🧪 TEST TIMER FIRED - this should appear every 2.5 seconds");
        },
        callbackScope: scene,
        loop: true
    });
    
    console.log("✅ Fresh spawn timers started!");
}

// Test functions for restart functionality
function testRestartFunctionality() {
    console.log("🧪 Testing restart functionality...");
    
    // Check if all required variables are properly defined
    const requiredVars = ['gameStarted', 'gameOver', 'gameWon', 'score', 'distance', 'currentMusicTrack'];
    const missingVars = requiredVars.filter(varName => typeof window[varName] === 'undefined');
    
    if (missingVars.length > 0) {
        console.error("❌ Missing variables:", missingVars);
        return false;
    }
    
    // Test initial state
    if (gameStarted === false && gameOver === false && gameWon === false && score === 0 && distance === 0) {
        console.log("✅ Initial game state is correct");
    } else {
        console.warn("⚠️ Initial state may be incorrect:", {gameStarted, gameOver, gameWon, score, distance});
    }
    
    // Test start screen elements array
    if (Array.isArray(startScreenElements)) {
        console.log("✅ Start screen elements array is properly initialized");
    } else {
        console.error("❌ Start screen elements array not properly initialized");
        return false;
    }
    
    console.log("✅ Restart functionality tests passed!");
    return true;
}

// Console command to manually trigger game over for testing
function triggerTestGameOver() {
    if (gameStarted) {
        gameOver = true;
        cat.setTint(0xff0000);
        showGameOverScreen(game.scene.scenes[0]);
        console.log("🎮 Test game over triggered");
    } else {
        console.log("⚠️ Start game first before testing game over");
    }
}

// Console command to check current game state
function checkGameState() {
    console.log("🎮 Current Game State:", {
        gameStarted,
        gameOver,
        gameWon,
        score,
        distance,
        currentMusicTrack,
        startScreenElementsCount: startScreenElements.length,
        isMusicPlaying,
        debugMode,
        obstaclesGroupExists: !!obstacles,
        fishGroupExists: !!fish,
        catExists: !!cat
    });
    
    // Check if groups have children
    if (obstacles) console.log("Obstacles count:", obstacles.children.entries.length);
    if (fish) console.log("Fish count:", fish.children.entries.length);
}

// Manual spawn test functions
function testSpawnObstacle() {
    console.log("🧪 Manual obstacle spawn test");
    spawnObstacle();
}

function testSpawnFish() {
    console.log("🧪 Manual fish spawn test");
    spawnFish();
}

// Debug function to count and inspect spawned objects
function inspectSpawnedObjects() {
    console.log("🔍 Inspecting spawned objects:");
    
    if (obstacles) {
        console.log("Obstacles count:", obstacles.children.entries.length);
        obstacles.children.entries.forEach((obj, i) => {
            console.log(`Obstacle ${i}:`, {
                x: obj.x, y: obj.y, 
                visible: obj.visible, 
                active: obj.active,
                alpha: obj.alpha,
                texture: obj.texture.key
            });
        });
    }
    
    if (fish) {
        console.log("Fish count:", fish.children.entries.length);
        fish.children.entries.forEach((obj, i) => {
            console.log(`Fish ${i}:`, {
                x: obj.x, y: obj.y, 
                visible: obj.visible, 
                active: obj.active,
                alpha: obj.alpha,
                texture: obj.texture.key
            });
        });
    }
}
