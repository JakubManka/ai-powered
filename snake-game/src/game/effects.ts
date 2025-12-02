// ==========================================
// Visual Effects Manager - PixiJS rendering and effects
// ==========================================

import { Application, Container, Graphics } from 'pixi.js';
import type { Snake, Food, Position, Particle } from '@/types';
import { COLORS } from '@/lib/constants';

export class EffectsManager {
  private app: Application;
  private gameContainer: Container;
  private snakeGraphics: Graphics;
  private foodGraphics: Graphics;
  private particleContainer: Container;
  private gridGraphics: Graphics;
  private particles: Particle[] = [];
  private cellSize: number = 0;
  private foodPulse: number = 0;
  private shakeOffset = { x: 0, y: 0 };
  private shakeIntensity: number = 0;
  private animationFrame: number | null = null;

  // Custom colors for high contrast mode
  private foregroundColor: number = parseInt(COLORS.darkest.slice(1), 16);
  private backgroundColor: number = parseInt(COLORS.lightest.slice(1), 16);
  private useHighContrast: boolean = false;

  constructor(app: Application, gameContainer: Container) {
    this.app = app;
    this.gameContainer = gameContainer;

    // Create graphics layers
    this.gridGraphics = new Graphics();
    this.snakeGraphics = new Graphics();
    this.foodGraphics = new Graphics();
    this.particleContainer = new Container();

    this.gameContainer.addChild(this.gridGraphics);
    this.gameContainer.addChild(this.foodGraphics);
    this.gameContainer.addChild(this.snakeGraphics);
    this.gameContainer.addChild(this.particleContainer);

    // Start animation loop
    this.startAnimationLoop();
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.updateEffects();
      this.animationFrame = requestAnimationFrame(animate);
    };
    this.animationFrame = requestAnimationFrame(animate);
  }

  setHighContrast(enabled: boolean, foreground?: string, background?: string): void {
    this.useHighContrast = enabled;
    
    if (enabled && foreground && background) {
      this.foregroundColor = parseInt(foreground.slice(1), 16);
      this.backgroundColor = parseInt(background.slice(1), 16);
    } else {
      this.foregroundColor = parseInt(COLORS.darkest.slice(1), 16);
      this.backgroundColor = parseInt(COLORS.lightest.slice(1), 16);
    }
  }

  render(snake: Snake, food: Food, gridSize: number): void {
    // Calculate cell size based on canvas dimensions
    this.cellSize = Math.min(
      this.app.canvas.width / gridSize,
      this.app.canvas.height / gridSize
    );

    // Apply screen shake
    this.gameContainer.x = this.shakeOffset.x;
    this.gameContainer.y = this.shakeOffset.y;

    this.renderGrid(gridSize);
    this.renderSnake(snake);
    this.renderFood(food);
  }

  private renderGrid(gridSize: number): void {
    this.gridGraphics.clear();
    
    const gridColor = this.useHighContrast 
      ? this.foregroundColor 
      : parseInt(COLORS.light.slice(1), 16);

    // Draw subtle grid lines
    for (let i = 0; i <= gridSize; i++) {
      // Vertical lines
      this.gridGraphics.moveTo(i * this.cellSize, 0);
      this.gridGraphics.lineTo(i * this.cellSize, gridSize * this.cellSize);
      
      // Horizontal lines
      this.gridGraphics.moveTo(0, i * this.cellSize);
      this.gridGraphics.lineTo(gridSize * this.cellSize, i * this.cellSize);
    }
    
    this.gridGraphics.stroke({ width: 0.5, color: gridColor, alpha: 0.3 });
  }

  private renderSnake(snake: Snake): void {
    this.snakeGraphics.clear();

    const headColor = this.useHighContrast
      ? this.foregroundColor
      : parseInt(COLORS.darkest.slice(1), 16);
    
    const bodyColor = this.useHighContrast
      ? this.foregroundColor
      : parseInt(COLORS.dark.slice(1), 16);

    snake.segments.forEach((segment, index) => {
      const isHead = index === 0;
      const color = isHead ? headColor : bodyColor;
      const padding = 1;

      this.snakeGraphics.rect(
        segment.x * this.cellSize + padding,
        segment.y * this.cellSize + padding,
        this.cellSize - padding * 2,
        this.cellSize - padding * 2
      );
      this.snakeGraphics.fill(color);

      // Add eyes to head
      if (isHead) {
        this.renderSnakeEyes(segment, snake.direction);
      }
    });
  }

  private renderSnakeEyes(head: Position, direction: string): void {
    const eyeColor = this.useHighContrast
      ? this.backgroundColor
      : parseInt(COLORS.lightest.slice(1), 16);

    const eyeSize = this.cellSize * 0.15;
    const eyeOffset = this.cellSize * 0.25;

    let leftEye: Position;
    let rightEye: Position;

    const centerX = head.x * this.cellSize + this.cellSize / 2;
    const centerY = head.y * this.cellSize + this.cellSize / 2;

    switch (direction) {
      case 'UP':
        leftEye = { x: centerX - eyeOffset, y: centerY - eyeOffset };
        rightEye = { x: centerX + eyeOffset, y: centerY - eyeOffset };
        break;
      case 'DOWN':
        leftEye = { x: centerX - eyeOffset, y: centerY + eyeOffset };
        rightEye = { x: centerX + eyeOffset, y: centerY + eyeOffset };
        break;
      case 'LEFT':
        leftEye = { x: centerX - eyeOffset, y: centerY - eyeOffset };
        rightEye = { x: centerX - eyeOffset, y: centerY + eyeOffset };
        break;
      case 'RIGHT':
      default:
        leftEye = { x: centerX + eyeOffset, y: centerY - eyeOffset };
        rightEye = { x: centerX + eyeOffset, y: centerY + eyeOffset };
        break;
    }

    this.snakeGraphics.circle(leftEye.x, leftEye.y, eyeSize);
    this.snakeGraphics.circle(rightEye.x, rightEye.y, eyeSize);
    this.snakeGraphics.fill(eyeColor);
  }

  private renderFood(food: Food): void {
    this.foodGraphics.clear();

    // Pulsing glow effect
    const pulseAmount = Math.sin(this.foodPulse) * 0.15 + 0.85;
    const glowColor = this.useHighContrast
      ? this.foregroundColor
      : parseInt(COLORS.light.slice(1), 16);

    const centerX = food.position.x * this.cellSize + this.cellSize / 2;
    const centerY = food.position.y * this.cellSize + this.cellSize / 2;
    const radius = (this.cellSize / 2 - 2) * pulseAmount;

    // Outer glow
    this.foodGraphics.circle(centerX, centerY, radius + 2);
    this.foodGraphics.fill({ color: glowColor, alpha: 0.3 * pulseAmount });

    // Inner food
    this.foodGraphics.circle(centerX, centerY, radius);
    this.foodGraphics.fill(glowColor);
  }

  spawnParticles(position: Position): void {
    const particleCount = 8;
    const centerX = position.x * this.cellSize + this.cellSize / 2;
    const centerY = position.y * this.cellSize + this.cellSize / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color: COLORS.light,
        size: 3 + Math.random() * 2,
      });
    }
  }

  screenShake(): void {
    this.shakeIntensity = 8;
  }

  private updateEffects(): void {
    // Update food pulse
    this.foodPulse += 0.1;

    // Update screen shake
    if (this.shakeIntensity > 0) {
      this.shakeOffset.x = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeOffset.y = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.85;
      
      if (this.shakeIntensity < 0.5) {
        this.shakeIntensity = 0;
        this.shakeOffset = { x: 0, y: 0 };
      }
    }

    // Update and render particles
    this.updateParticles();
  }

  private updateParticles(): void {
    // Clear old particle graphics
    this.particleContainer.removeChildren();

    // Update particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // Gravity
      p.life -= 0.03;

      if (p.life <= 0) return false;

      // Render particle
      const graphics = new Graphics();
      graphics.circle(p.x, p.y, p.size * p.life);
      graphics.fill({ 
        color: parseInt(p.color.slice(1), 16), 
        alpha: p.life 
      });
      this.particleContainer.addChild(graphics);

      return true;
    });
  }

  destroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.gameContainer.removeChildren();
    this.particles = [];
  }
}

