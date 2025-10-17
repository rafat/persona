import * as Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys: { [key: string]: Phaser.Input.Keyboard.Key } = {};

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    // Create a simple placeholder texture
    const graphics = scene.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x00ff00, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('player', 32, 32);
    graphics.destroy();
    this.setTexture('player');

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keys = scene.input.keyboard!.addKeys('W,A,S,D') as { [key: string]: Phaser.Input.Keyboard.Key };
  }

  update() {
    this.setVelocity(0);

    if (this.cursors.left.isDown || this.keys.A.isDown) {
      this.setVelocityX(-160);
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
      this.setVelocityX(160);
    }

    if (this.cursors.up.isDown || this.keys.W.isDown) {
      this.setVelocityY(-160);
    } else if (this.cursors.down.isDown || this.keys.S.isDown) {
      this.setVelocityY(160);
    }
  }
}
