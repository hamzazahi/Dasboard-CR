import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Use environment variables for PayFast config
        const passphrase = process.env.PAYFAST_PASSPHRASE || "";

        let pfParamString = "";
        // Sort keys alphabetically 
        // PayFast requires exactly matching the fields that are sent.
        Object.keys(body).sort().forEach(key => {
            if (body[key] !== "") {
                pfParamString += `${key}=${encodeURIComponent(body[key].toString().trim()).replace(/%20/g, "+")}&`;
            }
        });

        pfParamString = pfParamString.substring(0, pfParamString.length - 1);

        if (passphrase !== null && passphrase !== "") {
            pfParamString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
        }

        const signature = crypto.createHash("md5").update(pfParamString).digest("hex");

        return NextResponse.json({ signature });
    } catch (error) {
        console.error("Signature generation error:", error);
        return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
    }
}
