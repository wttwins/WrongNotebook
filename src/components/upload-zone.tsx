"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UploadZoneProps {
    onAnalyze: (base64: string) => void;
    isAnalyzing?: boolean;
}

export function UploadZone({ onAnalyze, isAnalyzing = false }: UploadZoneProps) {
    const { t } = useLanguage();

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result as string;
                    onAnalyze(base64);
                };
                reader.readAsDataURL(file);
            }
        },
        [onAnalyze]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png"],
        },
        maxFiles: 1,
        disabled: isAnalyzing,
    });

    return (
        <Card
            {...getRootProps()}
            className={`border-2 border-dashed cursor-pointer transition-colors hover:border-primary/50 ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                }`}
        >
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4 text-center min-h-[300px]">
                <input {...getInputProps()} />
                <div className="p-4 bg-muted rounded-full">
                    {isAnalyzing ? (
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    ) : (
                        <UploadCloud className="h-10 w-10 text-muted-foreground" />
                    )}
                </div>
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg">
                        {isAnalyzing ? t.upload.analyzing : t.upload.analyze}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {isAnalyzing ? t.upload.analyzing : t.upload.dragDrop}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        {t.upload.support}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
