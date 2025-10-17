import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress } from "viem";

describe("AdvancedAIEngine Contract", async function () {
  it("Should set and get the data pointer", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const accounts = await viem.getWalletClients();
    const deployer = accounts[0];

    const npcCore = await viem.deployContract("NPCCore", []);
    const advancedAIEngine = await viem.deployContract("AdvancedAIEngine", [npcCore.address]);

    // Create an NPC for testing
    let tx = await npcCore.write.createNPC(["Test NPC", 1, 500, 500, 500, 0]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    const npcId = 0;
    const dataPointer = "0x1234567890123456789012345678901234567890123456789012345678901234";

    tx = await advancedAIEngine.write.setNpcDataPointer([npcId, dataPointer]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    const retrievedPointer = await advancedAIEngine.read.getNpcDataPointer([npcId]);
    assert.equal(retrievedPointer, dataPointer);
  });
});