const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

const JWT_SECRET =
    process.env.SESSION_SECRET ||
    "development-only-change-this-secret";


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


/* =========================================================
   DATABASE
========================================================= */

const databaseDirectory =
    path.join(__dirname, "database");

const databaseFile =
    path.join(
        databaseDirectory,
        "online-sphere.db"
    );

const fs = require("fs");

if (!fs.existsSync(databaseDirectory)) {
    fs.mkdirSync(databaseDirectory, {
        recursive: true
    });
}

const db = new Database(databaseFile);

db.pragma("foreign_keys = ON");


/* =========================================================
   DATABASE TABLES
========================================================= */

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        account_number TEXT UNIQUE NOT NULL,
        balance INTEGER DEFAULT 0,
        currency TEXT DEFAULT 'KES',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        reference TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

        FOREIGN KEY (account_id)
        REFERENCES accounts(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );
`);


/* =========================================================
   FRONTEND
========================================================= */

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


/* =========================================================
   HELPERS
========================================================= */

function createAccountNumber() {

    return (
        "OS" +
        Date.now().toString().slice(-8) +
        crypto.randomInt(100, 999)
    );

}


function createToken(user) {

    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );

}


function authenticate(req, res, next) {

    const header =
        req.headers.authorization;

    if (!header) {

        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });

    }

    const token =
        header.startsWith("Bearer ")
            ? header.substring(7)
            : null;

    if (!token) {

        return res.status(401).json({
            success: false,
            message: "Invalid authentication token."
        });

    }

    try {

        req.user =
            jwt.verify(
                token,
                JWT_SECRET
            );

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Session expired or invalid."
        });

    }

}


/* =========================================================
   STATUS
========================================================= */

app.get(
    "/api/status",
    (req, res) => {

        res.json({
            success: true,
            app: "Online Sphere",
            status: "online",
            version: "1.0.0"
        });

    }
);


/* =========================================================
   REGISTER
========================================================= */

app.post(
    "/api/auth/register",
    async (req, res) => {

        try {

            const {
                fullName,
                email,
                phone,
                password
            } = req.body;

            if (
                !fullName ||
                !email ||
                !password
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Full name, email and password are required."
                });

            }

            if (password.length < 8) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Password must contain at least 8 characters."
                });

            }

            const normalizedEmail =
                email.trim().toLowerCase();

            const existingUser =
                db.prepare(`
                    SELECT id
                    FROM users
                    WHERE email = ?
                `).get(normalizedEmail);

            if (existingUser) {

                return res.status(409).json({
                    success: false,
                    message:
                        "An account with this email already exists."
                });

            }

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );

            const createUser =
                db.transaction(() => {

                    const userResult =
                        db.prepare(`
                            INSERT INTO users
                            (
                                full_name,
                                email,
                                phone,
                                password_hash
                            )
                            VALUES (?, ?, ?, ?)
                        `).run(
                            fullName.trim(),
                            normalizedEmail,
                            phone || null,
                            passwordHash
                        );

                    const userId =
                        userResult.lastInsertRowid;

                    const accountNumber =
                        createAccountNumber();

                    db.prepare(`
                        INSERT INTO accounts
                        (
                            user_id,
                            account_number
                        )
                        VALUES (?, ?)
                    `).run(
                        userId,
                        accountNumber
                    );

                    return {
                        userId,
                        accountNumber
                    };

                });

            const token =
                createToken({
                    id: createUser.userId,
                    email: normalizedEmail
                });

            res.status(201).json({
                success: true,
                message:
                    "Account created successfully.",
                token,
                accountNumber:
                    createUser.accountNumber
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message:
                    "Unable to create account."
            });

        }

    }
);


/* =========================================================
   LOGIN
========================================================= */

app.post(
    "/api/auth/login",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;

            if (!email || !password) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Email and password are required."
                });

            }

            const user =
                db.prepare(`
                    SELECT *
                    FROM users
                    WHERE email = ?
                `).get(
                    email.trim().toLowerCase()
                );

            if (!user) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid email or password."
                });

            }

            const passwordMatches =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );

            if (!passwordMatches) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid email or password."
                });

            }

            const token =
                createToken(user);

            res.json({
                success: true,
                message:
                    "Login successful.",
                token
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message:
                    "Unable to log in."
            });

        }

    }
);


/* =========================================================
   CURRENT USER
========================================================= */

app.get(
    "/api/auth/me",
    authenticate,
    (req, res) => {

        const user =
            db.prepare(`
                SELECT
                    id,
                    full_name,
                    email,
                    phone,
                    created_at
                FROM users
                WHERE id = ?
            `).get(req.user.id);

        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });

        }

        res.json({
            success: true,
            user
        });

    }
);


/* =========================================================
   ACCOUNT
========================================================= */

app.get(
    "/api/account",
    authenticate,
    (req, res) => {

        const account =
            db.prepare(`
                SELECT
                    account_number,
                    balance,
                    currency,
                    status,
                    created_at
                FROM accounts
                WHERE user_id = ?
            `).get(req.user.id);

        if (!account) {

            return res.status(404).json({
                success: false,
                message:
                    "Account not found."
            });

        }

        res.json({
            success: true,
            account
        });

    }
);


/* =========================================================
   TRANSACTIONS
========================================================= */

app.get(
    "/api/transactions",
    authenticate,
    (req, res) => {

        const transactions =
            db.prepare(`
                SELECT
                    id,
                    type,
                    amount,
                    status,
                    reference,
                    description,
                    created_at
                FROM transactions
                WHERE user_id = ?
                ORDER BY id DESC
                LIMIT 50
            `).all(req.user.id);

        res.json({
            success: true,
            transactions
        });

    }
);


/* =========================================================
   DEMO DEPOSIT REQUEST
========================================================= */

app.post(
    "/api/deposit",
    authenticate,
    (req, res) => {

        const amount =
            Number(req.body.amount);

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Enter a valid amount."
            });

        }

        const account =
            db.prepare(`
                SELECT id
                FROM accounts
                WHERE user_id = ?
            `).get(req.user.id);

        if (!account) {

            return res.status(404).json({
                success: false,
                message:
                    "Account not found."
            });

        }

        const reference =
            "DEMO-" +
            crypto.randomBytes(5)
                .toString("hex")
                .toUpperCase();

        db.prepare(`
            INSERT INTO transactions
            (
                user_id,
                account_id,
                type,
                amount,
                status,
                reference,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            req.user.id,
            account.id,
            "deposit",
            Math.round(amount),
            "pending",
            reference,
            "Demo deposit request"
        );

        res.status(201).json({
            success: true,
            message:
                "Deposit request created.",
            reference,
            status: "pending"
        });

    }
);


