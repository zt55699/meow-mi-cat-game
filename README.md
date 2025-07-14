# Meow Mi - 2D Side-Scrolling Cat Game 🐱

A fun and engaging 2D side-scrolling web game built with Phaser 3, featuring a cute cat character that jumps, collects fish, and avoids obstacles. **Optimized for iPhone 14/15 and mobile devices!**

## 🌐 Play Online

**Live Demo**: https://zt55699.github.io/meow-mi-cat-game/

A fun and engaging 2D side-scrolling web game with reliable audio system and smooth gameplay. **Perfect for mobile gaming on iPhone 14/15!**

## 🚀 Auto-Deployment

This repository uses GitHub Actions for automatic deployment to GitHub Pages when new tags are created.

### How to Deploy a New Version:

1. **Create and push a new tag:**
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. **GitHub Actions will automatically:**
   - Build the game files
   - Deploy to GitHub Pages
   - Update the live demo

3. **Manual deployment:**
   You can also trigger deployment manually from the GitHub Actions tab.

## 🎮 Game Features

### Core Gameplay
- **Side-scrolling action**: Cat moves horizontally through an endless scrolling world
- **Variable jump mechanics**: Quick tap = small jump, hold = charge jump power!
- **Smart visual feedback**: Charge indicator only appears for longer presses (150ms+)
- **Intuitive controls**: Quick taps feel responsive without visual clutter
- **Enhanced responsiveness**: Reduced bounce time by 50% for faster input response
- **Clear audio feedback**: Distinct sound effects for valid vs. invalid jump attempts
- **High score tracking**: Persistent high score system with localStorage
- **Curved fish patterns**: Fish spawn in jump trajectory arcs (5-7 fish per pattern)
- **Dynamic difficulty**: Fish curve heights vary from 40px to 270px
- **Obstacle avoidance**: Avoid red boxes to survive
- **Fish collection**: Collect blue fish to increase your score
- **Win condition**: Reach 500 meters to win the game
- **Game over**: Hit an obstacle to trigger game over

### Visual & Audio
- **Cute cat sprite**: Emoji-based cat character (🐱)
- **Smooth animations**: Cat tilts during jumps and has idle animations
- **Variable jump sounds**: Sound duration reflects jump charge level (longer = more charged)
- **Continuous charging sound**: Sustained audio that builds during charge (150ms+ hold)
- **Rich sound effects**: Jump, collect, game over, victory, and feedback sounds
- **Background music**: Multiple music tracks that change during gameplay
- **High score display**: Yellow-highlighted persistent score tracking
- **New record celebration**: Special "NEW HIGH SCORE!" notifications
- **Mobile-optimized**: Specially designed for iPhone 14/15 screen sizes
- **Responsive design**: Perfect touch controls and responsive layout

### Technical Features
- **Camera system**: Smooth camera following with cat movement
- **Physics engine**: Arcade physics for realistic movement and collisions
- **Curved spawn system**: Parabolic fish patterns matching jump trajectories
- **Persistent data**: localStorage high score tracking across sessions
- **State management**: Proper game state handling (start, playing, game over, win)
- **Restart functionality**: Full game restart without page reload
- **Audio feedback system**: Clear sound cues for all player interactions
- **Optimized physics**: Reduced bounce for more responsive controls

## 🗂️ Project Structure

```
meow_mi/
├── index.html              # Main HTML file
├── game.js                 # Main game logic with audio system
├── audioManager.js         # Audio management system
├── style.css               # Responsive styling
├── favicon.ico             # Game icon
├── server.py               # Local development server
├── start_game.sh           # Quick start script
├── README.md               # This file
└── HANDOFF.md              # Technical implementation details
```

## 🎯 Game Controls

- **iPhone/Mobile**: Quick tap = small jump, hold to charge power 📱
- **Desktop**: Quick click/SPACE = small jump, hold to charge power
- **Jump Power**: Short press = small jump, long press = high jump
- **Visual Guide**: Charge bar appears after 150ms (green → yellow → red)
- **Quick Response**: Instant taps feel responsive without visual clutter
- **Start**: Tap "TAP TO START" to begin
- **Restart**: Tap "Tap to Restart" after game over

### Feedback System
- **Continuous Charging Audio**: Sustained sound that builds throughout charge (120-180Hz)
- **Variable Jump Audio**: Sound duration extends with jump charge level (100ms → 350ms)
- **Enhanced Audio Cues**: Clear, distinct sounds for successful jumps vs. blocked attempts
- **Cat Animation**: Subtle bounce effect shows input was registered but invalid
- **Throttled Feedback**: Prevents spam while maintaining clear communication
- **Non-intrusive**: Clean feedback that doesn't disrupt gameplay flow
- **Immediate Response**: Instant audio feedback helps players understand game state

### Mobile Features
- **Full-screen gameplay** on iPhone 14/15
- **Safe area support** for notched screens
- **Optimized touch controls** with no accidental zooming
- **Responsive UI** that scales perfectly on all screen sizes

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

### iPhone 14/15 Optimizations
- **Full-screen experience** with proper safe area handling
- **Optimized screen dimensions** (390x844 portrait, 844x390 landscape)
- **Touch-first design** with large tap targets
- **Prevented zooming and scrolling** for seamless gameplay
- **Enhanced audio context** handling for iOS Safari

### General Mobile Features
- **Responsive UI scaling** for all screen sizes
- **Portrait and landscape support** 
- **Audio context properly initialized** after user interaction
- **Optimized rendering** for mobile performance
- **Smooth 60fps gameplay** on modern devices

## 🎵 Audio Features

- **Dynamic music**: 3 different background tracks
- **Sound effects**: Jump, collect, game over, victory
- **Volume control**: Balanced audio levels
- **Browser compliance**: Proper AudioContext initialization

Enjoy playing Meow Mi! 🐱🎮