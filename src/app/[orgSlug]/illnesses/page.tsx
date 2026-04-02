"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Save,
  Info,
  Sparkles,
  Building2,
  HardHat,
  HeartPulse,
  BriefcaseMedical,
  UtensilsCrossed,
  Factory,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";

const INDUSTRY_PRESETS: {
  label: string;
  icon: React.ElementType;
  categories: string[];
}[] = [
  {
    label: "Corporate",
    icon: Building2,
    categories: ["Cardiovascular", "Metabolic", "Mental Health"],
  },
  {
    label: "Healthcare",
    icon: HeartPulse,
    categories: ["Infectious Disease", "Cardiovascular", "Respiratory"],
  },
  {
    label: "Mining",
    icon: HardHat,
    categories: ["Respiratory", "Musculoskeletal", "Hearing"],
  },
  {
    label: "Manufacturing",
    icon: Factory,
    categories: ["Musculoskeletal", "Respiratory", "Hearing"],
  },
  {
    label: "Hospitality",
    icon: UtensilsCrossed,
    categories: ["Infectious Disease", "Metabolic", "Mental Health"],
  },
  {
    label: "Medical",
    icon: BriefcaseMedical,
    categories: ["Cardiovascular", "Metabolic", "Respiratory", "Mental Health"],
  },
];

interface Illness {
  id: string;
  displayName: string;
  category: string;
  isActive: boolean;
}

export default function IllnessSelectionPage() {
  const { orgId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allIllnesses, setAllIllnesses] = useState<Illness[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [planLimits, setPlanLimits] = useState({ max: 5, tier: "Small" });
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [activeIndustry, setActiveIndustry] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      if (!orgId) return;
      try {
        // Fetch all active illnesses
        const libSnap = await getDocs(
          query(
            collection(db, "illness_library"),
            where("isActive", "==", true),
          ),
        );
        const libData = libSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            displayName: data.displayName || data.name || "Unnamed Condition",
            category: data.category || "Uncategorized",
            isActive: data.isActive ?? true,
          } as Illness;
        });
        libData.sort((a, b) => a.displayName.localeCompare(b.displayName));
        setAllIllnesses(libData);

        // Fetch org's selected illnesses and plan tier
        const orgDoc = await getDoc(doc(db, "organizations", orgId));
        if (orgDoc.exists()) {
          const data = orgDoc.data();
          setSelectedIds(data.allowedIllnesses || []);

          const tier = (data.planTier || "small").toLowerCase();

          // Fetch the actual plan limits from Firestore (covers all 3 packages dynamically)
          const planDoc = await getDoc(doc(db, "plans", `${tier}_plan`));
          const max = planDoc.exists()
            ? (planDoc.data()?.maxIllnesses ?? 5)
            : 5;
          const planName = planDoc.exists()
            ? planDoc.data()?.name || tier
            : tier;
          setPlanLimits({ tier: planName, max });
        }
      } catch (error) {
        console.error("Error fetching illness data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [orgId]);

  const toggleIllness = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      if (selectedIds.length >= planLimits.max) {
        setIsUpgradeModalOpen(true);
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "organizations", orgId), {
        allowedIllnesses: selectedIds,
      });
      alert("Illness selection updated successfully!");
    } catch (error) {
      console.error("Error saving selection:", error);
      alert("Failed to save selection.");
    } finally {
      setSaving(false);
    }
  };

  const applyIndustryPreset = (preset: (typeof INDUSTRY_PRESETS)[0]) => {
    if (activeIndustry === preset.label) {
      setActiveIndustry(null);
      return;
    }
    setActiveIndustry(preset.label);
    const matching = allIllnesses
      .filter((i) =>
        preset.categories.some((cat) =>
          i.category.toLowerCase().includes(cat.toLowerCase()),
        ),
      )
      .slice(0, planLimits.max)
      .map((i) => i.id);
    setSelectedIds(matching);
  };

  const filtered = allIllnesses.filter(
    (i) =>
      i.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-52" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-11 w-36 rounded-md" />
        </div>
        <div className="rounded-xl border-none shadow-sm bg-white dark:bg-slate-900/50 p-6 space-y-3">
          <Skeleton className="h-4 w-44" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-md" />
            ))}
          </div>
        </div>
        <Skeleton className="h-11 max-w-md w-full rounded-md" />
        <div className="rounded-xl border-none shadow-sm overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-3.5 border-b border-slate-100 dark:border-slate-800"
            >
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 flex-1 max-w-[220px]" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Illness Selection
          </h1>
          <p className="text-muted-foreground">
            Choose which conditions are available for screening in your patient
            app.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Plan Usage
            </p>
            <p className="text-sm font-bold">
              <span
                className={
                  selectedIds.length >= planLimits.max
                    ? "text-rose-500"
                    : "text-primary"
                }
              >
                {selectedIds.length}
              </span>
              <span className="text-slate-400">
                {" "}
                / {planLimits.max} Illnesses
              </span>
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="font-semibold shadow-sm h-11 px-6"
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Selection
              </>
            )}
          </Button>
        </div>
      </div>
      {selectedIds.length >= planLimits.max && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Plan Limit Reached:</strong> You are currently using all{" "}
            {planLimits.max} slots available in your{" "}
            <strong>{planLimits.tier} Plan</strong>. To enable more illnesses,
            please upgrade your subscription.
          </p>
        </div>
      )}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Industry Quick-Select
          </CardTitle>
          <CardDescription>
            Select your industry to auto-recommend the most relevant screening
            conditions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {INDUSTRY_PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <Button
                  key={preset.label}
                  variant={
                    activeIndustry === preset.label ? "default" : "outline"
                  }
                  size="sm"
                  className="h-9 gap-2"
                  onClick={() => applyIndustryPreset(preset)}
                >
                  <Icon className="w-4 h-4" />
                  {preset.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search conditions..."
            className="pl-10 h-11 bg-white dark:bg-slate-900 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span className="text-sm text-slate-500 shrink-0">
          {filtered.length} condition{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <TableHead className="w-12 pl-6">
                <span className="sr-only">Select</span>
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Condition
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Category
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200 text-center">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((illness) => {
              const isSelected = selectedIds.includes(illness.id);
              return (
                <TableRow
                  key={illness.id}
                  className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"}`}
                  onClick={() => toggleIllness(illness.id)}
                >
                  <TableCell className="pl-6">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleIllness(illness.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-50">
                    {illness.displayName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {illness.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {isSelected ? (
                      <Badge className="bg-primary/15 text-primary border border-primary/30 text-xs font-semibold">
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-slate-400 text-xs"
                      >
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-slate-400"
                >
                  No conditions found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="flex flex-col items-center sm:text-center mt-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              Upgrade Your Plan
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              You have reached the maximum limit of{" "}
              <strong>{planLimits.max} condition screenings</strong> available
              on the <strong>{planLimits.tier} Tier</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 my-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Unlock more health screening conditions for your patients by
              upgrading to a higher tier package.
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2 mt-2">
            <Button
              className="w-full font-semibold h-11"
              onClick={() => router.push(`/${orgId}/subscription`)}
            >
              View Subscription Packages
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setIsUpgradeModalOpen(false)}
            >
              Maybe Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
