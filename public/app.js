let account = JSON.parse(
    localStorage.getItem("onlineSphereAccount")
) || {
    name: "Guest Member",
    balance: 0,
    deposits: 0,
    bonus: 0,
    transactions: []
};

function saveAccount() {
    localStorage.setItem(
        "onlineSphereAccount",
        JSON.stringify(account)
    );
}

function updateDisplay() {

    const balanceElements = [
        "balance",
        "accountBalance",
        "dashboardBalance"
    ];

    balanceElements.forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent =
                Number(account.balance).toFixed(2);
        }
    });

    const depositElements = [
        "totalDeposits",
        "dashboardDeposits"
    ];

    depositElements.forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent =
                Number(account.deposits).toFixed(2);
        }
    });

    const bonusElements = [
        "bonus",
        "dashboardBonus"
    ];

    bonusElements.forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent =
                Number(account.bonus).toFixed(2);
        }
    });

    const nameElement =
        document.getElementById("displayName");

    if (nameElement) {
        nameElement.textContent = account.name;
    }

    const count =
        document.getElementById("transactionCount");

    if (count) {
        count.textContent =
            account.transactions.length;
    }

    renderTransactions();
}

function enterPortal() {

    const input =
        document.getElementById("memberName");

    if (!input) return;

    const name =
        input.value.trim();

    if (!name) {
        alert("Please enter your name.");
        return;
    }

    account.name = name;

    saveAccount();

    const screen =
        document.getElementById("securityScreen");

    if (screen) {
        screen.style.display = "none";
    }

    updateDisplay();
}

function toggleMenu() {

    const navigation =
        document.getElementById("navigation");

    if (navigation) {
        navigation.classList.toggle("active");
    }
}

function showSection(id) {

    const section =
        document.getElementById(id);

    if (section) {
        section.scrollIntoView({
            behavior: "smooth"
        });
    }
}

function openModal(id) {

    const modal =
        document.getElementById(id);

    if (modal) {
        modal.classList.add("active");
    }
}

function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (modal) {
        modal.classList.remove("active");
    }
}

function processDeposit() {

    const amount =
        Number(
            document.getElementById(
                "depositAmount"
            )?.value
        );

    const phone =
        document.getElementById(
            "mpesaNumber"
        )?.value.trim();

    if (!amount || amount <= 0) {
        alert("Enter a valid deposit amount.");
        return;
    }

    if (!phone) {
        alert("Enter your M-Pesa number.");
        return;
    }

    account.balance += amount;
    account.deposits += amount;

    account.transactions.unshift({
        type: "Deposit",
        amount: amount,
        date: new Date().toLocaleString()
    });

    saveAccount();
    updateDisplay();

    closeModal("depositModal");

    alert(
        "Deposit recorded successfully. M-Pesa integration can be connected to the backend later."
    );
}

function processWithdrawal() {

    const amount =
        Number(
            document.getElementById(
                "withdrawAmount"
            )?.value
        );

    const phone =
        document.getElementById(
            "withdrawNumber"
        )?.value.trim();

    if (!amount || amount <= 0) {
        alert("Enter a valid withdrawal amount.");
        return;
    }

    if (!phone) {
        alert("Enter your M-Pesa number.");
        return;
    }

    if (amount > account.balance) {
        alert("Insufficient balance.");
        return;
    }

    account.balance -= amount;

    account.transactions.unshift({
        type: "Withdrawal",
        amount: amount,
        date: new Date().toLocaleString()
    });

    saveAccount();
    updateDisplay();

    closeModal("withdrawModal");

    alert(
        "Withdrawal request recorded successfully."
    );
}

function processDashboardDeposit() {

    const input =
        document.getElementById(
            "dashboardDepositAmount"
        );

    const amount =
        Number(input?.value);

    if (!amount || amount <= 0) {
        alert("Enter a valid amount.");
        return;
    }

    account.balance += amount;
    account.deposits += amount;

    account.transactions.unshift({
        type: "Deposit",
        amount: amount,
        date: new Date().toLocaleString()
    });

    saveAccount();
    updateDisplay();

    closeModal("depositModal");

    alert("Deposit recorded.");
}

function processDashboardWithdrawal() {

    const input =
        document.getElementById(
            "dashboardWithdrawAmount"
        );

    const amount =
        Number(input?.value);

    if (!amount || amount <= 0) {
        alert("Enter a valid amount.");
        return;
    }

    if (amount > account.balance) {
        alert("Insufficient balance.");
        return;
    }

    account.balance -= amount;

    account.transactions.unshift({
        type: "Withdrawal",
        amount: amount,
        date: new Date().toLocaleString()
    });

    saveAccount();
    updateDisplay();

    closeModal("withdrawModal");

    alert("Withdrawal request recorded.");
}

function renderTransactions() {

    const container =
        document.getElementById(
            "transactionList"
        );

    if (!container) return;

    if (
        !account.transactions ||
        account.transactions.length === 0
    ) {
        container.innerHTML = `
            <div class="empty-state">
                <div>📋</div>
                <p>No transactions yet.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        account.transactions
            .slice(0, 10)
            .map(transaction => `
                <div style="
                    width:100%;
                    padding:20px;
                    display:flex;
                    justify-content:space-between;
                    border-bottom:1px solid #e2e8f0;
                ">
                    <div>
                        <strong>
                            ${transaction.type}
                        </strong>

                        <small style="
                            display:block;
                            color:#64748b;
                        ">
                            ${transaction.date}
                        </small>
                    </div>

                    <strong>
                        KSh ${Number(
                            transaction.amount
                        ).toFixed(2)}
                    </strong>
                </div>
            `)
            .join("");
}

function contactSupport() {

    alert(
        "Support contact details will be added here."
    );
}

document.addEventListener(
    "DOMContentLoaded",
    updateDisplay
);
