import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function DELETE(request: NextRequest) {
    try {
        const { uid } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: "User UID is required" }, { status: 400 });
        }

        // 1. Delete from Firebase Auth
        await adminAuth().deleteUser(uid);

        // 2. Delete from Firestore
        await adminDb().collection("users").doc(uid).delete();

        return NextResponse.json({ success: true, message: "User deleted from Auth and Firestore" });
    } catch (error: any) {
        console.error("Error deleting user:", error);

        // If user not found in Auth (was already deleted), still try Firestore cleanup
        if (error.code === "auth/user-not-found") {
            try {
                const { uid } = await request.json().catch(() => ({ uid: null }));
                if (uid) await adminDb().collection("users").doc(uid).delete();
            } catch (_) { /* ignore */ }
            return NextResponse.json({ success: true, message: "User not in Auth, Firestore record cleaned up" });
        }

        return NextResponse.json(
            { error: error.message || "Failed to delete user" },
            { status: 500 }
        );
    }
}
