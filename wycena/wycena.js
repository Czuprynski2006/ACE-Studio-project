import {
    calculateGraphicEstimate,
    calculateVideoEstimate,
    calculateWebsiteEstimate,
    formatCurrency as formatAmount,
    getPrice,
    roundEstimate,
    validatePricing,
} from "./pricing.js?v=20261104";

const serviceOptions = document.querySelectorAll('input[name="service"]');
const selectionStatus = document.querySelector("#quote-selection-status");
const serviceActions = document.querySelector("#quote-service-actions");
const continueButton = document.querySelector("#quote-continue");
const graphicContinueButton = document.querySelector("#quote-graphic-continue");
const videoContinueButton = document.querySelector("#quote-video-continue");
const backButton = document.querySelector("#quote-back");
const graphicBackButton = document.querySelector("#quote-graphic-back");
const videoBackButton = document.querySelector("#quote-video-back");
const serviceScreen = document.querySelector("#quote-service-screen");
const websiteScreen = document.querySelector("#quote-website-screen");
const graphicScreen = document.querySelector("#quote-graphic-screen");
const videoScreen = document.querySelector("#quote-video-screen");
const summaryScreen = document.querySelector("#quote-summary-screen");
const summaryHeading = document.querySelector("#quote-summary-title");
const summaryService = document.querySelector("#quote-summary-service");
const summaryList = document.querySelector("#quote-summary-list");
const summaryBackButton = document.querySelector("#quote-summary-back");
const summaryButtons = document.querySelectorAll(".quote-summary-open");
const quotePicker = document.querySelector(".quote-picker");
const progress = document.querySelector("#quote-progress");
const languageOption = document.querySelector("#website-languages-enabled");
const languageCount = document.querySelector("#quote-language-count");
const languageCountSelect = document.querySelector("#website-language-count");
const contentOption = document.querySelector("#website-content-enabled");
const contentCount = document.querySelector("#quote-content-count");
const contentCountInput = document.querySelector("#website-content-pages");
const productCountField = document.querySelector("#website-products-field");
const productCountInput = document.querySelector("#website-products");
const pagesInput = document.querySelector("#website-pages");
const pagesHelp = document.querySelector("#website-pages-help");
const validationNote = document.querySelector("#website-validation-note");
const cmsOption = document.querySelector('input[name="website-feature"][value="cms"]');
const cmsNote = document.querySelector("#website-cms-note");
const customFunctionalityNote = document.querySelector("#website-custom-functionality-note");
const totalPanel = document.querySelector("#quote-total-panel");
const totalValue = document.querySelector("#quote-total-value");
const totalNote = document.querySelector("#quote-total-note");
const totalDisclaimer = document.querySelector("#quote-total-disclaimer");
const priceBreakdown = document.querySelector("#quote-price-breakdown");
const priceLines = document.querySelector("#quote-price-lines");
const priceExclusions = document.querySelector("#quote-estimate-exclusions");
const priceVatNote = document.querySelector("#quote-vat-note");
const copyButton = document.querySelector("#quote-copy-button");
const copyLabel = document.querySelector("#quote-copy-label");
const copyStatus = document.querySelector("#quote-copy-status");

