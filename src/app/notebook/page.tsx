"use client";

import { ErrorList } from "@/components/error-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotebookPage() {
    const { t } = useLanguage();

    return (
        <main className="min-h-screen p-8 bg-background">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">{t.notebook.title}</h1>
                        <p className="text-muted-foreground">
                            {t.notebook.subtitle}
                        </p>
                    </div>
                    <Link href="/">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {t.notebook.addNew}
                        </Button>
                    </Link>
                </div>

                <ErrorList />
            </div>
        </main>
    );
}
