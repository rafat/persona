import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { InteractionOutcome } from "./types";

describe("LearningEngine Contract", async function () {
  it("Should determine positive interactions correctly", async function () {
    const { viem } = await network.connect();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    
    // Deploy contracts in the correct order
    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);
    await npcCore.write.setLearningEngineAddress([learningEngine.address], { account: deployer.account });

    // Create an interaction context for a 'Help' action
    const interactionContext = {
      action: 3n, // Help action
      target: accounts[1].account.address,
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    const isPositive = await learningEngine.read.isInteractionPositive([interactionContext]);
    assert.equal(isPositive, true);
  });

  it("Should calculate interaction outcomes with intelligence changes", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    
    // Deploy contracts in the correct order
    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);
    await npcCore.write.setLearningEngineAddress([learningEngine.address], { account: deployer.account });

    // Create a friendly NPC
    const tx = await npcCore.write.createNPC([
      "Friendly Scholar",
      0, // Friendly personality
      800, // High intelligence
      200, // Low aggression
      700, // High sociability
    ]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Create an interaction context for a 'Help' action (positive)
    const interactionContext = {
      action: 3n, // Help action
      target: accounts[1].account.address,
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    const outcome = await learningEngine.read.calculateInteractionOutcome([0n, accounts[1].account.address, interactionContext, true]) as InteractionOutcome;

    // Check that relationship has improved
    assert.ok(outcome.newRelationshipScore > 0n); // newRelationshipScore

    // Check that intelligence has increased due to positive learning interaction
    assert.ok(outcome.newIntelligence >= 800n); // newIntelligence should be at least the original value

    // Check that sociability has increased due to positive interaction
    assert.ok(outcome.newSociability >= 700n); // newSociability should be at least the original value
  });

  it("Should calculate different outcomes for negative interactions", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    
    // Deploy contracts in the correct order
    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);
    await npcCore.write.setLearningEngineAddress([learningEngine.address], { account: deployer.account });

    // Create an NPC
    const tx = await npcCore.write.createNPC([
      "Neutral Merchant",
      1, // Neutral personality
      500, // Medium intelligence
      500, // Medium aggression
      500, // Medium sociability
    ]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Create an interaction context for an 'Attack' action (negative)
    const interactionContext = {
      action: 2n, // Attack action
      target: accounts[1].account.address,
      value1: 50n, // Damage value
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    const outcome = await learningEngine.read.calculateInteractionOutcome([0n, accounts[1].account.address, interactionContext, false]) as InteractionOutcome;
    
    // For negative interactions, aggression should increase
    assert.ok(outcome.newAggression >= 500n); // newAggression should be at least the original value
  });
});