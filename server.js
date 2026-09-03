require("dotenv").config();

const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const BASE_URL = process.env.BASE_URL;

const IS_SANDBOX = process.env.MPESA_ENV !== "production";

const MPESA_BASE_URL = IS_SANDBOX
    ? "https://sandbox.safaricom.co.ke"
    : "https://api.safaricom.co.ke";


/* =========================================================
   BASIC VALIDATION
========================================================= */

function checkConfiguration() {
    const missing = [];

    if (!MPESA_CONSUMER_KEY) missing.push("MPESA_CONSUMER_KEY");
    if (!MPESA_CONSUMER_SECRET) missing.push("MPESA_CONSUMER_SECRET");
    if (!MPESA_SHORTCODE) missing.push("MPESA_SHORTCODE");
    if (!MPESA_PASSKEY) missing.push("MPESA_PASSKEY");
    if (!BASE_URL) missing.push("BASE_URL");

    if (missing.length > 0) {
        console.warn(
            "Missing environment variables:",
            missing.join(", ")
        );
    }
}

checkConfiguration();


/* =========================================================
   MEMBERSHIP PACKAGES
========================================================= */

const PACKAGES = {
    bronze: {
        name: "Bronze",
        amount: 1000
    },

    silver: {
        name: "Silver",
        amount: 1750
    },

    gold: {
        name: "Gold",
        amount: 2500
    }
};


/* =========================================================
   TEMPORARY PAYMENT STORAGE
   ---------------------------------------------------------
   This is suitable for testing only.

   In production replace this with a real database.
========================================================= */

const payments = new Map();


/* =========================================================
   FORMAT KENYAN PHONE NUMBER
========================================================= */

function normalizePhone(phone) {
    if (!phone) return null;

    let cleaned = String(phone).replace(/\s+/g, "").replace(/-/g, "");

    if (cleaned.startsWith("+254")) {
        cleaned = cleaned.substring(1);
    }

    if (cleaned.startsWith("07") || cleaned.startsWith("01")) {
        cleaned = "254" + cleaned.substring(1);
    }

    if (/^2547\d{8}$/.test(cleaned)) {
        return cleaned;
    }

    if (/^2541\d{8}$/.test(cleaned)) {
        return cleaned;
    }

    return null;
}


/* =========================================================
   GET DARAJA ACCESS TOKEN
========================================================= */

async function getAccessToken() {

    const credentials = Buffer
        .from(
            `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
        )
        .toString("base64");

    const response = await axios.get(
        `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
        {
            headers: {
                Authorization: `Basic ${credentials}`
            },
            timeout: 20000
        }
    );

    return response.data.access_token;
}


/* =========================================================
   GENERATE STK PASSWORD
========================================================= */

function generateTimestamp() {

    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hour}${minute}${second}`;
}


function generatePassword(timestamp) {

    return Buffer
        .from(
            `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
        )
        .toString("base64");
}


/* =========================================================
   CREATE UNIQUE PAYMENT ID
========================================================= */

function createPaymentId() {

    return (
        "OS-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase()
    );
}


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        service: "ONLINE SPHERE COMMERCE",
        environment: IS_SANDBOX ? "sandbox" : "production",
        time: new Date().toISOString()
    });

});


/* =========================================================
   GET MEMBERSHIP PACKAGES
========================================================= */

app.get("/api/packages", (req, res) => {

    res.json({
        success: true,
        packages: PACKAGES
    });

});


/* =========================================================
   INITIATE M-PESA STK PUSH
========================================================= */

