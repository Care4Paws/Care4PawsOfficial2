// Dog Dinosaur Game
let dinoGame = {
  canvas: null,
  ctx: null,
  dogY: 0,
  dogVelocity: 0,
  obstacles: [],
  obstacleWidth: 20,
  obstacleHeight: 40,
  groundY: 0,
  dogWidth: 40,
  dogHeight: 40,
  isJumping: false,
  gameOver: false,
  gameActive: false,
  score: 0,
  speed: 5,
  lastFrameTime: 0,
  dogImage: null,
  obstacleImage: null,
  groundImage: null,
  backgroundImage: null,

  init: function(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Set ground position
    this.groundY = this.canvas.height - 50;
    this.dogY = this.groundY - this.dogHeight;

    // Load images
    this.dogImage = new Image();
    this.dogImage.src = 'https://imgur.com/a/rrDmz57'; // Dog image

    this.obstacleImage = new Image();
    this.obstacleImage.src = 'https://imgur.com/dIQLsEn'; // Obstacle image

    // No background image needed - using white background

    // Add keyboard listeners
    document.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && !this.isJumping && !this.gameOver) {
        this.jump();
      }

      if (e.code === 'Enter' && this.gameOver) {
        this.resetGame();
      }
    });

    // Add touch listeners for mobile
    this.canvas.addEventListener('touchstart', () => {
      if (!this.isJumping && !this.gameOver) {
        this.jump();
      } else if (this.gameOver) {
        this.resetGame();
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
  },

  jump: function() {
    if (!this.isJumping) {
      this.isJumping = true;
      this.dogVelocity = -8; // Reduced jump height
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

    // Recursive call to add more obstacles
    if (this.gameActive && !this.gameOver) {
      // Random time between 1.5 and 3 seconds
      const randomDelay = Math.random() * 1500 + 1500;
      setTimeout(() => this.addObstacle(), randomDelay);
    }
  },

  gameLoop: function(timestamp) {
    // Calculate delta time to ensure consistent game speed
    if (!this.lastFrameTime) this.lastFrameTime = timestamp;
    const deltaTime = (timestamp - this.lastFrameTime) / 16.67; // For 60fps
    this.lastFrameTime = timestamp;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Fill white background
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw ground line
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.groundY);
    this.ctx.lineTo(this.canvas.width, this.groundY);
    this.ctx.strokeStyle = '#000000';
    this.ctx.stroke();

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
    }

    // Draw dog
    this.ctx.drawImage(this.dogImage, 50, this.dogY, this.dogWidth, this.dogHeight);

    // Update and draw obstacles
    if (this.gameActive) {
      for (let i = 0; i < this.obstacles.length; i++) {
        const obstacle = this.obstacles[i];
        obstacle.x -= this.speed * deltaTime;

        // Draw obstacle
        this.ctx.drawImage(this.obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        // Check collision
        if (
          50 < obstacle.x + obstacle.width &&
          50 + this.dogWidth > obstacle.x &&
          this.dogY < obstacle.y + obstacle.height &&
          this.dogY + this.dogHeight > obstacle.y
        ) {
          this.gameOver = true;
          this.gameActive = false;
        }

        // Increase score when passing obstacle
        if (!obstacle.passed && obstacle.x + obstacle.width < 50) {
          obstacle.passed = true;
          this.score++;

          // Increase speed slightly every 5 points
          if (this.score % 5 === 0) {
            this.speed += 0.5;
          }
        }
      }

      // Remove obstacles that are off screen
      this.obstacles = this.obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
    }

    // Draw score
    this.ctx.fillStyle = '#000';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 25);

    // Draw start or game over text
    if (!this.gameActive && !this.gameOver) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Press SPACE or tap to start', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.textAlign = 'left';
    } else if (this.gameOver) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over! Press ENTER or tap to restart', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
      this.ctx.textAlign = 'left';

      // Show collect paws button
      const collectPawsButton = document.getElementById('collect-dino-paws');
      if (collectPawsButton) {
        collectPawsButton.style.display = 'block';
        collectPawsButton.dataset.score = this.score;
      }
    }

    // Continue game loop
    requestAnimationFrame((time) => this.gameLoop(time));
  }
};

function initDinoGame() {
  // Only initialize if we're on the bonus page
  if (document.getElementById('dino-game-canvas')) {
    dinoGame.init('dino-game-canvas');

    // Add click listener to start game button
    const startButton = document.getElementById('start-dino-game');
    if (startButton) {
      startButton.addEventListener('click', () => {
        dinoGame.startGame();
        startButton.style.display = 'none';
      });
    }

    // Handle paw collection
    const collectPawsButton = document.getElementById('collect-dino-paws');
    if (collectPawsButton) {
      collectPawsButton.addEventListener('click', async () => {
        if (collectPawsButton.dataset.collected === 'true') {
          return;
        }
        try {
          collectPawsButton.dataset.collected = 'true';
          // Get current user data
          const currentUser = await getUserData();
          if (!currentUser) return;

          // Get full user data
          let userData = await getUserFullData(currentUser.email);

          // Update paws count
          if (!userData.paws) {
            userData.paws = {
              count: 0,
              streak: 0,
              lastCollected: null
            };
          }

          userData.paws.count += pawsToAward;

          // Save updated data
          await updateUserData(userData);

          // Update UI
          document.getElementById('paws-count').textContent = userData.paws.count;

          // Hide button and show message
          collectPawsButton.style.display = 'none';

          const messageElement = document.getElementById('dino-game-message');
          if (messageElement) {
            messageElement.textContent = `Congratulations! You earned ${pawsToAward} paws!`;
            messageElement.style.display = 'block';
          }

          // Update leaderboard
          updateLeaderboard();
        } catch (error) {
          console.error('Error awarding paws:', error);
        }
      });
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDinoGame);