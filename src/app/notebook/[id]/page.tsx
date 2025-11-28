"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

interface ErrorItemDetail {
    id: string;
    questionText: string;
    answerText: string;
    analysis: string;
    knowledgePoints: string;
    masteryLevel: number;
    originalImageUrl: string;
}

export default function ErrorDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [item, setItem] = useState<ErrorItemDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchItem(params.id as string);
        }
    }, [params.id]);

    const fetchItem = async (id: string) => {
        try {
            const res = await fetch(`/api/error-items/${id}`);
            if (res.ok) {
                const data = await res.json();
                setItem(data);
            } else {
                alert("Failed to load item");
                router.push("/notebook");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMastery = async () => {
        if (!item) return;

        const newLevel = item.masteryLevel > 0 ? 0 : 1;
        // TODO: Implement API to update mastery
        // For now, optimistic update
        setItem({ ...item, masteryLevel: newLevel });
        alert("Mastery status updated (Mock)");
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!item) return <div className="p-8 text-center">Item not found</div>;

    let tags: string[] = [];
    try {
        tags = JSON.parse(item.knowledgePoints);
    } catch (e) {
        tags = [];
    }

    return (
        <main className="min-h-screen p-8 bg-background">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/notebook">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Error Detail</h1>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Left Column: Question & Image */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Question</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                                    {item.questionText}
                                </div>
                                {item.originalImageUrl && item.originalImageUrl !== "placeholder-image-url" && (
                                    <img
                                        src={item.originalImageUrl}
                                        alt="Original Problem"
                                        className="w-full rounded-lg"
                                    />
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <Badge key={tag} variant="secondary">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Your Answer / Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground italic">
                                    No notes added yet.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Analysis & Answer */}
                    <div className="space-y-6">
                        <Card className="border-primary/20">
                            <CardHeader>
                                <CardTitle className="text-primary">Correct Answer</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="font-medium text-lg">{item.answerText}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="whitespace-pre-wrap text-muted-foreground">
                                    {item.analysis}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-3">
                            <Link href={`/practice?id=${item.id}`}>
                                <Button variant="secondary" size="lg">
                                    <RefreshCw className="mr-2 h-5 w-5" />
                                    Practice Similar
                                </Button>
                            </Link>
                            <Button
                                size="lg"
                                variant={item.masteryLevel > 0 ? "outline" : "default"}
                                className={item.masteryLevel > 0 ? "text-green-600 border-green-600" : ""}
                                onClick={toggleMastery}
                            >
                                {item.masteryLevel > 0 ? (
                                    <>
                                        <CheckCircle className="mr-2 h-5 w-5" />
                                        Mastered
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="mr-2 h-5 w-5" />
                                        Mark as Mastered
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
