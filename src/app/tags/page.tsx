"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STANDARD_TAGS, MATH_CURRICULUM, MATH_TAG_INDEX } from "@/lib/knowledge-tags";
import { getCustomTags, addCustomTag, removeCustomTag, type CustomTagsData } from "@/lib/custom-tags";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TagStats {
    tag: string;
    count: number;
}

export default function TagsPage() {
    const { t, language } = useLanguage();
    const [stats, setStats] = useState<TagStats[]>([]);
    const [loading, setLoading] = useState(true);

    // 自定义标签状态
    const [customTags, setCustomTags] = useState<CustomTagsData>({ math: [], physics: [], chemistry: [], english: [], other: [] });
    const [newTagSubject, setNewTagSubject] = useState<keyof CustomTagsData>("math");
    const [newTagCategory, setNewTagCategory] = useState(() => {
        const mathCats = Object.keys(MATH_CURRICULUM);
        return mathCats.length > 0 ? mathCats[0] : "default";
    });
    const [newTagName, setNewTagName] = useState("");
    const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchStats();
        loadCustomTags();
    }, []);

    const loadCustomTags = () => {
        setCustomTags(getCustomTags());
    };

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/tags/stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch tag stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoriesForSubject = (subject: string) => {
        if (subject === 'math') {
            return Object.keys(MATH_CURRICULUM);
        }
        // For other subjects
        if (subject === 'other') return [];

        // @ts-ignore
        const subjectData = STANDARD_TAGS[subject];
        if (subjectData && typeof subjectData === 'object') {
            return Object.keys(subjectData);
        }
        return [];
    };

    const handleAddCustomTag = () => {
        if (!newTagName.trim()) {
            alert(t.tags?.custom?.enterName || "Please enter tag name");
            return;
        }

        const success = addCustomTag(newTagSubject, newTagName.trim(), newTagCategory);
        if (success) {
            setNewTagName("");
            loadCustomTags();
            alert(t.tags?.custom?.success || "Tag added successfully!");
        } else {
            alert(t.tags?.custom?.exists || "Tag already exists");
        }
    };

    const handleRemoveCustomTag = (subject: keyof CustomTagsData, tag: string) => {
        if (confirm((t.tags?.custom?.deleteConfirm || "Are you sure you want to delete tag \"{tag}\"?").replace("{tag}", tag))) {
            removeCustomTag(subject, tag);
            loadCustomTags();
        }
    };

    // 渲染标准标签库
    const renderStandardTags = () => {
        const toggleSubject = (subjectKey: string) => {
            setExpandedSubjects(prev => ({
                ...prev,
                [subjectKey]: !prev[subjectKey]
            }));
        };

        const toggleChapter = (chapterKey: string) => {
            setExpandedSubjects(prev => ({
                ...prev,
                [chapterKey]: !prev[chapterKey]
            }));
        };

        // 渲染数学学科(使用新的年级+章节结构)
        const renderMathSubject = () => {
            const isExpanded = expandedSubjects['math'];

            return (
                <Card key="math" className="mb-4">
                    <CardHeader
                        className="cursor-pointer hover:bg-muted/50 transition-colors flex flex-row items-center justify-between py-4"
                        onClick={() => toggleSubject('math')}
                    >
                        <CardTitle className="text-lg flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                            {t.tags?.subjects?.math || '数学'}
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">
                            {isExpanded ? (language === 'zh' ? '收起' : 'Collapse') : (language === 'zh' ? '展开' : 'Expand')}
                        </span>
                    </CardHeader>
                    {isExpanded && (
                        <CardContent className="space-y-4 pt-0">
                            {Object.entries(MATH_CURRICULUM).map(([gradeSemester, chapters]) => {
                                const gradeKey = `math-${gradeSemester}`;
                                const isGradeExpanded = expandedSubjects[gradeKey];

                                return (
                                    <div key={gradeSemester} className="border rounded-lg p-3">
                                        <div
                                            className="flex items-center justify-between cursor-pointer hover:bg-muted/30 -m-3 p-3 rounded-lg transition-colors"
                                            onClick={() => toggleChapter(gradeKey)}
                                        >
                                            <h3 className="font-semibold text-base flex items-center gap-2">
                                                {isGradeExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                {gradeSemester}
                                            </h3>
                                            <span className="text-xs text-muted-foreground">
                                                {chapters.length} {language === 'zh' ? '章' : 'chapters'}
                                            </span>
                                        </div>

                                        {isGradeExpanded && (
                                            <div className="mt-3 space-y-3">
                                                {chapters.map(({ chapter, sections }) => {
                                                    // 收集该章节的所有标签
                                                    const chapterTags: string[] = [];
                                                    sections.forEach(({ tags, subsections }) => {
                                                        if (tags) chapterTags.push(...tags);
                                                        subsections?.forEach(({ tags: subTags }) => {
                                                            chapterTags.push(...subTags);
                                                        });
                                                    });

                                                    return (
                                                        <div key={chapter} className="bg-muted/30 rounded-md p-3">
                                                            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                                                                {chapter} ({chapterTags.length})
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {chapterTags.map((tag) => {
                                                                    const stat = stats.find((s) => s.tag === tag);
                                                                    return (
                                                                        <Badge key={tag} variant="outline" className="cursor-default hover:bg-accent">
                                                                            {tag}
                                                                            {stat && <span className="ml-1 text-xs text-muted-foreground">({stat.count})</span>}
                                                                        </Badge>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    )}
                </Card>
            );
        };

        // 渲染其他学科(使用旧的分类结构)
        const renderOtherSubjects = () => {
            const { math, ...otherSubjects } = STANDARD_TAGS;

            return Object.entries(otherSubjects).map(([subjectKey, subjectData]) => {
                // @ts-ignore
                const subjectName = t.tags?.subjects?.[subjectKey] || subjectKey;
                const categories = Object.entries(subjectData);
                const isExpanded = expandedSubjects[subjectKey];

                return (
                    <Card key={subjectKey} className="mb-4">
                        <CardHeader
                            className="cursor-pointer hover:bg-muted/50 transition-colors flex flex-row items-center justify-between py-4"
                            onClick={() => toggleSubject(subjectKey)}
                        >
                            <CardTitle className="text-lg flex items-center gap-2">
                                {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                {subjectName}
                            </CardTitle>
                            <span className="text-sm text-muted-foreground">
                                {isExpanded ? (language === 'zh' ? '收起' : 'Collapse') : (language === 'zh' ? '展开' : 'Expand')}
                            </span>
                        </CardHeader>
                        {isExpanded && (
                            <CardContent className="space-y-4 pt-0">
                                {categories.map(([categoryKey, categoryData]) => {
                                    const tags: string[] = [];
                                    const extractTags = (data: any) => {
                                        if (Array.isArray(data)) tags.push(...data);
                                        else if (typeof data === 'object') Object.values(data).forEach(extractTags);
                                    };
                                    extractTags(categoryData);
                                    if (tags.length === 0) return null;
                                    // @ts-ignore
                                    const categoryName = t.tags?.categories?.[categoryKey] || categoryKey;
                                    return (
                                        <div key={categoryKey}>
                                            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{categoryName} ({tags.length})</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {tags.map((tag) => {
                                                    const stat = stats.find((s) => s.tag === tag);
                                                    return (
                                                        <Badge key={tag} variant="outline" className="cursor-default hover:bg-accent">
                                                            {tag}
                                                            {stat && <span className="ml-1 text-xs text-muted-foreground">({stat.count})</span>}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        )}
                    </Card>
                );
            });
        };

        return (
            <>
                {renderMathSubject()}
                {renderOtherSubjects()}
            </>
        );
    };

    // 渲染自定义标签
    const renderCustomTags = () => {
        const subjects = [
            { key: 'math' as const, name: t.tags?.subjects?.math || 'Math' },
            { key: 'english' as const, name: t.tags?.subjects?.english || 'English' },
            { key: 'physics' as const, name: t.tags?.subjects?.physics || 'Physics' },
            { key: 'chemistry' as const, name: t.tags?.subjects?.chemistry || 'Chemistry' },
            { key: 'other' as const, name: t.tags?.subjects?.other || 'Other' },
        ];

        const totalCount = customTags.math.length + customTags.physics.length + customTags.chemistry.length + customTags.english.length + customTags.other.length;

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>{t.tags?.custom?.addTitle || "Add Custom Tag"}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex gap-3 flex-wrap">
                            <Select value={newTagSubject} onValueChange={(v) => {
                                const subject = v as keyof CustomTagsData;
                                setNewTagSubject(subject);
                                const cats = getCategoriesForSubject(subject);
                                setNewTagCategory(cats.length > 0 ? cats[0] : "default");
                            }}>
                                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="math">{t.tags?.subjects?.math || "Math"}</SelectItem>
                                    <SelectItem value="english">{t.tags?.subjects?.english || "English"}</SelectItem>
                                    <SelectItem value="physics">{t.tags?.subjects?.physics || "Physics"}</SelectItem>
                                    <SelectItem value="chemistry">{t.tags?.subjects?.chemistry || "Chemistry"}</SelectItem>
                                    <SelectItem value="other">{t.tags?.subjects?.other || "Other"}</SelectItem>
                                </SelectContent>
                            </Select>

                            {getCategoriesForSubject(newTagSubject).length > 0 && (
                                <Select value={newTagCategory} onValueChange={setNewTagCategory}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getCategoriesForSubject(newTagSubject).map(cat => (
                                            // @ts-ignore
                                            <SelectItem key={cat} value={cat}>{t.tags?.categories?.[cat] || cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            <Input
                                placeholder={t.tags?.custom?.placeholder || "Enter tag name..."}
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                                className="flex-1 min-w-[200px]"
                            />
                            <Button onClick={handleAddCustomTag}>
                                <Plus className="h-4 w-4 mr-1" />
                                {t.tags?.custom?.add || "Add"}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {t.tags?.custom?.hint || "💡 Custom tags will automatically appear in tag suggestions"}
                        </p>
                    </CardContent>
                </Card>

                {totalCount === 0 ? (
                    <Card><CardContent className="py-12 text-center text-muted-foreground">
                        {t.tags?.custom?.empty || "No custom tags yet, click above to add!"}
                    </CardContent></Card>
                ) : (
                    subjects.map(({ key, name }) => {
                        if (customTags[key].length === 0) return null;
                        return (
                            <Card key={key}>
                                <CardHeader><CardTitle className="text-lg">{name} ({customTags[key].length})</CardTitle></CardHeader>
                                <CardContent>
                                    {/* Group by category */}
                                    {(() => {
                                        const tags = customTags[key];
                                        const grouped: Record<string, typeof tags> = {};
                                        tags.forEach(tag => {
                                            const cat = tag.category || 'default';
                                            if (!grouped[cat]) grouped[cat] = [];
                                            grouped[cat].push(tag);
                                        });

                                        return (
                                            <div className="space-y-4">
                                                {Object.entries(grouped).map(([category, categoryTags]) => (
                                                    <div key={category}>
                                                        {category !== 'default' && (
                                                            // @ts-ignore
                                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">{t.tags?.categories?.[category] || category}</h4>
                                                        )}
                                                        {category === 'default' && categoryTags.length > 0 && Object.keys(grouped).length > 1 && (
                                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">{t.common?.default || "Default"}</h4>
                                                        )}
                                                        <div className="flex flex-wrap gap-2">
                                                            {categoryTags.map((tagObj) => (
                                                                <Badge key={tagObj.name} variant="secondary" className="px-3 py-1.5 text-sm">
                                                                    {tagObj.name}
                                                                    <button onClick={() => handleRemoveCustomTag(key, tagObj.name)} className="ml-2 hover:text-destructive transition-colors" title={t.common?.delete || "Delete"}>
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </button>
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        );
    };

    const renderStats = () => {
        if (loading) return <div className="text-center py-8">{t.tags?.stats?.loading || "Loading..."}</div>;
        if (stats.length === 0) return <div className="text-center py-8 text-muted-foreground">{t.tags?.stats?.empty || "No tag usage records yet"}</div>;
        const maxCount = stats[0]?.count || 1;
        return (
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />{t.tags?.stats?.frequency || "Tag Usage Frequency (Top 20)"}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {stats.slice(0, 20).map((stat) => {
                        const percentage = (stat.count / maxCount) * 100;
                        return (
                            <div key={stat.tag} className="space-y-1">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">{stat.tag}</span>
                                    <span className="text-muted-foreground">{stat.count} {t.tags?.stats?.count || "times"}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">{t.tags?.title || "Tag Management"}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t.tags?.subtitle || "View and manage knowledge point tags"}
                    </p>
                </div>
            </div>

            <Tabs defaultValue="standard" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="standard">{t.tags?.tabs?.standard || "Standard Tags"}</TabsTrigger>
                    <TabsTrigger value="custom">{t.tags?.tabs?.custom || "Custom Tags"}</TabsTrigger>
                    <TabsTrigger value="stats">{t.tags?.tabs?.stats || "Usage Statistics"}</TabsTrigger>
                </TabsList>

                <TabsContent value="standard" className="space-y-4">{renderStandardTags()}</TabsContent>
                <TabsContent value="custom">{renderCustomTags()}</TabsContent>
                <TabsContent value="stats">{renderStats()}</TabsContent>
            </Tabs>
        </div>
    );
}
