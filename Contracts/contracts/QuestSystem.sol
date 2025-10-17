// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NPCCore.sol";
import "./SharedTypes.sol";

contract QuestSystem {
    NPCCore public immutable npcCore;
    address public interactionTrackerAddress;

    enum QuestType { DELIVER_ITEM, DEFEAT_ENEMY, GATHER_INFORMATION, ASSIST_NPC }
    enum QuestStatus { UNAVAILABLE, AVAILABLE, ACTIVE, COMPLETED, FAILED, CLAIMED }

    struct Quest {
        uint256 id;
        uint256 npcId;
        QuestType questType;
        string title;
        string description;
        uint256 targetValue;
        uint256 rewardXP;
        bool isActive;
        uint16 requiredRelationship; // 0-1000 scale, tied to NPCCore relationship
    }

    struct PlayerQuest {
        QuestStatus status;
        uint256 progress;
        uint256 acceptedAt;
    }

    uint256 private _questIdCounter;
    mapping(uint256 => Quest) public quests;
    mapping(address => mapping(uint256 => PlayerQuest)) public playerQuests;
    mapping(address => uint256[]) private _playerActiveQuestIds;

    event QuestCreated(uint256 indexed questId, uint256 npcId, string title);
    event QuestAccepted(address indexed player, uint256 indexed questId);
    event QuestProgressUpdated(address indexed player, uint256 indexed questId, uint256 newProgress);
    event QuestCompleted(address indexed player, uint256 indexed questId);
    event QuestRewardClaimed(address indexed player, uint256 indexed questId, uint256 rewardXP);

    modifier onlyInteractionTracker() {
        require(msg.sender == interactionTrackerAddress, "Only InteractionTracker can call");
        _;
    }

    constructor(address _npcCoreAddress) {
        npcCore = NPCCore(_npcCoreAddress);
    }

    function setInteractionTrackerAddress(address _address) external {
        require(msg.sender == npcCore.owner(), "Only owner can set addresses");
        interactionTrackerAddress = _address;
    }

    function createQuest(
        uint256 npcId,
        QuestType questType,
        string memory title,
        string memory description,
        uint256 targetValue,
        uint256 rewardXP,
        uint16 requiredRelationship
    ) external returns (uint256) {
        require(msg.sender == npcCore.owner(), "Only owner can create quests");
        uint256 questId = _questIdCounter++;
        quests[questId] = Quest({
            id: questId,
            npcId: npcId,
            questType: questType,
            title: title,
            description: description,
            targetValue: targetValue,
            rewardXP: rewardXP,
            isActive: true,
            requiredRelationship: requiredRelationship
        });
        emit QuestCreated(questId, npcId, title);
        return questId;
    }

    function acceptQuest(uint256 questId) external {
        Quest storage quest = quests[questId];
        require(quest.isActive, "Quest is not active");
        require(playerQuests[msg.sender][questId].status == QuestStatus.UNAVAILABLE, "Quest already actioned");
        
        uint16 relationship = npcCore.getRelationship(quest.npcId, msg.sender);
        require(relationship >= quest.requiredRelationship, "Insufficient relationship");

        playerQuests[msg.sender][questId] = PlayerQuest({
            status: QuestStatus.ACTIVE,
            progress: 0,
            acceptedAt: block.timestamp
        });
        _playerActiveQuestIds[msg.sender].push(questId);

        emit QuestAccepted(msg.sender, questId);
    }

    function updateQuestProgress(address player, uint256 npcId, uint256 progressIncrement) external onlyInteractionTracker {
        uint256[] storage activeQuests = _playerActiveQuestIds[player];
        for (uint i = 0; i < activeQuests.length; i++) {
            uint256 questId = activeQuests[i];
            Quest storage quest = quests[questId];
            PlayerQuest storage playerQuest = playerQuests[player][questId];

            if (quest.npcId == npcId && playerQuest.status == QuestStatus.ACTIVE) {
                uint256 newProgress = playerQuest.progress + progressIncrement;
                playerQuest.progress = newProgress > quest.targetValue ? quest.targetValue : newProgress;

                emit QuestProgressUpdated(player, questId, playerQuest.progress);

                if (playerQuest.progress >= quest.targetValue) {
                    _completeQuest(player, questId, i);
                }
            }
        }
    }

    function _completeQuest(address player, uint256 questId, uint questIndexInActiveList) internal {
        PlayerQuest storage playerQuest = playerQuests[player][questId];
        require(playerQuest.status == QuestStatus.ACTIVE, "Quest not active");

        playerQuest.status = QuestStatus.COMPLETED;
        _removeQuestFromActiveList(player, questIndexInActiveList);

        emit QuestCompleted(player, questId);
    }

    function claimReward(uint256 questId) external {
        PlayerQuest storage playerQuest = playerQuests[msg.sender][questId];
        require(playerQuest.status == QuestStatus.COMPLETED, "Quest not completed");
        
        playerQuest.status = QuestStatus.CLAIMED;
        Quest memory quest = quests[questId];
        
        // Here you would add logic to grant XP to the player via another contract.
        // For now, we emit the event.
        emit QuestRewardClaimed(msg.sender, questId, quest.rewardXP);
    }
    
    // Efficiently removes a quest from a player's active list using the swap-and-pop method.
    function _removeQuestFromActiveList(address player, uint index) private {
        uint256[] storage activeQuests = _playerActiveQuestIds[player];
        activeQuests[index] = activeQuests[activeQuests.length - 1];
        activeQuests.pop();
    }

    // --- View Functions ---
    function getPlayerQuestStatus(address player, uint256 questId) external view returns (PlayerQuest memory) {
        return playerQuests[player][questId];
    }
    
    function getPlayerActiveQuests(address player) external view returns (uint256[] memory) {
        return _playerActiveQuestIds[player];
    }
}