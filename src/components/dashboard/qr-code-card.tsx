"use client";

import React, { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer, Share2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";

interface QRCodeCardProps {
  url: string;
  orgName: string;
  primaryColor?: string;
  logoUrl?: string;
}

export function QRCodeCard({ url, orgName, primaryColor = "#0F172A", logoUrl }: QRCodeCardProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const downloadQRCode = () => {
    const canvas = document.getElementById("clinic-qr-code") as HTMLCanvasElement;
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${orgName.replace(/\s+/g, "_")}_QR_Code.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success("QR Code downloaded successfully!");
  };

  const printQRCode = () => {
    const canvas = document.getElementById("clinic-qr-code") as HTMLCanvasElement;
    if (!canvas) return;

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${orgName}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
            .container { text-align: center; border: 2px solid #eee; padding: 40px; border-radius: 20px; }
            img { width: 300px; height: 300px; margin-bottom: 20px; }
            h1 { margin: 0; color: ${primaryColor}; }
            p { color: #666; margin-top: 10px; }
          </style>
        </head>
        <body onload="window.print();window.close()">
          <div class="container">
            <img src="${canvas.toDataURL()}" />
            <h1>${orgName}</h1>
            <p>Scan to start your health screening</p>
          </div>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white/70 backdrop-blur-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" /> Entrance QR Code
          </CardTitle>
          <div className="flex gap-2">
             <Button variant="ghost" size="icon" onClick={() => {
                navigator.clipboard.writeText(url);
                toast.success("Link copied to clipboard!");
             }} title="Copy Link">
                <Share2 className="w-4 h-4" />
             </Button>
          </div>
        </div>
        <CardDescription>Patients scan this at your clinic to load your branded screening.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6 bg-slate-50/50">
        <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-100" ref={canvasRef}>
          <QRCodeCanvas
            id="clinic-qr-code"
            value={url}
            size={200}
            level={"H"}
            includeMargin={true}
            imageSettings={logoUrl ? {
                src: logoUrl,
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
            } : undefined}
          />
        </div>
        <p className="mt-4 text-xs font-mono text-slate-400 select-all truncate max-w-full px-4 italic">
          {url}
        </p>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-3 py-4 bg-white/40">
        <Button variant="outline" className="w-full" onClick={downloadQRCode}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
        <Button className="w-full" onClick={printQRCode}>
          <Printer className="mr-2 h-4 w-4" /> Print PDF
        </Button>
      </CardFooter>
    </Card>
  );
}
