import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress } from "viem";

describe("LearningEngine Contract", async function () {
  it("Should make a decision with all response types", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    const player = accounts[1];

    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);

    // Create NPCs with different personality traits
    const createNpcTx = await npcCore.write.createNPC(["Friendly NPC", 0, 800, 200, 900, 1]); // Friendly, high sociability
    await publicClient.waitForTransactionReceipt({ hash: createNpcTx });
    
    const createNpcTx2 = await npcCore.write.createNPC(["Hostile NPC", 2, 500, 800, 200, 0]); // Hostile, high aggression
    await publicClient.waitForTransactionReceipt({ hash: createNpcTx2 });

    // Test Greet action with friendly NPC
    let decision = (await learningEngine.read.makeDecision([
      0n, // NPC ID
      getAddress(player.account.address),
      0, // Greet action
      0,  // contextValue
    ])) as any;
    
    // Viem returns values as numbers or strings depending on the type
    assert.ok(typeof decision.responseType === 'number', `Expected responseType type to be number, got ${typeof decision.responseType}`);
    assert.ok(decision.intensity >= 0, `First test - intensity should be >= 0, got ${decision.intensity}`);
    assert.ok(decision.intensity <= 1000, `First test - intensity should be <= 1000, got ${decision.intensity}`);
    assert.ok(typeof decision.contextData === 'string', `Expected contextData type to be string, got ${typeof decision.contextData}`);

    // Test Attack action with hostile NPC (should result in Attack response)
    decision = (await learningEngine.read.makeDecision([
      1n, // NPC ID
      getAddress(player.account.address),
      2, // Attack action
      0,  // contextValue
    ])) as any;
    
    assert.ok(typeof decision.responseType === 'number', `Expected responseType type to be number, got ${typeof decision.responseType}`);

    // Test Help action with friendly NPC (should result in Help response)
    decision = (await learningEngine.read.makeDecision([
      0n, // NPC ID
      getAddress(player.account.address),
      3, // Help action
      0,  // contextValue
    ])) as any;
    
    assert.ok(typeof decision.responseType === 'number', `Expected responseType type to be number, got ${typeof decision.responseType}`);
    assert.ok(decision.intensity >= 0, `Third test - intensity should be >= 0, got ${decision.intensity}`);
    assert.ok(decision.intensity <= 1000, `Third test - intensity should be <= 1000, got ${decision.intensity}`);
    assert.ok(typeof decision.contextData === 'string', `Expected contextData type to be string, got ${typeof decision.contextData}`);
  });

  it("Should calculate the outcome of different types of interactions", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    const player = accounts[1];

    const npcCore = await viem.deployContract("NPCCore", []);
    const learningEngine = await viem.deployContract("LearningEngine", [npcCore.address]);

    // Create an NPC
    const tx = await npcCore.write.createNPC(["Test NPC", 1, 500, 500, 500, 0]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Test the correct structure for InteractionContext
    const context = {
      action: 0, // Greet action (using the enum value)
      target: player.account.address, // Target address
      value1: 0n, // Contextual data 1
      value2: 0n, // Contextual data 2
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000", // bytes32 memo
    };
    const wasPositive = true;

    const outcome = await learningEngine.read.calculateInteractionOutcome([
      0n, // npcId
      getAddress(player.account.address),
      context,
      wasPositive,
    ]);

    // Viem may return the result as an object with named properties or an array
    // Check if it's an object with the expected properties
    if (typeof outcome === 'object' && outcome !== null) {
      // It could be an object with named properties
      assert.ok('newRelationshipScore' in outcome, "Outcome should have newRelationshipScore property");
      assert.ok('newAggression' in outcome, "Outcome should have newAggression property");
      assert.ok('newSociability' in outcome, "Outcome should have newSociability property");
      assert.ok('newIntelligence' in outcome, "Outcome should have newIntelligence property");
      assert.ok('memorySnippet' in outcome, "Outcome should have memorySnippet property");
      
      assert.ok(typeof outcome.newRelationshipScore === 'number', `Expected newRelationshipScore type to be number, got ${typeof outcome.newRelationshipScore}`);
      assert.ok(typeof outcome.newAggression === 'number', `Expected newAggression type to be number, got ${typeof outcome.newAggression}`);
      assert.ok(typeof outcome.newSociability === 'number', `Expected newSociability type to be number, got ${typeof outcome.newSociability}`);
      assert.ok(typeof outcome.newIntelligence === 'number', `Expected newIntelligence type to be number, got ${typeof outcome.newIntelligence}`);
      assert.ok(typeof outcome.memorySnippet === 'string', `Expected memorySnippet type to be string, got ${typeof outcome.memorySnippet}`);
    } else {
      // If it's not an object, it should be an array
      assert.ok(Array.isArray(outcome), "Outcome should be an array or object");
      assert.ok(outcome.length >= 5, `Outcome should have at least 5 elements, got ${outcome.length}`);
      assert.ok(typeof outcome[0] === 'number', `Expected outcome[0] type to be number, got ${typeof outcome[0]}`); // newRelationshipScore
      assert.ok(typeof outcome[1] === 'number', `Expected outcome[1] type to be number, got ${typeof outcome[1]}`); // newAggression
      assert.ok(typeof outcome[2] === 'number', `Expected outcome[2] type to be number, got ${typeof outcome[2]}`); // newSociability
      assert.ok(typeof outcome[3] === 'number', `Expected outcome[3] type to be number, got ${typeof outcome[3]}`); // newIntelligence
      assert.ok(typeof outcome[4] === 'string', `Expected outcome[4] type to be string, got ${typeof outcome[4]}`); // memorySnippet
    }
  });
});