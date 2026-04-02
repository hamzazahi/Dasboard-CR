const crypto = require('crypto');

function generatePayfastSignature(data, passphrase) {
    let pfParamString = "";
    const sortedKeys = Object.keys(data).sort();
    sortedKeys.forEach(key => {
        if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
            pfParamString += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, "+")}&`;
        }
    });
    pfParamString = pfParamString.substring(0, pfParamString.length - 1);
    if (passphrase) {
        pfParamString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
    }
    return crypto.createHash("md5").update(pfParamString).digest("hex");
}

const testData = {
    merchant_id: "10000100",
    merchant_key: "46f0cd694581a",
    m_payment_id: "test-order-123",
    amount: "100.00",
    item_name: "Test Item"
};

const passphrase = "testpassphrase";
const signature = generatePayfastSignature(testData, passphrase);

console.log("Calculated Signature:", signature);

// Mocking the ITN data structure
const itnData = { ...testData, signature };
console.log("Mock ITN Data:", JSON.stringify(itnData));
