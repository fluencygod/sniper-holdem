import { Deck } from '@/lib/deck';

describe('Deck', () => {
    let deck: Deck;

    beforeEach(() => {
        deck = new Deck();
    });

    it('should initialize with exactly 40 cards', () => {
        expect(deck.remainingCards).toBe(40);
    });

    it('should be able to draw cards', () => {
        const cards = deck.draw(5);
        expect(cards.length).toBe(5);
        expect(deck.remainingCards).toBe(35);
    });

    it('should throw an error if drawing more than available', () => {
        expect(() => deck.draw(41)).toThrow();
    });

    it('should shuffle cards', () => {
        const unswapped = deck.toArray().map(card => card.id);
        deck.shuffle();
        const swapped = deck.toArray().map(card => card.id);
        expect(unswapped).not.toEqual(swapped);
    });
});
