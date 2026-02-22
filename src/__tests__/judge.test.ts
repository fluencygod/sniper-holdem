import { Judge } from '@/lib/judge';
import { Card, Suit, Rank } from '@/types/game';

function createCard(suit: Suit, rank: Rank): Card {
    return { id: `${suit}-${rank}`, suit, rank };
}

describe('Judge Updated Rules', () => {
    it('should identify Four of a Kind', () => {
        const hand = [
            createCard('SPADE', 8),
            createCard('HEART', 8)
        ];
        const com = [
            createCard('DIAMOND', 8),
            createCard('CLUB', 8),
            createCard('SPADE', 10),
            createCard('HEART', 2)
        ];
        const result = Judge.evaluate(hand, com);
        expect(result.name).toBe('8 포카드');
        expect(result.absoluteRank).toBe(7);
    });

    it('should resolve Tie-breakers (Same Exact Category -> Key Number)', () => {
        const r1 = Judge.evaluate(
            [createCard('SPADE', 8), createCard('HEART', 8)],
            [createCard('DIAMOND', 2), createCard('CLUB', 3), createCard('SPADE', 5), createCard('HEART', 6)]
        ); // 8 원페어

        const r2 = Judge.evaluate(
            [createCard('SPADE', 7), createCard('HEART', 7)],
            [createCard('DIAMOND', 2), createCard('CLUB', 3), createCard('SPADE', 5), createCard('HEART', 6)]
        ); // 7 원페어

        expect(Judge.compare(r1, r2)).toBeGreaterThan(0); // 8 pair wins
    });

    it('should resolve Tie-breakers using Personal Cards (Kicker 1, Kicker 2)', () => {
        // Both users hit the "10 One Pair" from community cards
        const com = [
            createCard('SPADE', 10), createCard('HEART', 10), createCard('DIAMOND', 2), createCard('CLUB', 3)
        ];

        // player 1 has 9 and 7
        const r1 = Judge.evaluate(
            [createCard('SPADE', 9), createCard('HEART', 7)], com
        );
        // player 2 has 9 and 6
        const r2 = Judge.evaluate(
            [createCard('CLUB', 9), createCard('DIAMOND', 6)], com
        );

        // They both have 10 One Pair.
        expect(r1.name).toBe('10 원페어');
        expect(r2.name).toBe('10 원페어');

        // r1 should win because Kicker 2 (7 > 6)
        expect(Judge.compare(r1, r2)).toBeGreaterThan(0);
    });

    it('should handle Split Pot (Exact Tie)', () => {
        const com = [createCard('SPADE', 10), createCard('HEART', 10), createCard('DIAMOND', 2), createCard('CLUB', 3)];

        const r1 = Judge.evaluate([createCard('SPADE', 9), createCard('HEART', 7)], com);
        const r2 = Judge.evaluate([createCard('CLUB', 9), createCard('DIAMOND', 7)], com);

        expect(Judge.compare(r1, r2)).toBe(0); // Exact tie
    });

    it('should make Sniped Hands lose strictly', () => {
        const com = [createCard('SPADE', 10), createCard('HEART', 10), createCard('DIAMOND', 2), createCard('CLUB', 3)];

        const r1 = Judge.evaluate([createCard('SPADE', 9), createCard('HEART', 7)], com);
        const r2 = Judge.evaluate([createCard('CLUB', 5), createCard('DIAMOND', 4)], com);

        // Normal: r1 (10 One Pair with 9,7) > r2 (10 One pair with 5,4)
        expect(Judge.compare(r1, r2)).toBeGreaterThan(0);

        // But if r1 was SNIPED!
        r1.isSniped = true;
        expect(Judge.compare(r1, r2)).toBeLessThan(0); // r2 wins despite lower kickers
    });
});
