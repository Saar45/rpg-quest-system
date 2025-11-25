const { 
  calculateLevel, 
  calculateQuestRewards, 
  checkInventoryForItem 
} = require('../utils/rewardCalculator');

describe('Level Up Calculation Logic', () => {
  describe('calculateLevel', () => {
    test('Level 1 with 0 experience', () => {
      expect(calculateLevel(0)).toBe(1);
    });

    test('Level 1 with 99 experience', () => {
      expect(calculateLevel(99)).toBe(1);
    });

    test('Level 2 with 100 experience', () => {
      expect(calculateLevel(100)).toBe(2);
    });

    test('Level 3 with 200 experience', () => {
      expect(calculateLevel(200)).toBe(3);
    });

    test('Level 5 with 450 experience', () => {
      expect(calculateLevel(450)).toBe(5);
    });

    test('Level 10 with 999 experience', () => {
      expect(calculateLevel(999)).toBe(10);
    });
  });

  describe('calculateQuestRewards', () => {
    test('Quest completion with no level up', () => {
      const quest = {
        rewards: {
          experience: 50
        }
      };
      const result = calculateQuestRewards(quest, 25, 1);
      
      expect(result.experienceReward).toBe(50);
      expect(result.newExperience).toBe(75);
      expect(result.newLevel).toBe(1);
      expect(result.leveledUp).toBe(false);
    });

    test('Quest completion with level up', () => {
      const quest = {
        rewards: {
          experience: 50
        }
      };
      const result = calculateQuestRewards(quest, 80, 1);
      
      expect(result.experienceReward).toBe(50);
      expect(result.newExperience).toBe(130);
      expect(result.newLevel).toBe(2);
      expect(result.leveledUp).toBe(true);
    });

    test('Quest completion with multiple level ups', () => {
      const quest = {
        rewards: {
          experience: 250
        }
      };
      const result = calculateQuestRewards(quest, 50, 1);
      
      expect(result.experienceReward).toBe(250);
      expect(result.newExperience).toBe(300);
      expect(result.newLevel).toBe(4);
      expect(result.leveledUp).toBe(true);
    });

    test('Quest completion with item reward', () => {
      const quest = {
        rewards: {
          experience: 100,
          item: 'item123'
        }
      };
      const result = calculateQuestRewards(quest, 0, 1);
      
      expect(result.experienceReward).toBe(100);
      expect(result.itemRewards).toEqual(['item123']);
      expect(result.newLevel).toBe(2);
      expect(result.leveledUp).toBe(true);
    });

    test('Quest with no rewards', () => {
      const quest = {
        rewards: {}
      };
      const result = calculateQuestRewards(quest, 50, 1);
      
      expect(result.experienceReward).toBe(0);
      expect(result.newExperience).toBe(50);
      expect(result.newLevel).toBe(1);
      expect(result.leveledUp).toBe(false);
      expect(result.itemRewards).toEqual([]);
    });
  });

  describe('checkInventoryForItem', () => {
    test('Item exists in inventory', () => {
      const inventory = ['item1', 'item2', 'item3'];
      const result = checkInventoryForItem(inventory, 'item2');
      
      expect(result.hasItem).toBe(true);
      expect(result.itemIndex).toBe(1);
      expect(result.canUse).toBe(true);
    });

    test('Item does not exist in inventory', () => {
      const inventory = ['item1', 'item2', 'item3'];
      const result = checkInventoryForItem(inventory, 'item4');
      
      expect(result.hasItem).toBe(false);
      expect(result.itemIndex).toBe(-1);
      expect(result.canUse).toBe(false);
    });

    test('Empty inventory', () => {
      const inventory = [];
      const result = checkInventoryForItem(inventory, 'item1');
      
      expect(result.hasItem).toBe(false);
      expect(result.itemIndex).toBe(-1);
      expect(result.canUse).toBe(false);
    });

    test('First item in inventory', () => {
      const inventory = ['item1', 'item2'];
      const result = checkInventoryForItem(inventory, 'item1');
      
      expect(result.hasItem).toBe(true);
      expect(result.itemIndex).toBe(0);
      expect(result.canUse).toBe(true);
    });
  });
});