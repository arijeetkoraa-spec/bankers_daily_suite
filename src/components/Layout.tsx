import React from 'react';
import {
    PiggyBank,
    Landmark,
    Briefcase,
    Calculator,
    Menu,
    ChevronRight,
    Mail,
    MessageCircle,
    Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { FeedbackModal } from './FeedbackModal';
import { AboutModal } from './AboutModal';
import { Info } from 'lucide-react';
import { buildWhatsappMessage, type ShareField } from '../lib/whatsapp-share';
import { BRAND } from '../config/brand';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SidebarItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    items?: { id: string; label: string }[];
}

interface LayoutProps {
    children: React.ReactNode;
    activeModule: string;
    activeCalculator: string;
    onNavigate: (moduleId: string, calculatorId: string) => void;
}

export const modules: SidebarItem[] = [
    {
        id: 'deposits',
        label: 'Deposits & Savings',
        icon: <PiggyBank className="w-5 h-5" />,
        items: [
            { id: 'fd', label: 'FD Calculator' },
            { id: 'rd', label: 'RD Calculator' },
            { id: 'mis', label: 'MIS (Discounted)' },
            { id: 'qis', label: 'QIS (Simple)' },
        ]
    },
    {
        id: 'loans',
        label: 'Loans & EMI',
        icon: <Landmark className="w-5 h-5" />,
        items: [
            { id: 'emi', label: 'EMI Calculator' },
            { id: 'gold', label: 'Gold Loan' },
            { id: 'kcc', label: 'KCC Limit' },
            { id: 'reverse', label: 'Reverse Calculator' },
            { id: 'loan-compare', label: 'Loan Compare' },
            { id: 'takeover', label: 'Takeover Benefit' },
        ]
    },
    {
        id: 'msme',
        label: 'MSME & Credit',
        icon: <Briefcase className="w-5 h-5" />,
        items: [
            { id: 'working-capital', label: 'Working Capital' },
            { id: 'drawing-power', label: 'Drawing Power' },
            { id: 'ratios', label: 'Financial Ratios' },
            { id: 'fees', label: 'CGTMSE Fees' },
        ]
    },
    {
        id: 'utilities',
        label: 'Utilities',
        icon: <Calculator className="w-5 h-5" />,
        items: [
            { id: 'cash-counter', label: 'Cash Counter' },
            { id: 'gst', label: 'GST Calculator' },
            { id: 'date', label: 'Date Calculator' },
            { id: 'converter', label: 'Unit Converter' },
        ]
    },
    {
        id: 'specialized',
        label: 'Specialized Tools',
        icon: <Users className="w-5 h-5" />,
        items: [
            { id: 'shg', label: 'SHG Management' },
        ]
    }
];

