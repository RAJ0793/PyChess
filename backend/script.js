
/* =========================================================
   PyChess — Main JavaScript
   Features:
   1. Dark / Light theme
   2. Mobile navigation
   3. Scroll reveal animations
   4. Stockfish / Leela ticker
   5. Interactive chessboard with random legal AI moves
   6. Architecture tree interaction
   7. Interactive FAQ
   8. Dynamic footer year
   ========================================================= */

"use strict";

/* =========================================================
   1. DOM HELPERS
   ========================================================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];


/* =========================================================
   2. THEME SYSTEM
   ========================================================= */

const themeToggle = $("#themeToggle");

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;

    if (themeToggle) {
        themeToggle.setAttribute(
            "aria-label",
            theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
        );

        themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
    }

    try {
        localStorage.setItem("pychess-theme", theme);
    } catch {
        // Storage may be unavailable.
    }
}

function initializeTheme() {
    let savedTheme = null;

    try {
        savedTheme = localStorage.getItem("pychess-theme");
    } catch {
        // Ignore storage errors.
    }

    const preferredTheme =
        savedTheme ||
        (window.matchMedia("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark");

    applyTheme(preferredTheme);
}

initializeTheme();

themeToggle?.addEventListener("click", () => {
    const currentTheme =
        document.documentElement.dataset.theme || "dark";

    applyTheme(currentTheme === "dark" ? "light" : "dark");
});


/* =========================================================
   3. MOBILE NAVIGATION
   ========================================================= */

const mobileToggle = $("#mobileToggle");
const mobileNav = $("#mobileNav");

function closeMobileNav() {
    if (!mobileNav || !mobileToggle) return;

    mobileNav.classList.remove("active");
    mobileToggle.classList.remove("active");

    mobileToggle.setAttribute("aria-expanded", "false");
}

mobileToggle?.addEventListener("click", () => {
    if (!mobileNav) return;

    const isOpen = mobileNav.classList.toggle("active");

    mobileToggle.classList.toggle("active", isOpen);
    mobileToggle.setAttribute("aria-expanded", String(isOpen));
});

$$("#mobileNav a").forEach(link => {
    link.addEventListener("click", closeMobileNav);
});

document.addEventListener("click", event => {
    if (
        mobileNav &&
        mobileToggle &&
        !mobileNav.contains(event.target) &&
        !mobileToggle.contains(event.target)
    ) {
        closeMobileNav();
    }
});


/* =========================================================
   4. SCROLL REVEAL ANIMATIONS
   ========================================================= */

const revealElements = $$(
    ".reveal, .reveal-left, .reveal-right, .feature-card"
);

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.12
        }
    );

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });
} else {
    revealElements.forEach(element => {
        element.classList.add("visible");
    });
}


/* =========================================================
   5. STOCKFISH / LEELA TICKER
   ========================================================= */

const ticker = $("#ticker");

if (ticker && "IntersectionObserver" in window) {
    const tickerObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                ticker.classList.toggle(
                    "ticker-running",
                    entry.isIntersecting
                );
            });
        },
        {
            threshold: 0.1
        }
    );

    tickerObserver.observe(ticker);
}


/* =========================================================
   6. CHESS GAME
   Requires Chess.js 0.10.3:
   https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js

   This is a random-move opponent, NOT Stockfish or Leela.
   ========================================================= */

const chessBoard = $("#chessBoard");
const moveStatus = $("#moveStatus");
const newGameButton = $("#newGameBtn");

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

const pieceSymbols = {
    w: {
        k: "♔",
        q: "♕",
        r: "♖",
        b: "♗",
        n: "♘",
        p: "♙"
    },
    b: {
        k: "♚",
        q: "♛",
        r: "♜",
        b: "♝",
        n: "♞",
        p: "♟"
    }
};

let chessGame = null;
let selectedSquare = null;
let legalTargets = [];
let computerThinking = false;
let computerTimer = null;

