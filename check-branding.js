const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyDxcnKQeiVYH4xIvPgFc_vMpdp_G3TkVO0",
    authDomain: "medical-screening-app-96e7c.firebaseapp.com",
    projectId: "medical-screening-app-96e7c",
    storageBucket: "medical-screening-app-96e7c.firebasestorage.app",
    messagingSenderId: "355537742810",
    appId: "1:355537742810:web:4bb50bd5a22dad71c2eee3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkBranding() {
    const orgs = ['bestmed_001', 'clientele_002'];

    for (const orgId of orgs) {
        const snap = await getDoc(doc(db, "organizations", orgId));
        if (snap.exists()) {
            console.log(`Org: ${orgId}`);
            console.log(JSON.stringify(snap.data().branding, null, 2));
        } else {
            console.log(`Org ${orgId} not found`);
        }
    }
    process.exit(0);
}

checkBranding();