if (
    !(selectionStatus instanceof HTMLElement)
    || !(serviceActions instanceof HTMLElement)
    || !(continueButton instanceof HTMLButtonElement)
    || !(graphicContinueButton instanceof HTMLButtonElement)
    || !(videoContinueButton instanceof HTMLButtonElement)
    || !(backButton instanceof HTMLButtonElement)
    || !(graphicBackButton instanceof HTMLButtonElement)
    || !(videoBackButton instanceof HTMLButtonElement)
    || !(serviceScreen instanceof HTMLElement)
    || !(websiteScreen instanceof HTMLElement)
    || !(graphicScreen instanceof HTMLElement)
    || !(videoScreen instanceof HTMLElement)
    || !(summaryScreen instanceof HTMLElement)
    || !(summaryHeading instanceof HTMLHeadingElement)
    || !(summaryService instanceof HTMLElement)
    || !(summaryList instanceof HTMLElement)
    || !(summaryBackButton instanceof HTMLButtonElement)
    || summaryButtons.length !== 3
    || !(quotePicker instanceof HTMLElement)
    || !(progress instanceof HTMLElement)
    || !(languageOption instanceof HTMLInputElement)
    || !(languageCount instanceof HTMLElement)
    || !(languageCountSelect instanceof HTMLInputElement)
    || !(contentOption instanceof HTMLInputElement)
    || !(contentCount instanceof HTMLElement)
    || !(contentCountInput instanceof HTMLInputElement)
    || !(productCountField instanceof HTMLElement)
    || !(productCountInput instanceof HTMLInputElement)
    || !(pagesInput instanceof HTMLInputElement)
    || !(pagesHelp instanceof HTMLElement)
    || !(validationNote instanceof HTMLElement)
    || !(cmsOption instanceof HTMLInputElement)
    || !(cmsNote instanceof HTMLElement)
    || !(customFunctionalityNote instanceof HTMLElement)
    || !(totalPanel instanceof HTMLElement)
    || !(totalValue instanceof HTMLElement)
    || !(totalNote instanceof HTMLElement)
    || !(totalDisclaimer instanceof HTMLElement)
    || !(priceBreakdown instanceof HTMLElement)
    || !(priceLines instanceof HTMLElement)
    || !(priceExclusions instanceof HTMLElement)
    || !(priceVatNote instanceof HTMLElement)
    || !(copyButton instanceof HTMLButtonElement)
    || !(copyLabel instanceof HTMLElement)
    || !(copyStatus instanceof HTMLElement)
    || serviceOptions.length !== 3
) {
    throw new Error("Nie można zainicjalizować konfiguratora ACE Studio.");
}

const serviceNames = new Map([
    ["website", "Strona internetowa"],
    ["graphic", "Projekt graficzny"],
    ["video", "Montaż wideo"],
]);

const progressLabel = progress.querySelector(".quote-step-label");
const progressTitle = progress.querySelector(".quote-step-title");
const progressBar = progress.querySelector('[role="progressbar"]');
const progressFill = progress.querySelector(".quote-step-track span");
const websiteHeading = websiteScreen.querySelector("h2");
const graphicHeading = graphicScreen.querySelector("h2");
const videoHeading = videoScreen.querySelector("h2");

if (
    !(progressLabel instanceof HTMLElement)
    || !(progressTitle instanceof HTMLElement)
    || !(progressBar instanceof HTMLElement)
    || !(progressFill instanceof HTMLElement)
    || !(websiteHeading instanceof HTMLHeadingElement)
    || !(graphicHeading instanceof HTMLHeadingElement)
    || !(videoHeading instanceof HTMLHeadingElement)
) {
    throw new Error("Nie można zainicjalizować kroków konfiguratora ACE Studio.");
}

let pricing = null;
let pricingError = null;
let latestWebsiteEstimate = null;

function getSelectedValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected instanceof HTMLInputElement ? selected.value : null;
}

function getSelectedOptions(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)]
        .filter((option) => option instanceof HTMLInputElement)
        .map((option) => option.value);
}

function priceFor(service) {
    if (!pricing) {
        return null;
    }

    if (service === "website") {
        return calculateWebsiteEstimate(getWebsiteConfiguration(), pricing);
    }

    if (service === "graphic") {
        return calculateGraphicEstimate({
            type: getSelectedValue("graphic-type"),
            complexity: getSelectedValue("graphic-complexity"),
            concepts: getSelectedValue("graphic-concepts"),
            options: getSelectedOptions("graphic-option"),
            labels: {
                type: getSelectedLabels("graphic-type")[0],
                complexity: getSelectedLabels("graphic-complexity")[0]?.split(" — ")[0],
                options: getLabelsByValue("graphic-option"),
            },
        }, pricing);
    }

    if (service === "video") {
        return calculateVideoEstimate({
            type: getSelectedValue("video-type"),
            duration: getSelectedValue("video-duration"),
            footage: getSelectedValue("video-footage"),
            versions: getSelectedValue("video-versions"),
            features: getSelectedOptions("video-feature"),
            labels: {
                type: getSelectedLabels("video-type")[0],
                duration: getSelectedLabels("video-duration")[0],
                footage: getSelectedLabels("video-footage")[0],
                versions: getSelectedLabels("video-versions")[0],
                features: getLabelsByValue("video-feature"),
            },
        }, pricing);
    }

    throw new Error(`Nieobsługiwany rodzaj usługi: ${service}.`);
}

