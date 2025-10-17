
import { NPC } from './NPC';

export class Farmer extends NPC {
  constructor(scene: Phaser.Scene, x: number, y: number, relationship: number) {
    super(scene, x, y, 'farmer', relationship);
  }
}
