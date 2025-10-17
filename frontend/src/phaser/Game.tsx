
"use client";

import { useEffect, useRef } from 'react';
import { Game as PhaserGame } from 'phaser';
import { MainScene } from './scenes/MainScene';

import { useGameStore } from '@/store/game';

export function Game() {
  const gameRef = useRef<PhaserGame | null>(null);
  const { setSelectedNpcId, relationshipScores } = useGameStore();

  useEffect(() => {
    if (gameRef.current) {
      return;
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'phaser-container',
      scene: [MainScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
        },
      },
    };

    const game = new PhaserGame(config);
    game.scene.start('MainScene', { setSelectedNpcId, relationshipScores });

    gameRef.current = game;

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [setSelectedNpcId, relationshipScores]);

  useEffect(() => {
    if (gameRef.current) {
      const mainScene = gameRef.current.scene.getScene('MainScene');
      if (mainScene && mainScene.sys && mainScene.sys.settings.data) {
        (mainScene.sys.settings.data as { relationshipScores: Record<number, number> }).relationshipScores = relationshipScores;
      }
    }
  }, [relationshipScores]);

  return <div id="phaser-container" />;
}