function getWebsiteConfiguration() {
    return {
        type: getSelectedValue("website-type"),
        pagesValue: pagesInput.value.trim(),
        productCountValue: productCountInput.value.trim(),
        selectedFeatures: getSelectedOptions("website-feature"),
        languageCountValue: languageCountSelect.value.trim(),
        contentPagesValue: contentCountInput.value.trim(),
        additionalRequirements: getControlValue("#website-additional"),
    };
}

function formatCurrency(amount, currency = pricing?.currency ?? "PLN") {
    return formatAmount(amount, currency);
}

function updateEstimate() {
    const selectedService = document.querySelector('input[name="service"]:checked');
    if (!(selectedService instanceof HTMLInputElement)) {
        totalPanel.hidden = true;
        latestWebsiteEstimate = null;
        return;
    }

    totalPanel.hidden = false;
    totalDisclaimer.firstChild.textContent = "Kwota orientacyjna brutto — nie stanowi wiążącej oferty.";
    customFunctionalityNote.hidden = selectedService.value !== "website" || !getControlValue("#website-additional");

    if (pricingError) {
        latestWebsiteEstimate = null;
        totalValue.textContent = "—";
        totalNote.textContent = "Nie udało się wczytać cennika. Odśwież stronę lub skontaktuj się z ACE Studio.";
        return;
    }

    try {
        const estimate = priceFor(selectedService.value);
        if (!estimate) {
            latestWebsiteEstimate = null;
            totalValue.textContent = "—";
            totalNote.textContent = "Wczytywanie orientacyjnego cennika…";
            return;
        }
        latestWebsiteEstimate = selectedService.value === "website" ? estimate : null;

        const roundedTotal = estimate.total === null ? null : roundEstimate(selectedService.value, estimate.total, pricing);
        totalValue.textContent = roundedTotal === null ? "—" : formatCurrency(roundedTotal);
        totalNote.textContent = estimate.note;
        updateWebsiteValidation(estimate);
    } catch (error) {
        latestWebsiteEstimate = null;
        validationNote.hidden = true;
        console.error("Nie można obliczyć orientacyjnej wyceny ACE Studio.", error);
        totalValue.textContent = "—";
        totalNote.textContent = "Nie udało się obliczyć sumy. Sprawdź wybrane opcje lub odśwież stronę.";
    }
}

function updateWebsiteValidation(estimate) {
    const type = getSelectedValue("website-type");
    validationNote.hidden = !type || estimate.total !== null;
    validationNote.textContent = validationNote.hidden ? "" : estimate.note;
    if (type) {
        pagesInput.max = type === "landing" ? "1" : "100";
        pagesHelp.textContent = type === "landing"
            ? "Landing page obejmuje dokładnie 1 podstronę. Większy zakres wymaga wyboru innego rodzaju strony."
            : `W cenie pakietu znajduje się ${pricing.website.includedPages[type]} podstron. Każda kolejna kosztuje ${formatCurrency(pricing.website.additionalPage)}.`;
    } else {
        pagesInput.max = "100";
        pagesHelp.textContent = "Podaj liczbę podstron. Zakres w cenie bazowej zależy od wybranego rodzaju strony.";
    }
}

