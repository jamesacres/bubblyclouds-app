import {
  getPlayerColor,
  getAllUserIds,
  PLAYER_COLORS,
  CURRENT_USER_COLOR,
} from '../utils/playerColors';

describe('playerColors', () => {
  describe('color constants', () => {
    it('should define player colors array', () => {
      expect(PLAYER_COLORS).toBeInstanceOf(Array);
      expect(PLAYER_COLORS.length).toBe(5);
    });

    it('should have valid tailwind color classes', () => {
      PLAYER_COLORS.forEach((color) => {
        expect(color).toMatch(/^bg-\w+-500$/);
      });
    });

    it('should define current user color', () => {
      expect(CURRENT_USER_COLOR).toBe('bg-red-500');
    });

    it('should have distinct colors', () => {
      const uniqueColors = new Set(PLAYER_COLORS);
      expect(uniqueColors.size).toBe(PLAYER_COLORS.length);
    });
  });

  describe('getPlayerColor', () => {
    describe('current user', () => {
      it('should return current user color when isCurrentUser is true', () => {
        const allUserIds = ['user-1', 'user-2', 'user-3'];
        const color = getPlayerColor('user-1', allUserIds, true);
        expect(color).toBe(CURRENT_USER_COLOR);
      });

      it('should return current user color regardless of user index', () => {
        const allUserIds = ['user-1', 'user-2', 'user-3'];
        expect(getPlayerColor('user-2', allUserIds, true)).toBe(
          CURRENT_USER_COLOR
        );
        expect(getPlayerColor('user-3', allUserIds, true)).toBe(
          CURRENT_USER_COLOR
        );
      });

      it('should prioritize isCurrentUser over user index', () => {
        const allUserIds = ['user-1', 'user-2', 'user-3'];
        // Even if user-1 would get first color, should return current user color
        const color = getPlayerColor('user-1', allUserIds, true);
        expect(color).not.toBe(PLAYER_COLORS[0]);
        expect(color).toBe(CURRENT_USER_COLOR);
      });
    });

    describe('other players', () => {
      it('should return first player color for first user in list', () => {
        const allUserIds = ['user-1', 'user-2'];
        const color = getPlayerColor('user-1', allUserIds, false);
        expect(color).toBe(PLAYER_COLORS[0]);
      });

      it('should return color based on user index', () => {
        const allUserIds = ['user-1', 'user-2', 'user-3'];
        const color1 = getPlayerColor('user-1', allUserIds, false);
        const color2 = getPlayerColor('user-2', allUserIds, false);
        const color3 = getPlayerColor('user-3', allUserIds, false);

        expect(color1).toBe(PLAYER_COLORS[0]);
        expect(color2).toBe(PLAYER_COLORS[1]);
        expect(color3).toBe(PLAYER_COLORS[2]);
      });

      it('should cycle through colors using modulo', () => {
        const userIds = Array.from({ length: 10 }, (_, i) => `user-${i}`);
        const colors = userIds.map((id) => getPlayerColor(id, userIds, false));

        // First 5 should match PLAYER_COLORS
        for (let i = 0; i < 5; i++) {
          expect(colors[i]).toBe(PLAYER_COLORS[i]);
        }

        // Next 5 should cycle back
        for (let i = 5; i < 10; i++) {
          expect(colors[i]).toBe(PLAYER_COLORS[i % 5]);
        }
      });
    });

    describe('user not found', () => {
      it('should return default color when user not in list', () => {
        const allUserIds = ['user-1', 'user-2', 'user-3'];
        const color = getPlayerColor('unknown-user', allUserIds, false);
        expect(color).toBe(PLAYER_COLORS[0]);
      });

      it('should return default color with empty user list', () => {
        const color = getPlayerColor('user-1', [], false);
        expect(color).toBe(PLAYER_COLORS[0]);
      });

      it('should return default color even if user ID looks valid', () => {
        const allUserIds = ['user-1', 'user-2'];
        const color = getPlayerColor('user-999', allUserIds, false);
        expect(color).toBe(PLAYER_COLORS[0]);
      });
    });

    describe('edge cases', () => {
      it('should handle single user', () => {
        const allUserIds = ['user-1'];
        expect(getPlayerColor('user-1', allUserIds, false)).toBe(
          PLAYER_COLORS[0]
        );
      });

      it('should handle exact number of users as colors', () => {
        const allUserIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
        allUserIds.forEach((id, idx) => {
          expect(getPlayerColor(id, allUserIds, false)).toBe(
            PLAYER_COLORS[idx]
          );
        });
      });

      it('should handle more users than colors', () => {
        const allUserIds = Array.from({ length: 15 }, (_, i) => `user-${i}`);

        allUserIds.forEach((id, idx) => {
          const expectedColor = PLAYER_COLORS[idx % PLAYER_COLORS.length];
          expect(getPlayerColor(id, allUserIds, false)).toBe(expectedColor);
        });
      });

      it('should be case-sensitive for user IDs', () => {
        const allUserIds = ['user-1', 'User-1'];
        const color1 = getPlayerColor('user-1', allUserIds, false);
        const color2 = getPlayerColor('User-1', allUserIds, false);

        expect(color1).toBe(PLAYER_COLORS[0]);
        expect(color2).toBe(PLAYER_COLORS[1]);
      });

      it('should handle special characters in user IDs', () => {
        const allUserIds = ['user@example.com', 'user-123-abc'];
        const color1 = getPlayerColor('user@example.com', allUserIds, false);
        const color2 = getPlayerColor('user-123-abc', allUserIds, false);

        expect(color1).toBe(PLAYER_COLORS[0]);
        expect(color2).toBe(PLAYER_COLORS[1]);
      });
    });
  });

  describe('getAllUserIds', () => {
    it('should extract unique user IDs from parties', () => {
      const parties = [
        {
          partyId: 'party-1',
          members: [
            { userId: 'user-1', memberNickname: 'Alice' },
            { userId: 'user-2', memberNickname: 'Bob' },
          ],
        },
        {
          partyId: 'party-2',
          members: [{ userId: 'user-3', memberNickname: 'Charlie' }],
        },
      ];

      const userIds = getAllUserIds(parties);
      expect(userIds).toEqual(['user-1', 'user-2', 'user-3']);
    });

    it('should return empty array for empty parties', () => {
      const userIds = getAllUserIds([]);
      expect(userIds).toEqual([]);
    });

    it('should remove duplicate user IDs', () => {
      const parties = [
        {
          partyId: 'party-1',
          members: [
            { userId: 'user-1', memberNickname: 'Alice' },
            { userId: 'user-2', memberNickname: 'Bob' },
          ],
        },
        {
          partyId: 'party-2',
          members: [
            { userId: 'user-1', memberNickname: 'Alice' },
            { userId: 'user-3', memberNickname: 'Charlie' },
          ],
        },
      ];

      const userIds = getAllUserIds(parties);
      expect(userIds).toHaveLength(3);
      expect(userIds).toEqual(['user-1', 'user-2', 'user-3']);
    });

    it('should return sorted user IDs', () => {
      const parties = [
        {
          partyId: 'party-1',
          members: [
            { userId: 'user-3', memberNickname: 'Charlie' },
            { userId: 'user-1', memberNickname: 'Alice' },
            { userId: 'user-2', memberNickname: 'Bob' },
          ],
        },
      ];

      const userIds = getAllUserIds(parties);
      expect(userIds).toEqual(['user-1', 'user-2', 'user-3']);
    });

    it('should maintain consistent sorting across calls', () => {
      const parties = [
        {
          partyId: 'party-1',
          members: [
            { userId: 'user-3', memberNickname: 'C' },
            { userId: 'user-1', memberNickname: 'A' },
            { userId: 'user-2', memberNickname: 'B' },
          ],
        },
      ];

      const ids1 = getAllUserIds(parties);
      const ids2 = getAllUserIds(parties);

      expect(ids1).toEqual(ids2);
      expect(ids1).toEqual(['user-1', 'user-2', 'user-3']);
    });

    it('should handle parties with no members', () => {
      const parties = [
        {
          partyId: 'party-1',
          members: [],
        },
        {
          partyId: 'party-2',
          members: [{ userId: 'user-1', memberNickname: 'Alice' }],
        },
      ];

      const userIds = getAllUserIds(parties);
      expect(userIds).toEqual(['user-1']);
    });

    it('should handle mixed empty and populated parties', () => {
      const parties = [
        {
          partyId: 'party-1',
          members: [{ userId: 'user-1', memberNickname: 'Alice' }],
        },
        {
          partyId: 'party-2',
          members: [],
        },
        {
          partyId: 'party-3',
          members: [
            { userId: 'user-2', memberNickname: 'Bob' },
            { userId: 'user-3', memberNickname: 'Charlie' },
          ],
        },
      ];

      const userIds = getAllUserIds(parties);
      expect(userIds).toEqual(['user-1', 'user-2', 'user-3']);
    });
  });

  describe('integration scenarios', () => {
    it('should provide consistent colors across multiple calls', () => {
      const allUserIds = ['user-1', 'user-2', 'user-3'];

      const color1 = getPlayerColor('user-2', allUserIds, false);
      const color2 = getPlayerColor('user-2', allUserIds, false);

      expect(color1).toBe(color2);
      expect(color1).toBe(PLAYER_COLORS[1]);
    });

    it('should assign correct colors based on party data', () => {
      const parties = [
        {
          partyId: 'party-1',
          members: [
            { userId: 'alice', memberNickname: 'Alice' },
            { userId: 'bob', memberNickname: 'Bob' },
            { userId: 'charlie', memberNickname: 'Charlie' },
          ],
        },
      ];

      const allUserIds = getAllUserIds(parties);

      // Colors should be assigned in sorted order
      const aliceColor = getPlayerColor('alice', allUserIds, false);
      const bobColor = getPlayerColor('bob', allUserIds, false);
      const charlieColor = getPlayerColor('charlie', allUserIds, false);

      expect(aliceColor).toBe(PLAYER_COLORS[0]);
      expect(bobColor).toBe(PLAYER_COLORS[1]);
      expect(charlieColor).toBe(PLAYER_COLORS[2]);
    });
  });
});
