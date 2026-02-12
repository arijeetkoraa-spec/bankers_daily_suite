import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from './ui/button';

export const WhatsAppShare: React.FC = () => {
    const shareToWhatsApp = () => {
        const text = `Check out this awesome Premature Withdrawal Calculator for FD/RD/MIS/QIS (Indian banks) – made by Arijit Kora! Link: ${encodeURIComponent(window.location.href)} Calculate your early closure interest easily!`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${text}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <Button
            onClick={shareToWhatsApp}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#128C7E] shadow-2xl z-50 p-0 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border-none"
            aria-label="Share on WhatsApp"
        >
            <MessageCircle className="w-8 h-8 text-white fill-white" />
        </Button>
    );
};
