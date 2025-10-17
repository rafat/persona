
import * as Phaser from 'phaser';

export type Mood = 'hostile' | 'neutral' | 'friendly';

export class NPC extends Phaser.Physics.Arcade.Sprite {
  public relationship: number;
  public mood: Mood;
  private moodRing: Phaser.GameObjects.Graphics;
  private heartIcon: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, relationship: number) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setInteractive();

    this.relationship = relationship;
    this.mood = this.calculateMood();

    this.moodRing = scene.add.graphics();
    this.updateMoodRing();

    this.heartIcon = scene.add.text(this.x, this.y - 40, '', { fontSize: '16px', color: '#ff0000' });
    this.updateHeartIcon();

    this.on('pointerdown', () => {
      // @ts-expect-error - setSelectedNpcId is passed from React
      this.scene.setSelectedNpcId(this.getData('id'));
    });
  }

  update() {
    this.moodRing.x = this.x;
    this.moodRing.y = this.y;
    this.heartIcon.x = this.x - this.heartIcon.width / 2;
    this.heartIcon.y = this.y - 40;
  }

  public setRelationship(newRelationship: number) {
    const relationshipChanged = this.relationship !== newRelationship;
    const isPositive = newRelationship > this.relationship;
    this.relationship = newRelationship;
    this.mood = this.calculateMood();
    this.updateMoodRing();
    this.updateHeartIcon();

    if (relationshipChanged) {
      this.emitParticles(isPositive);
    }
  }

  private emitParticles(isPositive: boolean) {
    const particles = this.scene.add.particles(0, 0, 'particle', {
      speed: 100,
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 500,
      tint: isPositive ? 0x00ff00 : 0xff0000,
    });
    particles.setX(this.x);
    particles.setY(this.y);
    particles.explode(16);
  }

  private calculateMood(): Mood {
    if (this.relationship < 0) {
      return 'hostile';
    } else if (this.relationship > 20) {
      return 'friendly';
    } else {
      return 'neutral';
    }
  }

  private updateMoodRing() {
    this.moodRing.clear();
    const color = {
      hostile: 0xff0000,
      neutral: 0xffff00,
      friendly: 0x00ff00,
    }[this.mood];

    this.moodRing.lineStyle(2, color, 1);
    this.moodRing.strokeCircle(0, 0, 20);
  }

  private updateHeartIcon() {
    const hearts = Math.floor(this.relationship / 10);
    this.heartIcon.setText('❤️'.repeat(Math.max(0, hearts)));
  }
}
