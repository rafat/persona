import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { NPCStruct } from "./types";

describe("NPCCore Contract", async function () {
  it("Should create an NPC with correct initial parameters", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    
    // Deploy NPCCore contract (no constructor parameters)
    const npcCore = await viem.deployContract("NPCCore", []);
    
    const tx = await npcCore.write.createNPC([
      "Guard John",
      2, // Hostile personality
      750, // Intelligence
      800, // Aggression
      200, // Sociability
    ]);
    
    await publicClient.waitForTransactionReceipt({ hash: tx });

    const npc = await npcCore.read.getNPCState([0n]) as NPCStruct;
    
    assert.equal(npc.name, "Guard John"); // name
    assert.equal(npc.personality, 2); // personality
    assert.equal(npc.intelligence, 750); // intelligence
    assert.equal(npc.aggression, 800); // aggression
    assert.equal(npc.sociability, 200); // sociability
    assert.equal(npc.isActive, true); // isActive
  });

  it("Should maintain correct NPC count", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    
    // Deploy NPCCore contract (no constructor parameters)
    const npcCore = await viem.deployContract("NPCCore", []);
    
    // Create first NPC
    let tx = await npcCore.write.createNPC([
      "Merchant Alice",
      0, // Friendly personality
      600, // Intelligence
      300, // Aggression
      700, // Sociability
    ]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Create second NPC
    tx = await npcCore.write.createNPC([
      "Guard Bob",
      2, // Hostile personality
      700, // Intelligence
      800, // Aggression
      100, // Sociability
    ]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    const count = await npcCore.read.getNPCCount();
    assert.equal(count, 2n);
  });

  it("Should properly track player relationships", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    
    // Deploy NPCCore contract (no constructor parameters)
    const npcCore = await viem.deployContract("NPCCore", []);
    
    // Create an NPC
    const tx = await npcCore.write.createNPC([
      "Friendly NPC",
      0, // Friendly personality
      500, // Intelligence
      200, // Aggression
      800, // Sociability
    ]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Check initial relationship (should be 0)
    const initialRelationship = await npcCore.read.getRelationship([0n, deployer.account.address]);
    assert.equal(initialRelationship, 0);
  });

  it("Should get NPC memories", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];
    
    // Deploy NPCCore contract (no constructor parameters)
    const npcCore = await viem.deployContract("NPCCore", []);
    
    // Create an NPC
    const tx = await npcCore.write.createNPC([
      "Memory Keeper",
      1, // Neutral personality
      600, // Intelligence
      400, // Aggression
      600, // Sociability
    ]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Get NPC memories (should be empty initially)
    const memories = await npcCore.read.getMemories([0n]);
    assert.ok(Array.isArray(memories));
  });
});