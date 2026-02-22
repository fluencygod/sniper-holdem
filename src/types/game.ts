export type Suit = 'SPADE' | 'HEART' | 'DIAMOND' | 'CLUB';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Card {
    readonly id: string; // e.g., "SPADE-10"
    readonly suit: Suit;
    readonly rank: Rank;
}

export type PlayerStatus =
    | 'WAITING'
    | 'PLAYING'
    | 'FOLDED'
    | 'ALL_IN'
    | 'ELIMINATED';

export interface Player {
    readonly id: string;
    name: string;
    hand: Card[];
    chips: number;
    betAmount: number;
    status: PlayerStatus;
    isDealer: boolean;
    isAI: boolean;
    snipedTarget?: string; // e.g., "8 스트레이트", "7 풀하우스"
}

export type GamePhase =
    | 'READY'
    | 'ANTE'         // 칩 1개씩 지불 및 개인 패 분배
    | 'ROUND_1'      // 공용 2장, 1차 베팅
    | 'ROUND_2'      // 공용 2장(총4장), 2차 베팅
    | 'SNIPING'      // 저격 페이즈
    | 'SHOWDOWN'     // 패 공개 및 승패 판정
    | 'FINISHED';

export interface GameState {
    roomId: string;
    phase: GamePhase;
    players: Player[];

    deck: Card[];
    communityCards: Card[];
    pot: number;

    currentTurnPlayerId: string | null;
    highestBet: number;
    round: number;

    snipedTargets: string[]; // 이번 라운드에 선언된 저격 족보들
}

// Player actions
export type ActionType = 'FOLD' | 'CHECK' | 'CALL' | 'RAISE' | 'ALL_IN' | 'SNIPE';

export interface PlayerActionDTO {
    playerId: string;
    action: ActionType;
    amount?: number;       // RAISE 시 추가할 금액
    snipeTarget?: string;  // SNIPE 시 저격할 족보 문자열
}
