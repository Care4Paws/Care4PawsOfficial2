// Flappy Dog Game
let flappyGame = {
  canvas: null,
  ctx: null,
  dogY: 0,
  dogVelocity: 0,
  dogX: 50,
  pipes: [],
  pipeWidth: 50,
  pipeGap: 150,
  dogWidth: 40,
  dogHeight: 30,
  gameOver: false,
  gameActive: false,
  score: 0,
  gravity: 0.5,
  lastFrameTime: 0,
  dogImage: null,
  pipeTopImage: null,
  pipeBottomImage: null,
  backgroundImage: null,

  init: function(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Initial bird position
    this.dogY = this.canvas.height / 2 - this.dogHeight / 2;

    // Load images
    this.dogImage = new Image();
    this.dogImage.src = 'https://i.imgur.com/YSJRQfr.png'; // Dog sprite

    this.pipeTopImage = new Image();
    this.pipeTopImage.src = 'https://i.imgur.com/TnF0v68.png'; // Pipe top

    this.pipeBottomImage = new Image();
    this.pipeBottomImage.src = 'https://i.imgur.com/gfG6Jx3.png'; // Pipe bottom

    this.backgroundImage = new Image();
    this.backgroundImage.src = 'https://i.imgur.com/F9v71Bm.png'; // Sky background

    // Add keyboard listeners
    document.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && !this.gameOver) {
        if (!this.gameActive) {
          this.startGame();
        } else {
          this.flap();
        }
      }

      if (e.code === 'Enter' && this.gameOver) {
        this.resetGame();
      }
    });

    // Add touch listeners for mobile
    this.canvas.addEventListener('touchstart', () => {
      if (!this.gameOver) {
        if (!this.gameActive) {
          this.startGame();
        } else {
          this.flap();
        }
      } else {
        this.resetGame();
      }
    });

    // Start render loop
    requestAnimationFrame((time) => this.gameLoop(time));
  },

  startGame: function() {
    if (!this.gameActive) {
      this.gameActive = true;
      this.addPipe();
    }
  },

  resetGame: function() {
    this.pipes = [];
    this.dogY = this.canvas.height / 2 - this.dogHeight / 2;
    this.dogVelocity = 0;
    this.gameOver = false;
    this.gameActive = false;
    this.score = 0;
  },

  flap: function() {
    this.dogVelocity = -7;
  },

  addPipe: function() {
    // Calculate random pipe positions
    const minHeight = 50;
    const maxHeight = this.canvas.height - this.pipeGap - minHeight;
    const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    this.pipes.push({
      x: this.canvas.width,
      topHeight: height,
      bottomY: height + this.pipeGap,
      passed: false
    });

    // Recursive call to add more pipes
    if (this.gameActive && !this.gameOver) {
      setTimeout(() => this.addPipe(), 1500);
    }
  },

  gameLoop: function(timestamp) {
    // Calculate delta time
    if (!this.lastFrameTime) this.lastFrameTime = timestamp;
    const deltaTime = (timestamp - this.lastFrameTime) / 16.67; // For 60fps
    this.lastFrameTime = timestamp;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background
    this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);

    // Update and draw bird
    if (this.gameActive) {
      // Apply gravity
      this.dogVelocity += this.gravity * deltaTime;
      this.dogY += this.dogVelocity * deltaTime;

      // Check for ceiling collision
      if (this.dogY < 0) {
        this.dogY = 0;
        this.dogVelocity = 0;
      }

      // Check for ground collision
      if (this.dogY + this.dogHeight > this.canvas.height) {
        this.dogY = this.canvas.height - this.dogHeight;
        this.gameOver = true;
      }
    }

    // Draw dog with slight rotation based on velocity
    this.ctx.save();
    this.ctx.translate(this.dogX + this.dogWidth / 2, this.dogY + this.dogHeight / 2);
    const rotation = Math.min(Math.max(this.dogVelocity * 0.05, -0.5), 0.5);
    this.ctx.rotate(rotation);
    this.ctx.drawImage(this.dogImage, -this.dogWidth / 2, -this.dogHeight / 2, this.dogWidth, this.dogHeight);
    this.ctx.restore();

    // Update and draw pipes
    if (this.gameActive) {
      for (let i = 0; i < this.pipes.length; i++) {
        const pipe = this.pipes[i];
        pipe.x -= 3 * deltaTime;

        // Draw top pipe
        this.ctx.drawImage(
          this.pipeTopImage, 
          pipe.x, 
          0, 
          this.pipeWidth, 
          pipe.topHeight
        );

        // Draw bottom pipe
        this.ctx.drawImage(
          this.pipeBottomImage, 
          pipe.x, 
          pipe.bottomY, 
          this.pipeWidth, 
          this.canvas.height - pipe.bottomY
        );

        // Check collision
        if (
          (this.dogX < pipe.x + this.pipeWidth &&
           this.dogX + this.dogWidth > pipe.x &&
           this.dogY < pipe.topHeight) ||
          (this.dogX < pipe.x + this.pipeWidth &&
           this.dogX + this.dogWidth > pipe.x &&
           this.dogY + this.dogHeight > pipe.bottomY)
        ) {
          this.gameOver = true;
        }

        // Increase score when passing pipe
        if (!pipe.passed && pipe.x + this.pipeWidth < this.dogX) {
          pipe.passed = true;
          this.score++;
        }
      }

      // Remove pipes that are off screen
      this.pipes = this.pipes.filter(pipe => pipe.x + this.pipeWidth > 0);
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
      const collectPawsButton = document.getElementById('collect-flappy-paws');
      if (collectPawsButton) {
        collectPawsButton.style.display = 'block';
        collectPawsButton.dataset.score = this.score;
      }
    }

    // Continue game loop
    requestAnimationFrame((time) => this.gameLoop(time));
  }
};

function initFlappyGame() {
  // Only initialize if we're on the bonus page
  if (document.getElementById('flappy-game-canvas')) {
    flappyGame.init('flappy-game-canvas');

    // Add click listener to start game button
    const startButton = document.getElementById('start-flappy-game');
    if (startButton) {
      startButton.addEventListener('click', () => {
        flappyGame.startGame();
        startButton.style.display = 'none';
      });
    }

    // Handle paw collection
    const collectPawsButton = document.getElementById('collect-flappy-paws');
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

          userData.paws.count += Math.floor(parseInt(collectPawsButton.dataset.score) / 3);

          // Save updated data
          await updateUserData(userData);

          // Update UI
          document.getElementById('paws-count').textContent = userData.paws.count;

          // Hide button and show message
          collectPawsButton.style.display = 'none';

          const messageElement = document.getElementById('flappy-game-message');
          if (messageElement) {
            messageElement.textContent = `Congratulations! You earned ${Math.floor(parseInt(collectPawsButton.dataset.score) / 3)} paws!`;
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
document.addEventListener('DOMContentLoaded', initFlappyGame);