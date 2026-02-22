import { Card, Suit, Rank } from '@/types/game';

export class Deck {
    private cards: Card[] = [];

    constructor() {
        this.init();
    }

    // 1~10 숫자 4벌 생성 (총 40장)
    public init(): void {
        const suits: Suit[] = ['SPADE', 'HEART', 'DIAMOND', 'CLUB'];
        const ranks: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        this.cards = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                this.cards.push({
                    id: `${suit}-${rank}`,
                    suit,
                    rank,
                });
            }
        }
    }

    // 피셔-예이츠 셔플 알고리즘
    public shuffle(): void {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    // 카드 뽑기
    public draw(count: number): Card[] {
        if (this.cards.length < count) {
            throw new Error(`Not enough cards in the deck. Requested: ${count}, Available: ${this.cards.length}`);
        }
        return this.cards.splice(0, count);
    }

    // 남은 카드 개수 확인
    public get remainingCards(): number {
        return this.cards.length;
    }
}
