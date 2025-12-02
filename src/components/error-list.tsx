"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, CheckCircle, Clock, ChevronDown, Printer } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MarkdownRenderer } from "@/components/markdown-renderer";

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

interface ErrorListProps {
    subjectId?: string;
}

export function ErrorList({ subjectId }: ErrorListProps = {}) {
    const [items, setItems] = useState<ErrorItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [masteryFilter, setMasteryFilter] = useState<"all" | "mastered" | "unmastered">("all");
    const [timeFilter, setTimeFilter] = useState<"all" | "week" | "month">("all");
    const [gradeFilter, setGradeFilter] = useState("");
    const [paperLevelFilter, setPaperLevelFilter] = useState<"all" | "a" | "b" | "other">("all");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
    const { t } = useLanguage();
    const router = useRouter();

    const handleExportPrint = () => {
        const params = new URLSearchParams();
        if (subjectId) params.append("subjectId", subjectId);
        if (search) params.append("query", search);
        if (masteryFilter !== "all") {
            params.append("mastery", masteryFilter === "mastered" ? "1" : "0");
        }
        if (timeFilter !== "all") {
            params.append("timeRange", timeFilter);
        }
        if (selectedTag) {
            params.append("tag", selectedTag);
        }
        if (gradeFilter) params.append("gradeSemester", gradeFilter);
        if (paperLevelFilter !== "all") params.append("paperLevel", paperLevelFilter);

        router.push(`/print-preview?${params.toString()}`);
    };

    const handleTagClick = (tag: string) => {
        setSelectedTag(selectedTag === tag ? null : tag);
    };

    const toggleTagsExpanded = (itemId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedTags(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    useEffect(() => {
        fetchItems();
    }, [search, masteryFilter, timeFilter, selectedTag, subjectId, gradeFilter, paperLevelFilter]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (subjectId) params.append("subjectId", subjectId);
            if (search) params.append("query", search);
            if (masteryFilter !== "all") {
                params.append("mastery", masteryFilter === "mastered" ? "1" : "0");
            }
            if (timeFilter !== "all") {
                params.append("timeRange", timeFilter);
            }
            if (selectedTag) {
                params.append("tag", selectedTag);
            }
            if (gradeFilter) params.append("gradeSemester", gradeFilter);
            if (paperLevelFilter !== "all") params.append("paperLevel", paperLevelFilter);

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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            {t.notebook.filter}
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>{t.filter.masteryStatus || "Mastery Status"}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setMasteryFilter("all")}>
                            {masteryFilter === "all" && "✓ "}{t.filter.all || "All"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setMasteryFilter("unmastered")}>
                            {masteryFilter === "unmastered" && "✓ "}{t.filter.review || "To Review"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setMasteryFilter("mastered")}>
                            {masteryFilter === "mastered" && "✓ "}{t.filter.mastered || "Mastered"}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuLabel>{t.filter.timeRange || "Time Range"}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setTimeFilter("all")}>
                            {timeFilter === "all" && "✓ "}{t.filter.allTime || "All Time"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTimeFilter("week")}>
                            {timeFilter === "week" && "✓ "}{t.filter.lastWeek || "Last Week"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTimeFilter("month")}>
                            {timeFilter === "month" && "✓ "}{t.filter.lastMonth || "Last Month"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" onClick={handleExportPrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    {t.notebook?.exportPrint || "导出打印"}
                </Button>
            </div>

            {/* Advanced Filters Row */}
            <div className="flex gap-4 items-center">
                <div className="w-48">
                    <Input
                        placeholder={t.filter.grade || "Grade/Semester"}
                        value={gradeFilter}
                        onChange={(e) => setGradeFilter(e.target.value)}
                        className="h-9"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={paperLevelFilter === "all" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setPaperLevelFilter("all")}
                    >
                        {t.filter.all || "All"}
                    </Button>
                    <Button
                        variant={paperLevelFilter === "a" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setPaperLevelFilter("a")}
                    >
                        {t.editor.paperLevels?.a || "Paper A"}
                    </Button>
                    <Button
                        variant={paperLevelFilter === "b" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setPaperLevelFilter("b")}
                    >
                        {t.editor.paperLevels?.b || "Paper B"}
                    </Button>
                    <Button
                        variant={paperLevelFilter === "other" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setPaperLevelFilter("other")}
                    >
                        {t.editor.paperLevels?.other || "Other"}
                    </Button>
                </div>
            </div>

            {selectedTag && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">
                        {t.filter.filteringByTag || "Filtering by tag"}:
                    </span>
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedTag(null)}>
                        {selectedTag}
                        <span className="ml-1 text-xs">×</span>
                    </Badge>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                    let tags: string[] = [];
                    try {
                        tags = JSON.parse(item.knowledgePoints || "[]");
                    } catch (e) {
                        tags = [];
                    }
                    return (
                        <Link key={item.id} href={`/error-items/${item.id}`}>
                            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <Badge
                                            variant={item.masteryLevel > 0 ? "default" : "secondary"}
                                            className={item.masteryLevel > 0 ? "bg-green-600 hover:bg-green-700" : ""}
                                        >
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
                                <CardContent>
                                    <MarkdownRenderer
                                        content={item.questionText.length > 150
                                            ? item.questionText.substring(0, 150) + "..."
                                            : item.questionText
                                        }
                                        className="text-sm"
                                    />
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {(expandedTags.has(item.id) ? tags : tags.slice(0, 3)).map((tag: string) => (
                                            <Badge
                                                key={tag}
                                                variant={selectedTag === tag ? "default" : "outline"}
                                                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleTagClick(tag);
                                                }}
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                        {tags.length > 3 && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                                                title={expandedTags.has(item.id)
                                                    ? (t.notebooks?.collapseTagsTooltip || "Click to collapse")
                                                    : (t.notebooks?.expandTagsTooltip || "Click to expand {count} tags").replace("{count}", (tags.length - 3).toString())}
                                                onClick={(e) => toggleTagsExpanded(item.id, e)}
                                            >
                                                {expandedTags.has(item.id) ? (
                                                    <>{t.notebooks?.collapseTags || "Collapse"}</>
                                                ) : (
                                                    <>{(t.notebooks?.expandTags || "+{count} more").replace("{count}", (tags.length - 3).toString())}</>
                                                )}
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