app.post("/api/stkpush", async (req, res) => {

    try {

        const {
            phone,
            packageId
        } = req.body;


        /* -------------------------------
           Validate package
        -------------------------------- */

        if (!packageId || !PACKAGES[packageId]) {

            return res.status(400).json({
                success: false,
                message: "Invalid membership package."
            });

        }


        /* -------------------------------
           Validate phone
        -------------------------------- */

        const normalizedPhone = normalizePhone(phone);

        if (!normalizedPhone) {

            return res.status(400).json({
                success: false,
                message:
                    "Enter a valid Kenyan M-PESA number, e.g. 0712345678."
            });

        }


        /* -------------------------------
           Configuration check
        -------------------------------- */

        if (
            !MPESA_CONSUMER_KEY ||
            !MPESA_CONSUMER_SECRET ||
            !MPESA_SHORTCODE ||
            !MPESA_PASSKEY ||
            !BASE_URL
        ) {

            return res.status(500).json({
                success: false,
                message:
                    "Daraja configuration is incomplete. Check your .env file."
            });

        }


        const selectedPackage = PACKAGES[packageId];

        const amount = selectedPackage.amount;

        const paymentId = createPaymentId();


        /* -------------------------------
           Create access token
        -------------------------------- */

        const accessToken = await getAccessToken();


        /* -------------------------------
           Timestamp
        -------------------------------- */

        const timestamp = generateTimestamp();


        /* -------------------------------
           Password
        -------------------------------- */

        const password = generatePassword(timestamp);


        /* -------------------------------
           Callback URL
        -------------------------------- */

        const callbackUrl =
            `${BASE_URL.replace(/\/$/, "")}/api/mpesa/callback`;


        /* -------------------------------
           STK Push request
        -------------------------------- */

        const stkPayload = {

            BusinessShortCode: Number(MPESA_SHORTCODE),

            Password: password,

            Timestamp: timestamp,

            TransactionType: "CustomerPayBillOnline",

            Amount: amount,

            PartyA: Number(normalizedPhone),

            PartyB: Number(MPESA_SHORTCODE),

            PhoneNumber: Number(normalizedPhone),

            CallBackURL: callbackUrl,

            AccountReference: paymentId,

            TransactionDesc:
                `${selectedPackage.name} Membership Activation`

        };


        const stkResponse = await axios.post(

            `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,

            stkPayload,

            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json"
                },

                timeout: 30000
            }

        );


        const result = stkResponse.data;


        /* -------------------------------
           Save payment
        -------------------------------- */

        payments.set(paymentId, {

            paymentId,

            packageId,

            packageName: selectedPackage.name,

            amount,

            phone: normalizedPhone,

            merchantRequestId:
                result.MerchantRequestID || null,

            checkoutRequestId:
                result.CheckoutRequestID || null,

            responseCode:
                result.ResponseCode || null,

            status:
                result.ResponseCode === "0"
                    ? "pending"
                    : "failed",

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        });


        /* -------------------------------
           Return response
        -------------------------------- */

        if (result.ResponseCode === "0") {

            return res.json({

                success: true,

                message:
                    "STK Push sent successfully. Check your phone and enter your M-PESA PIN.",

                paymentId,

                checkoutRequestId:
                    result.CheckoutRequestID,

                merchantRequestId:
                    result.MerchantRequestID,

                customerMessage:
                    result.CustomerMessage ||

                    "Please check your phone for the M-PESA prompt."

            });

        }


        return res.status(400).json({

            success: false,

            message:
                result.ResponseDescription ||
                result.errorMessage ||
                "M-PESA request was not accepted.",

            data: result

        });

    }

    catch (error) {

        console.error(
            "STK PUSH ERROR:",
            error.response?.data ||
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                error.response?.data?.errorMessage ||
                error.response?.data?.ResponseDescription ||
                "Unable to initiate M-PESA payment.",

            error:
                error.response?.data || null

        });

    }

});


/* =========================================================
   M-PESA CALLBACK
========================================================= */

app.post("/api/mpesa/callback", (req, res) => {

    try {

        console.log(
            "===================================="
        );

        console.log(
            "M-PESA CALLBACK RECEIVED"
        );

        console.log(
            JSON.stringify(
                req.body,
                null,
                2
            )
        );

        console.log(
            "===================================="
        );


        const stkCallback =
            req.body?.Body?.stkCallback;


        if (!stkCallback) {

            return res.json({
                ResultCode: 0,
                ResultDesc: "Accepted"
            });

        }


        const checkoutRequestId =
            stkCallback.CheckoutRequestID;


        /* -------------------------------
           Find payment
        -------------------------------- */

        let payment = null;

        for (const item of payments.values()) {

            if (
                item.checkoutRequestId ===
                checkoutRequestId
            ) {

                payment = item;

                break;

            }

        }


        /* -------------------------------
           Payment cancelled / failed
        -------------------------------- */

        if (
            Number(stkCallback.ResultCode) !== 0
        ) {

            if (payment) {

                payment.status = "failed";

                payment.resultCode =
                    stkCallback.ResultCode;

                payment.resultDescription =
                    stkCallback.ResultDesc;

                payment.updatedAt =
                    new Date().toISOString();

            }

            return res.json({

                ResultCode: 0,

                ResultDesc: "Callback received"

            });

        }


        /* -------------------------------
           Successful payment
        -------------------------------- */

        const metadata =
            stkCallback.CallbackMetadata?.Item || [];


        const values = {};


        for (const item of metadata) {

            if (item.Name) {

                values[item.Name] =
                    item.Value;

            }

        }


        if (payment) {

            payment.status = "paid";

            payment.resultCode =
                stkCallback.ResultCode;

            payment.resultDescription =
                stkCallback.ResultDesc;

            payment.mpesaReceiptNumber =
                values.MpesaReceiptNumber || null;

            payment.transactionDate =
                values.TransactionDate || null;

            payment.phoneNumber =
                values.PhoneNumber || payment.phone;

            payment.amountPaid =
                values.Amount || payment.amount;

            payment.updatedAt =
                new Date().toISOString();

        }


        console.log(
            "PAYMENT SUCCESS:",
            payment
        );


        return res.json({

            ResultCode: 0,

            ResultDesc:
                "Callback received successfully"

        });

    }

    catch (error) {

        console.error(
            "CALLBACK ERROR:",
            error
        );

        return res.json({

            ResultCode: 0,

            ResultDesc:
                "Callback received"

        });

    }

});


/* =========================================================
   PAYMENT STATUS
========================================================= */

app.get("/api/payment/:paymentId", (req, res) => {

    const payment =
        payments.get(req.params.paymentId);


    if (!payment) {

        return res.status(404).json({

            success: false,

            message:
                "Payment not found."

        });

    }


    res.json({

        success: true,

        payment

    });

});


/* =========================================================
   FRONTEND FALLBACK
========================================================= */

app.get("*splat", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {

    console.log(
        `ONLINE SPHERE running on port ${PORT}`
    );

    console.log(
        `M-PESA environment: ${
            IS_SANDBOX
                ? "SANDBOX"
                : "PRODUCTION"
        }`
    );

});
