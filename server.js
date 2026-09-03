require("dotenv").config();

const express = require("express");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

/*
=========================================================
ONLINE SPHERE MEMBERSHIP PRICES
=========================================================
*/

const PACKAGES = {
    Bronze: 1000,
    Silver: 1750,
    Gold: 2500
};


/*
=========================================================
HEALTH CHECK
=========================================================
*/

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "Online Sphere Daraja backend is running."
    });

});


/*
=========================================================
CHECK PACKAGE PRICE
=========================================================
*/

app.get("/api/package/:packageName", (req, res) => {

    const packageName = req.params.packageName;

    const amount = PACKAGES[packageName];

    if (!amount) {

        return res.status(400).json({
            success: false,
            message: "Invalid membership package."
        });

    }

    res.json({
        success: true,
        package: packageName,
        amount: amount
    });

});


/*
=========================================================
STK PUSH
=========================================================
*/

app.post("/api/mpesa/stkpush", async (req, res) => {

    try {

        const {
            phone,
            packageName
        } = req.body;


        /*
        -----------------------------------------------
        VALIDATE PACKAGE
        -----------------------------------------------
        */

        if (!packageName || !PACKAGES[packageName]) {

            return res.status(400).json({
                success: false,
                message: "Invalid membership package."
            });

        }


        /*
        -----------------------------------------------
        GET AMOUNT FROM SERVER
        -----------------------------------------------
        */

        const amount = PACKAGES[packageName];


        /*
        -----------------------------------------------
        VALIDATE PHONE
        -----------------------------------------------
        */

        if (!phone) {

            return res.status(400).json({
                success: false,
                message: "M-Pesa phone number is required."
            });

        }


        /*
        -----------------------------------------------
        CONVERT PHONE TO 254 FORMAT
        -----------------------------------------------
        */

        let phoneNumber = String(phone)
            .replace(/\s+/g, "")
            .replace(/^\+/, "");


        if (phoneNumber.startsWith("07")) {

            phoneNumber =
                "254" + phoneNumber.substring(1);

        }

        else if (phoneNumber.startsWith("01")) {

            phoneNumber =
                "254" + phoneNumber.substring(1);

        }


        /*
        -----------------------------------------------
        VALIDATE FINAL PHONE
        -----------------------------------------------
        */

        if (!/^254[17]\d{8}$/.test(phoneNumber)) {

            return res.status(400).json({
                success: false,
                message: "Invalid Kenyan M-Pesa number."
            });

        }


        /*
        -----------------------------------------------
        TEMPORARY RESPONSE
        -----------------------------------------------

        The Daraja credentials will be connected
        in the next step.
        -----------------------------------------------
        */

        console.log("M-Pesa activation request:");

        console.log({
            package: packageName,
            amount: amount,
            phone: phoneNumber
        });


        res.json({

            success: true,

            message:
                "Payment request received. Daraja STK Push will be connected next.",

            package: packageName,

            amount: amount,

            phone: phoneNumber

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "An error occurred while processing the payment."

        });

    }

});


/*
=========================================================
MPESA CALLBACK
=========================================================
*/

app.post("/api/mpesa/callback", (req, res) => {

    console.log(
        "M-Pesa Callback Received:"
    );

    console.log(
        JSON.stringify(req.body, null, 2)
    );


    /*
    -----------------------------------------------
    Always acknowledge Safaricom callback
    -----------------------------------------------
    */

    res.json({

        ResultCode: 0,

        ResultDesc: "Accepted"

    });

});


/*
=========================================================
START SERVER
=========================================================
*/

app.listen(PORT, () => {

    console.log(
        `Online Sphere server running on port ${PORT}`
    );

});