function setChessStatus(message) {
    if (moveStatus) {
        moveStatus.textContent = message;
    }
}

function getSquareName(row, column) {
    return files[column] + (8 - row);
}

function initializeChessGame() {
    if (!chessBoard) return;

    if (typeof Chess !== "function") {
        setChessStatus(
            "Chess library unavailable. Check your internet connection."
        );

        return;
    }

    chessGame = new Chess();

    selectedSquare = null;
    legalTargets = [];
    computerThinking = false;

    clearTimeout(computerTimer);

    renderChessBoard();
    setChessStatus("Your turn — White");
}

function renderChessBoard() {
    if (!chessBoard || !chessGame) return;

    chessBoard.innerHTML = "";

    for (let row = 0; row < 8; row++) {
        for (let column = 0; column < 8; column++) {
            const squareName = getSquareName(row, column);
            const square = document.createElement("button");

            square.type = "button";
            square.className =
                `square ${(row + column) % 2 === 0 ? "light" : "dark"}`;

            square.dataset.square = squareName;
            square.setAttribute("aria-label", squareName);

            const piece = chessGame.get(squareName);

            if (piece) {
                const pieceElement = document.createElement("span");

                pieceElement.className =
                    `piece ${piece.color === "w" ? "white-piece" : "black-piece"}`;

                pieceElement.textContent =
                    pieceSymbols[piece.color][piece.type];

                square.appendChild(pieceElement);
            }

            if (selectedSquare === squareName) {
                square.classList.add("selected");
            }

            if (legalTargets.includes(squareName)) {
                square.classList.add("legal-target");
            }

            if (
                chessGame.isCheck() &&
                piece?.type === "k" &&
                piece.color === chessGame.turn()
            ) {
                square.classList.add("in-check");
            }

            square.addEventListener("click", () => {
                handleSquareClick(squareName);
            });

            chessBoard.appendChild(square);
        }
    }
}

function handleSquareClick(squareName) {
    if (!chessGame || computerThinking || chessGame.game_over()) {
        return;
    }

    // Player controls White.
    if (chessGame.turn() !== "w") return;

    const clickedPiece = chessGame.get(squareName);

    if (!selectedSquare) {
        if (clickedPiece && clickedPiece.color === "w") {
            selectSquare(squareName);
        }

        return;
    }

    // Selecting another friendly piece.
    if (clickedPiece && clickedPiece.color === "w") {
        selectSquare(squareName);
        return;
    }

    const move = chessGame.move({
        from: selectedSquare,
        to: squareName,
        promotion: "q"
    });

    if (move) {
        selectedSquare = null;
        legalTargets = [];

        renderChessBoard();
        updateChessStatus();

        if (!chessGame.game_over()) {
            scheduleComputerMove();
        }
    } else {
        selectedSquare = null;
        legalTargets = [];

        renderChessBoard();
        setChessStatus("Illegal move — select a White piece.");
    }
}

function selectSquare(squareName) {
    selectedSquare = squareName;

    const moves = chessGame.moves({
        square: squareName,
        verbose: true
    });

    legalTargets = moves.map(move => move.to);

    renderChessBoard();
}

function scheduleComputerMove() {
    computerThinking = true;
    setChessStatus("Black is thinking...");

    computerTimer = setTimeout(() => {
        makeComputerMove();
    }, 650);
}

function makeComputerMove() {
    if (!chessGame || chessGame.game_over()) {
        computerThinking = false;
        return;
    }

    const possibleMoves = chessGame.moves();

    if (possibleMoves.length === 0) {
        computerThinking = false;
        updateChessStatus();
        return;
    }

    const randomIndex = Math.floor(
        Math.random() * possibleMoves.length
    );

    chessGame.move(possibleMoves[randomIndex]);

    computerThinking = false;

    renderChessBoard();
    updateChessStatus();
}