async function loadPricing() {
    try {
        const response = await fetch("cennik.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Nie udało się wczytać cennika (HTTP ${response.status}).`);
        }

        const data = await response.json();
        validatePricing(data);
        pricing = data;
        updateEstimate();
    } catch (error) {
        pricingError = error;
        console.error("Nie można wczytać orientacyjnego cennika ACE Studio.", error);
        updateEstimate();
    }
}

function updateProgress(step, title) {
    progress.setAttribute("aria-label", `Krok ${step} z 3`);
    progressLabel.textContent = `Krok ${String(step).padStart(2, "0")}`;
    progressTitle.textContent = title;
    progressBar.setAttribute("aria-valuenow", String(step));
    progressBar.setAttribute("aria-valuemax", "3");
    progressFill.style.width = `${(step / 3) * 100}%`;
}

function showWebsiteConfiguration() {
    serviceScreen.hidden = true;
    websiteScreen.hidden = false;
    graphicScreen.hidden = true;
    videoScreen.hidden = true;
    summaryScreen.hidden = true;
    quotePicker.setAttribute("aria-labelledby", "website-title");
    updateProgress(2, "Zakres strony WWW");
    websiteHeading.focus({ preventScroll: true });
    websiteHeading.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
}

function showGraphicConfiguration() {
    serviceScreen.hidden = true;
    websiteScreen.hidden = true;
    graphicScreen.hidden = false;
    videoScreen.hidden = true;
    summaryScreen.hidden = true;
    quotePicker.setAttribute("aria-labelledby", "graphic-title");
    updateProgress(2, "Zakres projektu graficznego");
    graphicHeading.focus({ preventScroll: true });
    graphicHeading.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
}

function showVideoConfiguration() {
    serviceScreen.hidden = true;
    websiteScreen.hidden = true;
    graphicScreen.hidden = true;
    videoScreen.hidden = false;
    summaryScreen.hidden = true;
    quotePicker.setAttribute("aria-labelledby", "video-title");
    updateProgress(2, "Zakres montażu wideo");
    videoHeading.focus({ preventScroll: true });
    videoHeading.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
}

function showServicePicker() {
    websiteScreen.hidden = true;
    graphicScreen.hidden = true;
    videoScreen.hidden = true;
    summaryScreen.hidden = true;
    serviceScreen.hidden = false;
    quotePicker.setAttribute("aria-labelledby", "quote-title");
    updateProgress(1, "Wybór usługi");
    const selectedOption = document.querySelector('input[name="service"]:checked');
    if (selectedOption instanceof HTMLInputElement) {
        selectedOption.focus();
    }
}

function getOptionLabel(input) {
    const label = input.closest("label");
    if (!label) {
        return input.value;
    }

    const title = label.querySelector(".quote-type-card-title");
    if (title) {
        return title.textContent.trim();
    }

    const conceptNumber = label.querySelector(".quote-concept-number");
    const conceptLabel = label.querySelector(".quote-concept-label");
    if (conceptNumber && conceptLabel) {
        return `${conceptNumber.textContent.trim()} ${conceptLabel.textContent.trim()}`;
    }

    return label.lastElementChild?.textContent.trim() ?? label.textContent.trim();
}

function getSelectedLabels(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)]
        .filter((input) => input instanceof HTMLInputElement)
        .map(getOptionLabel);
}

function getLabelsByValue(name) {
    return Object.fromEntries(
        [...document.querySelectorAll(`input[name="${name}"]:checked`)]
            .filter((input) => input instanceof HTMLInputElement)
            .map((input) => [input.value, getOptionLabel(input)]),
    );
}

function formatCount(count, singular, paucal, plural) {
    if (count === 1) {
        return `${count} ${singular}`;
    }

    return count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)
        ? `${count} ${paucal}`
        : `${count} ${plural}`;
}

function getControlValue(selector) {
    const control = document.querySelector(selector);
    return control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement
        ? control.value.trim()
        : "";
}

function addSummaryRow(label, value) {
    const row = document.createElement("div");
    row.className = "quote-summary-row";

    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value || "Nie podano";

    row.append(term, description);
    summaryList.append(row);
}

