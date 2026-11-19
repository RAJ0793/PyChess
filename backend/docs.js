
/* =========================================
   PyChess Documentation — JavaScript
   ========================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // ELEMENTS
    // =====================================

    const html = document.documentElement;

    const themeToggle = document.getElementById("themeToggle");
    const mobileMenuToggle = document.getElementById("mobileMenuToggle");

    const sidebar = document.getElementById("leftSidebar");
    const overlay = document.getElementById("mobileOverlay");

    const searchInput = document.getElementById("docSearch");
    const searchResults = document.getElementById("searchResults");

    const navLinks = [...document.querySelectorAll(".nav-link")];
    const tocLinks = [...document.querySelectorAll(".toc-link")];

    const sections = [...document.querySelectorAll(".doc-section")];

    // =====================================
    // THEME MANAGEMENT
    // =====================================

    const savedTheme = localStorage.getItem("pychess-docs-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
        html.dataset.theme = savedTheme;
    }

    function updateThemeButton() {

        const theme = html.dataset.theme;

        themeToggle?.setAttribute(
            "aria-label",
            theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
        );

    }

    themeToggle?.addEventListener("click", () => {

        const currentTheme = html.dataset.theme;

        const nextTheme =
            currentTheme === "dark" ? "light" : "dark";

        html.dataset.theme = nextTheme;

        localStorage.setItem(
            "pychess-docs-theme",
            nextTheme
        );

        updateThemeButton();

    });

    updateThemeButton();

    // =====================================
    // MOBILE SIDEBAR
    // =====================================

    function openSidebar() {

        sidebar?.classList.add("open");
        overlay?.classList.add("visible");

        mobileMenuToggle?.setAttribute("aria-expanded", "true");
        overlay?.setAttribute("aria-hidden", "false");

        document.body.style.overflow = "hidden";

    }

    function closeSidebar() {

        sidebar?.classList.remove("open");
        overlay?.classList.remove("visible");

        mobileMenuToggle?.setAttribute("aria-expanded", "false");
        overlay?.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";

    }

    mobileMenuToggle?.addEventListener("click", () => {

        const isOpen = sidebar.classList.contains("open");

        isOpen ? closeSidebar() : openSidebar();

    });

    overlay?.addEventListener("click", closeSidebar);

    navLinks.forEach(link => {

        link.addEventListener("click", () => {

            if (window.innerWidth <= 760) {
                closeSidebar();
            }

        });

    });

    window.addEventListener("resize", () => {

        if (window.innerWidth > 760) {
            closeSidebar();
        }

    });

    // =====================================
    // COLLAPSIBLE SIDEBAR CATEGORIES
    // =====================================

    document.querySelectorAll(".category-toggle").forEach(button => {

        button.addEventListener("click", () => {

            const expanded =
                button.getAttribute("aria-expanded") === "true";

            const list = button.nextElementSibling;

            button.setAttribute(
                "aria-expanded",
                String(!expanded)
            );

            list?.classList.toggle("collapsed", expanded);

        });

    });

    // =====================================
    // ACTIVE SECTION TRACKING
    // =====================================

    function setActiveSection(id) {

        [...navLinks, ...tocLinks].forEach(link => {

            const active = link.getAttribute("href") === `#${id}`;

            link.classList.toggle("active", active);

        });

    }

    if ("IntersectionObserver" in window) {

        const observer = new IntersectionObserver(entries => {

            const visible = entries
                .filter(entry => entry.isIntersecting)
                .sort((a, b) =>
                    b.intersectionRatio - a.intersectionRatio
                );

            if (visible.length > 0) {
                setActiveSection(visible[0].target.id);
            }

        }, {
            rootMargin: "-15% 0px -65% 0px",
            threshold: [0, 0.2, 0.5, 1]
        });

        sections.forEach(section => observer.observe(section));

    }

    // =====================================
    // DOCUMENTATION SEARCH
    // =====================================

    const searchableSections = sections.map(section => {

        const heading = section.querySelector("h1, h2");

        return {
            id: section.id,
            title: heading?.textContent.trim() || section.id,
            text: section.textContent.toLowerCase()
        };

    });

    function performSearch(query) {

        searchResults.innerHTML = "";

        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
            searchResults.classList.remove("visible");
            return;
        }

        const results = searchableSections.filter(section => {

            return (
                section.title.toLowerCase().includes(normalizedQuery) ||
                section.text.includes(normalizedQuery)
            );

        });

        if (results.length === 0) {

            searchResults.innerHTML =
                '<div class="search-empty">No documentation found.</div>';

        } else {

            results.slice(0, 8).forEach(section => {

                const link = document.createElement("a");

                link.className = "search-result";
                link.href = `#${section.id}`;

                const title = document.createElement("strong");
                title.textContent = section.title;

                const description = document.createElement("small");
                description.textContent = "PyChess Documentation";

                link.append(title, description);

                link.addEventListener("click", () => {

                    searchResults.classList.remove("visible");
                    searchInput.value = "";

                });

                searchResults.appendChild(link);

            });

        }

        searchResults.classList.add("visible");

    }

    searchInput?.addEventListener("input", event => {

        performSearch(event.target.value);

    });

    searchInput?.addEventListener("focus", () => {

        if (searchInput.value.trim()) {
            performSearch(searchInput.value);
        }

    });

    document.addEventListener("click", event => {

        if (!event.target.closest(".search-wrapper")) {
            searchResults?.classList.remove("visible");
        }

    });

    // =====================================
    // KEYBOARD SHORTCUTS
    // =====================================

    document.addEventListener("keydown", event => {

        const isMac = navigator.platform
            .toUpperCase()
            .includes("MAC");

        const modifier = isMac ? event.metaKey : event.ctrlKey;

        if (modifier && event.key.toLowerCase() === "k") {

            event.preventDefault();

            searchInput?.focus();
            searchInput?.select();

        }

        if (event.key === "Escape") {

            closeSidebar();

            searchResults?.classList.remove("visible");

            if (document.activeElement === searchInput) {
                searchInput.blur();
            }

        }

    });

    // =====================================
    // COPY CODE BUTTONS
    // =====================================

    document.querySelectorAll(".copy-btn").forEach(button => {

        button.addEventListener("click", async () => {

            const codeBlock = button.closest(".code-block");
            const code = codeBlock?.querySelector("pre code");

            if (!code) return;

            const originalText = button.textContent;

            try {

                await navigator.clipboard.writeText(code.textContent);

                button.textContent = "Copied!";

            } catch (error) {

                // Fallback for browsers without Clipboard API access.

                const textarea = document.createElement("textarea");

                textarea.value = code.textContent;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";

                document.body.appendChild(textarea);

                textarea.select();

                const copied = document.execCommand("copy");

                textarea.remove();

                button.textContent = copied
                    ? "Copied!"
                    : "Copy failed";

            }

            setTimeout(() => {

                button.textContent = originalText;

            }, 1800);

        });

    });

    // =====================================
    // INITIAL HASH NAVIGATION
    // =====================================

    function syncInitialHash() {

        const id = decodeURIComponent(
            window.location.hash.slice(1)
        );

        if (id && document.getElementById(id)) {
            setActiveSection(id);
        }

    }

    syncInitialHash();

    window.addEventListener("hashchange", syncInitialHash);

});
