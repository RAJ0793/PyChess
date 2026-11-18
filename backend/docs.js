document.addEventListener("DOMContentLoaded", () => {
    const html = document.documentElement;
    const body = document.body;

    const themeToggle = document.getElementById("themeToggle");
    const mobileMenuToggle = document.getElementById("mobileMenuToggle");
    const mobileOverlay = document.getElementById("mobileOverlay");
    const sidebar = document.getElementById("leftSidebar") || document.getElementById("sidebar");
    const searchInput = document.getElementById("docSearch");
    const searchResults = document.getElementById("searchResults");

    // ---------------------------------------
    // THEME MANAGEMENT
    // ---------------------------------------

    const savedTheme = localStorage.getItem("pychess-doc-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
        html.dataset.theme = savedTheme;
    }

    function updateThemeIcon() {
        if (!themeToggle) return;
    }

    updateThemeIcon();

    themeToggle?.addEventListener("click", () => {
        const nextTheme = html.dataset.theme === "dark" ? "light" : "dark";

        html.dataset.theme = nextTheme;
        localStorage.setItem("pychess-doc-theme", nextTheme);
        updateThemeIcon();
    });

    // ---------------------------------------
    // MOBILE SIDEBAR
    // ---------------------------------------

    function openMenu() {
        body.classList.add("menu-open");
        mobileMenuToggle?.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
        body.classList.remove("menu-open");
        mobileMenuToggle?.setAttribute("aria-expanded", "false");
    }

    mobileMenuToggle?.addEventListener("click", () => {
        body.classList.contains("menu-open") ? closeMenu() : openMenu();
    });

    mobileOverlay?.addEventListener("click", closeMenu);

    sidebar?.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeMenu();
            searchResults?.removeAttribute("open");
            searchResults?.setAttribute("hidden", "true");
            searchResults?.classList.remove("show");
        }
    });

    // ---------------------------------------
    // COLLAPSIBLE SIDEBAR GROUPS
    // ---------------------------------------

    document.querySelectorAll(".category-toggle, .sidebar-group-toggle").forEach(button => {
        button.addEventListener("click", () => {
            const groupList = button.nextElementSibling;
            const expanded = button.getAttribute("aria-expanded") === "true";

            button.setAttribute("aria-expanded", String(!expanded));
            if (groupList) {
                groupList.classList.toggle("collapsed", expanded);
            }

            const chevron = button.querySelector(".chevron");
            if (chevron) {
                chevron.style.transform = expanded ? "rotate(-90deg)" : "rotate(0deg)";
            }
        });
    });

    // ---------------------------------------
    // COPY CODE BUTTONS
    // ---------------------------------------

    document.querySelectorAll(".copy-btn, .copy-button").forEach(button => {
        button.addEventListener("click", async () => {
            const codeBlock = button.closest(".code-block");
            const code = codeBlock?.querySelector("code");

            if (!code) return;

            const originalText = button.textContent;

            try {
                await navigator.clipboard.writeText(code.innerText);
                button.textContent = "Copied!";
            } catch {
                const range = document.createRange();
                range.selectNodeContents(code);

                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);

                button.textContent = "Select & Copy";
            }

            setTimeout(() => {
                button.textContent = originalText;
            }, 1600);
        });
    });

    // ---------------------------------------
    // DOCUMENTATION SEARCH
    // ---------------------------------------

    const sections = [...document.querySelectorAll(".doc-section")];

    const searchItems = sections.map(section => ({
        id: section.id,
        title: section.querySelector("h1, h2")?.innerText || section.id,
        text: section.innerText.toLowerCase()
    }));

    function renderSearch(query) {
        if (!searchResults) return;

        const normalized = query.trim().toLowerCase();

        if (!normalized) {
            searchResults.classList.remove("show");
            searchResults.setAttribute("hidden", "true");
            searchResults.innerHTML = "";
            return;
        }

        const matches = searchItems.filter(item =>
            item.title.toLowerCase().includes(normalized) ||
            item.text.includes(normalized)
        ).slice(0, 8);

        searchResults.innerHTML = "";

        if (!matches.length) {
            searchResults.innerHTML =
                '<div class="search-empty" style="padding: 12px; color: var(--muted); font-size: 13px;">No documentation results found.</div>';
        } else {
            matches.forEach(item => {
                const link = document.createElement("a");
                link.href = `#${item.id}`;
                link.textContent = item.title;
                link.className = "search-result-item";

                link.addEventListener("click", () => {
                    searchResults.classList.remove("show");
                    searchResults.setAttribute("hidden", "true");
                    searchInput.value = "";
                });

                searchResults.appendChild(link);
            });
        }

        searchResults.classList.add("show");
        searchResults.removeAttribute("hidden");
    }

    searchInput?.addEventListener("input", event => {
        renderSearch(event.target.value);
    });

    searchInput?.addEventListener("focus", () => {
        if (searchInput.value.trim()) {
            renderSearch(searchInput.value);
        }
    });

    document.addEventListener("click", event => {
        if (
            !event.target.closest(".topbar-center") &&
            !event.target.closest(".search-wrapper") &&
            searchResults
        ) {
            searchResults.classList.remove("show");
            searchResults.setAttribute("hidden", "true");
        }
    });

    // Ctrl + K / Cmd + K
    document.addEventListener("keydown", event => {
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {
            event.preventDefault();
            searchInput?.focus();
        }
    });

    // ---------------------------------------
    // ACTIVE SIDEBAR + TABLE OF CONTENTS
    // ---------------------------------------

    const sidebarLinks = [
        ...document.querySelectorAll(".left-sidebar .nav-link, .sidebar .nav-link")
    ];

    const tocLinks = [
        ...document.querySelectorAll("#pageToc a, .toc-nav a")
    ];

    const allNavigationLinks = [...sidebarLinks, ...tocLinks];

    function setActiveSection(id) {
        allNavigationLinks.forEach(link => {
            const href = link.getAttribute("href");
            const active = href === `#${id}`;

            link.classList.toggle("active", active);

            if (active && link.closest(".category-list, .sidebar-group")) {
                const group = link.closest(".category-list, .sidebar-group");
                group.classList.remove("collapsed");

                const toggle = group.previousElementSibling;
                toggle?.setAttribute("aria-expanded", "true");
            }
        });
    }

    const observer = new IntersectionObserver(entries => {
        const visible = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length) {
            setActiveSection(visible[0].target.id);
        }
    }, {
        rootMargin: "-15% 0px -70% 0px",
        threshold: [0, 0.1, 0.25, 0.5]
    });

    sections.forEach(section => observer.observe(section));

    // ---------------------------------------
    // SMOOTH INTERNAL NAVIGATION
    // ---------------------------------------

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", event => {
            const href = link.getAttribute("href");
            if (href === "#") return;

            const id = href.slice(1);
            const target = document.getElementById(id);

            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            history.replaceState(null, "", `#${id}`);
            setActiveSection(id);
        });
    });

    // ---------------------------------------
    // INITIAL HASH
    // ---------------------------------------

    if (location.hash) {
        const target = document.querySelector(location.hash);

        if (target) {
            setTimeout(() => {
                target.scrollIntoView({ behavior: "instant" });
                setActiveSection(target.id);
            }, 100);
        }
    }
});