function addPriceLine(label, amount, isTotal = false) {
    const row = document.createElement("div");
    row.className = isTotal ? "quote-summary-row quote-price-row quote-price-row-total" : "quote-summary-row quote-price-row";

    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = formatCurrency(amount);

    row.append(term, description);
    priceLines.append(row);
}

function renderPriceBreakdown(service, estimate) {
    priceLines.replaceChildren();
    if (estimate?.total === null || estimate?.total === undefined) {
        priceBreakdown.hidden = true;
        return;
    }

    priceBreakdown.hidden = false;
    for (const line of estimate.lines) {
        addPriceLine(line.label, line.amount);
    }

    const roundedTotal = roundEstimate(service, estimate.total, pricing);
    const linesSum = estimate.lines.reduce((sum, line) => sum + line.amount, 0);
    if (Math.abs(roundedTotal - linesSum) >= 0.5) {
        addPriceLine("Zaokrąglenie do pełnych dziesiątek", roundedTotal - linesSum);
    }
    addPriceLine("Łączna orientacyjna cena", roundedTotal, true);
    priceExclusions.hidden = service !== "website";
    priceVatNote.textContent = pricing.website.vatDisplay;
}

function populateSummary(service) {
    const serviceName = serviceNames.get(service);
    if (!serviceName) {
        throw new Error(`Nieobsługiwany rodzaj usługi w podsumowaniu: ${service}.`);
    }

    summaryService.textContent = serviceName;
    summaryList.replaceChildren();
    copyLabel.textContent = "Kopiuj wycenę";
    setCopyFeedback(copyDefaultMessage);

    if (service === "website") {
        if (!latestWebsiteEstimate || latestWebsiteEstimate.total === null) {
            throw new Error("Nie można przygotować podsumowania wyceny WWW dla nieprawidłowego zakresu.");
        }

        const estimate = latestWebsiteEstimate;
        addSummaryRow("Rodzaj strony", getSelectedLabels("website-type")[0] ?? "");
        const features = getSelectedLabels("website-feature");
        const languageIndex = features.indexOf("Dodatkowe wersje językowe");
        if (languageIndex !== -1) {
            const languageCountValue = Number(getControlValue("#website-language-count"));
            features[languageIndex] += ` (${formatCount(languageCountValue, "język", "języki", "języków")})`;
        }
        if (estimate.type === "store") {
            const cmsIndex = features.indexOf("CMS do samodzielnej edycji treści");
            if (cmsIndex !== -1) {
                features.splice(cmsIndex, 1);
            }
            features.push("Standardowy system produktów i zamówień w cenie sklepu");
        }
        const contentIndex = features.indexOf("Przygotowanie treści na stronę");
        if (contentIndex !== -1) {
            const contentPageCount = Number(getControlValue("#website-content-pages"));
            features[contentIndex] += ` (${formatCount(contentPageCount, "podstrona", "podstrony", "podstron")})`;
        }

        addSummaryRow("Liczba podstron", `${estimate.pages} (w cenie pakietu: ${estimate.includedPages})`);
        if (estimate.type === "store") {
            addSummaryRow("Liczba produktów", `${estimate.productCount} (w cenie pakietu: ${getPrice(pricing.website, "includedProducts", "produkty w cenie sklepu")})`);
        }
        addSummaryRow("Dodatkowe elementy", features.join(", ") || "Brak");
        addSummaryRow("Dodatkowe funkcjonalności", getControlValue("#website-additional") || "Brak");
        renderPriceBreakdown(service, estimate);
    } else if (service === "graphic") {
        addSummaryRow("Rodzaj projektu", getSelectedLabels("graphic-type")[0] ?? "");
        addSummaryRow("Liczba propozycji", getSelectedLabels("graphic-concepts")[0] ?? "");
        addSummaryRow("Złożoność", getSelectedLabels("graphic-complexity")[0] ?? "");
        addSummaryRow("Przygotowanie i warianty", getSelectedLabels("graphic-option").join(", ") || "Brak");
        renderPriceBreakdown(service, priceFor(service));
    } else {
        addSummaryRow("Rodzaj filmu", getSelectedLabels("video-type")[0] ?? "");
        addSummaryRow("Długość gotowego filmu", getSelectedLabels("video-duration")[0] ?? "");
        addSummaryRow("Materiał źródłowy", getSelectedLabels("video-footage")[0] ?? "");
        addSummaryRow("Dodatkowe elementy", getSelectedLabels("video-feature").join(", ") || "Brak");
        addSummaryRow("Dodatkowe wersje", getSelectedLabels("video-versions")[0] ?? "");
        addSummaryRow("Dodatkowe wskazówki", getControlValue("#video-additional") || "Brak");
        renderPriceBreakdown(service, priceFor(service));
    }
}

