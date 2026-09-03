/* =========================================================
   ONLINE SPHERE — MAIN JAVASCRIPT
   Version: Advanced UI
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* ---------------------------------------------------------
       HELPERS
    --------------------------------------------------------- */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    /* ---------------------------------------------------------
       PAGE LOADER
    --------------------------------------------------------- */

    const pageLoader = $(".page-loader");

    if (pageLoader) {
        setTimeout(() => {
            pageLoader.classList.add("hidden");

            setTimeout(() => {
                pageLoader.style.display = "none";
            }, 500);
        }, 700);
    }

    /* ---------------------------------------------------------
       MOBILE MENU
    --------------------------------------------------------- */

    const menuBtn = $(".menu-btn");
    const nav = $("nav");

    if (menuBtn && nav) {
        menuBtn.addEventListener("click", () => {
            nav.classList.toggle("active");
            menuBtn.classList.toggle("active");
        });

        $$("nav a").forEach(link => {
            link.addEventListener("click", () => {
                nav.classList.remove("active");
                menuBtn.classList.remove("active");
            });
        });
    }

    /* ---------------------------------------------------------
       THEME SWITCHER
    --------------------------------------------------------- */

    const themeButton = $(".theme-button");

    const savedTheme =
        localStorage.getItem("onlineSphereTheme");

    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
    }

    function updateThemeIcon() {
        if (!themeButton) return;

        const lightMode =
            document.body.classList.contains("light-theme");

        themeButton.textContent = lightMode ? "☀️" : "🌙";

        themeButton.setAttribute(
            "aria-label",
            lightMode
                ? "Switch to dark mode"
                : "Switch to light mode"
        );
    }

    updateThemeIcon();

    if (themeButton) {
        themeButton.addEventListener("click", () => {

            document.body.classList.toggle("light-theme");

            const isLight =
                document.body.classList.contains("light-theme");

            localStorage.setItem(
                "onlineSphereTheme",
                isLight ? "light" : "dark"
            );

            updateThemeIcon();

            showToast(
                "Theme Updated",
                isLight
                    ? "Light mode enabled."
                    : "Dark mode enabled."
            );
        });
    }

    /* ---------------------------------------------------------
       SMOOTH SCROLLING
    --------------------------------------------------------- */

    $$('a[href^="#"]').forEach(link => {

        link.addEventListener("click", event => {

            const targetId =
                link.getAttribute("href");

            if (!targetId || targetId === "#") return;

            const target =
                document.querySelector(targetId);

            if (target) {
                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });

    });

    /* ---------------------------------------------------------
       BACK TO TOP
    --------------------------------------------------------- */

    const backToTop = $(".back-to-top");

    function updateBackToTop() {

        if (!backToTop) return;

        if (window.scrollY > 500) {
            backToTop.classList.add("visible");
        } else {
            backToTop.classList.remove("visible");
        }
    }

    window.addEventListener(
        "scroll",
        updateBackToTop,
        { passive: true }
    );

    updateBackToTop();

    if (backToTop) {
        backToTop.addEventListener("click", () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        });
    }

    /* ---------------------------------------------------------
       TOAST NOTIFICATION
    --------------------------------------------------------- */

    const toast = $(".toast");
    const toastTitle = toast
        ? $("strong", toast)
        : null;

    const toastMessage = toast
        ? $("p", toast)
        : null;

    const toastClose = toast
        ? $("button", toast)
        : null;

    let toastTimer;

    function showToast(
        title = "Online Sphere",
        message = "Action completed.",
        type = "success"
    ) {

        if (!toast) return;

        if (toastTitle) {
            toastTitle.textContent = title;
        }

        if (toastMessage) {
            toastMessage.textContent = message;
        }

        toast.classList.remove("warning");

        if (type === "warning") {
            toast.classList.add("warning");
        }

        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 4000);
    }

    if (toastClose) {
        toastClose.addEventListener("click", () => {
            toast.classList.remove("show");
        });
    }

    /* ---------------------------------------------------------
       MODALS
    --------------------------------------------------------- */

    const modals = $$(".modal");

    function openModal(selector) {

        const modal = $(selector);

        if (!modal) return;

        modal.classList.add("active");

        document.body.classList.add("modal-open");
    }

    function closeModal(modal) {

        if (!modal) return;

        modal.classList.remove("active");

        const anotherOpen =
            modals.some(item =>
                item.classList.contains("active")
            );

        if (!anotherOpen) {
            document.body.classList.remove("modal-open");
        }
    }

    /* Close buttons */

    $$(".modal-close").forEach(button => {

        button.addEventListener("click", () => {

            closeModal(
                button.closest(".modal")
            );

        });

    });

    /* Click outside modal */

    $$(".modal-overlay").forEach(overlay => {

        overlay.addEventListener("click", () => {

            closeModal(
                overlay.closest(".modal")
            );

        });

    });

    /* Escape key */

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            modals.forEach(modal => {
                closeModal(modal);
            });

        }

    });

    /* ---------------------------------------------------------
       DEPOSIT / WITHDRAW BUTTONS
    --------------------------------------------------------- */

    const depositButton =
        $(".deposit-action");

    const withdrawButton =
        $(".withdraw-action");

    if (depositButton) {

        depositButton.addEventListener(
            "click",
            () => {

                openModal("#depositModal");

            }
        );

    }

    if (withdrawButton) {

        withdrawButton.addEventListener(
            "click",
            () => {

                openModal("#withdrawModal");

            }
        );

    }

    /* ---------------------------------------------------------
       DEMO DEPOSIT FORM
       NOTE:
       This interface does NOT process real payments.
    --------------------------------------------------------- */

    const depositForm =
        $("#depositForm");

    if (depositForm) {

        depositForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const modal =
                    depositForm.closest(".modal");

                closeModal(modal);

                showToast(
                    "Request Received",
                    "This is a demonstration interface. No payment was processed."
                );

                depositForm.reset();

            }
        );

    }

    /* ---------------------------------------------------------
       DEMO WITHDRAW FORM
       NOTE:
       This interface does NOT process real withdrawals.
    --------------------------------------------------------- */

    const withdrawForm =
        $("#withdrawForm");

    if (withdrawForm) {

        withdrawForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const modal =
                    withdrawForm.closest(".modal");

                closeModal(modal);

                showToast(
                    "Request Received",
                    "This is a demonstration interface. No withdrawal was processed.",
                    "warning"
                );

                withdrawForm.reset();

            }
        );

    }

    /* ---------------------------------------------------------
       SECURITY SCREEN
    --------------------------------------------------------- */

    const securityScreen =
        $(".security-screen");

    const securityForm =
        $("#securityForm");

    const accessGranted =
        localStorage.getItem(
            "onlineSphereAccess"
        );

    if (
        securityScreen &&
        accessGranted === "granted"
    ) {

        securityScreen.classList.add(
            "security-hidden"
        );

    }

    if (securityForm) {

        securityForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                securityScreen?.classList.add(
                    "security-hidden"
                );

                localStorage.setItem(
                    "onlineSphereAccess",
                    "granted"
                );

                showToast(
                    "Access Granted",
                    "Welcome to Online Sphere."
                );

            }
        );

    }

    /* ---------------------------------------------------------
       PROFILE BUTTON
    --------------------------------------------------------- */

    const profileButton =
        $(".profile-button");

    if (profileButton) {

        profileButton.addEventListener(
            "click",
            () => {

                showToast(
                    "Profile",
                    "Profile management will be available in the next update."
                );

            }
        );

    }

    /* ---------------------------------------------------------
       FEATURE LINKS
    --------------------------------------------------------- */

    $$(".feature-link").forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const href =
                    link.getAttribute("href");

                if (!href || href === "#") {

                    event.preventDefault();

                    showToast(
                        "Online Sphere",
                        "This feature is ready for the next development stage."
                    );

                }

            }
        );

    });

    /* ---------------------------------------------------------
       ACTION BUTTONS
    --------------------------------------------------------- */

    $$(".primary-btn, .secondary-btn, .primary-small, .outline-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    const href =
                        button.getAttribute("href");

                    const text =
                        button.textContent
                            .trim()
                            .toLowerCase();

                    /*
                     * Don't interfere with actual links.
                     */

                    if (
                        href &&
                        href !== "#"
                    ) {
                        return;
                    }

                    /*
                     * Deposit and withdrawal
                     * are handled separately.
                     */

                    if (
                        button.classList.contains(
                            "deposit-action"
                        ) ||
                        button.classList.contains(
                            "withdraw-action"
                        )
                    ) {
                        return;
                    }

                    event.preventDefault();

                    if (
                        text.includes("support") ||
                        text.includes("help")
                    ) {

                        showToast(
                            "Support",
                            "Support centre is ready for integration."
                        );

                    } else if (
                        text.includes("explore")
                    ) {

                        const features =
                            document.querySelector(
                                "#features"
                            );

                        if (features) {

                            features.scrollIntoView({
                                behavior: "smooth"
                            });

                        }

                    } else {

                        showToast(
                            "Online Sphere",
                            "This feature is ready for the next development stage."
                        );

                    }

                }
            );

        });

    /* ---------------------------------------------------------
       ACTIVE NAVIGATION
    --------------------------------------------------------- */

    const sections =
        $$("section[id]");

    const navLinks =
        $$('nav a[href^="#"]');

    function updateActiveNavigation() {

        const scrollPosition =
            window.scrollY + 180;

        let currentSection = "";

        sections.forEach(section => {

            const sectionTop =
                section.offsetTop;

            const sectionHeight =
                section.offsetHeight;

            if (
                scrollPosition >= sectionTop &&
                scrollPosition <
                    sectionTop + sectionHeight
            ) {

                currentSection =
                    section.getAttribute("id");

            }

        });

        navLinks.forEach(link => {

            link.classList.remove("active");

            const href =
                link.getAttribute("href");

            if (
                currentSection &&
                href === `#${currentSection}`
            ) {

                link.classList.add("active");

            }

        });

    }

    window.addEventListener(
        "scroll",
        updateActiveNavigation,
        { passive: true }
    );

    updateActiveNavigation();

    /* ---------------------------------------------------------
       NUMBER COUNTER ANIMATION
    --------------------------------------------------------- */

    const counters =
        $$(".counter");

    function animateCounter(element) {

        const target =
            Number(
                element.dataset.target ||
                element.textContent.replace(
                    /[^0-9.]/g,
                    ""
                )
            );

        if (!target) return;

        const duration = 1200;

        const startTime =
            performance.now();

        function update(currentTime) {

            const progress =
                Math.min(
                    (currentTime - startTime) /
                    duration,
                    1
                );

            const value =
                Math.floor(
                    progress * target
                );

            element.textContent =
                value.toLocaleString();

            if (progress < 1) {

                requestAnimationFrame(update);

            } else {

                element.textContent =
                    target.toLocaleString();

            }

        }

        requestAnimationFrame(update);
    }

    /* ---------------------------------------------------------
       INTERSECTION OBSERVER
    --------------------------------------------------------- */

    if ("IntersectionObserver" in window) {

        const observer =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "in-view"
                            );

                            if (
                                entry.target.classList
                                    .contains("counter")
                            ) {

                                if (
                                    !entry.target.dataset.animated
                                ) {

                                    entry.target.dataset.animated =
                                        "true";

                                    animateCounter(
                                        entry.target
                                    );

                                }

                            }

                        }

                    });

                },
                {
                    threshold: 0.15
                }
            );

        $$(
            ".feature-card, .quick-stat, .security-item, .counter"
        ).forEach(element => {

            observer.observe(element);

        });

    }

    /* ---------------------------------------------------------
       AMOUNT INPUT FORMATTING
    --------------------------------------------------------- */

    $$(".amount-input").forEach(input => {

        input.addEventListener(
            "input",
            () => {

                let value =
                    input.value.replace(
                        /[^0-9]/g,
                        ""
                    );

                if (value) {

                    value =
                        Number(value)
                            .toLocaleString(
                                "en-KE"
                            );

                }

                /*
                 * Keep cursor-friendly simple value.
                 */

                input.dataset.rawValue =
                    value.replace(
                        /,/g,
                        ""
                    );

            }
        );

    });

    /* ---------------------------------------------------------
       PREVENT DOUBLE SUBMISSIONS
    --------------------------------------------------------- */

    $$("form").forEach(form => {

        form.addEventListener(
            "submit",
            () => {

                const submitButton =
                    form.querySelector(
                        'button[type="submit"]'
                    );

                if (!submitButton) return;

                submitButton.dataset.originalText =
                    submitButton.textContent;

                submitButton.disabled = true;

                submitButton.textContent =
                    "Processing...";

                setTimeout(() => {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        submitButton.dataset.originalText ||
                        "Submit";

                }, 1500);

            }
        );

    });

    /* ---------------------------------------------------------
       CURRENT YEAR
    --------------------------------------------------------- */

    const yearElements =
        $$(".current-year");

    yearElements.forEach(element => {

        element.textContent =
            new Date().getFullYear();

    });

    /* ---------------------------------------------------------
       ONLINE STATUS
    --------------------------------------------------------- */

    function updateOnlineStatus() {

        const status =
            $(".account-status");

        if (!status) return;

        const statusText =
            status.querySelector("span:last-child");

        if (navigator.onLine) {

            if (statusText) {
                statusText.textContent =
                    "Online";
            }

            status.classList.remove(
                "offline"
            );

        } else {

            if (statusText) {
                statusText.textContent =
                    "Offline";
            }

            status.classList.add(
                "offline"
            );

        }

    }

    window.addEventListener(
        "online",
        updateOnlineStatus
    );

    window.addEventListener(
        "offline",
        updateOnlineStatus
    );

    updateOnlineStatus();

    /* ---------------------------------------------------------
       INITIAL READY MESSAGE
    --------------------------------------------------------- */

    setTimeout(() => {

        if (
            !sessionStorage.getItem(
                "onlineSphereWelcome"
            )
        ) {

            showToast(
                "Online Sphere",
                "Welcome to your advanced digital platform."
            );

            sessionStorage.setItem(
                "onlineSphereWelcome",
                "true"
            );

        }

    }, 1800);

});
