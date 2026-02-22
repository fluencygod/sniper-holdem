import { Player, GamePhase } from '@/types/game';
import CardView from './CardView';

interface Props {
    player: Player;
    isActiveTurn: boolean;
    phase: GamePhase;
}

export default function PlayerView({ player, isActiveTurn, phase }: Props) {
    const showCards = !player.isAI || phase === 'SHOWDOWN' || player.status === 'FOLDED';
    const statusBadge = player.status !== 'PLAYING' && player.status !== 'WAITING';

    return (
        <div
            className={`relative flex flex-col gap-2 rounded-2xl px-3 py-3 backdrop-blur-md transition-all border ${isActiveTurn ? 'border-cyan-300/80 shadow-[0_0_28px_rgba(91,188,255,0.35)] -translate-y-1 bg-white/5' : 'border-white/10 bg-black/45'} ${player.status === 'FOLDED' || player.status === 'ELIMINATED' ? 'opacity-40 grayscale' : ''}`}
        >

            {/* SNIPED BADGE */}
            {player.snipedTarget && (
                <div className="absolute -top-4 px-2 py-0.5 bg-rose-500/80 text-[10px] text-white font-bold rounded-full border border-rose-200/40 z-20 shadow-md uppercase tracking-[0.18em]">
                    저격: {player.snipedTarget}
                </div>
            )}

            <div className="flex items-center gap-2">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center border ${isActiveTurn ? 'border-cyan-300/80 bg-cyan-400/10' : 'border-white/15 bg-white/5'} shadow-[0_0_16px_rgba(140,120,255,0.25)]`}>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-100/90" fill="currentColor" aria-hidden="true">
                        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5Z" />
                    </svg>
                </div>
                <div className="flex flex-col leading-tight">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-indigo-200/70">Player</span>
                    <span className="text-sm font-semibold text-white">{player.name}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-full border border-indigo-400/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-300"></div>
                    <span className="text-xs font-semibold text-cyan-200">{player.chips}</span>
                </div>
                {statusBadge ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/80 uppercase tracking-[0.2em]">
                        {player.status}
                    </span>
                ) : player.betAmount > 0 ? (
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-bold text-white bg-cyan-500/80 uppercase tracking-[0.18em]">
                        BET {player.betAmount}
                    </span>
                ) : null}
            </div>

            <div className="flex gap-[-10px]">
                {player.hand.map((c, i) => (
                    <div key={i} className={`${i > 0 ? '-ml-6' : ''} z-0`}>
                        <CardView card={c} hidden={!showCards && player.status !== 'FOLDED' && player.status !== 'ELIMINATED'} size="sm" />
                    </div>
                ))}
            </div>
        </div>
    );
}
