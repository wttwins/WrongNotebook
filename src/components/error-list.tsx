"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface ErrorItem {
    id: string;
    questionText: string;
    knowledgePoints: string;
    masteryLevel: number;
    createdAt: string;
    subject?: {
        name: string;
    };
}

export function ErrorList() {
    const [items, setItems] = useState<ErrorItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const { t } = useLanguage();

    useEffect(() => {
        fetchItems();
    }, [search]);

    const fetchItems = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append("query", search);

            const res = await fetch(`/api/error-items/list?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t.notebook.search}
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    {t.notebook.filter}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                    let tags: string[] = [];
                    try {
                        tags = JSON.parse(item.knowledgePoints || "[]");
                    } catch (e) {
                        tags = [];
                    }
                    return (
                        <Link key={item.id} href={`/notebook/${item.id}`}>
                            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <Badge variant={item.masteryLevel > 0 ? "default" : "secondary"}>
                                            {item.masteryLevel > 0 ? (
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" /> {t.notebook.mastered}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {t.notebook.review}
                                                </span>
                                            )}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(item.createdAt), "MM/dd")}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="line-clamp-3 text-sm font-medium">
                                        {item.questionText}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {tags.slice(0, 3).map((tag: string) => (
                                            <Badge key={tag} variant="outline" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                        {tags.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{tags.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
