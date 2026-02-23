"use client";

import { useEffect, useMemo, useState } from 'react';
import CardView from '@/components/CardView';
import { useGameStore } from '@/store/useGameStore';
import { Player } from '@/types/game';

interface SeatLayout {
  seatX: number;
  seatY: number;
  cardX: number;
  cardY: number;
  cardRotation: number;
}

const ARC_SEATS: SeatLayout[] = [
  { seatX: 9, seatY: 55, cardX: 17, cardY: 47, cardRotation: -24 },
  { seatX: 23, seatY: 79, cardX: 30, cardY: 63, cardRotation: -16 },
  { seatX: 40, seatY: 92, cardX: 41, cardY: 75, cardRotation: -6 },
  { seatX: 60, seatY: 92, cardX: 59, cardY: 75, cardRotation: 6 },
  { seatX: 77, seatY: 79, cardX: 70, cardY: 63, cardRotation: 16 },
  { seatX: 91, seatY: 55, cardX: 83, cardY: 47, cardRotation: 24 },
];

const HAND_TYPES = ['하이카드', '원페어', '투페어', '트리플', '스트레이트', '풀하우스', '포카드'];
const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const store = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [selectedSnipeHand, setSelectedSnipeHand] = useState('');
  const [selectedSnipeRank, setSelectedSnipeRank] = useState<number | null>(null);

  const phase = store.phase;
  const players = store.players;
  const currentTurnPlayerId = store.currentTurnPlayerId;
  const simulateAI = store.simulateAI;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (phase !== 'READY' && phase !== 'ANTE' && currentTurnPlayerId) {
      const activePlayer = players.find(player => player.id === currentTurnPlayerId);
      if (activePlayer?.isAI) {
        simulateAI();
      }
    }
  }, [currentTurnPlayerId, phase, players, simulateAI]);

  const human = useMemo(() => players.find(player => !player.isAI), [players]);
  const aiPlayers = useMemo(() => players.filter(player => player.isAI), [players]);

  const tablePlayers = useMemo(() => {
    const seats: Array<Player | undefined> = [aiPlayers[0], aiPlayers[1], aiPlayers[2], human, aiPlayers[3], aiPlayers[4]];
    return seats;
  }, [aiPlayers, human]);

  const isHumanTurn = currentTurnPlayerId === human?.id;
  const callAmount = store.highestBet - (human?.betAmount || 0);

  if (!mounted) return null;

  if (phase === 'READY') {
    return (
      <main className="sn-scene flex items-center justify-center px-4 py-10">
        <div className="sn-env" aria-hidden="true">
          <div className="sn-concrete-wall"></div>
          <div className="sn-wall-panels"></div>
          <div className="sn-light-fixture sn-light-fixture--left"></div>
          <div className="sn-light-fixture sn-light-fixture--right"></div>
          <div className="sn-volumetric sn-volumetric--left"></div>
          <div className="sn-volumetric sn-volumetric--right"></div>
          <div className="sn-side-neon sn-side-neon--left"></div>
          <div className="sn-side-neon sn-side-neon--right"></div>
          <div className="sn-fog sn-fog--top"></div>
          <div className="sn-fog sn-fog--bottom"></div>
        </div>

        <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-violet-400/35 bg-black/40 p-8 text-center backdrop-blur-xl sm:p-12">
          <p className="sn-font-title text-xs uppercase tracking-[0.45em] text-cyan-200/80">Devil&apos;s Plan 2</p>
          <h1 className="sn-font-title mt-4 text-4xl text-white sm:text-6xl">Sniper Hold&apos;em</h1>
          <p className="mt-5 text-sm text-violet-100/80 sm:text-base">High-end cyberpunk table UI with holographic neon visuals.</p>
          <button onClick={() => store.startGame()} className="sn-action-button sn-action-button--snipe mx-auto mt-8">
            Enter Table
          </button>
        </div>
      </main>
    );
  }

  const shouldRevealCards = (player: Player) => {
    return !player.isAI || phase === 'SHOWDOWN' || player.status === 'FOLDED' || player.status === 'ELIMINATED';
  };

  const showRoundActions = phase !== 'SNIPING' && phase !== 'SHOWDOWN' && phase !== 'FINISHED';

  return (
    <main className="sn-scene px-3 py-4 sm:px-6 sm:py-6">
      <div className="sn-env" aria-hidden="true">
        <div className="sn-concrete-wall"></div>
        <div className="sn-wall-panels"></div>
        <div className="sn-light-fixture sn-light-fixture--left"></div>
        <div className="sn-light-fixture sn-light-fixture--right"></div>
        <div className="sn-volumetric sn-volumetric--left"></div>
        <div className="sn-volumetric sn-volumetric--right"></div>
        <div className="sn-side-neon sn-side-neon--left"></div>
        <div className="sn-side-neon sn-side-neon--right"></div>
        <div className="sn-fog sn-fog--top"></div>
        <div className="sn-fog sn-fog--mid"></div>
        <div className="sn-fog sn-fog--bottom"></div>
        <div className="sn-floor-reflection"></div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1700px] flex-col">
        <section className="sn-stage-shell">
          <div className="sn-stage-canvas">
            <header className="sn-hud">
              <div className="sn-hud__phase">
                Phase <span className="text-cyan-200">{phase}</span>
              </div>
              <button className="sn-hud__menu">≡</button>
            </header>

            <div className="sn-seat-ring" aria-hidden="true">
              {ARC_SEATS.map((seat, index) => {
                const player = tablePlayers[index];
                if (!player) return null;

                const isCurrentTurn = player.id === currentTurnPlayerId;
                const isFolded = player.status === 'FOLDED' || player.status === 'ELIMINATED';

                return (
                  <article
                    key={`seat-${player.id}`}
                    className={`sn-seat ${isCurrentTurn ? 'sn-seat--active' : ''} ${isFolded ? 'sn-seat--dim' : ''}`}
                    style={{ left: `${seat.seatX}%`, top: `${seat.seatY}%` }}
                  >
                    <div className="sn-seat__avatar"></div>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] uppercase tracking-[0.06em] text-violet-100/72">{player.name}</p>
                      <p className="sn-font-title text-[19px] leading-none text-white">{player.chips.toLocaleString()}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="sn-table-wrap">
              <div className="sn-table">
                <div className="sn-table__rim" aria-hidden="true"></div>
                <div className="sn-table__contact-shadow" aria-hidden="true"></div>
                <div className="sn-table__surface">
                  <div className="sn-circuit" aria-hidden="true"></div>

                  {ARC_SEATS.map((seat, index) => {
                    const player = tablePlayers[index];
                    if (!player) return null;

                    return (
                      <div
                        key={`cards-${player.id}`}
                        className={`sn-seat-cards ${player.status === 'FOLDED' || player.status === 'ELIMINATED' ? 'opacity-45 grayscale' : ''}`}
                        style={{
                          left: `${seat.cardX}%`,
                          top: `${seat.cardY}%`,
                          transform: `translate(-50%, -50%) rotate(${seat.cardRotation}deg)`,
                        }}
                      >
                        {player.hand.map((card, cardIndex) => (
                          <div key={cardIndex} className={`sn-seat-cards__card ${cardIndex === 1 ? 'sn-seat-cards__card--rear' : ''}`}>
                            <CardView card={card} hidden={!shouldRevealCards(player)} size="sm" />
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  <div className="sn-dealer-chip">DEALER</div>

                  <div className="sn-holo-sign" aria-label="Sniper Holdem hologram">
                    <div className="sn-holo-sign__stand"></div>
                    <div className="sn-holo-sign__glass">
                      <div className="sn-holo-sign__crack"></div>
                      <div className="sn-holo-sign__scan"></div>
                      <div className="sn-holo-sign__text">
                        <span className="sn-holo-sign__main">SNIPER</span>
                        <span className="sn-holo-sign__sub">HOLD&apos;EM</span>
                      </div>
                    </div>
                  </div>

                  <div className="sn-board-row sn-board-row--deck">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <CardView key={`deck-slot-${index}`} hidden size="sm" />
                    ))}
                  </div>

                  <div className="sn-board-row sn-board-row--community">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const card = store.communityCards[index];
                      return card ? <CardView key={`community-${index}`} card={card} size="md" /> : <CardView key={`community-${index}`} hidden size="md" />;
                    })}
                  </div>

                  <div className="sn-pot-widget backdrop-blur-md drop-shadow-[0_0_20px_rgba(120,92,255,0.34)]">
                    <span>CURRENT POT: {store.pot.toLocaleString()}</span>
                    <span>BET: {store.highestBet.toLocaleString()}</span>
                  </div>

                  {store.winnersInfo && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center rounded-[28px] bg-black/65 backdrop-blur-sm">
                      <div className="rounded-2xl border border-cyan-300/40 bg-slate-950/90 p-7 text-center shadow-[0_0_45px_rgba(85,220,255,0.35)]">
                        <h2 className="sn-font-title text-3xl text-white">{store.winnersInfo.winners.map(winner => winner.name).join(', ')} Win</h2>
                        <p className="mt-3 rounded-md bg-cyan-200/10 px-3 py-1 text-sm uppercase tracking-[0.2em] text-cyan-100">{store.winnersInfo.handName}</p>
                        {store.winnersInfo.splitPotAmount > 0 && (
                          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-cyan-200">+{store.winnersInfo.splitPotAmount} Chips</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sn-stage-actions">
              {(phase === 'SHOWDOWN' || phase === 'FINISHED') && (
                <button onClick={store.startGame} className="sn-action-button sn-action-button--snipe">
                  Next Round
                </button>
              )}

              {showRoundActions && human && (
                <div className="sn-action-dock">
                  <button
                    disabled={!isHumanTurn}
                    onClick={() => store.playerAction(human.id, 'FOLD')}
                    className="sn-action-button sn-action-button--fold"
                  >
                    FOLD
                  </button>

                  {callAmount > 0 ? (
                    <button
                      disabled={!isHumanTurn}
                      onClick={() => store.playerAction(human.id, 'CALL')}
                      className="sn-action-button sn-action-button--call"
                    >
                      CALL {callAmount}
                    </button>
                  ) : (
                    <button
                      disabled={!isHumanTurn}
                      onClick={() => store.playerAction(human.id, 'CHECK')}
                      className="sn-action-button sn-action-button--call"
                    >
                      CHECK
                    </button>
                  )}

                  <button
                    disabled={!isHumanTurn || human.chips < callAmount + 5 || (store.highestBet + 5) > store.getMaxBetAllowed()}
                    onClick={() => store.playerAction(human.id, 'RAISE', 5)}
                    className="sn-action-button sn-action-button--raise"
                  >
                    RAISE
                  </button>

                  <button className="sn-action-button sn-action-button--snipe" aria-label="Snipe">
                    <TargetIcon />
                    SNIPE
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {store.snipedTargets.length > 0 && (
          <section className="sn-sniped-strip">
            <span className="text-rose-300">Sniped</span>
            {store.snipedTargets.map((target, index) => (
              <span key={`${target}-${index}`}>{target}</span>
            ))}
          </section>
        )}

        {phase === 'SNIPING' && human && (
          <section className="mt-3 flex justify-center">
            <div className="w-full max-w-5xl rounded-2xl border border-violet-400/35 bg-black/45 p-3 backdrop-blur-xl sm:p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="sn-font-title text-sm uppercase tracking-[0.25em] text-cyan-200">Sniping Target</p>
                <button
                  disabled={!isHumanTurn}
                  onClick={() => {
                    store.playerAction(human.id, 'SNIPE', 0, '');
                    setSelectedSnipeHand('');
                    setSelectedSnipeRank(null);
                  }}
                  className="rounded-full border border-violet-300/35 bg-violet-900/35 px-3 py-1 text-xs uppercase tracking-[0.2em] text-violet-100 disabled:opacity-40"
                >
                  Pass
                </button>
              </div>

              <div className="mb-2 flex flex-wrap gap-2">
                {HAND_TYPES.map(hand => (
                  <button
                    key={hand}
                    disabled={!isHumanTurn}
                    onClick={() => {
                      setSelectedSnipeHand(hand);
                      setSelectedSnipeRank(null);
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${
                      selectedSnipeHand === hand
                        ? 'border-cyan-300 bg-cyan-400/30 text-cyan-100 shadow-[0_0_14px_rgba(90,220,255,0.42)]'
                        : 'border-violet-400/35 bg-violet-900/30 text-violet-100/80'
                    }`}
                  >
                    {hand}
                  </button>
                ))}
              </div>

              {selectedSnipeHand && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {RANKS.map(rank => (
                    <button
                      key={rank}
                      disabled={!isHumanTurn}
                      onClick={() => setSelectedSnipeRank(rank)}
                      className={`h-8 w-8 rounded-full border text-xs font-semibold ${
                        selectedSnipeRank === rank
                          ? 'border-cyan-300 bg-cyan-400/30 text-cyan-100 shadow-[0_0_14px_rgba(90,220,255,0.42)]'
                          : 'border-violet-400/35 bg-violet-900/30 text-violet-100/80'
                      }`}
                    >
                      {rank}
                    </button>
                  ))}
                </div>
              )}

              <button
                disabled={!isHumanTurn || !selectedSnipeHand || !selectedSnipeRank}
                onClick={() => {
                  store.playerAction(human.id, 'SNIPE', 0, `${selectedSnipeRank} ${selectedSnipeHand}`);
                  setSelectedSnipeHand('');
                  setSelectedSnipeRank(null);
                }}
                className="sn-action-button sn-action-button--snipe w-full"
              >
                <TargetIcon />
                {selectedSnipeRank && selectedSnipeHand ? `Shoot ${selectedSnipeRank} ${selectedSnipeHand}` : 'Select Hand + Rank'}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
