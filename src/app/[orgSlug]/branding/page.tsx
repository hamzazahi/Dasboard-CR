"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { QRCodeCard } from "@/components/dashboard/qr-code-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Palette,
  Upload,
  Save,
  Building2,
  Smartphone,
  Eye,
  Code,
  Crop,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { HexColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function BrandingPage() {
  const { orgId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState({
    appName: "H360 Health",
    primaryColor: "#025E73",
    secondaryColor: "#05C7F2",
    logoUrl: "",
    welcomeMessage: "Welcome to our health screening portal.",
    disclaimerText:
      "This screening is not a replacement for professional medical advice.",
  });
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [orgName, setOrgName] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState("");
  const [cropScale, setCropScale] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    async function fetchBranding() {
      if (!orgId) return;
      setLoading(true);
      try {
        const orgDoc = await getDoc(doc(db, "organizations", orgId));
        if (orgDoc.exists()) {
          const data = orgDoc.data();
          setOrgName(data.orgName || data.name || "My Organisation");
          setQrCode(data.qrCode || `https://h360.app/org/${orgId}`);

          const brandingData = data.branding || {};

          // Support both branding map and top-level fields (backward compatibility)
          const appName =
            brandingData.appName ||
            data.appName ||
            data.orgName ||
            "H360 Health";
          const primaryColor =
            brandingData.primaryColor || data.primaryColor || "#025E73";
          const secondaryColor =
            brandingData.secondaryColor || data.secondaryColor || "#05C7F2";
          const logoUrl = brandingData.logoUrl || data.logoUrl || "";
          const welcomeMessage =
            brandingData.welcomeMessage ||
            data.welcomeMessage ||
            "Welcome to our health screening portal.";
          const disclaimerText =
            brandingData.disclaimerText ||
            data.disclaimerText ||
            "This screening is not a replacement for professional medical advice.";

          setBranding({
            appName,
            primaryColor,
            secondaryColor,
            logoUrl,
            welcomeMessage,
            disclaimerText,
          });
          setPreviewUrl(logoUrl);
        }
      } catch (error) {
        console.error("Error fetching branding:", error);
        toast.error("Failed to load branding data.");
      } finally {
        setLoading(false);
      }
    }
    fetchBranding();
  }, [orgId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const objectUrl = URL.createObjectURL(e.target.files[0]);
      setRawImageUrl(objectUrl);
      setCropScale(1);
      setCropOffset({ x: 0, y: 0 });
      setCropModalOpen(true);
    }
  };

  const handleCropApply = () => {
    const canvas = cropCanvasRef.current;
    const img = cropImageRef.current;
    if (!canvas || !img) return;
    const SIZE = 512;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    const scaledW = img.naturalWidth * cropScale;
    const scaledH = img.naturalHeight * cropScale;
    const drawX = (SIZE - scaledW) / 2 + cropOffset.x;
    const drawY = (SIZE - scaledH) / 2 + cropOffset.y;
    ctx.drawImage(img, drawX, drawY, scaledW, scaledH);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const croppedFile = new File([blob], "logo.png", { type: "image/png" });
      setPreviewFile(croppedFile);
      setPreviewUrl(URL.createObjectURL(croppedFile));
      setCropModalOpen(false);
    }, "image/png");
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
  };
  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setCropOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleCropMouseUp = () => setDragging(false);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);

    try {
      let finalLogoUrl = branding.logoUrl;

      if (previewFile) {
        const storageRef = ref(storage, `org_logos/${orgId}/logo.png`);
        await uploadBytes(storageRef, previewFile);
        finalLogoUrl = await getDownloadURL(storageRef);
      }

      // Save to the 'branding' object to remain consistent with Flutter model
      await updateDoc(doc(db, "organizations", orgId), {
        branding: {
          ...branding,
          logoUrl: finalLogoUrl,
        },
      });

      setBranding((prev) => ({ ...prev, logoUrl: finalLogoUrl }));
      toast.success("Branding updated successfully!");
      setPreviewFile(null);
    } catch (error) {
      console.error("Error saving branding:", error);
      toast.error("Failed to update branding.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-56" />
              </div>
              <div className="flex items-center gap-6">
                <Skeleton className="h-24 w-24 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-9 w-40 rounded-md" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-10 w-full rounded-md" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center gap-4">
              <Skeleton className="h-5 w-36 self-start" />
              <Skeleton className="w-[320px] h-[560px] rounded-[3rem]" />
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Branding & Identity
        </h1>
        <p className="text-muted-foreground">
          Customizing branding for{" "}
          <span className="font-semibold text-primary">{orgName}</span>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" /> Visual Identity
              </CardTitle>
              <CardDescription>
                Upload your logo and select your brand colors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Organization Logo</Label>
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Logo Preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Building2 className="w-10 h-10 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="relative h-9"
                    >
                      <Upload className="mr-2 h-4 w-4" /> Upload New Logo
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        accept="image/*"
                        title="Upload Image"
                      />
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Recommended: PNG with transparent background. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label
                    htmlFor="primaryColor"
                    className="text-sm font-semibold"
                  >
                    Primary Color
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="primaryColor"
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-14 bg-white dark:bg-slate-950 border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-sm"
                      >
                        <div
                          className="w-8 h-8 rounded-full border shadow-sm mr-3 shrink-0 ring-2 ring-offset-2 ring-transparent transition-all hover:scale-105"
                          style={{ backgroundColor: branding.primaryColor }}
                        />
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <span className="text-sm font-medium leading-none mb-1 text-foreground">
                            Main Brand Color
                          </span>
                          <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                            {branding.primaryColor}
                          </span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-4 border-slate-200 shadow-2xl rounded-xl"
                      align="start"
                      sideOffset={8}
                    >
                      <div className="mb-4 space-y-1">
                        <h4 className="font-medium text-sm">
                          Select Primary Color
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Used for main buttons and active states.
                        </p>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        <HexColorPicker
                          color={branding.primaryColor}
                          onChange={(color) =>
                            setBranding({ ...branding, primaryColor: color })
                          }
                          style={{
                            width: "100%",
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        />
                      </div>
                      <div className="mt-4 flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div
                          className="w-8 h-8 rounded-full shadow-inner border border-slate-200 shrink-0"
                          style={{ backgroundColor: branding.primaryColor }}
                        />
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                            HEX
                          </span>
                          <Input
                            value={branding.primaryColor.replace(/^#/, "")}
                            onChange={(e) =>
                              setBranding({
                                ...branding,
                                primaryColor: `#${e.target.value}`,
                              })
                            }
                            className="h-9 pl-12 text-sm font-mono uppercase border-slate-200 bg-white"
                            placeholder="000000"
                            maxLength={6}
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="secondaryColor"
                    className="text-sm font-semibold"
                  >
                    Secondary Color
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="secondaryColor"
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-14 bg-white dark:bg-slate-950 border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-sm"
                      >
                        <div
                          className="w-8 h-8 rounded-full border shadow-sm mr-3 shrink-0 ring-2 ring-offset-2 ring-transparent transition-all hover:scale-105"
                          style={{ backgroundColor: branding.secondaryColor }}
                        />
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <span className="text-sm font-medium leading-none mb-1 text-foreground">
                            Accent Color
                          </span>
                          <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                            {branding.secondaryColor}
                          </span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-4 border-slate-200 shadow-2xl rounded-xl"
                      align="start"
                      sideOffset={8}
                    >
                      <div className="mb-4 space-y-1">
                        <h4 className="font-medium text-sm">
                          Select Secondary Color
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Used for subtle highlights and badges.
                        </p>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        <HexColorPicker
                          color={branding.secondaryColor}
                          onChange={(color) =>
                            setBranding({ ...branding, secondaryColor: color })
                          }
                          style={{
                            width: "100%",
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        />
                      </div>
                      <div className="mt-4 flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div
                          className="w-8 h-8 rounded-full shadow-inner border border-slate-200 shrink-0"
                          style={{ backgroundColor: branding.secondaryColor }}
                        />
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                            HEX
                          </span>
                          <Input
                            value={branding.secondaryColor.replace(/^#/, "")}
                            onChange={(e) =>
                              setBranding({
                                ...branding,
                                secondaryColor: `#${e.target.value}`,
                              })
                            }
                            className="h-9 pl-12 text-sm font-mono uppercase border-slate-200 bg-white"
                            placeholder="000000"
                            maxLength={6}
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>App Information</CardTitle>
              <CardDescription>
                Messaging and general application details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appName">Display Name</Label>
                <Input
                  id="appName"
                  value={branding.appName}
                  onChange={(e) =>
                    setBranding({ ...branding, appName: e.target.value })
                  }
                  placeholder="Enter App Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcome">Welcome Message</Label>
                <Input
                  id="welcome"
                  value={branding.welcomeMessage}
                  onChange={(e) =>
                    setBranding({ ...branding, welcomeMessage: e.target.value })
                  }
                  placeholder="Enter Welcome Message"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disclaimer">Mobile Disclaimer</Label>
                <textarea
                  id="disclaimer"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={branding.disclaimerText}
                  onChange={(e) =>
                    setBranding({ ...branding, disclaimerText: e.target.value })
                  }
                  placeholder="Enter Legal Disclaimer"
                  title="Mobile Disclaimer"
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2 border-t py-4">
              <Button variant="outline" disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  "Saving Changes..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Branding
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="sticky top-8">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-500 uppercase tracking-wider">
              <Eye className="w-4 h-4" /> Live Mobile Preview
            </div>

            {/* Mobile Mockup */}
            <div className="relative mx-auto w-[320px] h-[640px] bg-slate-950 rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 flex justify-center">
                <div className="w-20 h-4 bg-black rounded-b-xl" />
              </div>

              <div className="h-full bg-white dark:bg-slate-950 flex flex-col pt-8">
                <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex justify-center">
                    <div
                      className="h-20 w-20 rounded-2xl flex items-center justify-center p-2"
                      style={{ backgroundColor: `${branding.primaryColor}10` }}
                    >
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Logo"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="h-10 w-10 flex items-center justify-center bg-slate-200 rounded-lg">
                          <Building2 className="text-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: branding.primaryColor }}
                    >
                      {branding.appName}
                    </h2>
                    <p className="text-sm text-slate-500 px-4">
                      {branding.welcomeMessage}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div
                      className="h-12 w-full rounded-xl"
                      style={{ backgroundColor: branding.primaryColor }}
                    />
                    <div
                      className="h-12 w-full rounded-xl border-2"
                      style={{ borderColor: branding.primaryColor }}
                    />
                  </div>

                  <div className="pt-8 px-4">
                    <p className="text-[10px] text-center text-slate-400 leading-relaxed italic">
                      "{branding.disclaimerText}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 inset-x-0 h-1 bg-white/20 w-24 mx-auto rounded-full" />
            </div>

            <p className="text-center mt-6 text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Smartphone className="w-3 h-3" /> Changes reflect in the mobile
              app instantly after saving.
            </p>

            <div className="mt-8 space-y-6">
              <Separator />
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                <Code className="w-4 h-4" /> Clinic Integration
              </div>

              <QRCodeCard
                url={qrCode}
                orgName={orgName}
                primaryColor={branding.primaryColor}
                logoUrl={previewUrl}
              />

              <Card className="bg-primary/5 border border-primary/20 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> Developer Quick-Link
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Use this command to force-open this clinic in a connected
                    emulator or physical device via ADB tools.
                  </p>
                  <div className="relative group">
                    <code className="block bg-white border border-slate-200 p-3 rounded-lg text-[10px] text-slate-700 font-mono select-all overflow-x-auto">
                      adb shell am start -a android.intent.action.VIEW -d &quot;
                      {qrCode}&quot;
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `adb shell am start -a android.intent.action.VIEW -d "${qrCode}"`,
                        );
                        toast.success("Command copied!");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {cropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Crop className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Crop Logo</h2>
              </div>
              <button
                onClick={() => setCropModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <p className="text-sm text-slate-500">
                Drag the image to reposition it within the crop frame. Use zoom
                to fit.
              </p>
              <div
                className="relative mx-auto w-96 h-96 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border-2 border-dashed border-primary/40 cursor-move select-none"
                onMouseDown={handleCropMouseDown}
                onMouseMove={handleCropMouseMove}
                onMouseUp={handleCropMouseUp}
                onMouseLeave={handleCropMouseUp}
              >
                {rawImageUrl && (
                  <img
                    ref={cropImageRef}
                    src={rawImageUrl}
                    alt="Crop preview"
                    draggable={false}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: `translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px)) scale(${cropScale})`,
                      transformOrigin: "center",
                      maxWidth: "none",
                      pointerEvents: "none",
                    }}
                  />
                )}
                <div className="absolute inset-0 border-2 border-primary/60 rounded-xl pointer-events-none" />
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setCropScale((s) => Math.max(0.2, s - 0.1))}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm font-mono text-slate-500 w-12 text-center">
                  {Math.round(cropScale * 100)}%
                </span>
                <button
                  onClick={() => setCropScale((s) => Math.min(3, s + 0.1))}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
            <canvas ref={cropCanvasRef} className="hidden" />
            <div className="flex gap-3 px-6 pb-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCropModalOpen(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCropApply}>
                Apply Crop
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
