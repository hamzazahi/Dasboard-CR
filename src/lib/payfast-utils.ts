import crypto from 'crypto';

export function generatePayfastSignature(data: Record<string, any>, passphrase?: string): string {
    let pfParamString = "";
    
    // Sort keys alphabetically
    const sortedKeys = Object.keys(data).sort();
    
    sortedKeys.forEach(key => {
        if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
            pfParamString += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, "+")}&`;
        }
    });

    // Remove trailing ampersand
    pfParamString = pfParamString.substring(0, pfParamString.length - 1);

    if (passphrase) {
        pfParamString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
    }

    return crypto.createHash("md5").update(pfParamString).digest("hex");
}
