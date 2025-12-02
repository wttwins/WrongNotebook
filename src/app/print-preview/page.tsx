"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { format } from "date-fns";
import Image from "next/image";

interface ErrorItem {
    id: string;
    questionText: string;
    answerText: string;
    analysis: string;
    knowledgePoints: string;
    originalImageUrl: string;
    createdAt: string;
    gradeSemester?: string;
    paperLevel?: string;
    subject?: {
        name: string;
    };
}

function PrintPreviewContent() {
    const searchParams = useSearchParams();
    const [items, setItems] = useState<ErrorItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAnswers, setShowAnswers] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [showTags, setShowTags] = useState(false);
    const [imageScale, setImageScale] = useState(70);

    useEffect(() => {
        fetchItems();
    }, []);
    const fetchItems = async () => {
        try {
            const params = new URLSearchParams(searchParams.toString());
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

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">加载中...</p>
            </div>
        );
    }

    return (
        <>
            {/* Print Controls - Hidden when printing */}
            <div className="print:hidden sticky top-0 z-10 bg-background border-b p-4 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <h1 className="text-xl font-bold">打印预览 ({items.length} 道题)</h1>
                    <div className="flex items-center gap-4">
                        {/* Image Scale Control */}
                        <div className="flex items-center gap-2 text-sm border-r pr-4 mr-2">
                            <span>图片比例: {imageScale}%</span>
                            <input
                                type="range"
                                min="30"
                                max="100"
                                value={imageScale}
                                onChange={(e) => setImageScale(Number(e.target.value))}
                                className="w-24"
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={showAnswers}
                                onChange={(e) => setShowAnswers(e.target.checked)}
                                className="rounded"
                            />
                            显示答案
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={showAnalysis}
                                onChange={(e) => setShowAnalysis(e.target.checked)}
                                className="rounded"
                            />
                            显示解析
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={showTags}
                                onChange={(e) => setShowTags(e.target.checked)}
                                className="rounded"
                            />
                            显示知识点
                        </label>
                        <Button onClick={handlePrint}>
                            打印 / 保存为 PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Print Content */}
            <div className="max-w-4xl mx-auto p-8 print:p-0">
                {items.map((item, index) => {
                    let tags: string[] = [];
                    try {
                        tags = JSON.parse(item.knowledgePoints || "[]");
                    } catch (e) {
                        tags = [];
                    }

                    return (
                        <div
                            key={item.id}
                            className="mb-8 pb-8 border-b last:border-b-0 print:break-inside-avoid"
                        >
                            {/* Question Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold">题目 {index + 1}</span>
                                    {item.subject && (
                                        <span className="text-sm text-muted-foreground">
                                            {item.subject.name}
                                        </span>
                                    )}
                                    {item.gradeSemester && (
                                        <span className="text-sm text-muted-foreground">
                                            {item.gradeSemester}
                                        </span>
                                    )}
                                    {item.paperLevel && (
                                        <span className="text-sm text-muted-foreground">
                                            试卷等级: {item.paperLevel.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Original Image */}
                            {item.originalImageUrl && (
                                <div className="mb-4">
                                    <img
                                        src={item.originalImageUrl}
                                        alt="题目图片"
                                        className="h-auto border rounded"
                                        style={{ maxWidth: `${imageScale}%` }}
                                    />
                                </div>
                            )}



                            {/* Knowledge Points */}
                            {showTags && tags.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="font-semibold mb-2">知识点：</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2 py-1 bg-muted rounded text-sm"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Answer */}
                            {showAnswers && item.answerText && (
                                <div className="mb-4">
                                    <h3 className="font-semibold mb-2">参考答案：</h3>
                                    <MarkdownRenderer content={item.answerText} />
                                </div>
                            )}

                            {/* Analysis */}
                            {showAnalysis && item.analysis && (
                                <div className="mb-4">
                                    <h3 className="font-semibold mb-2">解析：</h3>
                                    <MarkdownRenderer content={item.analysis} />
                                </div>
                            )}
                        </div>
                    );
                })}

                {items.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        没有符合条件的错题
                    </div>
                )}
            </div>
        </>
    );
}

export default function PrintPreviewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
            <PrintPreviewContent />
        </Suspense>
    );
}
