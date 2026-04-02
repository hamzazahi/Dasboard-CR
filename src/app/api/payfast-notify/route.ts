import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { generatePayfastSignature } from "@/lib/payfast-utils";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    // 1. Get the raw form data (Payfast sends form-urlencoded)
    const text = await req.text();
    const params = new URLSearchParams(text);
    const payload: Record<string, string> = {};
    params.forEach((value, key) => {
      payload[key] = value;
    });

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
    console.log(`Payfast ITN received from IP: ${ip} for payment:`, payload.m_payment_id, payload.payment_status);

    // 2. Security: Verify ITN using PayFast's validation endpoint
    const payfastHost = process.env.PAYFAST_URL?.includes('sandbox') 
        ? 'sandbox.payfast.co.za' 
        : 'www.payfast.co.za';
    
    const validateUrl = `https://${payfastHost}/eng/query/validate`;

    try {
        const validateResponse = await fetch(validateUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: text,
        });

        const validateResult = await validateResponse.text();

        if (validateResult !== "VALID") {
            console.error("PayFast ITN Validation failed: ", validateResult);
            return new NextResponse("Validation Failed", { status: 400 });
        }
    } catch (err) {
        console.error("Error communicating with PayFast validation endpoint:", err);
        return new NextResponse("Validation Error", { status: 500 });
    }

    // 3. Update Firebase based on payment_status
    const orderId = payload.m_payment_id;
    const paymentStatus = payload.payment_status;

    if (paymentStatus === "COMPLETE") {
      const orderRef = db.collection("payments").doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        console.error("Order not found:", orderId);
        return new NextResponse("Order not found", { status: 404 });
      }

      const orderData = orderDoc.data()!;
      
      // Update Payment Record
      await orderRef.update({
        status: "SUCCESS",
        payfastPaymentId: payload.pf_payment_id,
        completedAt: FieldValue.serverTimestamp(),
        rawNotifyData: payload, // Store raw data for debugging/audit
      });
      
      // Update User Subscription in H360
      const { userId, planId } = orderData; // userId is orgId in this context
      if (userId) {
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);

        // Update Organization Document
        await db.collection("organizations").doc(userId).update({
          status: "active",
          planTier: planId || "pro", // Default to pro if missing
          subscriptionExpiresAt: Timestamp.fromDate(nextMonth), // 30 days safely stored as Firestore Timestamp
          lastUpdated: FieldValue.serverTimestamp()
        });

        // Also update the user record for backward compatibility/individual flags
        await db.collection("users").doc(userId).update({
          isPremium: true,
          subscriptionEnd: Timestamp.fromDate(nextMonth),
          lastUpdated: FieldValue.serverTimestamp()
        });
        console.log("Organization and User subscription updated successfully for:", userId);
      }
    } else if (paymentStatus === "CANCELLED") {
        await db.collection("payments").doc(orderId).update({
            status: "CANCELLED",
            updatedAt: FieldValue.serverTimestamp()
        });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing Payfast ITN:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
