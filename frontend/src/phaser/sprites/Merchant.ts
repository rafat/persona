
import { NPC } from './NPC';

export class Merchant extends NPC {
  constructor(scene: Phaser.Scene, x: number, y: number, relationship: number) {
    super(scene, x, y, 'merchant', relationship);
  }
}
