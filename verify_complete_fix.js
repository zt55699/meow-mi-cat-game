// Automated test to verify the spawn system works after restart
// Run this in browser console after loading the game

console.log("🧪 Starting comprehensive spawn system test...");

// Test 1: Wait for initial game state
setTimeout(() => {
    console.log("📋 Test 1: Checking initial game state");
    console.log("gameStarted:", gameStarted, "gameOver:", gameOver, "gameWon:", gameWon);
    
    if (!gameStarted) {
        console.log("✅ Game correctly waiting for start");
        
        // Simulate click to start
        console.log("🖱️ Simulating click to start game...");
        document.querySelector('#game canvas').click();
        
        // Test 2: Verify game starts and timers work
        setTimeout(() => {
            console.log("📋 Test 2: Checking if game started");
            console.log("gameStarted:", gameStarted, "groups exist:", !!obstacles, !!fish);
            
            if (gameStarted) {
                console.log("✅ Game started successfully");
                
                // Test 3: Wait for first spawns
                setTimeout(() => {
                    console.log("📋 Test 3: Checking first spawns");
                    const obstacleCount = obstacles ? obstacles.children.entries.length : 0;
                    const fishCount = fish ? fish.children.entries.length : 0;
                    console.log("Objects spawned - obstacles:", obstacleCount, "fish:", fishCount);
                    
                    if (obstacleCount > 0 || fishCount > 0) {
                        console.log("✅ Initial spawning works");
                        
                        // Test 4: Force game over to test restart
                        console.log("💀 Forcing game over to test restart...");
                        gameOver = true;
                        showGameOverScreen(game.scene.scenes[0]);
                        
                        // Test 5: Click restart and verify
                        setTimeout(() => {
                            console.log("📋 Test 5: Simulating restart click");
                            const restartButton = document.querySelector('canvas');
                            if (restartButton) {
                                // Simulate click on restart
                                restartButton.click();
                                
                                // Test 6: Verify restart worked
                                setTimeout(() => {
                                    console.log("📋 Test 6: Checking post-restart state");
                                    console.log("gameStarted:", gameStarted, "gameOver:", gameOver);
                                    console.log("Groups exist:", !!obstacles, !!fish);
                                    
                                    // Test 7: Wait for post-restart spawns
                                    setTimeout(() => {
                                        console.log("📋 Test 7: Checking post-restart spawning");
                                        const postObstacles = obstacles ? obstacles.children.entries.length : 0;
                                        const postFish = fish ? fish.children.entries.length : 0;
                                        console.log("Post-restart objects - obstacles:", postObstacles, "fish:", postFish);
                                        
                                        if (postObstacles > 0 || postFish > 0) {
                                            console.log("🎉 SUCCESS: Spawn system works after restart!");
                                        } else {
                                            console.log("❌ FAILED: No objects spawned after restart");
                                        }
                                        
                                        console.log("🏁 Test completed");
                                    }, 5000); // Wait 5 seconds for spawns
                                }, 1000); // Wait 1 second for restart to complete
                            }
                        }, 2000); // Wait 2 seconds for game over screen
                    } else {
                        console.log("❌ FAILED: No initial spawning detected");
                    }
                }, 4000); // Wait 4 seconds for initial spawns
            } else {
                console.log("❌ FAILED: Game did not start");
            }
        }, 1000); // Wait 1 second for start to process
    } else {
        console.log("⚠️ Game already started, skipping start test");
    }
}, 500); // Wait 0.5 seconds for initial load