import { Card as CardType } from '@/types/game';

interface Props {
    card?: CardType;
    hidden?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function CardView({ card, hidden = false, size = 'md' }: Props) {
    const sizeClasses = {
        sm: "w-[32px] h-[46px] min-w-[32px] min-h-[46px] sm:w-[36px] sm:h-[50px] sm:min-w-[36px] sm:min-h-[50px] md:w-[40px] md:h-[56px] md:min-w-[40px] md:min-h-[56px]",
        md: "w-[44px] h-[62px] min-w-[44px] min-h-[62px] sm:w-[50px] sm:h-[70px] sm:min-w-[50px] sm:min-h-[70px] md:w-[58px] md:h-[82px] md:min-w-[58px] md:min-h-[82px]",
        lg: "w-[52px] h-[74px] min-w-[52px] min-h-[74px] sm:w-[60px] sm:h-[86px] sm:min-w-[60px] sm:min-h-[86px] md:w-[68px] md:h-[100px] md:min-w-[68px] md:min-h-[100px]",
    }[size];

    if (hidden || !card) {
        return (
            <div className={`${sizeClasses} rounded-[13px] outline-none border border-cyan-300/42 bg-gradient-to-br from-[#1A1B49] via-[#2E1F7A] to-[#211856] shadow-[0_0_10px_rgba(96,220,255,0.3)] flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-1 rounded-[11px] border border-cyan-300/30"></div>
                <div className="absolute inset-2 rounded-[9px] border border-indigo-300/28 bg-[linear-gradient(140deg,rgba(140,120,255,0.24),rgba(72,42,190,0.22))]"></div>
                <div className="absolute inset-3 rounded-[8px] bg-[radial-gradient(circle_at_24%_26%,rgba(168,126,255,0.42),transparent_58%)]"></div>
                <div className="absolute inset-0 opacity-50 bg-[linear-gradient(90deg,rgba(131,123,255,0.2)_1px,transparent_1px),linear-gradient(0deg,rgba(131,123,255,0.2)_1px,transparent_1px)] bg-[size:9px_9px]"></div>
                <div className="relative z-10 h-[18px] w-[18px] sm:h-5 sm:w-5 rounded-full border border-cyan-200/65 shadow-[0_0_8px_rgba(125,226,255,0.34)]">
                    <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-200/70"></span>
                    <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-cyan-200/70"></span>
                    <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/88"></span>
                </div>
            </div>
        );
    }

    const isRed = card.suit === 'HEART' || card.suit === 'DIAMOND';
    const suitSymbol = { SPADE: '♠', HEART: '♥', DIAMOND: '♦', CLUB: '♣' }[card.suit];

    return (
        <div className={`${sizeClasses} rounded-[14px] bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 border border-white/60 shadow-[0_10px_24px_rgba(10,10,30,0.25)] flex flex-col items-center py-1 sm:py-2 ${isRed ? 'text-rose-500' : 'text-slate-900'} relative overflow-hidden transform transition-transform`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.9),transparent_55%)] opacity-60"></div>
            <div className="absolute inset-0 border border-white/80 rounded-[14px]"></div>
            <span className="text-sm sm:text-lg md:text-xl font-black leading-none drop-shadow-sm z-10">{card.rank === 1 ? 'A' : card.rank}</span>
            <span className="text-xl sm:text-2xl md:text-4xl mt-0.5 drop-shadow-md z-10">{suitSymbol}</span>
            <span className="absolute bottom-0.5 sm:bottom-1 right-1 sm:right-2 text-[10px] sm:text-xs opacity-50 font-bold rotate-180 leading-none z-10">{card.rank === 1 ? 'A' : card.rank}</span>
        </div>
    );
}
