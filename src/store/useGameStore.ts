import { create } from 'zustand';
import { GameState, Player, ActionType } from '@/types/game';
import { Deck } from '@/lib/deck';
import { Judge } from '@/lib/judge';

interface WinnersInfo {
    winners: Player[];
    handName: string;
    splitPotAmount: number;
}

interface GameStore extends GameState {
    actionIndex: number;          // 턴 인덱스
    lastAggressorIndex: number;   // 마지막으로 레이즈/베팅을 한 기준점
    winnersInfo: WinnersInfo | null;
    startingPlayerIndex: number;  // 매 라운드 선행 플레이어 (선 플레이어)

    startGame: () => void;
    playerAction: (playerId: string, action: ActionType, amount?: number, snipeTarget?: string) => void;
    nextTurn: () => void;
    nextPhase: () => void;
    handleShowdown: () => void;
    simulateAI: () => void;
    getMaxBetAllowed: () => number;
}

const INITIAL_CHIPS = 60;

export const useGameStore = create<GameStore>((set, get) => ({
    roomId: 'sniper-holdem',
    phase: 'READY',
    players: [],
    deck: [],
    communityCards: [],
    pot: 0,
    currentTurnPlayerId: null,
    highestBet: 0,
    round: 0,
    snipedTargets: [],

    actionIndex: 0,
    lastAggressorIndex: 0,
    winnersInfo: null,
    startingPlayerIndex: 0,

    getMaxBetAllowed: () => {
        // 룰: 베팅은 칩이 가장 적은 플레이어의 칩의 수보다 많이 진행할 수 없다. (총 베팅액 기준)
        const { players } = get();
        const activeBots = players.filter(p => p.status === 'PLAYING' || p.status === 'ALL_IN');
        if (activeBots.length === 0) return 0;

        // 현재 각 플레이어가 들고 있는 "남은 칩 + 이미 베팅한 금액(총 자산)" 중 제일 작은 값을 구함
        const minTotalWealth = Math.min(...activeBots.map(p => p.chips + p.betAmount));
        return minTotalWealth;
    },

    startGame: () => {
        // 1. 초기 지급
        const newPlayers: Player[] = [
            { id: 'p1', name: 'You', hand: [], chips: INITIAL_CHIPS, betAmount: 0, status: 'WAITING', isDealer: false, isAI: false },
            { id: 'ai1', name: 'Bot 1', hand: [], chips: INITIAL_CHIPS, betAmount: 0, status: 'WAITING', isDealer: false, isAI: true },
            { id: 'ai2', name: 'Bot 2', hand: [], chips: INITIAL_CHIPS, betAmount: 0, status: 'WAITING', isDealer: false, isAI: true },
            { id: 'ai3', name: 'Bot 3', hand: [], chips: INITIAL_CHIPS, betAmount: 0, status: 'WAITING', isDealer: false, isAI: true },
            { id: 'ai4', name: 'Bot 4', hand: [], chips: INITIAL_CHIPS, betAmount: 0, status: 'WAITING', isDealer: false, isAI: true },
            { id: 'ai5', name: 'Bot 5', hand: [], chips: INITIAL_CHIPS, betAmount: 0, status: 'WAITING', isDealer: false, isAI: true },
        ];

        // 라운드 진입 과정 진행
        set({
            phase: 'READY',
            players: newPlayers,
            deck: [],
            communityCards: [],
            pot: 0,
            round: 1,
            winnersInfo: null,
            snipedTargets: [],
            highestBet: 0,
            startingPlayerIndex: 0,
        });

        get().nextPhase(); // READY -> ANTE 로 즉시 진입
    },

    playerAction: (playerId, action, amount = 0, snipeTarget = '') => {
        const state = get();
        if (state.currentTurnPlayerId !== playerId || state.phase === 'SHOWDOWN' || state.phase === 'FINISHED') return;

        const { players } = state;
        let { pot, highestBet, lastAggressorIndex, snipedTargets } = state;
        const playerIndex = players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return;

        const player = players[playerIndex];
        let newBetAmount = player.betAmount;
        let newChips = player.chips;
        let newStatus = player.status;

        // SNIPING 페이즈 전용 액션 처리
        if (state.phase === 'SNIPING') {
            if (action === 'SNIPE' && snipeTarget) {
                snipedTargets = [...snipedTargets, snipeTarget];
                players[playerIndex] = { ...player, snipedTarget: snipeTarget };
                set({ players: [...players], snipedTargets });
            }
            get().nextTurn();
            return;
        }

        // 일반 베팅
        if (action === 'FOLD') {
            newStatus = 'FOLDED';
        } else if (action === 'CALL' || action === 'CHECK') {
            const callAmount = highestBet - player.betAmount;
            const actualCall = Math.min(callAmount, player.chips);
            newChips -= actualCall;
            pot += actualCall;
            newBetAmount += actualCall;
            if (newChips === 0) newStatus = 'ALL_IN';
        } else if (action === 'RAISE' || action === 'ALL_IN') {
            let totalTargetBet = 0;
            const maxAllowed = get().getMaxBetAllowed();

            if (action === 'ALL_IN') {
                totalTargetBet = maxAllowed;
            } else {
                totalTargetBet = highestBet + amount;
                if (totalTargetBet > maxAllowed) totalTargetBet = maxAllowed; // 한도 제한
            }

            const raiseAdding = totalTargetBet - player.betAmount;
            const actualRaise = Math.min(raiseAdding, player.chips);

            if (actualRaise > 0) {
                newChips -= actualRaise;
                pot += actualRaise;
                newBetAmount += actualRaise;
                highestBet = newBetAmount;
                lastAggressorIndex = playerIndex; // 새로운 어그레서 지정
                if (newChips === 0) newStatus = 'ALL_IN';
            } else {
                // 실제 더 지출할 칩이 없으면 CALL 취급
                if (newChips === 0) newStatus = 'ALL_IN';
            }
        }

        const updatedPlayers = [...players];
        updatedPlayers[playerIndex] = { ...player, chips: newChips, betAmount: newBetAmount, status: newStatus };

        set({ players: updatedPlayers, pot, highestBet, lastAggressorIndex });
        get().nextTurn();
    },

    nextTurn: () => {
        const { actionIndex, lastAggressorIndex, players, phase, startingPlayerIndex } = get();

        // 타겟 페이즈가 저격 페이즈 일 경우 1바퀴 돌면 즉시 쇼다운
        if (phase === 'SNIPING') {
            let nextIndex = (actionIndex + 1) % players.length;
            if (nextIndex === startingPlayerIndex) {
                get().handleShowdown();
            } else {
                // 플레이어 찾기
                let loops = 0;
                while (['FOLDED', 'ELIMINATED'].includes(players[nextIndex].status) && loops < players.length) {
                    nextIndex = (nextIndex + 1) % players.length;
                    loops++;
                }

                if (loops >= players.length || nextIndex === startingPlayerIndex) {
                    get().handleShowdown();
                } else {
                    set({ actionIndex: nextIndex, currentTurnPlayerId: players[nextIndex].id });
                }
            }
            return;
        }

        // 일반 베팅 페이즈
        const activeCount = players.filter(p => !['FOLDED', 'ELIMINATED'].includes(p.status)).length;
        if (activeCount <= 1) { // 1명 빼고 다 죽었으므로 즉시 쇼다운(또는 라운드종료)
            get().handleShowdown();
            return;
        }

        let nextIndex = (actionIndex + 1) % players.length;
        let loops = 0;
        while (!['PLAYING'].includes(players[nextIndex].status) && loops < players.length) {
            nextIndex = (nextIndex + 1) % players.length;
            loops++;
        }

        // 1바퀴를 다 돌아서 레이즈 건 사람한테 왔거나, 남은 플레이어가 1명(다 올인/폴드)이면 다음 페이즈
        if (nextIndex === lastAggressorIndex || players.filter(p => p.status === 'PLAYING').length === 0) {
            get().nextPhase();
        } else {
            set({ actionIndex: nextIndex, currentTurnPlayerId: players[nextIndex].id });
        }
    },

    nextPhase: () => {
        const state = get();

        if (state.phase === 'READY') {
            // ANTE: 기본 베팅 1개씩 내고 카드 2장 받음
            const deck = new Deck();
            deck.shuffle();

            let currentPot = state.pot;
            const playingPlayers = state.players.map(p => {
                // 탈락자가 아니면 강제 1칩 지불
                if (p.status === 'ELIMINATED') return p;
                const pay = Math.min(1, p.chips);
                currentPot += pay;
                return {
                    ...p,
                    hand: deck.draw(2),
                    chips: p.chips - pay,
                    status: 'PLAYING' as const,
                    betAmount: 0,
                    snipedTarget: undefined
                };
            });

            // 칩이 제일 적은 플레이어가 '선'이 됨
            let startIdx = 0;
            let minChips = 99999;
            playingPlayers.forEach((p, i) => {
                if (p.chips < minChips && p.status === 'PLAYING') {
                    minChips = p.chips;
                    startIdx = i;
                }
            });

            set({
                phase: 'ANTE',
                deck: deck.toArray(),
                communityCards: [],
                players: playingPlayers,
                pot: currentPot,
                startingPlayerIndex: startIdx,
            });

            // 바로 ROUND_1로 이동 (UI 생략 가능하도록)
            setTimeout(() => get().nextPhase(), 500);

        } else if (state.phase === 'ANTE') {

            const deck = new Deck();
            deck.setCards(state.deck);
            const newCommunityCards = deck.draw(2);

            set({
                phase: 'ROUND_1',
                communityCards: newCommunityCards,
                deck: deck.toArray(),
                highestBet: 0,
                actionIndex: state.startingPlayerIndex,
                lastAggressorIndex: state.startingPlayerIndex,
                currentTurnPlayerId: state.players[state.startingPlayerIndex].id,
            });

        } else if (state.phase === 'ROUND_1') {
            // ROUND_2: 공용카드 2장 더 (총4장), 베팅 초기화
            const deck = new Deck();
            deck.setCards(state.deck);
            const newCommunityCards = deck.draw(2);

            const resetPlayers = state.players.map(p => ({
                ...p,
                betAmount: 0,
            }));

            // 선행 플레이어부터 턴 재개
            let startIdx = state.startingPlayerIndex;
            while (resetPlayers[startIdx].status !== 'PLAYING' && startIdx < resetPlayers.length * 2) {
                startIdx = (startIdx + 1) % resetPlayers.length;
            }

            set({
                phase: 'ROUND_2',
                communityCards: [...state.communityCards, ...newCommunityCards],
                deck: deck.toArray(),
                players: resetPlayers,
                highestBet: 0,
                actionIndex: startIdx,
                lastAggressorIndex: startIdx,
                currentTurnPlayerId: resetPlayers[startIdx]?.id || null,
            });
        } else if (state.phase === 'ROUND_2') {
            // SNIPING: 저격 페이즈 돌입
            // 턴 초기화
            const resetPlayers = state.players.map(p => ({
                ...p, betAmount: 0
            }));
            let startIdx = state.startingPlayerIndex;
            while (['FOLDED', 'ELIMINATED'].includes(resetPlayers[startIdx].status) && startIdx < resetPlayers.length * 2) {
                startIdx = (startIdx + 1) % resetPlayers.length;
            }

            set({
                phase: 'SNIPING',
                players: resetPlayers,
                snipedTargets: [],
                actionIndex: startIdx,
                currentTurnPlayerId: resetPlayers[startIdx]?.id || null,
            });

        }
    },

    handleShowdown: () => {
        const state = get();
        const { players, communityCards, pot, snipedTargets } = state;

        // 생존자 도출
        const activePlayers = players.filter(p => !['FOLDED', 'ELIMINATED'].includes(p.status));
        let winners: Player[] = [];
        let bestHandName = '기권 승 (Win by Fold)';

        if (activePlayers.length === 1) {
            winners = [activePlayers[0]];
        } else {
            // 판독 수행
            const evaluated = activePlayers.map(p => {
                const result = Judge.evaluate(p.hand, communityCards);
                // 저격당했는지 검사
                if (snipedTargets.includes(result.name)) {
                    result.isSniped = true;
                }
                return { player: p, result };
            });

            // 가장 쎈 사람 도출
            // 정렬 (내림차순, 첫번째가 승자)
            evaluated.sort((a, b) => Judge.compare(b.result, a.result));

            // 1등과 비교 (동점자 있는지 확인)
            winners = [evaluated[0].player];
            bestHandName = evaluated[0].result.name;

            for (let i = 1; i < evaluated.length; i++) {
                if (Judge.compare(evaluated[0].result, evaluated[i].result) === 0) {
                    winners.push(evaluated[i].player);
                } else {
                    break;
                }
            }
        }

        // 팟 분배 (베팅 똑같이 나누고 남는 칩은 턴 앞선 순서대로 1개씩)
        const baseSplit = Math.floor(pot / winners.length);
        const remainder = pot % winners.length;

        // winners 리스트를 "선(startingPlayerIndex)에서 가까운 순"으로 정렬 (나머지 칩 분배용)
        const sortedWinners = [...winners].sort((a, b) => {
            const idxA = players.findIndex(p => p.id === a.id);
            const idxB = players.findIndex(p => p.id === b.id);
            const distA = (idxA - state.startingPlayerIndex + players.length) % players.length;
            const distB = (idxB - state.startingPlayerIndex + players.length) % players.length;
            return distA - distB;
        });

        const updatedPlayers = players.map(p => {
            const isWinner = sortedWinners.find(w => w.id === p.id);
            let earned = 0;
            if (isWinner) {
                earned = baseSplit;
                if (remainder > 0 && sortedWinners.indexOf(isWinner) < remainder) { // 앞선 자가 1개씩 추가 획득
                    earned += 1;
                }
            }
            return {
                ...p,
                chips: p.chips + earned
            };
        });

        set({
            phase: 'SHOWDOWN',
            players: updatedPlayers,
            currentTurnPlayerId: null,
            pot: 0,
            winnersInfo: {
                winners: sortedWinners,
                handName: bestHandName,
                splitPotAmount: baseSplit // 화면표시용
            }
        });

        // 여기서 누군가 칩이 0이면 ELIMINATED 처리 (다음 게임 시작 시 진행)
    },

    simulateAI: () => {
        const state = get();
        const currentPlayer = state.players.find(p => p.id === state.currentTurnPlayerId);
        if (!currentPlayer || !currentPlayer.isAI || state.phase === 'SHOWDOWN' || state.phase === 'FINISHED') return;

        if (state.phase === 'SNIPING') {
            setTimeout(() => {
                // AI 랜덤 저격: 단순 하드코딩 랜덤 생성 (실제론 가능성 높은 족보를 계산해야함)
                const randomRank = Math.floor(Math.random() * 10) + 1;
                const fakeSnipes = [`${randomRank} 스트레이트`, `${randomRank} 투페어`, `${randomRank} 원페어`, 'Pass'];
                const target = fakeSnipes[Math.floor(Math.random() * fakeSnipes.length)];
                const finalTarget = target === 'Pass' ? '' : target;
                get().playerAction(currentPlayer.id, 'SNIPE', 0, finalTarget);
            }, 1500);
            return;
        }

        // 일반 베팅
        const callAmount = state.highestBet - currentPlayer.betAmount;

        setTimeout(() => {
            if (callAmount > 0) {
                // 20% fold, 80% call
                const rand = Math.random();
                if (rand < 0.2 && currentPlayer.chips > callAmount) {
                    get().playerAction(currentPlayer.id, 'FOLD');
                } else {
                    get().playerAction(currentPlayer.id, 'CALL');
                }
            } else {
                const rand = Math.random();
                if (rand < 0.2 && currentPlayer.chips > 5) {
                    get().playerAction(currentPlayer.id, 'RAISE', 5);
                } else {
                    get().playerAction(currentPlayer.id, 'CHECK');
                }
            }
        }, 1000);
    }
}));