export const Layout: React.FC<LayoutProps> = ({
    children,
    activeModule,
    activeCalculator,
    onNavigate
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
    const [isAboutOpen, setIsAboutOpen] = React.useState(false);
    const [theme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

    const isDark = theme === 'dark';

    const getCalcColor = (id: string, isMobile: boolean = false) => {
        switch (id) {
            case 'fd':
            case 'date':
                return isMobile ? 'bg-blue-600' : 'from-blue-600 to-blue-700 shadow-blue-500/40';
            case 'rd':
            case 'ratios':
                return isMobile ? 'bg-emerald-600' : 'from-emerald-600 to-emerald-700 shadow-emerald-500/40';
            case 'mis':
            case 'fees':
                return isMobile ? 'bg-purple-600' : 'from-purple-600 to-purple-700 shadow-purple-500/40';
            case 'shg':
                return isMobile ? 'bg-primary' : 'from-primary to-primary/80 shadow-primary/40';
            case 'qis':
                return isMobile ? 'bg-orange-600' : 'from-orange-600 to-orange-700 shadow-orange-500/40';
            case 'emi':
            case 'loan-compare':
            case 'takeover':
                return isMobile ? 'bg-indigo-600' : 'from-indigo-600 to-indigo-700 shadow-indigo-500/40';
            case 'reverse':
            case 'converter':
                return isMobile ? 'bg-cyan-600' : 'from-cyan-600 to-cyan-700 shadow-cyan-500/40';
            case 'gst':
                return isMobile ? 'bg-slate-700' : 'from-slate-700 to-slate-800 shadow-slate-600/40';
            case 'working-capital':
            case 'drawing-power':
            case 'kcc':
            case 'gold':
                return isMobile ? 'bg-amber-600' : 'from-amber-600 to-amber-700 shadow-amber-500/40';
            case 'cash-counter':
                return isMobile ? 'bg-emerald-600' : 'from-emerald-600 to-emerald-700 shadow-emerald-500/40';
            default:
                return isMobile ? 'bg-primary' : 'from-primary to-indigo-600 shadow-primary/40';
        }
    };

    const handleWhatsAppShare = () => {
        const rows = document.querySelectorAll('.share-row');
        const fields: ShareField[] = [];

        rows.forEach(row => {
            if ((row as HTMLElement).offsetParent === null) return;

            const labelEl = row.querySelector('.share-label');
            const valueEl = row.querySelector('.share-value');
            const key = (row as HTMLElement).getAttribute('data-share-key') || '';
            const type = (row as HTMLElement).getAttribute('data-share-type') as 'input' | 'option' | 'result' || 'result';

            if (labelEl && valueEl) {
                const label = labelEl.textContent?.trim().replace(/:$/, '') || '';
                let value = '';

                if (valueEl.tagName === 'INPUT' || valueEl.tagName === 'SELECT') {
                    value = (valueEl as HTMLInputElement).value;
                } else {
                    value = valueEl.textContent?.trim() || '';
                }

                if (label && value) {
                    fields.push({ key, label, value, type });
                }
            }
        });

        if (fields.length === 0) {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this Calculator on ${BRAND.name} Suite!`)}`, '_blank');
        } else {
            const message = buildWhatsappMessage(activeCalculator, fields);
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://api.whatsapp.com/send?text=${encodedMessage}`, '_blank');
        }
    };

    const handleNavigate = (moduleId: string, calcId: string) => {
        onNavigate(moduleId, calcId);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden flex-col md:flex-row antialiased">
            <aside
                className={cn(
                    "bg-card/50 backdrop-blur-2xl border-r border-border/50 transition-all duration-500 ease-in-out flex flex-col fixed md:relative z-30 h-full",
                    isSidebarOpen ? "w-64 translate-x-0 shadow-2xl" : "w-0 -translate-x-full md:w-64 md:translate-x-0 overflow-hidden"
                )}
            >
                <div className="p-6 border-b border-border/50 bg-background/40 flex flex-col items-center text-center">
                    <img
                        src={BRAND.logoIcon}
                        alt={BRAND.name}
                        className="w-16 h-16 mb-2 object-contain rounded-full ring-2 ring-primary/20 bg-background shadow-sm"
                    />
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black tracking-tighter leading-none text-primary uppercase">
                            {BRAND.name.split(' ')[0]}
                        </h1>
                        <span className="text-[10px] font-black tracking-[0.3em] text-muted-foreground leading-none mt-1 uppercase">
                            {BRAND.name.split(' ')[1]} SUITE
                        </span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-6">
                    <ul className="space-y-6 px-4">
                        {modules.map((module) => (
                            <li key={module.id} className="space-y-3">
                                <div className="px-3 py-1 text-[11px] uppercase font-display font-black tracking-widest text-foreground/70 flex items-center gap-2">
                                    {module.label}
                                </div>
                                {module.items && (
                                    <ul className="space-y-1.5">
                                        {module.items.map((item) => (
                                            <li key={item.id}>
                                                <button
                                                    onClick={() => handleNavigate(module.id, item.id)}
                                                    className={cn(
                                                        "w-full text-left px-5 py-3.5 text-[15px] rounded-2xl transition-all duration-400 flex items-center justify-between group",
                                                        activeModule === module.id && activeCalculator === item.id
                                                            ? cn("bg-gradient-to-r text-primary-foreground scale-[1.03] font-bold z-10 shadow-2xl", getCalcColor(item.id))
                                                            : "text-foreground/80 hover:bg-primary/10 hover:text-primary font-semibold"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3.5">
                                                        <span className={cn(
                                                            "transition-all duration-400",
                                                            activeModule === module.id && activeCalculator === item.id ? "text-primary-foreground scale-125" : "text-muted-foreground group-hover:text-primary scale-110"
                                                        )}>
                                                            {React.isValidElement(module.icon) && React.cloneElement(module.icon as React.ReactElement<any>, { className: "w-5 h-5" })}
                                                        </span>
                                                        <span className="font-sans leading-none">{item.label}</span>
                                                    </div>
                                                    <ChevronRight className={cn(
                                                        "w-4 h-4 transition-all duration-400",
                                                        activeModule === module.id && activeCalculator === item.id ? "rotate-90 scale-110 opacity-100" : "opacity-0 group-hover:opacity-100 translate-x-1"
                                                    )} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-6 border-t border-border/50 bg-background/20">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Fintech Solution By</span>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-sm font-black text-primary tracking-tight uppercase italic">
                                Arijit Kora
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="bg-background/80 backdrop-blur-xl border-b border-border/10 p-2 md:px-8 flex items-center justify-between shadow-sm z-10 sticky top-0 h-16">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="md:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                        <div className="hidden md:flex items-center gap-3 mr-4 border-r border-border/50 pr-6">
                            <img
                                src={isDark ? BRAND.logoDark : BRAND.logoLight}
                                alt={BRAND.name}
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] uppercase font-display font-black tracking-widest text-primary/70">
                                {modules.find(m => m.id === activeModule)?.label || 'Dashboard'}
                            </span>
                            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 text-foreground">
                                {modules.find(m => m.id === activeModule)?.items?.find(i => i.id === activeCalculator)?.label || 'Suite'}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <img
                            src={BRAND.logoIcon}
                            alt={BRAND.name}
                            className="h-8 w-8 md:hidden object-contain rounded-full ring-1 ring-primary/10 mr-2"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsAboutOpen(true)}
                            className="h-9 w-9 rounded-xl border border-border/50 bg-card/60 hover:bg-accent/50 md:hidden"
                        >
                            <Info className="w-4 h-4 text-primary" />
                        </Button>
                        <ThemeToggle />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background flex flex-col pb-6 relative">
                    <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col justify-center">
                        <div className="animate-in-up w-full">
                            {children}
                        </div>
                    </div>

                    <footer className="mt-8 pt-6 border-t border-border/10 max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden p-1 shadow-inner">
                                <img src={BRAND.logoIcon} alt="" className="w-full h-full object-contain rounded-full" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">Architect & Developer</span>
                                <button
                                    onClick={() => setIsAboutOpen(true)}
                                    className="text-4xl font-black text-primary tracking-tighter italic hover:opacity-80 transition bg-transparent text-left"
                                >
                                    ARIJIT KORA
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleWhatsAppShare}
                                variant="outline"
                                size="sm"
                                className="h-9 px-4 rounded-xl gap-2 border-green-500/20 hover:bg-green-500/5 text-green-600 font-bold"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Share
                            </Button>
                            <Button
                                onClick={() => setIsFeedbackOpen(true)}
                                variant="outline"
                                size="sm"
                                className="h-9 px-4 rounded-xl gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold"
                            >
                                <Mail className="w-4 h-4" />
                                Feedback
                            </Button>
                        </div>
                    </footer>
                </div>
            </main>

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
            />

            <AboutModal
                open={isAboutOpen}
                onClose={() => setIsAboutOpen(false)}
            />
        </div>
    );
};
