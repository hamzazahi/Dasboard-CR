const admin = require('firebase-admin');

// Ensure you have the service account key in the correct place, or run this where firebase is already authenticated via env vars.
// Since we are running in the Next.js API environment or root, we can just use the emulator or the existing project credentials.

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedPlans() {
    const plans = [
        {
            id: "small_plan",
            name: "Package 1",
            tier: "small",
            priceMonthlyZAR: 499,
            maxUsers: 50,
            maxIllnesses: 5,
            features: [
                "Up to 50 users",
                "Access to 5 screenings",
                "Basic-depth screening",
                "Basic branding (colors & name)",
                "Standard support"
            ],
            description: "Ideal for small clinics focusing on key conditions."
        },
        {
            id: "medium_plan",
            name: "Package 2",
            tier: "medium",
            priceMonthlyZAR: 999,
            maxUsers: 150,
            maxIllnesses: 15,
            features: [
                "Up to 150 users",
                "Access to 15 screenings",
                "Medium-depth screening",
                "Full branding (colors, name, logo, welcome message)",
                "Priority support",
                "Analytics dashboard"
            ],
            description: "For medical aids and mid-size corporate wellness programmes."
        },
        {
            id: "full_plan",
            name: "Package 3",
            tier: "full",
            priceMonthlyZAR: 1999,
            maxUsers: 0, // 0 = unlimited
            maxIllnesses: 27,
            features: [
                "Unlimited users",
                "All 27 screenings",
                "Full-depth screening (all questions)",
                "Full branding + custom disclaimers",
                "Dedicated support",
                "Advanced analytics & reporting",
                "API access"
            ],
            description: "For universities and large institutions needing comprehensive coverage."
        }
    ];

    for (const plan of plans) {
        await db.collection('plans').doc(plan.id).set(plan);
        console.log(`Updated plan: ${plan.id}`);
    }
}

seedPlans().then(() => {
    console.log("Done");
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