function showSummary(service) {
    updateEstimate();
    if (service === "website") {
        const type = getSelectedValue("website-type");
        if (!type) {
            totalNote.textContent = "Wybierz rodzaj strony, aby przygotować podsumowanie.";
            document.querySelector('input[name="website-type"]')?.focus();
            return;
        }
        if (latestWebsiteEstimate?.total === null) {
            const pages = pagesInput.value.trim() ? Number(pagesInput.value) : pricing.website.includedPages[type];
            const contentPages = Number(contentCountInput.value);
            const languageCountValue = Number(languageCountSelect.value);
            const productCountValue = Number(productCountInput.value);

            if (
                type === "store"
                && (!Number.isInteger(productCountValue) || productCountValue < 1 || productCountValue > 1000)
            ) {
                productCountInput.focus();
            } else if (
                getSelectedOptions("website-feature").includes("content")
                && (!Number.isInteger(contentPages) || contentPages < 1 || contentPages > pages)
            ) {
                contentCountInput.focus();
            } else if (
                getSelectedOptions("website-feature").includes("languages")
                && (!Number.isInteger(languageCountValue) || languageCountValue < 1 || languageCountValue > 100)
            ) {
                languageCountSelect.focus();
            } else {
                pagesInput.focus();
            }
            return;
        }
        if (!latestWebsiteEstimate) {
            return;
        }
    }
    populateSummary(service);
    serviceScreen.hidden = true;
    websiteScreen.hidden = true;
    graphicScreen.hidden = true;
    videoScreen.hidden = true;
    summaryScreen.hidden = false;
    quotePicker.setAttribute("aria-labelledby", "quote-summary-title");
    updateProgress(3, "Podsumowanie i kontakt");
    summaryHeading.focus({ preventScroll: true });
    summaryHeading.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
}

function showSelectedConfiguration() {
    const selectedService = document.querySelector('input[name="service"]:checked');
    if (!(selectedService instanceof HTMLInputElement)) {
        showServicePicker();
        return;
    }

    const showConfiguration = {
        website: showWebsiteConfiguration,
        graphic: showGraphicConfiguration,
        video: showVideoConfiguration,
    }[selectedService.value];

    if (!showConfiguration) {
        throw new Error(`Nieobsługiwany rodzaj usługi w konfiguratorze: ${selectedService.value}.`);
    }

    showConfiguration();
}

for (const option of serviceOptions) {
    if (!(option instanceof HTMLInputElement)) {
        throw new Error("Nieprawidłowa opcja wyboru usługi w kalkulatorze ACE Studio.");
    }

    option.addEventListener("change", () => {
        const selectedService = serviceNames.get(option.value);

        if (!option.checked || !selectedService) {
            return;
        }

        const canContinue = option.value === "website";
        const canConfigureGraphic = option.value === "graphic";
        const canConfigureVideo = option.value === "video";
        serviceActions.hidden = false;
        continueButton.hidden = !canContinue;
        graphicContinueButton.hidden = !canConfigureGraphic;
        videoContinueButton.hidden = !canConfigureVideo;
        selectionStatus.textContent = canContinue
            ? `Wybrano: ${selectedService}. Możesz przejść do pytań o zakres strony.`
            : canConfigureGraphic
                ? `Wybrano: ${selectedService}. Możesz przejść do pytań o zakres projektu graficznego.`
                : `Wybrano: ${selectedService}. Możesz przejść do pytań o zakres montażu.`;
        updateEstimate();
    });
}

