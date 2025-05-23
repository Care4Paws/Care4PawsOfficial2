// Dog Dinosaur Game
let dinoGame = {
  canvas: null,
  ctx: null,
  dogY: 0,
  dogVelocity: 0,
  obstacles: [],
  obstacleWidth: 120,
  obstacleHeight: 130,
  groundY: 0,
  dogWidth: 120,
  dogHeight: 90,
  originalCanvasWidth: 1000,
  originalCanvasHeight: 400,
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
  originalCanvasHeight: 400,

  init: function(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Set canvas size and background
    this.canvas.width = this.originalCanvasWidth;
    this.canvas.height = this.originalCanvasHeight;
    this.canvas.style.backgroundColor = '#ffffff';

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
      this.dogVelocity = -12;
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
      setTimeout(() => this.addObstacle(), 1500);
    }
  },

  checkCollision: function(dogX, dogY, obstacle) {
    // Adjust hitbox to be more forgiving
    const hitboxPadding = 20;
    const dogHitbox = {
      x: dogX + hitboxPadding,
      y: dogY + hitboxPadding * 2.8,
      width: this.dogWidth - (hitboxPadding * 3),
      height: this.dogHeight - (hitboxPadding * 4)
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
      this.dogVelocity += 0.4 * deltaTime;
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

    // First update and draw obstacles
    if (this.gameActive) {
      const currentSpeed = this.speed + (this.score * 0.1);

      for (let i = 0; i < this.obstacles.length; i++) {
        const obstacle = this.obstacles[i];
        obstacle.x -= currentSpeed * deltaTime;

        // Draw obstacle
        if (this.obstacleImage) {
          this.ctx.drawImage(this.obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }

        // Check collision with smaller hitbox
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

    // Draw dog on top of everything
    if (this.dogImages[this.isJumping ? 1 : this.currentDogFrame]) {
      this.ctx.drawImage(this.dogImages[this.isJumping ? 1 : this.currentDogFrame], 50, this.dogY, this.dogWidth, this.dogHeight);
    }

    // Draw score
    this.ctx.fillStyle = '#000';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 30);

    // Draw game state messages
    if (!this.gameActive && !this.gameOver) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = '32px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Press SPACE/UP ARROW or Click to start', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.textAlign = 'left';
    } else if (this.gameOver) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = '32px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.fillText('Collect your paws to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
      this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 80);
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

    // Start game on space/up/click
    document.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && !dinoGame.gameActive && !dinoGame.gameOver) {
        dinoGame.startGame();
      }
    });

    dinoGame.canvas.addEventListener('click', () => {
      if (!dinoGame.gameActive && !dinoGame.gameOver) {
        dinoGame.startGame();
      }
    });

    const collectPawsButton = document.getElementById('collect-dino-paws');
    if (collectPawsButton) {
      collectPawsButton.addEventListener('click', async () => {
        if (collectPawsButton.dataset.collected === 'true') {
          return;
        }
        try {
          const currentUser = await getUserData();
          location.reload();
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