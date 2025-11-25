/**
 * Calculate level based on experience points
 * @param {number} experience - Total experience points
 * @returns {number} - Calculated level
 */
function calculateLevel(experience) {
  // 100 xp per level
  return Math.floor(experience / 100) + 1;
}

/**
 * Calculate rewards for quest completion
 * @param {object} quest - Quest object with rewards
 * @param {number} currentExperience - Player's current experience
 * @param {number} currentLevel - Player's current level
 * @returns {object} - Calculated rewards and level info
 */
function calculateQuestRewards(quest, currentExperience, currentLevel) {
  const experienceReward = quest.rewards?.experience || 0;
  const newExperience = currentExperience + experienceReward;
  const newLevel = calculateLevel(newExperience);
  const leveledUp = newLevel > currentLevel;

  return {
    experienceReward,
    newExperience,
    newLevel,
    leveledUp,
    itemRewards: quest.rewards?.item ? [quest.rewards.item] : []
  };
}

/**
 * Check if player has item in inventory
 * @param {array} inventory - Player's inventory (array of item IDs)
 * @param {string} itemId - Item ID to check
 * @returns {object} - Result of the check
 */
function checkInventoryForItem(inventory, itemId) {
  const itemIndex = inventory.findIndex(
    item => item.toString() === itemId
  );

  return {
    hasItem: itemIndex !== -1,
    itemIndex: itemIndex,
    canUse: itemIndex !== -1
  };
}

module.exports = {
  calculateLevel,
  calculateQuestRewards,
  checkInventoryForItem
};
