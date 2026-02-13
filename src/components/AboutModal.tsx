import React from 'react';
import { X, Info } from 'lucide-react';
import { Button } from './ui/button';

interface AboutModalProps {
    open: boolean;
    onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ open, onClose }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-[420px] bg-card border border-border/40 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tighter text-foreground flex items-center gap-2">
                                <Info className="w-6 h-6 text-primary" />
                                About Me
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-accent rounded-xl transition-colors text-muted-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4 text-sm leading-relaxed text-foreground">
                        <p>
                            I’m Arijit Kora, a banking professional and technology builder with a strong focus on practical financial tools. As an Assistant Manager in a regional rural bank in West Bengal, I work closely with real-world credit assessment, MSME financing, and day-to-day banking operations. Alongside my banking career, I am actively transitioning into the tech space by designing and building intelligent web applications that simplify complex financial calculations.
                        </p>
                        <p>
                            Banker’s Daily Suite was created from my own field experience — turning manual banking processes into structured, modern digital tools powered by thoughtful design and AI-assisted development. My goal is to bridge traditional banking expertise with modern technology, creating solutions that are simple, reliable, and genuinely useful for professionals.
                        </p>
                    </div>

                    <Button
                        onClick={onClose}
                        className="w-full h-10 rounded-xl bg-accent/40 hover:bg-accent/70 text-foreground font-semibold border-none"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};
