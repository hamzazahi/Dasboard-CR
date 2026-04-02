"use server";

import { db } from "@/lib/firebase-admin";
import { generatePayfastSignature } from "@/lib/payfast-utils";
import { headers } from "next/headers";

export async function startH360Payment(userId: string, planId: string, amount: number, userEmail?: string) {
  try {
    // 1. Create a Pending Order in Firestore
    const orderRef = await db.collection("payments").add({
      userId,
      planId,
      amount,
      status: "PENDING",
      createdAt: new Date(),
    });

    // 2. Prepare Payfast Data
    const merchantId = process.env.PAYFAST_MERCHANT_ID!;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY!;
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    const payfastUrl = process.env.PAYFAST_URL || "https://sandbox.payfast.co.za/eng/process";
    
    // Dynamically get the base URL from the current request headers, or fallback to localhost
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    const payfastData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${baseUrl}/payment-success`,
      cancel_url: `${baseUrl}/payment-cancel`,
      notify_url: `${baseUrl}/api/payfast-notify`,
      name_first: "H360",
      name_last: "User",
      email_address: userEmail || "user@example.com",
      m_payment_id: orderRef.id,
      amount: amount.toFixed(2),
      item_name: `H360 Health Check: ${planId} Package`,
      custom_str1: userId,
      custom_str2: planId,
    };

    // 3. Generate Signature
    const signature = generatePayfastSignature(payfastData, passphrase);
    payfastData.signature = signature;

    // 4. Construct Query String
    const queryParams = new URLSearchParams(payfastData).toString();

    // 5. Return Data
    return { 
      success: true, 
      payfastUrl,
      paymentData: payfastData,
      orderId: orderRef.id 
    };
  } catch (error) {
    console.error("Error starting Payfast payment:", error);
    return { success: false, error: "Failed to initialize payment" };
  }
}
