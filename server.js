const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
 * Serve the Online Sphere frontend
 */
app.use(express.static(path.join(__dirname, "public")));

/*
 * Basic API health check
 */
app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        app: "Online Sphere",
        status: "online",
        version: "1.0.0"
    });
});

/*
 * Demo account endpoint.
 *
 * This does NOT create real financial balances.
 */
app.get("/api/account", (req, res) => {
    res.json({
        success: true,
        account: {
            balance: 0,
            currency: "KES",
            status: "active"
        }
    });
});

/*
 * Demo deposit request.
 *
 * No real payment is processed here.
 */
app.post("/api/deposit", (req, res) => {

    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid amount."
        });
    }

    res.json({
        success: true,
        message:
            "Deposit request received. No payment was processed.",
        amount: Number(amount),
        currency: "KES"
    });
});

/*
 * Demo withdrawal request.
 *
 * No real withdrawal is processed here.
 */
app.post("/api/withdraw", (req, res) => {

    const { amount, phone } = req.body;

    if (!amount || Number(amount) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid withdrawal amount."
        });
    }

    if (!phone) {
        return res.status(400).json({
            success: false,
            message: "Phone number is required."
        });
    }

    res.json({
        success: true,
        message:
            "Withdrawal request received. No withdrawal was processed.",
        amount: Number(amount),
        phone: phone
    });
});

/*
 * Return the frontend for unknown browser routes.
 */
app.get("*", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

app.listen(PORT, () => {

    console.log(
        `Online Sphere running on port ${PORT}`
    );

});
