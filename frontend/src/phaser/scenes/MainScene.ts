
import { Scene } from 'phaser';
import { Player } from '../sprites/Player';
import { Guard } from '../sprites/Guard';
import { Merchant } from '../sprites/Merchant';
import { Villager } from '../sprites/Villager';
import { Elder } from '../sprites/Elder';
import { Farmer } from '../sprites/Farmer';
import { NPC } from '../sprites/NPC';

export class MainScene extends Scene {
  private setSelectedNpcId!: (id: number) => void;
  private player!: Player;
  private npcs!: Phaser.GameObjects.Group;
  private relationshipScores!: Record<number, number>;

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: { setSelectedNpcId: (id: number) => void, relationshipScores: Record<number, number> }) {
    this.setSelectedNpcId = data.setSelectedNpcId;
    this.relationshipScores = data.relationshipScores || {};
  }

  preload() {
    this.createPlaceholderTexture('guard', 0xff0000);
    this.createPlaceholderTexture('merchant', 0x0000ff);
    this.createPlaceholderTexture('villager', 0x00ff00);
    this.createPlaceholderTexture('elder', 0xffff00);
    this.createPlaceholderTexture('farmer', 0x8B4513);
  }

  create() {
    this.cameras.main.setBackgroundColor('#24252A');
    this.player = new Player(this, 400, 300);
    this.npcs = this.add.group();

    const npcData = [
      { id: 0, type: Guard, x: 200, y: 100, relationship: -10 },
      { id: 1, type: Merchant, x: 300, y: 200, relationship: 10 },
      { id: 2, type: Villager, x: 400, y: 300, relationship: 0 },
      { id: 3, type: Elder, x: 500, y: 400, relationship: 5 },
      { id: 4, type: Farmer, x: 600, y: 500, relationship: 0 },
    ];

    npcData.forEach(data => {
      const npc = new data.type(this, data.x, data.y, data.relationship);
      npc.setData('id', data.id);
      this.npcs.add(npc);
    });

    this.physics.add.collider(this.player, this.npcs);
  }

  update() {
    this.player.update();
    this.npcs.getChildren().forEach(npc => {
      const npcSprite = npc as NPC;
      const data = this.sys.settings.data as { relationshipScores: Record<number, number> };
      const score = data.relationshipScores?.[npcSprite.getData('id')];
      if (score !== undefined && npcSprite.relationship !== score) {
        npcSprite.setRelationship(score);
      }
      npcSprite.update();
    });
  }

  private createPlaceholderTexture(key: string, color: number) {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture(key, 32, 32);
    graphics.destroy();
  }
}


  