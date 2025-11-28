"use client";

import { useState } from "react";
import { ParsedQuestion } from "@/lib/gemini";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CorrectionEditorProps {
    initialData: ParsedQuestion;
    onSave: (data: ParsedQuestion) => void;
    onCancel: () => void;
    imagePreview?: string | null;
}

export function CorrectionEditor({ initialData, onSave, onCancel, imagePreview }: CorrectionEditorProps) {
    const [data, setData] = useState<ParsedQuestion>(initialData);
    const [newTag, setNewTag] = useState("");
    const { t } = useLanguage();

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && newTag.trim()) {
            e.preventDefault();
            if (!data.knowledgePoints.includes(newTag.trim())) {
                setData({
                    ...data,
                    knowledgePoints: [...data.knowledgePoints, newTag.trim()],
                });
            }
            setNewTag("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setData({
            ...data,
            knowledgePoints: data.knowledgePoints.filter((tag) => tag !== tagToRemove),
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{t.editor.title}</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        {t.editor.cancel}
                    </Button>
                    <Button onClick={() => onSave(data)}>
                        <Save className="mr-2 h-4 w-4" />
                        {t.editor.save}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                    {imagePreview && (
                        <Card>
                            <CardContent className="p-4">
                                <img src={imagePreview} alt="Original" className="w-full rounded-md" />
                            </CardContent>
                        </Card>
                    )}
                    <div className="space-y-2">
                        <Label>{t.editor.question}</Label>
                        <Textarea
                            value={data.questionText}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData({ ...data, questionText: e.target.value })}
                            className="min-h-[150px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t.editor.answer}</Label>
                        <Textarea
                            value={data.answerText}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData({ ...data, answerText: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>{t.editor.analysis}</Label>
                        <Textarea
                            value={data.analysis}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData({ ...data, analysis: e.target.value })}
                            className="min-h-[200px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>{t.editor.tags}</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {data.knowledgePoints.map((tag) => (
                                <Badge key={tag} variant="secondary" className="px-2 py-1">
                                    {tag}
                                    <button
                                        onClick={() => removeTag(tag)}
                                        className="ml-2 hover:text-destructive"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={newTag}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder={t.editor.addTag}
                            />
                            <Button size="icon" variant="ghost" onClick={() => {
                                if (newTag.trim()) {
                                    if (!data.knowledgePoints.includes(newTag.trim())) {
                                        setData({
                                            ...data,
                                            knowledgePoints: [...data.knowledgePoints, newTag.trim()],
                                        });
                                    }
                                    setNewTag("");
                                }
                            }}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
