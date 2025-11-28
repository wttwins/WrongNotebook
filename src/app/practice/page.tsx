"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, CheckCircle, Eye } from "lucide-react";
import { ParsedQuestion } from "@/lib/gemini";

export default function PracticePage() {
    const searchParams = useSearchParams();
    const errorItemId = searchParams.get("id");

    const [question, setQuestion] = useState<ParsedQuestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);

    const generateQuestion = async () => {
        if (!errorItemId) return;

        setLoading(true);
        setShowAnswer(false);
        try {
            const res = await fetch("/api/practice/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ errorItemId }),
            });

            if (res.ok) {
                const data = await res.json();
                setQuestion(data);
            } else {
                alert("Failed to generate question");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!errorItemId) {
        return <div className="p-8 text-center">Invalid Request</div>;
    }

    return (
        <main className="min-h-screen p-8 bg-background">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold">Smart Practice</h1>
                    <p className="text-muted-foreground">
                        Generate a similar problem to test your understanding.
                    </p>

                    {!question && (
                        <Button size="lg" onClick={generateQuestion} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating AI Question...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Generate Practice Question
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {question && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-primary/50 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>Practice Problem</span>
                                    <Button variant="ghost" size="sm" onClick={generateQuestion} disabled={loading}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Regenerate
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg whitespace-pre-wrap font-medium">
                                    {question.questionText}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-center gap-4">
                            <Button
                                size="lg"
                                variant={showAnswer ? "outline" : "default"}
                                onClick={() => setShowAnswer(!showAnswer)}
                            >
                                {showAnswer ? (
                                    <>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Hide Answer
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Check Answer
                                    </>
                                )}
                            </Button>
                        </div>

                        {showAnswer && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle className="text-green-600">Correct Answer</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold">{question.answerText}</div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Detailed Analysis</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="whitespace-pre-wrap text-muted-foreground">
                                            {question.analysis}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
