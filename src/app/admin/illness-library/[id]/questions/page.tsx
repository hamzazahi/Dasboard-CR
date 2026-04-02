"use client";

import React, { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Plus,
    Trash2,
    GripVertical,
    Loader2,
    Save,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    orderBy,
    writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface Question {
    id: string;
    order: number;
    questionText: string;
    answers: string[];
    weights: Record<string, number>;
    isRequired: boolean;
}

interface IllnessData {
    displayName: string;
    category: string;
    specialist: string;
    isActive: boolean;
}

export default function QuestionsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: illnessId } = use(params);
    const router = useRouter();

    const [illness, setIllness] = useState<IllnessData | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Load illness data and questions
    useEffect(() => {
        async function load() {
            try {
                // Fetch illness metadata
                const illnessDoc = await getDoc(doc(db, "illness_library", illnessId));
                if (illnessDoc.exists()) {
                    const data = illnessDoc.data();
                    setIllness({
                        displayName: data.displayName || data.name || "Unnamed",
                        category: data.category || "Uncategorized",
                        specialist: data.specialist || "",
                        isActive: data.isActive ?? true,
                    });
                }

                // Fetch questions sub-collection
                const questionsSnap = await getDocs(
                    query(collection(db, "illness_library", illnessId, "questions"), orderBy("order", "asc"))
                );
                const questionsData = questionsSnap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Question[];
                setQuestions(questionsData);
            } catch (error) {
                console.error("Error loading questions:", error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [illnessId]);

    // Add a new blank question
    const handleAddQuestion = () => {
        const newOrder = questions.length + 1;
        const newQuestion: Question = {
            id: `new_${Date.now()}`,
            order: newOrder,
            questionText: "",
            answers: ["yes", "no", "not_sure"],
            weights: { yes: 1.0, no: 0.0, not_sure: 0.5 },
            isRequired: true,
        };
        setQuestions([...questions, newQuestion]);
    };

    // Update a question field
    const handleUpdateQuestion = (index: number, field: keyof Question, value: any) => {
        const updated = [...questions];
        (updated[index] as any)[field] = value;
        setQuestions(updated);
    };

    // Update a weight value
    const handleUpdateWeight = (index: number, answer: string, weight: number) => {
        const updated = [...questions];
        updated[index].weights = { ...updated[index].weights, [answer]: weight };
        setQuestions(updated);
    };

    // Remove a question
    const handleRemoveQuestion = (index: number) => {
        const updated = questions.filter((_, i) => i !== index);
        // Re-order
        updated.forEach((q, i) => (q.order = i + 1));
        setQuestions(updated);
    };

    // Move question up
    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const updated = [...questions];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        updated.forEach((q, i) => (q.order = i + 1));
        setQuestions(updated);
    };

    // Move question down
    const handleMoveDown = (index: number) => {
        if (index >= questions.length - 1) return;
        const updated = [...questions];
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
        updated.forEach((q, i) => (q.order = i + 1));
        setQuestions(updated);
    };

    // Save all questions to Firestore
    const handleSave = async () => {
        // Validate
        const emptyQuestions = questions.filter((q) => !q.questionText.trim());
        if (emptyQuestions.length > 0) {
            setSaveMessage({ type: "error", text: "All questions must have text. Please fill in empty questions." });
            return;
        }

        setSaving(true);
        setSaveMessage(null);

        try {
            const batch = writeBatch(db);
            const questionsRef = collection(db, "illness_library", illnessId, "questions");

            // First delete ALL existing questions
            const existingSnap = await getDocs(questionsRef);
            existingSnap.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Then write all current questions
            questions.forEach((q, index) => {
                const questionDocRef = doc(questionsRef, `q_${index + 1}`);
                batch.set(questionDocRef, {
                    order: index + 1,
                    questionText: q.questionText.trim(),
                    answers: q.answers,
                    weights: q.weights,
                    isRequired: q.isRequired,
                });
            });

            // Update illness doc with question count and hasQuestions flag
            const illnessRef = doc(db, "illness_library", illnessId);
            batch.update(illnessRef, {
                hasQuestions: questions.length > 0,
                questionCount: questions.length,
            });

            await batch.commit();

            // Refresh IDs after save
            const refreshedSnap = await getDocs(
                query(collection(db, "illness_library", illnessId, "questions"), orderBy("order", "asc"))
            );
            setQuestions(
                refreshedSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Question[]
            );

            setSaveMessage({ type: "success", text: `Saved ${questions.length} questions successfully!` });
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            console.error("Error saving questions:", error);
            setSaveMessage({ type: "error", text: "Failed to save questions. Please try again." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/admin/illness-library")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {illness?.displayName || "Unknown Condition"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage screening questions · {questions.length} question{questions.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{illness?.category}</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleAddQuestion}>
                        <Plus className="mr-2 h-4 w-4" /> Add Question
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        {saving ? "Saving..." : "Save All"}
                    </Button>
                </div>
            </div>

            {/* Save Message */}
            {saveMessage && (
                <div
                    className={`flex items-center gap-2 text-sm p-3 rounded-lg ${saveMessage.type === "success"
                            ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
                            : "text-rose-500 bg-rose-50 dark:bg-rose-950/30"
                        }`}
                >
                    {saveMessage.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    {saveMessage.text}
                </div>
            )}

            {/* Questions List */}
            {questions.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <p className="text-muted-foreground mb-4">No questions yet. Add your first screening question.</p>
                        <Button onClick={handleAddQuestion}>
                            <Plus className="mr-2 h-4 w-4" /> Add First Question
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {questions.map((question, index) => (
                        <Card key={question.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
                            <CardContent className="p-0">
                                {/* Top Header Section */}
                                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Question Item</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 hover:bg-slate-200 dark:hover:bg-slate-800"
                                            onClick={() => handleMoveUp(index)}
                                            disabled={index === 0}
                                        >
                                            <span className="text-xs">▲</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 hover:bg-slate-200 dark:hover:bg-slate-800"
                                            onClick={() => handleMoveDown(index)}
                                            disabled={index === questions.length - 1}
                                        >
                                            <span className="text-xs">▼</span>
                                        </Button>
                                        <Separator orientation="vertical" className="h-4 mx-1" />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                            onClick={() => handleRemoveQuestion(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Main Content Section */}
                                <div className="p-6 space-y-6">
                                    {/* Question Text */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Content</Label>
                                        <Input
                                            placeholder="e.g. Have you been in contact with someone who has TB?"
                                            className="h-12 text-base bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm font-medium"
                                            value={question.questionText}
                                            onChange={(e) => handleUpdateQuestion(index, "questionText", e.target.value)}
                                        />
                                    </div>

                                    {/* Weights Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Scoring Matrix</Label>
                                            <Badge variant="outline" className="text-[10px] font-bold text-slate-400 border-slate-200">Risk Weights</Badge>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            {question.answers.map((answer) => (
                                                <div key={answer} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                                                    <Label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-tight block">{answer.replace(/_/g, " ")}</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        max="10"
                                                        className="h-9 text-sm bg-white dark:bg-slate-950 font-bold text-primary"
                                                        value={question.weights[answer] ?? 0}
                                                        onChange={(e) =>
                                                            handleUpdateWeight(index, answer, parseFloat(e.target.value) || 0)
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Bottom Save Bar */}
            {questions.length > 0 && (
                <div className="sticky bottom-4 flex justify-end">
                    <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
                        {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        {saving ? "Saving..." : `Save ${questions.length} Questions`}
                    </Button>
                </div>
            )}
        </div>
    );
}
