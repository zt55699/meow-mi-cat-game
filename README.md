# Meow Mi - 2D Side-Scrolling Cat Game 🐱

A fun and engaging 2D side-scrolling web game built with Phaser 3, featuring a cute cat character that jumps, collects fish, and avoids obstacles.

## 🎮 Game Features

### Core Gameplay
- **Side-scrolling action**: Cat moves horizontally through an endless scrolling world
- **Jump mechanics**: Click or tap anywhere to make the cat jump
- **Obstacle avoidance**: Avoid red boxes to survive
- **Fish collection**: Collect blue fish to increase your score
- **Win condition**: Reach 500 meters to win the game
- **Game over**: Hit an obstacle to trigger game over

### Visual & Audio
- **Cute cat sprite**: Emoji-based cat character (🐱)
- **Smooth animations**: Cat tilts during jumps and has idle animations
- **Sound effects**: Jump, collect, game over, and victory sounds
- **Background music**: Multiple music tracks that change during gameplay
- **Responsive design**: Works on desktop and mobile devices

### Technical Features
- **Camera system**: Smooth camera following with cat movement
- **Physics engine**: Arcade physics for realistic movement and collisions
- **Spawn system**: Dynamic obstacle and fish spawning
- **State management**: Proper game state handling (start, playing, game over, win)
- **Restart functionality**: Full game restart without page reload

## 🗂️ Project Structure

```
meow_mi/
├── index.html              # Main HTML file
├── style.css               # Responsive styling
├── game.js                 # Main game logic
├── README.md               # This file
├── HANDOFF.md              # Technical implementation details
└── debug/                  # Debug and test files
    ├── debug_fish_issue.html
    ├── test_manual_restart.html
    ├── final_test.html
    ├── test_group_fix.html
    └── minimal_test.html
```

## 🎯 Game Controls

- **Desktop**: Click anywhere to jump
- **Mobile**: Tap anywhere to jump
- **Start**: Click/tap "Tap or Click Anywhere to Start" to begin
- **Restart**: Click/tap "Click or Tap to Restart" after game over

## 📋 Requirements

### Browser Requirements
- Modern web browser with JavaScript enabled
- Web Audio API support (for sound effects)
- HTML5 Canvas support
- ES6+ JavaScript support

### Technical Requirements
- No installation required - runs in browser
- Internet connection (for Phaser 3 CDN)
- HTTP server for local development

## 🚀 How to Run

### Option 1: Local HTTP Server (Recommended)
```bash
# Navigate to project directory
cd meow_mi

# Start Python HTTP server
python3 -m http.server 8080

# Open browser to http://localhost:8080
```

### Option 2: Live Server (VS Code)
1. Install Live Server extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

### Option 3: Any HTTP Server
Deploy files to any web server and access via browser.

**⚠️ Note**: The game requires an HTTP server due to browser security restrictions. Opening `index.html` directly in browser will not work.

## 🎮 Gameplay Instructions

1. **Start**: Click "Tap or Click Anywhere to Start"
2. **Play**: 
   - Click/tap to make the cat jump
   - Avoid red obstacles (boxes)
   - Collect blue fish for points
   - Watch your distance progress
3. **Scoring**:
   - Each fish collected = +10 points
   - Goal: Reach 500 meters
4. **Game Over**: Hit an obstacle ends the game
5. **Restart**: Click restart button to play again

## 🛠️ Technologies Used

- **Phaser 3.70.0**: Game framework
- **Web Audio API**: Sound generation
- **HTML5 Canvas**: Rendering
- **ES6 JavaScript**: Game logic
- **CSS3**: Responsive styling
- **Emoji Graphics**: Simple, cute visuals

## 🎨 Game Assets

All game assets are procedurally generated:
- **Cat**: 🐱 emoji rendered to texture
- **Obstacles**: Red rectangles
- **Fish**: Blue ellipses with details
- **Background**: Solid colors and ground tiles
- **Sounds**: Generated using Web Audio API oscillators

## 🐛 Known Issues

- None currently known
- All major issues have been resolved

## 🔧 Development Notes

- Game uses camera-following system for smooth scrolling
- Physics optimized to prevent collision bounce issues
- Extensive debugging and testing system included
- Restart system completely resets game state without page reload
- Timer system carefully managed to prevent memory leaks

## 📱 Mobile Support

- Touch controls fully supported
- Responsive design adapts to mobile screens
- Audio context properly initialized after user interaction
- Optimized for both landscape and portrait orientations

## 🎵 Audio Features

- **Dynamic music**: 3 different background tracks
- **Sound effects**: Jump, collect, game over, victory
- **Volume control**: Balanced audio levels
- **Browser compliance**: Proper AudioContext initialization

Enjoy playing Meow Mi! 🐱🎮