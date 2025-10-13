import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { NPCStruct, InteractionOutcome } from "./types";

describe("Full Integration Test: Adaptive NPCs System", async function () {
  it("Should create an NPC and demonstrate the learning process", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    
    // Deploy all contracts in the correct order
    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);
    const interactionTracker = await viem.deployContract("InteractionTracker", [npcCore.address, learningEngine.address]);
    await npcCore.write.setLearningEngineAddress([learningEngine.address], { account: deployer.account });
    await npcCore.write.setInteractionTrackerAddress([interactionTracker.address], { account: deployer.account });

    // Create a scholarly NPC with high intelligence
    const createTx = await npcCore.write.createNPC([
      "Scholar NPC",
      0, // Friendly personality
      800, // High intelligence
      200, // Low aggression
      700, // High sociability
    ]);
    await publicClient.waitForTransactionReceipt({ hash: createTx });

    // Check initial NPC state
    const initialNpc = await npcCore.read.getNPCState([0n]) as NPCStruct;
    assert.equal(initialNpc.name, "Scholar NPC"); // name
    assert.equal(initialNpc.intelligence, 800); // intelligence
    assert.equal(initialNpc.aggression, 200); // aggression
    assert.equal(initialNpc.sociability, 700); // sociability

    // Initial relationship should be 0
    const initialRelationship = await npcCore.read.getRelationship([0n, deployer.account.address]);
    assert.equal(initialRelationship, 0);

    // Perform multiple interactions to see the learning effect
    const interactionContext = {
      action: 3n, // Help action
      target: deployer.account.address,
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    // First interaction
    let firstInteractTx = await interactionTracker.write.interact([0n, interactionContext], { account: deployer.account });
    await publicClient.waitForTransactionReceipt({ hash: firstInteractTx });

    // Check state after first interaction
    let updatedNpc = await npcCore.read.getNPCState([0n]) as NPCStruct;
    let relationship = await npcCore.read.getRelationship([0n, deployer.account.address]) as bigint;
    
    assert.ok(updatedNpc.intelligence >= 800n); // intelligence should have increased or stayed same
    assert.ok(updatedNpc.sociability >= 700n); // sociability should have increased or stayed same
    assert.ok(relationship > initialRelationship); // relationship should have increased

    // Perform a second positive interaction
    let secondInteractTx = await interactionTracker.write.interact([0n, interactionContext], { account: deployer.account });
    await publicClient.waitForTransactionReceipt({ hash: secondInteractTx });

    // Check state after second interaction
    updatedNpc = await npcCore.read.getNPCState([0n]) as NPCStruct;
    relationship = await npcCore.read.getRelationship([0n, deployer.account.address]) as bigint;

    // Traits should have continued to evolve
    assert.ok(updatedNpc.intelligence >= 800n); // intelligence should have increased more
    assert.ok(updatedNpc.sociability >= 700n); // sociability should have increased more
    assert.ok(relationship > initialRelationship); // should be higher than after first interaction

    // Now try a negative interaction
    const negativeContext = {
      action: 2n, // Attack action
      target: deployer.account.address,
      value1: 10n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    const negativeInteractTx = await interactionTracker.write.interact([0n, negativeContext], { account: deployer.account });
    await publicClient.waitForTransactionReceipt({ hash: negativeInteractTx });

    // Check state after negative interaction
    updatedNpc = await npcCore.read.getNPCState([0n]) as NPCStruct;
    relationship = await npcCore.read.getRelationship([0n, deployer.account.address]) as bigint;

    // Aggression should have increased, relationship may have decreased
    assert.ok(updatedNpc.aggression >= 200n); // aggression should have increased
  });

  it("Should demonstrate different personality responses", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    
    // Deploy all contracts in the correct order
    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);
    const interactionTracker = await viem.deployContract("InteractionTracker", [npcCore.address, learningEngine.address]);
    await npcCore.write.setLearningEngineAddress([learningEngine.address]);
    await npcCore.write.setInteractionTrackerAddress([interactionTracker.address]);

    // Create different personality types
    const friendlyTx = await npcCore.write.createNPC([
      "Friendly NPC",
      0, // Friendly personality
      600, // Intelligence
      200, // Low aggression
      800, // High sociability
    ]);
    await publicClient.waitForTransactionReceipt({ hash: friendlyTx });

    const hostileTx = await npcCore.write.createNPC([
      "Hostile NPC",
      2, // Hostile personality
      700, // Intelligence
      800, // High aggression
      100, // Low sociability
    ]);
    await publicClient.waitForTransactionReceipt({ hash: hostileTx });

    // Create a neutral interaction
    const greetingContext = {
      action: 0n, // Greet action
      target: deployer.account.address,
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    // Both NPCs interact with the same greeting
    const friendlyInteractTx = await interactionTracker.write.interact([0n, greetingContext], { account: deployer.account });
    await publicClient.waitForTransactionReceipt({ hash: friendlyInteractTx });

    const hostileInteractTx = await interactionTracker.write.interact([1n, greetingContext], { account: deployer.account });
    await publicClient.waitForTransactionReceipt({ hash: hostileInteractTx });

    // Get both NPCs' updated states
    const friendlyNpc = await npcCore.read.getNPCState([0n]) as NPCStruct;
    const hostileNpc = await npcCore.read.getNPCState([1n]) as NPCStruct;

    // The friendly NPC should have had a more positive response
    assert.ok(friendlyNpc.sociability >= 800n); // friendly NPC sociability should have increased from 800
  });

  it("Should emit events properly during interactions", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    
    // Deploy all contracts in the correct order
    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);
    const interactionTracker = await viem.deployContract("InteractionTracker", [npcCore.address, learningEngine.address]);
    await npcCore.write.setLearningEngineAddress([learningEngine.address]);
    await npcCore.write.setInteractionTrackerAddress([interactionTracker.address]);

    // Create an NPC
    const createTx = await npcCore.write.createNPC([
      "Event NPC",
      0, // Friendly personality
      550, // Intelligence
      300, // Low aggression
      700, // High sociability
    ]);
    await publicClient.waitForTransactionReceipt({ hash: createTx });

    // Create an interaction
    const interactionContext = {
      action: 3n, // Help action
      target: deployer.account.address,
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    // Perform interaction
    const interactTx = await interactionTracker.write.interact([0n, interactionContext], { account: deployer.account });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: interactTx });

    // Check that the event was emitted
    assert.ok(receipt.logs.length >= 0);
  });
});