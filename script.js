const siteHeader = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const primaryNavigation = document.querySelector("#primary-navigation");

if (!(siteHeader instanceof HTMLElement) || !(menuToggle instanceof HTMLButtonElement) || !(primaryNavigation instanceof HTMLElement)) {
    throw new Error("Nie można zainicjalizować nawigacji ACE Studio.");
}

function setMenuOpen(isOpen) {
    siteHeader.dataset.menuOpen = String(isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Zamknij menu" : "Otwórz menu");
}

menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

primaryNavigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
        setMenuOpen(false);
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false);
        menuToggle.focus();
    }
});

window.matchMedia("(min-width: 761px)").addEventListener("change", () => setMenuOpen(false));

window.addEventListener("scroll", () => {
    siteHeader.dataset.scrolled = String(window.scrollY > 24);
}, { passive: true });

const revealCards = document.querySelectorAll(".service-card, .reason-card, .process-step");

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        }
    }, { threshold: 0.12 });

    for (const card of revealCards) {
        card.classList.add("reveal-card");
        revealObserver.observe(card);
    }
}
