
/* ============================================
   PyChess Landing Page
   Main JavaScript Controller
   ============================================ */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // =========================================
    // ELEMENTS
    // =========================================

    const html = document.documentElement;

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");

    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    const board = document.getElementById("chessBoard");
    const moveStatus = document.getElementById("moveStatus");

    const currentYear = document.getElementById("currentYear");

    // =========================================
    // THEME MANAGEMENT
    // =========================================

    const savedTheme = localStorage.getItem("pychess-theme");

    if (savedTheme === "dark" || savedTheme === "light") {
        html.dataset.theme = savedTheme;
    }

    function updateThemeIcon() {

        if (!themeIcon) return;

        themeIcon.textContent =
            html.dataset.theme === "dark" ? "☀" : "☾";

    }

    themeToggle?.addEventListener("click", () => {

        const nextTheme =
            html.dataset.theme === "dark" ? "light" : "dark";

        html.dataset.theme = nextTheme;

        localStorage.setItem("pychess-theme", nextTheme);

        updateThemeIcon();

    });

    updateThemeIcon();

    // =========================================
    // MOBILE NAVIGATION
    // =========================================

    function closeNavigation() {

        navLinks?.classList.remove("open");

        menuToggle?.setAttribute("aria-label", "Open navigation");

        if (menuToggle) {
            menuToggle.textContent = "☰";
        }

    }

    menuToggle?.addEventListener("click", () => {

        const isOpen = navLinks.classList.toggle("open");

        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation" : "Open navigation"
        );

        menuToggle.textContent = isOpen ? "✕" : "☰";

    });

    navLinks?.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", closeNavigation);

    });

    document.addEventListener("click", event => {

        if (
            navLinks?.classList.contains("open") &&
            !event.target.closest(".navbar")
        ) {
            closeNavigation();
        }

    });

    window.addEventListener("resize", () => {

        if (window.innerWidth > 760) {
            closeNavigation();
        }

    });

    // =========================================
    // NAVIGATION ACTIVE STATE
    // =========================================

    const pageSections = [
        ...document.querySelectorAll("main section[id]")
    ];

    const pageNavLinks = [
        ...document.querySelectorAll(".nav-link[href^='#']")
    ];

    if ("IntersectionObserver" in window) {

        const navigationObserver = new IntersectionObserver(entries => {

            const visible = entries
                .filter(entry => entry.isIntersecting)
                .sort((a, b) =>
                    b.intersectionRatio - a.intersectionRatio
                );

            if (!visible.length) return;

            const currentId = visible[0].target.id;

            pageNavLinks.forEach(link => {

                const active =
                    link.getAttribute("href") === `#${currentId}`;

                link.classList.toggle("active", active);

            });

        }, {
            rootMargin: "-20% 0px -65% 0px",
            threshold: [0, 0.2, 0.5, 1]
        });

        pageSections.forEach(section => {
            navigationObserver.observe(section);
        });

    }

    // =========================================
    // REVEAL ANIMATIONS
    // =========================================

    const revealElements = [
        ...document.querySelectorAll(".reveal")
    ];

    if ("IntersectionObserver" in window) {

        const revealObserver = new IntersectionObserver(entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("visible");

                    revealObserver.unobserve(entry.target);

                }

            });

        }, {
            threshold: 0.12
        });

        revealElements.forEach(element => {
            revealObserver.observe(element);
        });

    } else {

        revealElements.forEach(element => {
            element.classList.add("visible");
        });

    }

    // =========================================
    // CHESSBOARD SIMULATION
    // =========================================

    const chessPieces = {

        wK: "♔",
        wQ: "♕",
        wR: "♖",
        wB: "♗",
        wN: "♘",
        wP: "♙",

        bK: "♚",
        bQ: "♛",
        bR: "♜",
        bB: "♝",
        bN: "♞",
        bP: "♟"

    };

    let chessGame = null;
    let boardTimer = null;

    let lastMove = null;
    let moveNumber = 0;

    const squareElements = new Map();

    function createChessBoard() {

        if (!board) return;

        board.innerHTML = "";
        squareElements.clear();

        for (let row = 0; row < 8; row++) {

            for (let col = 0; col < 8; col++) {

                const square = document.createElement("div");

                const file = "abcdefgh"[col];
                const rank = 8 - row;

                const squareName = file + rank;

                square.className =
                    `chess-square ${(row + col) % 2 === 0 ? "light" : "dark"}`;

                square.dataset.square = squareName;

                square.setAttribute("aria-hidden", "true");

                squareElements.set(squareName, square);

                board.appendChild(square);

            }

        }

    }

    function renderChessBoard() {

        if (!chessGame || !board) return;

        const position = chessGame.board();

        squareElements.forEach(square => {

            square.innerHTML = "";

            square.classList.remove("last-move", "check");

        });

        position.forEach((row, rowIndex) => {

            row.forEach((piece, colIndex) => {

                if (!piece) return;

                const file = "abcdefgh"[colIndex];
                const rank = 8 - rowIndex;

                const squareName = file + rank;

                const square = squareElements.get(squareName);

                if (!square) return;

                const key =
                    (piece.color === "w" ? "w" : "b") + piece.type.toUpperCase();

                const pieceElement = document.createElement("span");

                pieceElement.className =
                    `chess-piece ${piece.color === "w" ? "white" : "black"}`;

                pieceElement.textContent = chessPieces[key];

                square.appendChild(pieceElement);

            });

        });

        if (lastMove) {

            const from = squareElements.get(lastMove.from);
            const to = squareElements.get(lastMove.to);

            from?.classList.add("last-move");
            to?.classList.add("last-move");

        }

        if (chessGame.in_check()) {

            const kingSquare = findKingSquare(
                chessGame.board(),
                chessGame.turn()
            );

            if (kingSquare) {
                squareElements.get(kingSquare)?.classList.add("check");
            }

        }

        updateMoveStatus();

    }

    function findKingSquare(position, color) {

        for (let row = 0; row < 8; row++) {

            for (let col = 0; col < 8; col++) {

                const piece = position[row][col];

                if (
                    piece &&
                    piece.type === "k" &&
                    piece.color === color
                ) {

                    return "abcdefgh"[col] + (8 - row);

                }

            }

        }

        return null;

    }

    function updateMoveStatus() {

        if (!moveStatus || !chessGame) return;

        if (chessGame.in_checkmate()) {

            moveStatus.textContent = "CHECKMATE";

        } else if (chessGame.in_draw()) {

            moveStatus.textContent = "DRAW";

        } else if (chessGame.in_check()) {

            moveStatus.textContent =
                `${chessGame.turn() === "w" ? "WHITE" : "BLACK"} IN CHECK`;

        } else {

            moveStatus.textContent =
                `MOVE ${Math.max(1, Math.ceil(moveNumber / 2))} · ` +
                `${chessGame.turn() === "w" ? "WHITE" : "BLACK"} TO MOVE`;

        }

    }

    function playAutomaticMove() {

        if (!chessGame) return;

        if (chessGame.game_over()) {

            chessGame.reset();

            lastMove = null;
            moveNumber = 0;

            renderChessBoard();

            return;

        }

        const moves = chessGame.moves({
            verbose: true
        });

        if (!moves.length) return;

        // Choose a random legal move for the visual demonstration.
        const selectedMove =
            moves[Math.floor(Math.random() * moves.length)];

        const result = chessGame.move(selectedMove);

        if (!result) return;

        lastMove = result;
        moveNumber++;

        renderChessBoard();

    }

    function initializeChessSimulation() {

        if (!board) return;

        if (typeof Chess !== "function") {

            if (moveStatus) {
                moveStatus.textContent = "CHESS LIBRARY UNAVAILABLE";
            }

            console.error(
                "PyChess: chess.js was not loaded. Check the CDN script."
            );

            return;

        }

        chessGame = new Chess();

        createChessBoard();
        renderChessBoard();

        if (boardTimer) {
            clearInterval(boardTimer);
        }

        // Automatic visual simulation, not an AI engine.
        boardTimer = setInterval(playAutomaticMove, 1700);

    }

    initializeChessSimulation();

    // =========================================
    // ENGINE TICKER
    // =========================================

    const tickerTrack = document.getElementById("tickerTrack");

    if (tickerTrack && !tickerTrack.dataset.cloned) {

        const originalItems = [...tickerTrack.children];

        originalItems.forEach(item => {

            const clone = item.cloneNode(true);

            clone.setAttribute("aria-hidden", "true");

            tickerTrack.appendChild(clone);

        });

        tickerTrack.dataset.cloned = "true";

    }

    // =========================================
    // ARCHITECTURE EXPLORER
    // =========================================

    const architectureData = {

        engines: {

            title: "Engine ecosystem",

            description:
                "Explore the integration of compatible chess engines, " +
                "their communication interfaces, and specialized analysis tasks.",

            counter: "01 / 04"

        },

        analysis: {

            title: "Strategic analysis",

            description:
                "Study chess positions, evaluate candidate moves, " +
                "and explore tactical and positional decision-making.",

            counter: "02 / 04"

        },

        learning: {

            title: "Learning and research",

            description:
                "Explore chess datasets, self-play experiments, " +
                "neural evaluation, and comparative engine research.",

            counter: "03 / 04"

        },

        orchestration: {

            title: "Engine orchestration",

            description:
                "Explore the concept of coordinating multiple engines " +
                "through common interfaces and task-specific workflows.",

            counter: "04 / 04"

        }

    };

    const architectureNodes = [
        ...document.querySelectorAll(".tree-node")
    ];

    const architectureTitle =
        document.getElementById("architectureTitle");

    const architectureDescription =
        document.getElementById("architectureDescription");

    const architectureProgress =
        document.getElementById("architectureProgress");

    const architectureCounter =
        document.getElementById("architectureCounter");

    let currentArchitecture = 0;

    const architectureKeys = Object.keys(architectureData);

    function selectArchitecture(key) {

        const data = architectureData[key];

        if (!data) return;

        currentArchitecture = architectureKeys.indexOf(key);

        architectureTitle.textContent = data.title;

        architectureDescription.textContent = data.description;

        architectureCounter.textContent = data.counter;

        architectureProgress.style.width =
            `${((currentArchitecture + 1) / architectureKeys.length) * 100}%`;

        architectureNodes.forEach(node => {

            const active = node.dataset.feature === key;

            node.classList.toggle("active", active);

            node.setAttribute(
                "aria-pressed",
                String(active)
            );

        });

    }

    architectureNodes.forEach(node => {

        node.setAttribute("role", "button");
        node.setAttribute("tabindex", "0");

        node.addEventListener("click", () => {

            selectArchitecture(node.dataset.feature);

        });

        node.addEventListener("keydown", event => {

            if (event.key === "Enter" || event.key === " ") {

                event.preventDefault();

                selectArchitecture(node.dataset.feature);

            }

        });

    });

    selectArchitecture("engines");

    // =========================================
    // FAQ ACCORDION
    // =========================================

    const faqItems = [
        ...document.querySelectorAll(".faq-item")
    ];

    faqItems.forEach(item => {

        const button = item.querySelector(".faq-question");

        button?.addEventListener("click", () => {

            const isOpen = item.classList.contains("open");

            // Keep one FAQ open at a time.
            faqItems.forEach(otherItem => {

                otherItem.classList.remove("open");

                otherItem.querySelector(".faq-question")
                    ?.setAttribute("aria-expanded", "false");

            });

            if (!isOpen) {

                item.classList.add("open");

                button.setAttribute("aria-expanded", "true");

            }

        });

    });

    // =========================================
    // FOOTER YEAR
    // =========================================

    if (currentYear) {

        currentYear.textContent = new Date().getFullYear();

    }

    // =========================================
    // CLEANUP
    // =========================================

    window.addEventListener("pagehide", () => {

        if (boardTimer) {
            clearInterval(boardTimer);
        }

    });

});
