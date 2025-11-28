"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'zh' : 'en');
    };

    return (
        <Button variant="ghost" size="icon" onClick={toggleLanguage} title="Switch Language">
            <Languages className="h-5 w-5" />
            <span className="sr-only">Switch Language</span>
            <span className="ml-2 text-xs font-bold">{language.toUpperCase()}</span>
        </Button>
    );
}
