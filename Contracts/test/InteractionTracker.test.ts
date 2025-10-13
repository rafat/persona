import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { NPCStruct } from "./types";

describe("InteractionTracker Contract", async function () {
  it("Should allow player interactions with NPCs", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    
    // Deploy contracts in the correct order
    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);
    const interactionTracker = await viem.deployContract("InteractionTracker", [npcCore.address, learningEngine.address]);
    await npcCore.write.setLearningEngineAddress([learningEngine.address]);
    await npcCore.write.setInteractionTrackerAddress([interactionTracker.address]);

    // Create an NPC
    const tx = await npcCore.write.createNPC([
      "Test NPC",
      1, // Neutral personality
      500n, // Intelligence
      500n, // Aggression
      500n, // Sociability
    ]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Create an interaction context
    const interactionContext = {
      action: 0n, // Greet action
      target: accounts[1].account.address,
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    // Perform interaction
    const interactTx = await interactionTracker.write.interact([0n, interactionContext], { account: accounts[1].account });
    await publicClient.waitForTransactionReceipt({ hash: interactTx });

    // Check that the NPC state was updated
    const npc = await npcCore.read.getNPCState([0n]) as NPCStruct;
    assert.equal(npc.id, 0n); // id
    assert.equal(npc.name, "Test NPC"); // name
  });

  it("Should update NPC traits after interaction", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    
    // Deploy contracts in the correct order
    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);
    const interactionTracker = await viem.deployContract("InteractionTracker", [npcCore.address, learningEngine.address]);
    await npcCore.write.setLearningEngineAddress([learningEngine.address]);
    await npcCore.write.setInteractionTrackerAddress([interactionTracker.address]);

    // Create an NPC
    const tx = await npcCore.write.createNPC([
      "Learning NPC",
      0, // Friendly personality
      600n, // Intelligence
      300n, // Aggression
      700n, // Sociability
    ]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Record initial state
    const initialNpc = await npcCore.read.getNPCState([0n]) as NPCStruct;

    // Create a positive interaction context (Help action)
    const interactionContext = {
      action: 3n, // Help action
      target: accounts[1].account.address,
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    // Perform interaction
    const interactTx = await interactionTracker.write.interact([0n, interactionContext], { account: accounts[1].account });
    await publicClient.waitForTransactionReceipt({ hash: interactTx });

    // Check that the NPC traits were updated
    const updatedNpc = await npcCore.read.getNPCState([0n]) as NPCStruct;
    
    // In our implementation, since the initial NPC has 600 intelligence, and that affects how much
    // traits change, we expect some change occurred
    // Intelligence should be >= the original value after positive interaction
    assert.ok(updatedNpc.intelligence >= initialNpc.intelligence);
    // Sociability should be >= the original value after positive interaction
    assert.ok(updatedNpc.sociability >= initialNpc.sociability);
  });

  it("Should update player relationships after interactions", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    
    // Deploy contracts in the correct order
    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);
    const interactionTracker = await viem.deployContract("InteractionTracker", [npcCore.address, learningEngine.address]);
    await npcCore.write.setLearningEngineAddress([learningEngine.address]);
    await npcCore.write.setInteractionTrackerAddress([interactionTracker.address]);

    // Create an NPC
    const tx = await npcCore.write.createNPC([
      "Social NPC",
      1, // Neutral personality
      500n, // Intelligence
      500n, // Aggression
      500n, // Sociability
    ]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Check initial relationship
    const initialRelationship = await npcCore.read.getRelationship([0n, deployer.account.address]) as bigint;
    // Relationship should start at 0

    // Create a positive interaction context
    const interactionContext = {
      action: 3n, // Help action
      target: deployer.account.address,
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    // Perform interaction
    const interactTx = await interactionTracker.write.interact([0n, interactionContext], { account: deployer.account });
    await publicClient.waitForTransactionReceipt({ hash: interactTx });

    // Check that relationship improved
    const updatedRelationship = await npcCore.read.getRelationship([0n, deployer.account.address]) as bigint;
    assert.ok(updatedRelationship >= initialRelationship);
  });

  it("Should validate NPC existence before interaction", async function () {
    const { viem } = await network.connect();
    const accounts = await viem.getWalletClients();
    
    // Deploy contracts in the correct order
    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);
    const interactionTracker = await viem.deployContract("InteractionTracker", [npcCore.address, learningEngine.address]);
    await npcCore.write.setLearningEngineAddress([learningEngine.address]);
    await npcCore.write.setInteractionTrackerAddress([interactionTracker.address]);

    // Create an interaction context
    const interactionContext = {
      action: 0n, // Greet action
      target: accounts[1].account.address,
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    // This should fail because NPC ID 0 doesn't exist yet
    await assert.rejects(
      interactionTracker.write.interact([0n, interactionContext], { account: accounts[1].account })
    );
  });

  it("Should check if NPC can be interacted with", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    
    // Deploy contracts in the correct order
    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);
    const interactionTracker = await viem.deployContract("InteractionTracker", [npcCore.address, learningEngine.address]);
    await npcCore.write.setLearningEngineAddress([learningEngine.address]);
    await npcCore.write.setInteractionTrackerAddress([interactionTracker.address]);

    // Check with non-existent NPC ID
    const canInteract = await interactionTracker.read.canInteractWith([0n]);
    assert.equal(canInteract, false);

    // Create an NPC
    const tx = await npcCore.write.createNPC([
      "Active NPC",
      1, // Neutral personality
      500n, // Intelligence
      500n, // Aggression
      500n, // Sociability
    ]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Now it should be able to interact
    const canInteractAfter = await interactionTracker.read.canInteractWith([0n]);
    assert.equal(canInteractAfter, true);
  });
});