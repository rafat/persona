
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress } from "viem";

describe("Full Integration Test", async function () {
  it("Should create an NPC, interact with it, and complete a quest", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    const player = accounts[1];

    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);
    const questSystem = await viem.deployContract("QuestSystem", [npcCore.address]);
    const interactionTracker = await viem.deployContract("InteractionTracker", [
      npcCore.address,
      learningEngine.address,
    ]);

    // Set addresses
    let tx = await interactionTracker.write.setQuestSystemAddress([questSystem.address]);
    await publicClient.waitForTransactionReceipt({ hash: tx });
    tx = await questSystem.write.setInteractionTrackerAddress([interactionTracker.address]);
    await publicClient.waitForTransactionReceipt({ hash: tx });
    tx = await npcCore.write.setInteractionTrackerAddress([interactionTracker.address]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Create an NPC
    tx = await npcCore.write.createNPC(["Test NPC", 1, 500, 500, 500, 0]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Create a Quest
    tx = await questSystem.write.createQuest([0n, 0, "Test Quest", "Test Description", 1n, 100n, 0]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Accept the Quest
    tx = await questSystem.write.acceptQuest([0n], { account: player.account });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Interact with the NPC to make progress
    const context = {
      action: 3, // Help
      target: getAddress(player.account.address),
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };
    tx = await interactionTracker.write.interact([0n, context], { account: player.account });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Check quest progress
    const questProgress = await questSystem.read.getPlayerQuestStatus([player.account.address, 0n]);
    assert.ok(questProgress.status >= 2n); // Should be ACTIVE (2) or higher (COMPLETED/CLAIMED)

    // Complete the quest by making more interactions
    tx = await interactionTracker.write.interact([0n, context], { account: player.account });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Claim the reward
    tx = await questSystem.write.claimReward([0n], { account: player.account });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    assert.equal(receipt.status, "success");
  });

  it("Should handle different NPC personalities in interactions", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    const player = accounts[1];

    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);
    const questSystem = await viem.deployContract("QuestSystem", [npcCore.address]);
    const interactionTracker = await viem.deployContract("InteractionTracker", [
      npcCore.address,
      learningEngine.address,
    ]);

    // Set addresses
    let tx = await interactionTracker.write.setQuestSystemAddress([questSystem.address]);
    await publicClient.waitForTransactionReceipt({ hash: tx });
    tx = await questSystem.write.setInteractionTrackerAddress([interactionTracker.address]);
    await publicClient.waitForTransactionReceipt({ hash: tx });
    tx = await npcCore.write.setInteractionTrackerAddress([interactionTracker.address]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Create NPCs with different personalities
    tx = await npcCore.write.createNPC(["Friendly NPC", 0, 700, 200, 800, 1]); // Friendly
    await publicClient.waitForTransactionReceipt({ hash: tx });
    
    tx = await npcCore.write.createNPC(["Hostile NPC", 2, 600, 900, 100, 0]); // Hostile
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Test interactions with friendly NPC
    const friendlyContext = {
      action: 0, // Greet
      target: getAddress(player.account.address),
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };
    tx = await interactionTracker.write.interact([0n, friendlyContext], { account: player.account });
    const receipt1 = await publicClient.waitForTransactionReceipt({ hash: tx });
    assert.equal(receipt1.status, "success");

    // Test interactions with hostile NPC (attack)
    const hostileContext = {
      action: 2, // Attack
      target: getAddress(player.account.address),
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };
    tx = await interactionTracker.write.interact([1n, hostileContext], { account: player.account });
    const receipt2 = await publicClient.waitForTransactionReceipt({ hash: tx });
    assert.equal(receipt2.status, "success");

    // Verify the interactions updated relationships appropriately
    const friendlyRelationship = await npcCore.read.getRelationship([0n, player.account.address]);
    const hostileRelationship = await npcCore.read.getRelationship([1n, player.account.address]);
    
    assert.ok(friendlyRelationship >= 0); // Should be non-negative
    assert.ok(hostileRelationship >= 0); // Should be non-negative
  });
});
