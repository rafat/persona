import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress } from "viem";

describe("InteractionTracker Contract", async function () {
  it("Should successfully execute an interaction", async function () {
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

    const npcId = 0n;
    const context = {
      action: 0, // Greet action (enum value)
      target: getAddress(player.account.address), // Target address
      value1: 0n, // Contextual data 1
      value2: 0n, // Contextual data 2
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000", // bytes32 memo
    };

    tx = await interactionTracker.write.interact([npcId, context], { account: player.account });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    assert.equal(receipt.status, "success");
  });

  it("Should handle different interaction types", async function () {
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
    tx = await npcCore.write.createNPC(["Test NPC", 0, 600, 300, 700, 1]); // Friendly, social NPC
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Test Greet interaction
    let context = {
      action: 0, // Greet
      target: getAddress(player.account.address),
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };

    tx = await interactionTracker.write.interact([0n, context], { account: player.account });
    let receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    assert.equal(receipt.status, "success");

    // Test Help interaction
    context = {
      action: 3, // Help
      target: getAddress(player.account.address),
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };

    tx = await interactionTracker.write.interact([0n, context], { account: player.account });
    receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    assert.equal(receipt.status, "success");

    // Test Attack interaction
    context = {
      action: 2, // Attack
      target: getAddress(player.account.address),
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };

    tx = await interactionTracker.write.interact([0n, context], { account: player.account });
    receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    assert.equal(receipt.status, "success");
  });
});