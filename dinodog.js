
// Dog Dinosaur Game
let dinoGame = {
  canvas: null,
  ctx: null,
  dogY: 0,
  dogVelocity: 0,
  obstacles: [],
  obstacleWidth: 40,
  obstacleHeight: 80,
  groundY: 0,
  dogWidth: 80,
  dogHeight: 80,
  isJumping: false,
  gameOver: false,
  gameActive: false,
  score: 0,
  speed: 5,
  lastFrameTime: 0,
  dogImages: [],
  obstacleImage: null,
  currentDogFrame: 0,
  frameCounter: 0,
  originalCanvasWidth: 800,
  originalCanvasHeight: 300,

  init: function(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size
    this.canvas.width = this.originalCanvasWidth;
    this.canvas.height = this.originalCanvasHeight;

    // Set ground position
    this.groundY = this.canvas.height - 20;
    this.dogY = this.groundY - this.dogHeight;

    // Load dog animation frames
    const dogUrls = [
      'https://imgur.com/bYOtROq.png',
      'https://imgur.com/Ua7CWNQ.png',
      'https://imgur.com/HtDordr.png',
      'https://imgur.com/NLligu3.png'
    ];
    
    this.dogImages = dogUrls.map(url => {
      const img = new Image();
      img.src = url;
      return img;
    });

    // Load obstacle image
    this.obstacleImage = new Image();
    this.obstacleImage.src = 'https://imgur.com/mJ3kr4a.png';

    // Add keyboard listeners
    document.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && !this.isJumping && !this.gameOver) {
        this.jump();
      }
    });

    // Add click/touch listeners
    this.canvas.addEventListener('click', () => {
      if (!this.isJumping && !this.gameOver) {
        this.jump();
      }
    });

    // Add fullscreen button
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.textContent = 'Πλήρης Οθόνη';
    fullscreenBtn.className = 'game-button fullscreen-button';
    fullscreenBtn.style.marginLeft = '10px';
    this.canvas.parentElement.insertBefore(fullscreenBtn, this.canvas.nextSibling);

    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        this.canvas.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    // Handle fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        const screenRatio = window.innerWidth / window.innerHeight;
        const gameRatio = this.originalCanvasWidth / this.originalCanvasHeight;
        
        if (screenRatio > gameRatio) {
          this.canvas.style.height = '100vh';
          this.canvas.style.width = 'auto';
        } else {
          this.canvas.style.width = '100vw';
          this.canvas.style.height = 'auto';
        }
      } else {
        this.canvas.style.width = '';
        this.canvas.style.height = '';
      }
    });

    // Start render loop
    requestAnimationFrame((time) => this.gameLoop(time));
  },

  startGame: function() {
    if (!this.gameActive && !this.gameOver) {
      this.gameActive = true;
      this.addObstacle();
    } else if (this.gameOver) {
      this.resetGame();
    }
  },

  resetGame: function() {
    this.obstacles = [];
    this.dogY = this.groundY - this.dogHeight;
    this.dogVelocity = 0;
    this.isJumping = false;
    this.gameOver = false;
    this.gameActive = true;
    this.score = 0;
    this.speed = 5;
    this.currentDogFrame = 0;
    this.frameCounter = 0;

    // Hide collect button
    const collectPawsButton = document.getElementById('collect-dino-paws');
    if (collectPawsButton) {
      collectPawsButton.style.display = 'none';
      collectPawsButton.dataset.collected = 'false';
    }
  },

  jump: function() {
    if (!this.isJumping) {
      this.isJumping = true;
      this.dogVelocity = -15;
    }
  },

  addObstacle: function() {
    this.obstacles.push({
      x: this.canvas.width,
      y: this.groundY - this.obstacleHeight,
      width: this.obstacleWidth,
      height: this.obstacleHeight,
      passed: false
    });

    if (this.gameActive && !this.gameOver) {
      const delay = Math.max(1500 - (this.score * 50), 800);
      setTimeout(() => this.addObstacle(), delay);
    }
  },

  checkCollision: function(dogX, dogY, obstacle) {
    // Adjust hitbox to be slightly smaller than visual size
    const hitboxPadding = 10;
    const dogHitbox = {
      x: dogX + hitboxPadding,
      y: dogY + hitboxPadding,
      width: this.dogWidth - (hitboxPadding * 2),
      height: this.dogHeight - (hitboxPadding * 2)
    };

    return (
      dogHitbox.x < obstacle.x + obstacle.width &&
      dogHitbox.x + dogHitbox.width > obstacle.x &&
      dogHitbox.y < obstacle.y + obstacle.height &&
      dogHitbox.y + dogHitbox.height > obstacle.y
    );
  },

  gameLoop: function(timestamp) {
    // Calculate delta time
    if (!this.lastFrameTime) this.lastFrameTime = timestamp;
    const deltaTime = (timestamp - this.lastFrameTime) / 16.67;
    this.lastFrameTime = timestamp;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw dog
    if (this.gameActive) {
      // Apply gravity
      this.dogVelocity += 0.5 * deltaTime;
      this.dogY += this.dogVelocity * deltaTime;

      // Check ground collision
      if (this.dogY > this.groundY - this.dogHeight) {
        this.dogY = this.groundY - this.dogHeight;
        this.isJumping = false;
        this.dogVelocity = 0;
      }

      // Animate dog
      if (!this.isJumping) {
        this.frameCounter++;
        if (this.frameCounter >= 5) {
          this.currentDogFrame = (this.currentDogFrame + 1) % 4;
          this.frameCounter = 0;
        }
      }
    }

    // Draw current dog frame
    if (this.dogImages[this.currentDogFrame]) {
      this.ctx.drawImage(this.dogImages[this.currentDogFrame], 50, this.dogY, this.dogWidth, this.dogHeight);
    }

    // Update and draw obstacles
    if (this.gameActive) {
      const currentSpeed = this.speed + (this.score * 0.2);
      
      for (let i = 0; i < this.obstacles.length; i++) {
        const obstacle = this.obstacles[i];
        obstacle.x -= currentSpeed * deltaTime;

        // Draw obstacle
        if (this.obstacleImage) {
          this.ctx.drawImage(this.obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }

        // Check collision
        if (this.checkCollision(50, this.dogY, obstacle)) {
          this.gameOver = true;
          this.gameActive = false;
        }

        // Increase score when passing obstacle
        if (!obstacle.passed && obstacle.x + obstacle.width < 50) {
          obstacle.passed = true;
          this.score++;
        }
      }

      // Remove obstacles that are off screen
      this.obstacles = this.obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
    }

    // Draw score
    this.ctx.fillStyle = '#000';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 30);

    // Draw game state messages
    if (!this.gameActive && !this.gameOver) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Press SPACE/UP ARROW or Click to start', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.textAlign = 'left';
    } else if (this.gameOver) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over! Press ENTER or Click to restart', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
      this.ctx.textAlign = 'left';

      // Show collect paws button if not already collected
      const collectPawsButton = document.getElementById('collect-dino-paws');
      if (collectPawsButton && collectPawsButton.dataset.collected !== 'true') {
        collectPawsButton.style.display = 'block';
        collectPawsButton.dataset.score = this.score;
      }
    }

    // Continue game loop
    requestAnimationFrame((time) => this.gameLoop(time));
  }
};

