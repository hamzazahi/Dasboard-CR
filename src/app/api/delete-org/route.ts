import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function DELETE(request: NextRequest) {
    try {
        const { orgId } = await request.json();

        if (!orgId) {
            return NextResponse.json({ error: "Organisation ID is required" }, { status: 400 });
        }

        const db = adminDb();
        const auth = adminAuth();

        // 1. Find all users belonging to this org in Firestore
        const usersSnap = await db.collection("users").where("orgId", "==", orgId).get();

        // 2. Delete each user from Firebase Auth + Firestore
        const userDeletionResults: { uid: string; error?: string }[] = [];
        for (const userDoc of usersSnap.docs) {
            const uid = userDoc.id;
            try {
                await auth.deleteUser(uid);
            } catch (authErr: any) {
                // If the user doesn't exist in Auth, continue to Firestore cleanup
                if (authErr.code !== "auth/user-not-found") {
                    userDeletionResults.push({ uid, error: authErr.message });
                }
            }
            // Always delete from Firestore
            await userDoc.ref.delete();
        }

        // 3. Delete all screening_attempts for this org
        const screeningsSnap = await db.collection("screening_attempts").where("orgId", "==", orgId).get();
        const screeningDeletes = screeningsSnap.docs.map(d => d.ref.delete());
        await Promise.all(screeningDeletes);

        // 4. Delete all transactions for this org
        const txSnap = await db.collection("transactions").where("orgId", "==", orgId).get();
        const txDeletes = txSnap.docs.map(d => d.ref.delete());
        await Promise.all(txDeletes);

        // 5. Finally delete the organization document itself
        await db.collection("organizations").doc(orgId).delete();

        return NextResponse.json({
            success: true,
            message: `Organisation ${orgId} and all associated data deleted`,
            usersDeleted: usersSnap.size,
            screeningsDeleted: screeningsSnap.size,
            transactionsDeleted: txSnap.size,
            userErrors: userDeletionResults,
        });
    } catch (error: any) {
        console.error("Error deleting organisation:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete organisation" },
            { status: 500 }
        );
    }
}
