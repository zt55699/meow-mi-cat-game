/**
 * Robust Audio Manager for Meow Mi Game
 * Handles all audio operations with proper state management and cleanup
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.musicGainNode = null;
        this.masterGainNode = null;
        this.sounds = {};
        this.currentMusicTrack = 1;
        
        // Detailed state management
        this.state = {
            music: 'stopped', // stopped, starting, playing, stopping
            context: 'uninitialized', // uninitialized, initializing, ready, closed
            lastAction: null,
            lastError: null
        };
        
        // Track active oscillators for cleanup
        this.activeOscillators = new Set();
        this.musicLoopTimeout = null;
        
        // Configuration
        this.config = {
            musicVolume: 0.15,
            effectsVolume: 0.3,
            fadeOutTime: 0.3,
            fadeOutDelay: 350,
            retryDelay: 200
        };
        
        console.log('🎵 AudioManager initialized');
    }

    /**
     * Initialize or reinitialize the audio context
     */
    async init() {
        console.log('🔊 AudioManager.init() called - current state:', this.state);
        
        // Prevent multiple simultaneous initializations
        if (this.state.context === 'initializing') {
            console.log('⏳ Already initializing, waiting...');
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (this.state.context !== 'initializing') {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }
        
        this.state.context = 'initializing';
        
        try {
            // Close existing context if any
            if (this.audioContext) {
                console.log('🔄 Closing existing audio context...');
                await this.closeAudioContext();
            }
            
            // Create new audio context
            console.log('🆕 Creating new audio context...');
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node for global volume control
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = 1.0;
            this.masterGainNode.connect(this.audioContext.destination);
            
            console.log('📊 AudioContext created - initial state:', this.audioContext.state);
            
            // Resume if suspended (browser requirement)
            if (this.audioContext.state === 'suspended') {
                console.log('▶️ Resuming suspended audio context...');
                await this.audioContext.resume();
                console.log('✅ Audio context resumed - state:', this.audioContext.state);
            }
            
            // Create sound effects
            this.createSoundEffects();
            
            this.state.context = 'ready';
            console.log('✅ Audio system initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize audio:', error);
            this.state.context = 'uninitialized';
            this.state.lastError = error.message;
            throw error;
        }
    }

    /**
     * Properly close the audio context
     */
    async closeAudioContext() {
        if (!this.audioContext) return;
        
        console.log('🔌 Closing audio context...');
        
        try {
            // Stop all music first
            if (this.state.music !== 'stopped') {
                await this.stopMusic();
            }
            
            // Disconnect master gain
            if (this.masterGainNode) {
                this.masterGainNode.disconnect();
                this.masterGainNode = null;
            }
            
            // Close the context
            if (this.audioContext.state !== 'closed') {
                await this.audioContext.close();
            }
            
            this.audioContext = null;
            this.state.context = 'uninitialized';
            console.log('✅ Audio context closed');
            
        } catch (error) {
            console.error('⚠️ Error closing audio context:', error);
        }
    }

    /**
     * Create sound effect functions
     */
    createSoundEffects() {
        console.log('🔨 Creating sound effects...');
        
        this.sounds.jump = () => this.playSound([
            { freq: 200, time: 0 },
            { freq: 400, time: 0.1 }
        ], this.config.effectsVolume, 0.1);
        
        this.sounds.collect = () => this.playSound([
            { freq: 523.25, time: 0 },
            { freq: 659.25, time: 0.05 },
            { freq: 783.99, time: 0.1 }
        ], this.config.effectsVolume, 0.2);
        
        this.sounds.gameOver = () => this.playSound([
            { freq: 400, time: 0 },
            { freq: 100, time: 0.5 }
        ], this.config.effectsVolume, 0.5);
        
        this.sounds.win = () => {
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                setTimeout(() => this.playTone(freq, this.config.effectsVolume, 0.3), i * 100);
            });
        };
    }

    /**
     * Start background music with full state management
     */
    async startMusic(trackNumber = null) {
        console.log('🎵 startMusic() called - current state:', this.state.music);
        this.state.lastAction = 'startMusic';
        
        // Check if we're in a transition state
        if (this.state.music === 'starting' || this.state.music === 'stopping') {
            console.log('⏳ Music in transition, retrying in', this.config.retryDelay, 'ms...');
            return new Promise((resolve) => {
                setTimeout(async () => {
                    await this.startMusic(trackNumber);
                    resolve();
                }, this.config.retryDelay);
            });
        }
        
        // Stop existing music if playing
        if (this.state.music === 'playing') {
            console.log('🛑 Stopping existing music first...');
            await this.stopMusic();
            // Small delay to ensure clean transition
            await this.delay(100);
        }
        
        // Set state to starting
        this.state.music = 'starting';
        
        try {
            // Ensure audio system is initialized
            if (!this.audioContext || this.state.context !== 'ready') {
                console.log('🔧 Audio not ready, initializing...');
                await this.init();
            }
            
            // Resume context if needed (critical for browser compatibility)
            if (this.audioContext.state === 'suspended') {
                console.log('▶️ Resuming audio context for music...');
                await this.audioContext.resume();
            }
            
            // Verify context is running
            if (this.audioContext.state !== 'running') {
                throw new Error(`Audio context not running: ${this.audioContext.state}`);
            }
            
            // Use provided track or current
            const track = trackNumber || this.currentMusicTrack;
            this.currentMusicTrack = track;
            
            // Create new music gain node
            console.log('🔊 Creating new music gain node...');
            this.musicGainNode = this.audioContext.createGain();
            this.musicGainNode.gain.setValueAtTime(this.config.musicVolume, this.audioContext.currentTime);
            
            // Connect to master gain (not directly to destination)
            this.musicGainNode.connect(this.masterGainNode);
            console.log('🔗 Music gain node connected to master');
            
            // Update state
            this.state.music = 'playing';
            console.log('✅ Music started successfully - track:', track);
            
            // Start the music loop
            this.playMusicLoop(track);
            
        } catch (error) {
            console.error('❌ Failed to start music:', error);
            this.state.music = 'stopped';
            this.state.lastError = error.message;
            this.musicGainNode = null;
            throw error;
        }
    }

    /**
     * Stop music with proper cleanup
     */
    async stopMusic() {
        console.log('🛑 stopMusic() called - current state:', this.state.music);
        this.state.lastAction = 'stopMusic';
        
        // Already stopped or stopping
        if (this.state.music === 'stopped' || this.state.music === 'stopping') {
            console.log('⏭️ Already stopped/stopping, skipping...');
            return;
        }
        
        this.state.music = 'stopping';
        
        try {
            // Clear any pending music loops
            if (this.musicLoopTimeout) {
                clearTimeout(this.musicLoopTimeout);
                this.musicLoopTimeout = null;
                console.log('⏹️ Cleared music loop timeout');
            }
            
            // Stop all active oscillators
            if (this.activeOscillators.size > 0) {
                console.log(`🔇 Stopping ${this.activeOscillators.size} active oscillators...`);
                const now = this.audioContext.currentTime;
                this.activeOscillators.forEach(osc => {
                    try {
                        osc.stop(now + 0.1);
                    } catch (e) {
                        // Oscillator might already be stopped
                    }
                });
                this.activeOscillators.clear();
            }
            
            // Fade out and disconnect music gain node
            if (this.musicGainNode) {
                console.log('🔉 Fading out music...');
                this.musicGainNode.gain.exponentialRampToValueAtTime(
                    0.001, // Can't use 0 for exponential ramp
                    this.audioContext.currentTime + this.config.fadeOutTime
                );
                
                // Wait for fade out
                await this.delay(this.config.fadeOutDelay);
                
                // Disconnect and cleanup
                console.log('🔌 Disconnecting music gain node...');
                this.musicGainNode.disconnect();
                this.musicGainNode = null;
            }
            
            this.state.music = 'stopped';
            console.log('✅ Music stopped successfully');
            
        } catch (error) {
            console.error('⚠️ Error stopping music:', error);
            this.state.lastError = error.message;
            // Force cleanup
            this.musicGainNode = null;
            this.activeOscillators.clear();
            this.state.music = 'stopped';
        }
    }

    /**
     * Play the music loop
     */
    playMusicLoop(track) {
        if (this.state.music !== 'playing' || !this.musicGainNode) {
            console.log('🚫 Music loop cancelled - state:', this.state.music);
            return;
        }
        
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
                this.scheduleNote(
                    freq,
                    currentTrack.bassType,
                    now + i * beatLength,
                    beatLength,
                    0.2
                );
            });
            
            // Melody
            currentTrack.melodyNotes.forEach((freq, i) => {
                if (freq > 0) {
                    this.scheduleNote(
                        freq,
                        currentTrack.melodyType,
                        now + i * beatLength * 0.5,
                        beatLength * 0.5,
                        0.1
                    );
                }
            });
            
            // Schedule next loop
            const loopDuration = currentTrack.bassNotes.length * beatLength * 1000;
            this.musicLoopTimeout = setTimeout(() => {
                if (this.state.music === 'playing') {
                    this.playMusicLoop(track);
                }
            }, loopDuration);
            
        } catch (error) {
            console.error('❌ Error in music loop:', error);
            this.state.music = 'stopped';
            this.state.lastError = error.message;
        }
    }

    /**
     * Schedule a single note
     */
    scheduleNote(frequency, type, startTime, duration, volume) {
        if (!this.musicGainNode || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, startTime);
            
            gainNode.gain.setValueAtTime(volume, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.8);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.musicGainNode);
            
            // Track oscillator
            this.activeOscillators.add(oscillator);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
            
            // Remove from tracking when stopped
            oscillator.onended = () => {
                this.activeOscillators.delete(oscillator);
            };
            
        } catch (error) {
            console.error('⚠️ Error scheduling note:', error);
        }
    }

    /**
     * Play a sound effect
     */
    playSound(frequencies, volume, duration) {
        if (!this.audioContext || this.audioContext.state !== 'running') {
            console.log('⚠️ Cannot play sound - audio not ready');
            return;
        }
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            // Set frequency changes
            frequencies.forEach(({ freq, time }) => {
                if (time === 0) {
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                } else {
                    oscillator.frequency.exponentialRampToValueAtTime(
                        freq,
                        this.audioContext.currentTime + time
                    );
                }
            });
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.001,
                this.audioContext.currentTime + duration
            );
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
        } catch (error) {
            console.error('⚠️ Error playing sound:', error);
        }
    }

    /**
     * Play a single tone
     */
    playTone(frequency, volume, duration) {
        this.playSound([{ freq: frequency, time: 0 }], volume, duration);
    }

    /**
     * Play a named sound effect
     */
    playEffect(effectName) {
        if (this.sounds[effectName]) {
            try {
                this.sounds[effectName]();
            } catch (error) {
                console.error(`⚠️ Error playing effect ${effectName}:`, error);
            }
        }
    }

    /**
     * Change to next music track
     */
    changeTrack() {
        this.currentMusicTrack = (this.currentMusicTrack % 3) + 1;
        console.log('🎼 Changed to track:', this.currentMusicTrack);
    }

    /**
     * Restart music with a new track
     */
    async restartMusic() {
        console.log('🔄 Restarting music...');
        await this.stopMusic();
        this.changeTrack();
        await this.startMusic();
    }

    /**
     * Get current state for debugging
     */
    getState() {
        return {
            music: this.state.music,
            context: this.state.context,
            contextState: this.audioContext?.state || 'no context',
            activeOscillators: this.activeOscillators.size,
            currentTrack: this.currentMusicTrack,
            lastAction: this.state.lastAction,
            lastError: this.state.lastError,
            hasGainNode: !!this.musicGainNode,
            hasMasterGain: !!this.masterGainNode
        };
    }

    /**
     * Utility: delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Full cleanup for game restart
     */
    async cleanup() {
        console.log('🧹 Full audio cleanup...');
        await this.stopMusic();
        await this.closeAudioContext();
        this.activeOscillators.clear();
        this.musicLoopTimeout = null;
        console.log('✅ Audio cleanup complete');
    }
}