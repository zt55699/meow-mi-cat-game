// Import or include audioManager.js before this file

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

// Create audio manager instance
const audioManager = new AudioManager();

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
    console.log('🎮 Creating game scene...');
    
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
    
    // Debug key - D
    this.input.keyboard.on('keydown-D', () => {
        const state = audioManager.getState();
        console.log('🎵 Audio State:', state);
    });
    
    // Music toggle - M
    this.input.keyboard.on('keydown-M', () => {
        if (audioManager.state.music === 'playing') {
            console.log('🔇 Stopping music via M key');
            audioManager.stopMusic();
        } else {
            console.log('🔊 Starting music via M key');
            audioManager.startMusic();
        }
    });
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

async function hitObstacle(cat, obstacle) {
    if (gameOver || gameWon) return;
    
    console.log('💥 Game Over - hit obstacle');
    this.physics.pause();
    cat.setTint(0xff0000);
    gameOver = true;
    
    audioManager.playEffect('gameOver');
    await audioManager.stopMusic();
    
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

async function showWinScreen(scene) {
    console.log('🏆 You Win!');
    scene.physics.pause();
    
    audioManager.playEffect('win');
    await audioManager.stopMusic();
    
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
    
    // Stop music and wait for cleanup
    await audioManager.stopMusic();
    
    // Clean up UI elements
    if (gameOverText) {
        gameOverText.destroy();
        gameOverText = null;
    }
    if (winText) {
        winText.destroy();
        winText = null;
    }
    if (restartText) {
        restartText.destroy();
        restartText = null;
    }
    
    const finalScore = scene.children.getByName('finalScore');
    if (finalScore) {
        finalScore.destroy();
    }
    
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
    
    // Change music track for variety
    audioManager.changeTrack();
    
    // Resume physics
    scene.physics.resume();
    
    // Start game with new music
    await startGame(scene);
}

async function startGame(scene) {
    console.log('🚀 Starting game...');
    
    // Clear all timers
    scene.time.removeAllEvents();
    
    // Initialize and start audio
    try {
        await audioManager.init();
        await audioManager.startMusic();
        console.log('✅ Audio started successfully');
    } catch (error) {
        console.error('❌ Audio failed to start:', error);
        // Game can continue without music
    }
    
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
    console.log('🎵 Audio state:', audioManager.getState());
}