function initDinoGame() {
  if (document.getElementById('dino-game-canvas')) {
    dinoGame.init('dino-game-canvas');

    const startButton = document.getElementById('start-dino-game');
    if (startButton) {
      startButton.addEventListener('click', () => {
        dinoGame.startGame();
        startButton.style.display = 'none';
      });
    }

    const collectPawsButton = document.getElementById('collect-dino-paws');
    if (collectPawsButton) {
      collectPawsButton.addEventListener('click', async () => {
        if (collectPawsButton.dataset.collected === 'true') {
          return;
        }
        try {
          collectPawsButton.dataset.collected = 'true';
          const currentUser = await getUserData();
          if (!currentUser) return;

          let userData = await getUserFullData(currentUser.email);

          if (!userData.paws) {
            userData.paws = {
              count: 0,
              streak: 0,
              lastCollected: null
            };
          }

          const pawsToAward = Math.floor(parseInt(collectPawsButton.dataset.score) / 5);
          userData.paws.count += pawsToAward;

          await updateUserData(userData);

          document.getElementById('paws-count').textContent = userData.paws.count;

          collectPawsButton.style.display = 'none';

          const messageElement = document.getElementById('dino-game-message');
          if (messageElement) {
            messageElement.textContent = `Congratulations! You earned ${pawsToAward} paws!`;
            messageElement.style.display = 'block';
          }

          updateLeaderboard();
          
          // Reset the game
          dinoGame.resetGame();
        } catch (error) {
          console.error('Error awarding paws:', error);
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', initDinoGame);