/* =========================================================
   DEMO WITHDRAWAL REQUEST
========================================================= */

app.post(
    "/api/withdraw",
    authenticate,
    (req, res) => {

        const amount =
            Number(req.body.amount);

        const phone =
            String(
                req.body.phone || ""
            ).trim();

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Enter a valid amount."
            });

        }

        if (!phone) {

            return res.status(400).json({
                success: false,
                message:
                    "Phone number is required."
            });

        }

        const account =
            db.prepare(`
                SELECT id
                FROM accounts
                WHERE user_id = ?
            `).get(req.user.id);

        if (!account) {

            return res.status(404).json({
                success: false,
                message:
                    "Account not found."
            });

        }

        const reference =
            "WD-" +
            crypto.randomBytes(5)
                .toString("hex")
                .toUpperCase();

        db.prepare(`
            INSERT INTO transactions
            (
                user_id,
                account_id,
                type,
                amount,
                status,
                reference,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            req.user.id,
            account.id,
            "withdrawal",
            Math.round(amount),
            "pending",
            reference,
            `Demo withdrawal request for ${phone}`
        );

        res.status(201).json({
            success: true,
            message:
                "Withdrawal request created.",
            reference,
            status: "pending"
        });

    }
);


/* =========================================================
   FRONTEND FALLBACK
========================================================= */

app.get(
    "*",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );

    }
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    () => {

        console.log(
            `Online Sphere running on port ${PORT}`
        );

    }
);