function updateChessStatus() {
    if (!chessGame) return;

    if (chessGame.in_checkmate()) {
        const winner =
            chessGame.turn() === "w" ? "Black" : "White";

        setChessStatus(`Checkmate — ${winner} wins!`);
        return;
    }

    if (chessGame.in_draw()) {
        setChessStatus("Game drawn.");
        return;
    }

    if (chessGame.in_check()) {
        setChessStatus(
            chessGame.turn() === "w"
                ? "White is in check!"
                : "Black is in check!"
        );

        return;
    }

    setChessStatus(
        chessGame.turn() === "w"
            ? "Your turn — White"
            : "Black's turn"
    );
}

newGameButton?.addEventListener("click", initializeChessGame);

initializeChessGame();


/* =========================================================
   7. ARCHITECTURE TREE
   ========================================================= */

const architectureNodes = $$(
    "[data-architecture-node]"
);

const architectureDetail = $("#architectureDetail");

function activateArchitectureNode(node) {
    architectureNodes.forEach(item => {
        item.classList.toggle("active", item === node);
        item.setAttribute(
            "aria-pressed",
            String(item === node)
        );
    });

    if (!architectureDetail) return;

    const title = node.dataset.title || "PyChess Architecture";
    const description =
        node.dataset.description || "Explore the PyChess system.";

    architectureDetail.innerHTML = "";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = description;

    architectureDetail.append(heading, paragraph);
}

architectureNodes.forEach(node => {
    node.addEventListener("click", () => {
        activateArchitectureNode(node);
    });
});

if (architectureNodes.length > 0) {
    activateArchitectureNode(architectureNodes[0]);
}


/* =========================================================
   8. ARCHITECTURE SCROLL TRACKING
   ========================================================= */

const architectureSection =
    $("#architecture") || $("#architectureTree");

if (
    architectureSection &&
    architectureNodes.length > 0 &&
    "IntersectionObserver" in window
) {
    const architectureObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const visibleNode = architectureNodes.find(
                    node => node.getBoundingClientRect().top > 0
                );

                if (visibleNode) {
                    activateArchitectureNode(visibleNode);
                }
            });
        },
        {
            threshold: 0.5
        }
    );

    architectureNodes.forEach(node => {
        architectureObserver.observe(node);
    });
}


/* =========================================================
   9. INTERACTIVE FAQ
   ========================================================= */

const faqItems = $$(".faq-item");

faqItems.forEach(item => {
    const question =
        $(".faq-question", item) ||
        $("button", item);

    const answer =
        $(".faq-answer", item) ||
        $(".faq-content", item);

    if (!question || !answer) return;

    question.setAttribute("aria-expanded", "false");

    answer.hidden = true;

    question.addEventListener("click", () => {
        const isOpen =
            question.getAttribute("aria-expanded") === "true";

        // Close other FAQ entries.
        faqItems.forEach(otherItem => {
            const otherQuestion =
                $(".faq-question", otherItem) ||
                $("button", otherItem);

            const otherAnswer =
                $(".faq-answer", otherItem) ||
                $(".faq-content", otherItem);

            if (!otherQuestion || !otherAnswer) return;

            otherQuestion.setAttribute("aria-expanded", "false");
            otherItem.classList.remove("active");
            otherAnswer.hidden = true;
        });

        if (!isOpen) {
            question.setAttribute("aria-expanded", "true");
            item.classList.add("active");
            answer.hidden = false;
        }
    });
});


/* =========================================================
   10. FOOTER YEAR
   ========================================================= */

const footerYear = $("#footerYear");

if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
}


/* =========================================================
   11. SMOOTH SCROLL
   ========================================================= */

$$('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
        const targetId = link.getAttribute("href");

        if (!targetId || targetId === "#") return;

        const target = $(targetId);

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});


/* =========================================================
   12. INITIALIZATION COMPLETE
   ========================================================= */

console.info(
    "%cPyChess",
    "font-size:24px;font-weight:bold;color:#00e5ff;"
);

console.info(
    "PyChess frontend initialized successfully."
);
