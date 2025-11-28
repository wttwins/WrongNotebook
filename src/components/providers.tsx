"use client";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <LanguageProvider>
                {children}
            </LanguageProvider>
        </SessionProvider>
    );
}
