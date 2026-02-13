import React, { useState } from 'react';
import { X, Send, Mail, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '../lib/utils';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
    const [fromEmail, setFromEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const body = `From: ${fromEmail}\n\nMessage:\n${message}`;
        const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=arijit.kora.in@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        window.open(gmailLink, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

                <div className="p-8 space-y-8">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tighter text-foreground flex items-center gap-2">
                                <MessageSquare className="w-6 h-6 text-blue-600" />
                                Send Feedback
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground opacity-70">
                                Help us improve Banker's Daily
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-accent rounded-xl transition-colors text-muted-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-foreground opacity-70">Your Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                                <Input
                                    type="email"
                                    required
                                    placeholder="your@email.com"
                                    value={fromEmail}
                                    onChange={(e) => setFromEmail(e.target.value)}
                                    className="h-12 bg-accent/30 border-none pl-12 focus-visible:ring-blue-600 font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-foreground opacity-70">Subject</Label>
                            <Input
                                type="text"
                                required
                                placeholder="What is this regarding?"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="h-12 bg-accent/30 border-none focus-visible:ring-blue-600 font-bold"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-foreground opacity-70">Message / Comments</Label>
                            <textarea
                                required
                                rows={4}
                                placeholder="Your detailed feedback..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className={cn(
                                    "flex min-h-[120px] w-full rounded-xl border-none bg-accent/30 px-4 py-3 text-sm ring-offset-background transition-all",
                                    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50",
                                    "font-bold resize-none"
                                )}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest gap-2 shadow-lg shadow-blue-600/20"
                        >
                            <Send className="w-4 h-4" />
                            Send Feedback
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};
