import {
    calculateGraphicEstimate,
    calculateVideoEstimate,
    calculateWebsiteEstimate,
    roundEstimate,
    validatePricing,
} from "./pricing.js";

const output = document.querySelector("#test-results");
const summary = document.querySelector("#test-summary");

const website = (overrides = {}) => ({
    type: "business",
    pagesValue: "",
    productCountValue: "",
    selectedFeatures: [],
    languageCountValue: "",
    contentPagesValue: "",
    additionalRequirements: "",
    ...overrides,
});
const graphic = (overrides = {}) => ({ type: null, complexity: null, concepts: null, options: [], ...overrides });
const video = (overrides = {}) => ({
    type: null,
    duration: null,
    footage: null,
    versions: null,
    features: [],
    ...overrides,
});

const cases = [
    ["WWW: landing + formularz", (p) => calculateWebsiteEstimate(website({ type: "landing", selectedFeatures: ["contact-form"] }), p).total, 900],
    ["WWW: firmowa 5 podstron + projekt + formularz + SEO", (p) => calculateWebsiteEstimate(website({ pagesValue: "5", selectedFeatures: ["custom-design", "contact-form", "seo"] }), p).total, 1450],
    ["WWW: firmowa 7 podstron + projekt + CMS + formularz + SEO", (p) => calculateWebsiteEstimate(website({ pagesValue: "7", selectedFeatures: ["custom-design", "cms", "contact-form", "seo"] }), p).total, 1800],
    ["WWW: rozbudowana domyślnie", (p) => calculateWebsiteEstimate(website({ type: "expanded" }), p).total, 1500],
    ["WWW: landing 2 podstrony — brak wyceny", (p) => calculateWebsiteEstimate(website({ type: "landing", pagesValue: "2" }), p).total, null],
    ["WWW: sklep 15 produktów + CMS (CMS w cenie)", (p) => calculateWebsiteEstimate(website({ type: "store", productCountValue: "15", selectedFeatures: ["cms"] }), p).total, 2600],
    ["WWW: sklep 10 produktów — bez dopłaty", (p) => calculateWebsiteEstimate(website({ type: "store", productCountValue: "10" }), p).total, 2500],
    ["WWW: sklep 0 produktów — brak wyceny", (p) => calculateWebsiteEstimate(website({ type: "store", productCountValue: "0" }), p).total, null],
    ["WWW: 100 podstron", (p) => calculateWebsiteEstimate(website({ pagesValue: "100" }), p).total, 10500],
    ["WWW: 101 podstron — brak wyceny", (p) => calculateWebsiteEstimate(website({ pagesValue: "101" }), p).total, null],
    ["WWW: 0 podstron — brak wyceny", (p) => calculateWebsiteEstimate(website({ pagesValue: "0" }), p).total, null],
    ["WWW: ujemna liczba podstron — brak wyceny", (p) => calculateWebsiteEstimate(website({ pagesValue: "-3" }), p).total, null],
    ["WWW: ułamkowa liczba podstron — brak wyceny", (p) => calculateWebsiteEstimate(website({ pagesValue: "5.5" }), p).total, null],
    ["WWW: zapis 1e1 to 10 podstron", (p) => calculateWebsiteEstimate(website({ pagesValue: "1e1" }), p).total, 1500],
    ["WWW: firmowa + 3 języki", (p) => calculateWebsiteEstimate(website({ selectedFeatures: ["languages"], languageCountValue: "3" }), p).total, 1600],
    ["WWW: treści dla 5 z 5 podstron", (p) => calculateWebsiteEstimate(website({ pagesValue: "5", selectedFeatures: ["content"], contentPagesValue: "5" }), p).total, 1500],
    ["WWW: treści dla 6 z 5 podstron — brak wyceny", (p) => calculateWebsiteEstimate(website({ pagesValue: "5", selectedFeatures: ["content"], contentPagesValue: "6" }), p).total, null],
    ["WWW: nietypowe wymagania oznaczają sumę częściową", (p) => calculateWebsiteEstimate(website({ additionalRequirements: "Integracja z CRM" }), p).partial, true],
    ["Grafika: logo standard, 1 propozycja", (p) => calculateGraphicEstimate(graphic({ type: "logo", complexity: "standard", concepts: "1" }), p).total, 400],
    ["Grafika: logo rozbudowane, 3 propozycje + pliki źródłowe", (p) => calculateGraphicEstimate(graphic({ type: "logo", complexity: "advanced", concepts: "3", options: ["source-files"] }), p).total, 1050],
    ["Grafika: social media prosta, 2 propozycje", (p) => calculateGraphicEstimate(graphic({ type: "social-media", complexity: "simple", concepts: "2" }), p).total, 135],
    ["Grafika: brak rodzaju — cena początkowa", (p) => calculateGraphicEstimate(graphic(), p).total, 90],
    ["Grafika: 4 propozycje — brak wyceny", (p) => calculateGraphicEstimate(graphic({ type: "logo", complexity: "simple", concepts: "4" }), p).total, null],
    ["Wideo: reels do 15 s, materiał do 15 min", (p) => calculateVideoEstimate(video({ type: "reel", duration: "up-to-15", footage: "up-to-15", versions: "0" }), p).total, 300],
    ["Wideo: reklama 15–30 s, materiał 15–60 min, 1 wersja", (p) => calculateVideoEstimate(video({ type: "advert", duration: "15-30", footage: "15-60", versions: "1" }), p).total, 1350],
    ["Wideo: film >60 s, >3 h, 2 wersje + audio", (p) => calculateVideoEstimate(video({ type: "promo", duration: "over-60", footage: "over-3-hours", versions: "2", features: ["audio"] }), p).total, 4160],
    ["Wideo: brak rodzaju — cena początkowa", (p) => calculateVideoEstimate(video(), p).total, 300],
    ["Zaokrąglenie wideo do 10 zł", (p) => roundEstimate("video", 1005, p), 1010],
    ["Brak zaokrąglenia dla stron i grafik", (p) => roundEstimate("website", 1005, p), 1005],
    ["Grafika: pozycje zestawienia sumują się do łącznej ceny", (p) => {
        const e = calculateGraphicEstimate(graphic({ type: "logo", complexity: "advanced", concepts: "3", options: ["source-files", "print-ready"] }), p);
        return e.lines.reduce((sum, line) => sum + line.amount, 0) === e.total;
    }, true],
    ["Grafika: zestawienie zawiera cenę bazową i 4 dopłaty", (p) => calculateGraphicEstimate(graphic({ type: "logo", complexity: "advanced", concepts: "3", options: ["source-files", "print-ready"] }), p).lines.length, 5],
    ["Wideo: pozycje zestawienia sumują się do łącznej ceny", (p) => {
        const e = calculateVideoEstimate(video({ type: "promo", duration: "over-60", footage: "over-3-hours", versions: "2", features: ["audio", "color"] }), p);
        return e.lines.reduce((sum, line) => sum + line.amount, 0) === e.total;
    }, true],
    ["WWW: pozycje zestawienia sumują się do łącznej ceny", (p) => {
        const e = calculateWebsiteEstimate(website({ pagesValue: "7", selectedFeatures: ["custom-design", "cms", "seo"] }), p);
        return e.lines.reduce((sum, line) => sum + line.amount, 0) === e.total;
    }, true],
];

function render(name, ok, detail) {
    const item = document.createElement("li");
    item.dataset.status = ok ? "pass" : "fail";
    item.textContent = `${ok ? "OK" : "BŁĄD"} — ${name}${ok ? "" : ` (${detail})`}`;
    output.append(item);
}

try {
    const response = await fetch("cennik.json", { cache: "no-store" });
    const pricing = await response.json();
    validatePricing(pricing);

    let failed = 0;
    for (const [name, run, expected] of cases) {
        let actual;
        try {
            actual = run(pricing);
        } catch (error) {
            actual = `wyjątek: ${error.message}`;
        }
        const ok = actual === expected;
        failed += ok ? 0 : 1;
        render(name, ok, `oczekiwano ${expected}, otrzymano ${actual}`);
    }

    summary.textContent = failed === 0
        ? `Wszystkie testy zaliczone (${cases.length}).`
        : `Niezaliczone testy: ${failed} z ${cases.length}.`;
    summary.dataset.status = failed === 0 ? "pass" : "fail";
} catch (error) {
    summary.textContent = `Nie udało się uruchomić testów: ${error.message}`;
    summary.dataset.status = "fail";
}
