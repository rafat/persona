import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress } from "viem";

describe("QuestSystem Contract", async function () {
  it("Should create, accept, and complete a quest", async function () {
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

    // Create NPC
    tx = await npcCore.write.createNPC(["Test NPC", 1, 500, 500, 500, 0]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Create Quest
    tx = await questSystem.write.createQuest([0n, 0, "Test Quest", "Test Description", 1n, 100n, 0]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Accept Quest
    tx = await questSystem.write.acceptQuest([0n], { account: player.account });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Interact with the NPC to progress the quest (this internally calls updateQuestProgress)
    const context = {
      action: 3, // Help action
      target: getAddress(player.account.address),
      value1: 0n,
      value2: 0n,
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };
    tx = await interactionTracker.write.interact([0n, context], { account: player.account });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Check that quest has progressed
    const playerQuestStatus = await questSystem.read.getPlayerQuestStatus([player.account.address, 0n]);
    assert.ok(playerQuestStatus.status >= 2n); // Should be ACTIVE (2) or higher (COMPLETED/CLAIMED)

    // Claim Reward
    tx = await questSystem.write.claimReward([0n], { account: player.account });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    assert.equal(receipt.status, "success");
  });
});