continueButton.addEventListener("click", () => {
    const selectedService = document.querySelector('input[name="service"]:checked');
    if (selectedService instanceof HTMLInputElement && selectedService.value === "website") {
        showWebsiteConfiguration();
    }
});

graphicContinueButton.addEventListener("click", () => {
    const selectedService = document.querySelector('input[name="service"]:checked');
    if (selectedService instanceof HTMLInputElement && selectedService.value === "graphic") {
        showGraphicConfiguration();
    }
});

videoContinueButton.addEventListener("click", () => {
    const selectedService = document.querySelector('input[name="service"]:checked');
    if (selectedService instanceof HTMLInputElement && selectedService.value === "video") {
        showVideoConfiguration();
    }
});

backButton.addEventListener("click", showServicePicker);
graphicBackButton.addEventListener("click", showServicePicker);
videoBackButton.addEventListener("click", showServicePicker);
for (const button of summaryButtons) {
    if (!(button instanceof HTMLButtonElement)) {
        throw new Error("Nieprawidłowy przycisk podsumowania w konfiguratorze ACE Studio.");
    }

    button.addEventListener("click", () => {
        const service = button.dataset.service;
        if (!service || getSelectedValue("service") !== service) {
            throw new Error("Nie można przygotować podsumowania dla wybranej usługi.");
        }
        showSummary(service);
    });
}
summaryBackButton.addEventListener("click", showSelectedConfiguration);

const copyDefaultMessage = "Skopiuj podsumowanie do schowka, aby zachować je lub wysłać innym kanałem.";
let copyResetTimer = 0;

function setCopyFeedback(message, state = "") {
    copyStatus.textContent = message;
    copyStatus.classList.toggle("is-success", state === "success");
    copyStatus.classList.toggle("is-error", state === "error");
}

function buildQuoteText() {
    const lines = ["Wycena orientacyjna — ACE Studio", `Usługa: ${summaryService.textContent}`, "", "Zakres projektu:"];
    for (const row of summaryList.children) {
        lines.push(`- ${row.querySelector("dt").textContent}: ${row.querySelector("dd").textContent}`);
    }

    if (!priceBreakdown.hidden) {
        lines.push("", "Co wpływa na cenę:");
        for (const row of priceLines.children) {
            lines.push(`- ${row.querySelector("dt").textContent}: ${row.querySelector("dd").textContent}`);
        }
        lines.push("", priceVatNote.textContent.trim());
        if (!priceExclusions.hidden) {
            lines.push(priceExclusions.textContent.trim());
        }
    }

    lines.push(
        "Kwota ma charakter orientacyjny i nie stanowi wiążącej oferty.",
        "",
        "ACE Studio · kontakt@ace-studio.pl · tel. 795 972 775",
        "https://www.ace-studio.pl/wycena/",
    );
    return lines.join("\n");
}

async function copyToClipboard(text) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Przechodzimy do metody awaryjnej poniżej.
        }
    }

    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    try {
        return document.execCommand("copy");
    } finally {
        field.remove();
    }
}

copyButton?.addEventListener("click", async () => {
    window.clearTimeout(copyResetTimer);
    if (await copyToClipboard(buildQuoteText())) {
        copyLabel.textContent = "Skopiowano";
        setCopyFeedback("Wycena została skopiowana do schowka.", "success");
    } else {
        setCopyFeedback("Nie udało się skopiować automatycznie. Zaznacz podsumowanie na stronie i skopiuj je ręcznie.", "error");
    }
    copyResetTimer = window.setTimeout(() => {
        copyLabel.textContent = "Kopiuj wycenę";
    }, 3000);
});

