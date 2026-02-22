import { Card, Rank } from '@/types/game';

export interface HandResult {
    name: string;          // e.g., "8 스트레이트", "7 투페어"
    absoluteRank: number;  // 1: 하이카드 ~ 7: 포카드
    keyNumber: number;     // 족보의 메인 숫자 (동률 1차 비교)
    kicker1: number;       // 개인 카드 중 높은 숫자 (동률 2차 비교)
    kicker2: number;       // 개인 카드 중 낮은 숫자 (동률 3차 비교)
    isSniped?: boolean;    // 저격당한 경우 true (최하위 강등)
}

export class Judge {
    private static readonly RANKING = {
        FOUR_OF_A_KIND: 7,
        FULL_HOUSE: 6,
        STRAIGHT: 5,
        THREE_OF_A_KIND: 4,
        TWO_PAIR: 3,
        ONE_PAIR: 2,
        HIGH_CARD: 1,
    };

    /**
     * 6 cards (2 hand + 4 community) -> Pick the best 5-card combination
     */
    public static evaluate(handCards: Card[], communityCards: Card[]): HandResult {
        const allCards = [...handCards, ...communityCards];
        if (allCards.length < 5) throw new Error("At least 5 cards required.");

        const handRanks = handCards.map(c => c.rank).sort((a, b) => b - a);
        const h1 = handRanks[0] || 0;
        const h2 = handRanks[1] || 0;

        const combinations = this.getCombinations(allCards, 5);
        let bestResult: HandResult | null = null;

        for (const combo of combinations) {
            const result = this.evaluate5Cards(combo, h1, h2);
            if (!bestResult || this.compare(result, bestResult) > 0) {
                bestResult = result;
            }
        }

        return bestResult!;
    }

    /**
     * 5장으로 7가지 족보 중 하나를 판별하여 반환
     */
    private static evaluate5Cards(cards: Card[], kicker1: number, kicker2: number): HandResult {
        const sorted = [...cards].sort((a, b) => b.rank - a.rank);
        const ranks = sorted.map(c => c.rank);

        let isStraight = true;
        for (let i = 1; i < 5; i++) {
            if (ranks[i - 1] - 1 !== ranks[i]) {
                isStraight = false;
                break;
            }
        }

        const counts = new Map<number, number>();
        for (const r of ranks) counts.set(r, (counts.get(r) || 0) + 1);

        const countFreq = Array.from(counts.entries()).sort((a, b) => {
            if (a[1] !== b[1]) return b[1] - a[1]; // 빈도 내림차순
            return b[0] - a[0]; // 숫자 내림차순
        });

        let name = '';
        let absoluteRank = 0;
        let keyNumber = 0;

        // 규칙에 정의된 7가지 족보만 순차적으로 검증 (플러시류 제외)
        if (countFreq[0][1] === 4) {
            absoluteRank = this.RANKING.FOUR_OF_A_KIND;
            keyNumber = countFreq[0][0];
            name = `${keyNumber} 포카드`;
        } else if (countFreq[0][1] === 3 && countFreq[1][1] === 2) {
            absoluteRank = this.RANKING.FULL_HOUSE;
            keyNumber = countFreq[0][0]; // 트리플 숫자가 키넘버
            name = `${keyNumber} 풀하우스`;
        } else if (isStraight) {
            absoluteRank = this.RANKING.STRAIGHT;
            keyNumber = ranks[0]; // 가장 높은 숫자
            name = `${keyNumber} 스트레이트`;
        } else if (countFreq[0][1] === 3) {
            absoluteRank = this.RANKING.THREE_OF_A_KIND;
            keyNumber = countFreq[0][0];
            name = `${keyNumber} 트리플`;
        } else if (countFreq[0][1] === 2 && countFreq[1][1] === 2) {
            absoluteRank = this.RANKING.TWO_PAIR;
            keyNumber = Math.max(countFreq[0][0], countFreq[1][0]);
            name = `${keyNumber} 투페어`;
        } else if (countFreq[0][1] === 2) {
            absoluteRank = this.RANKING.ONE_PAIR;
            keyNumber = countFreq[0][0];
            name = `${keyNumber} 원페어`;
        } else {
            absoluteRank = this.RANKING.HIGH_CARD;
            keyNumber = ranks[0];
            name = `${keyNumber} 하이카드`;
        }

        return {
            name,
            absoluteRank,
            keyNumber,
            kicker1,
            kicker2,
        };
    }

    /**
     * 결과 2개를 비교하여 a가 크면 양수, b가 크면 음수, 같으면 0 반환
     * 동점자 규칙:
     * 1. 족보 등급
     * 2. 족보 사용 숫자 (Key Number)
     * 3. 개인 카드 중 높은 숫자
     * 4. 개인 카드 중 다른 숫자
     */
    public static compare(a: HandResult, b: HandResult): number {
        // 저격당한 패는 무조건 제일 약함 (-999 역할)
        if (a.isSniped && !b.isSniped) return -1;
        if (!a.isSniped && b.isSniped) return 1;

        if (a.absoluteRank !== b.absoluteRank) return a.absoluteRank - b.absoluteRank;
        if (a.keyNumber !== b.keyNumber) return a.keyNumber - b.keyNumber;
        if (a.kicker1 !== b.kicker1) return a.kicker1 - b.kicker1;
        if (a.kicker2 !== b.kicker2) return a.kicker2 - b.kicker2;
        return 0; // 완전 무승부 (Split)
    }

    // Generate all possible combinations of size k
    private static getCombinations(cards: Card[], k: number): Card[][] {
        const results: Card[][] = [];
        function helper(start: number, combo: Card[]) {
            if (combo.length === k) {
                results.push([...combo]);
                return;
            }
            for (let i = start; i < cards.length; i++) {
                combo.push(cards[i]);
                helper(i + 1, combo);
                combo.pop();
            }
        }
        helper(0, []);
        return results;
    }
}