const contactSubmit = document.querySelector("#quote-contact-submit");
const contactStatus = document.querySelector("#quote-contact-status");
const contactName = document.querySelector("#quote-contact-name");
const contactEmail = document.querySelector("#quote-contact-email");

function buildInquirySummary() {
    const lines = [];
    for (const row of summaryList.children) {
        lines.push(`${row.querySelector("dt").textContent}: ${row.querySelector("dd").textContent}`);
    }
    if (!priceBreakdown.hidden) {
        lines.push("", "Co wpływa na cenę:");
        for (const row of priceLines.children) {
            lines.push(`${row.querySelector("dt").textContent}: ${row.querySelector("dd").textContent}`);
        }
    }
    lines.push("", `Orientacyjna suma (brutto): ${totalValue.textContent}`);
    return lines.join("\n");
}

function setContactStatus(message, state = "", withMailFallback = false) {
    contactStatus.textContent = message;
    contactStatus.classList.toggle("is-success", state === "success");
    contactStatus.classList.toggle("is-error", state === "error");
    if (withMailFallback) {
        const link = document.createElement("a");
        link.href = "mailto:kontakt@ace-studio.pl";
        link.textContent = "kontakt@ace-studio.pl";
        contactStatus.append(" Napisz bezpośrednio na ", link, ".");
    }
}

let contactSending = false;

contactSubmit?.addEventListener("click", async () => {
    if (contactSending) {
        return;
    }
    if (!contactName.value.trim()) {
        setContactStatus("Podaj imię, abyśmy wiedzieli, jak się do Ciebie zwracać.", "error");
        contactName.focus();
        return;
    }
    if (!contactEmail.validity.valid || !contactEmail.value.trim()) {
        setContactStatus("Podaj poprawny adres e-mail, na który możemy odpowiedzieć.", "error");
        contactEmail.focus();
        return;
    }

    contactSending = true;
    contactSubmit.disabled = true;
    contactSubmit.setAttribute("aria-busy", "true");
    setContactStatus("Wysyłamy zapytanie…");

    try {
        const response = await fetch("wyslij.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: contactName.value.trim(),
                email: contactEmail.value.trim(),
                phone: getControlValue("#quote-contact-phone"),
                message: getControlValue("#quote-contact-message"),
                website: getControlValue("#quote-contact-website"),
                service: summaryService.textContent,
                summary: buildInquirySummary(),
            }),
        });
        const result = await response.json().catch(() => null);
        if (response.ok && result?.ok) {
            setContactStatus(result.message, "success");
            contactSubmit.textContent = "Zapytanie wysłane";
            return;
        }
        setContactStatus(result?.message ?? "Nie udało się wysłać zapytania.", "error", !result);
    } catch {
        setContactStatus("Nie udało się wysłać zapytania — sprawdź połączenie z internetem.", "error", true);
    } finally {
        contactSending = false;
        contactSubmit.removeAttribute("aria-busy");
        if (!contactSubmit.textContent.includes("wysłane")) {
            contactSubmit.disabled = false;
        }
    }
});

function updateWebsiteOptions() {
    const type = getSelectedValue("website-type");
    const isStore = type === "store";
    languageCount.hidden = !languageOption.checked;
    languageCountSelect.disabled = !languageOption.checked;
    contentCount.hidden = !contentOption.checked;
    contentCountInput.disabled = !contentOption.checked;
    productCountField.hidden = !isStore;
    cmsOption.disabled = isStore;
    cmsNote.hidden = !isStore;
    if (isStore && cmsOption.checked) {
        cmsOption.checked = false;
    }
}

for (const input of [languageOption, contentOption, pagesInput, productCountInput]) {
    input.addEventListener("input", updateWebsiteOptions);
    input.addEventListener("change", updateWebsiteOptions);
}

for (const input of document.querySelectorAll('input[name="website-type"], input[name="website-feature"], #website-language-count, #website-content-pages')) {
    input.addEventListener("change", updateWebsiteOptions);
}

document.addEventListener("input", updateEstimate);
document.addEventListener("change", updateEstimate);
void loadPricing();
