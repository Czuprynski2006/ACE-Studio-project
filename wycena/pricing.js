// Czysta logika wyceny ACE Studio. Nie korzysta z DOM — stawki pochodzą z cennik.json.

export const websiteFeatureLabels = {
    "custom-design": "Indywidualny projekt graficzny",
    cms: "CMS do samodzielnej edycji treści",
    "contact-form": "Formularz kontaktowy",
    seo: "Rozszerzona optymalizacja SEO",
};

export function getPrice(table, key, description) {
    const value = table?.[key];

    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new Error(`Nieprawidłowa stawka cennika: ${description}.`);
    }

    return value;
}

function labelled(prefix, label) {
    return label ? `${prefix} — ${label}` : prefix;
}

export function validatePricing(data) {
    if (
        typeof data !== "object"
        || data === null
        || data.currency !== "PLN"
        || data.priceBasis !== "gross"
        || typeof data.startingFrom !== "object"
        || typeof data.website !== "object"
        || typeof data.graphic !== "object"
        || typeof data.video !== "object"
    ) {
        throw new Error("Plik orientacyjnego cennika ma nieprawidłowy format.");
    }
}

export function formatCurrency(amount, currency = "PLN") {
    return new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

// Wideo zaokrąglamy do pełnych dziesiątek, strony i grafiki liczymy co do złotówki.
export function roundEstimate(service, total, priceList) {
    if (service !== "video") {
        return total;
    }

    const roundTo = getPrice(priceList, "roundTo", "zaokrąglenie kwoty");
    if (roundTo < 1) {
        throw new Error("Nieprawidłowa precyzja zaokrąglenia w cenniku.");
    }

    return Math.round(total / roundTo) * roundTo;
}

export function calculateWebsiteEstimate(configuration, priceList) {
    const config = priceList.website;
    const type = configuration.type;
    if (!type) {
        return {
            total: getPrice(priceList.startingFrom, "website", "cena początkowa / strona WWW"),
            partial: true,
            note: "Wybierz rodzaj strony, aby doprecyzować szacunkową sumę.",
            lines: [],
        };
    }

    const base = getPrice(config.base, type, `strona WWW / ${type}`);
    const includedPages = getPrice(config.includedPages, type, `podstrony w cenie / ${type}`);
    const pages = configuration.pagesValue === "" ? includedPages : Number(configuration.pagesValue);
    if (!Number.isInteger(pages) || pages < 1 || pages > 100) {
        return { total: null, partial: true, note: "Podaj liczbę podstron od 1 do 100.", lines: [] };
    }

    if (type === "landing" && pages > includedPages) {
        return {
            total: null,
            partial: true,
            note: "Landing page obejmuje maksymalnie 1 podstronę. Zmień rodzaj strony, aby wycenić większą witrynę.",
            lines: [],
        };
    }

    const lines = [{ label: "Cena bazowa", amount: base }];
    let total = base;
    const additionalPages = Math.max(0, pages - includedPages);
    const additionalPagePrice = getPrice(config, "additionalPage", "dodatkowa podstrona");
    if (additionalPages > 0) {
        const amount = additionalPages * additionalPagePrice;
        total += amount;
        lines.push({
            label: `Dodatkowe podstrony (${additionalPages} × ${formatCurrency(additionalPagePrice, priceList.currency)})`,
            amount,
        });
    }

    let productCount = 0;
    if (type === "store") {
        const includedProducts = getPrice(config, "includedProducts", "produkty w cenie sklepu");
        productCount = configuration.productCountValue === "" ? includedProducts : Number(configuration.productCountValue);
        if (!Number.isInteger(productCount) || productCount < 1 || productCount > 1000) {
            return { total: null, partial: true, note: "Podaj liczbę produktów od 1 do 1000.", lines: [] };
        }
        const additionalProducts = Math.max(0, productCount - includedProducts);
        const additionalProductPrice = getPrice(config, "additionalProduct", "dodatkowy produkt");
        if (additionalProducts > 0) {
            const amount = additionalProducts * additionalProductPrice;
            total += amount;
            lines.push({
                label: `Dodatkowe produkty (${additionalProducts} × ${formatCurrency(additionalProductPrice, priceList.currency)})`,
                amount,
            });
        }
    }

    for (const feature of configuration.selectedFeatures) {
        if (feature === "languages") {
            const count = Number(configuration.languageCountValue);
            if (!Number.isInteger(count) || count < 1 || count > 100) {
                return { total: null, partial: true, note: "Podaj liczbę dodatkowych języków od 1 do 100.", lines: [] };
            }
            const perLanguage = getPrice(config.languageSurcharge, "perLanguage", "dodatkowy język");
            const amount = count * perLanguage;
            total += amount;
            lines.push({
                label: `Dodatkowe wersje językowe (${count} × ${formatCurrency(perLanguage, priceList.currency)})`,
                amount,
            });
        } else if (feature === "content") {
            const contentPages = Number(configuration.contentPagesValue);
            if (!Number.isInteger(contentPages) || contentPages < 1 || contentPages > pages) {
                return {
                    total: null,
                    partial: true,
                    note: `Podaj liczbę podstron z treścią od 1 do ${pages}.`,
                    lines: [],
                };
            }
            const perContentPage = getPrice(config, "perContentPage", "przygotowanie treści za podstronę");
            const amount = contentPages * perContentPage;
            total += amount;
            lines.push({
                label: `Przygotowanie treści (${contentPages} × ${formatCurrency(perContentPage, priceList.currency)})`,
                amount,
            });
        } else if (type === "store" && feature === "cms") {
            continue;
        } else {
            const amount = getPrice(config.features, feature, `strona WWW / ${feature}`);
            total += amount;
            lines.push({ label: websiteFeatureLabels[feature] ?? feature, amount });
        }
    }

    const minimum = getPrice(config, "minimum", "minimalna cena projektu WWW");
    if (total < minimum) {
        lines.push({ label: "Dopłata do ceny minimalnej", amount: minimum - total });
        total = minimum;
    }
    const incomplete = configuration.pagesValue === "" || (type === "store" && configuration.productCountValue === "");
    const note = configuration.additionalRequirements
        ? "Nietypowe funkcjonalności wymagają indywidualnej wyceny."
        : incomplete
            ? "Suma częściowa — przyjęto zakres podstron i produktów wliczony w pakiet."
            : "Suma uwzględnia wybrany pakiet, zakres i dodatki.";

    return {
        type,
        base,
        includedPages,
        pages,
        additionalPages,
        productCount,
        total,
        partial: incomplete || Boolean(configuration.additionalRequirements),
        note,
        lines,
    };
}

export function calculateGraphicEstimate(configuration, priceList) {
    const type = configuration.type;
    if (!type) {
        return {
            total: getPrice(priceList.startingFrom, "graphic", "cena początkowa / grafika"),
            partial: true,
            note: "Wybierz rodzaj grafiki, aby doprecyzować szacunkową sumę.",
            lines: [],
        };
    }

    const config = priceList.graphic;
    const base = getPrice(config.base, type, `grafika / ${type}`);
    const complexity = configuration.complexity ?? "standard";
    const complexitySurcharge = getPrice(config.complexitySurcharge, complexity, `złożoność / ${complexity}`);
    const concepts = Number(configuration.concepts ?? "1");

    if (!Number.isInteger(concepts) || concepts < 1 || concepts > 3) {
        return { total: null, partial: true, note: "Wybierz od 1 do 3 propozycji projektu.", lines: [] };
    }

    const labels = configuration.labels ?? {};
    const extraConceptsPrice = Math.max(0, concepts - 1) * base * getPrice(config, "additionalConceptMultiplier", "dodatkowa koncepcja");
    let total = base + complexitySurcharge + extraConceptsPrice;

    const lines = [{ label: labelled("Cena bazowa", labels.type), amount: base }];
    if (complexitySurcharge > 0) {
        lines.push({ label: labelled("Złożoność projektu", labels.complexity), amount: complexitySurcharge });
    }
    if (extraConceptsPrice > 0) {
        lines.push({ label: `Dodatkowe propozycje projektu (${concepts - 1})`, amount: extraConceptsPrice });
    }

    for (const option of configuration.options) {
        const amount = getPrice(config.options, option, `grafika / ${option}`);
        total += amount;
        lines.push({ label: labels.options?.[option] ?? option, amount });
    }

    const incomplete = !configuration.complexity || !configuration.concepts;
    return {
        total,
        lines,
        partial: incomplete,
        note: incomplete
            ? "Uzupełnij wymagane wybory — brakujące odpowiedzi liczymy w wariancie podstawowym."
            : "Suma uwzględnia rodzaj grafiki, liczbę koncepcji, złożoność i dodatki.",
    };
}

export function calculateVideoEstimate(configuration, priceList) {
    const type = configuration.type;
    if (!type) {
        return {
            total: getPrice(priceList.startingFrom, "video", "cena początkowa / montaż wideo"),
            partial: true,
            note: "Wybierz rodzaj filmu, aby doprecyzować szacunkową sumę.",
            lines: [],
        };
    }

    const config = priceList.video;
    const base = getPrice(config.base, type, `wideo / ${type}`);
    const duration = configuration.duration ?? "up-to-15";
    const footage = configuration.footage ?? "up-to-15";
    const versions = configuration.versions ?? "0";
    const durationSurcharge = getPrice(config.durationSurcharge, duration, `długość filmu / ${duration}`);
    const footageSurcharge = getPrice(config.footageSurcharge, footage, `materiał źródłowy / ${footage}`);
    const versionsMultiplier = getPrice(config.additionalVersionMultiplier, versions, `dodatkowe wersje / ${versions}`);
    const labels = configuration.labels ?? {};
    const subtotal = base + durationSurcharge + footageSurcharge;
    const versionsPrice = subtotal * versionsMultiplier;
    let total = subtotal * (1 + versionsMultiplier);

    const lines = [{ label: labelled("Cena bazowa", labels.type), amount: base }];
    if (durationSurcharge > 0) {
        lines.push({ label: labelled("Długość filmu", labels.duration), amount: durationSurcharge });
    }
    if (footageSurcharge > 0) {
        lines.push({ label: labelled("Materiał źródłowy", labels.footage), amount: footageSurcharge });
    }
    if (versionsPrice > 0) {
        lines.push({ label: labelled("Dodatkowe wersje", labels.versions), amount: versionsPrice });
    }

    for (const feature of configuration.features) {
        const amount = getPrice(config.features, feature, `wideo / ${feature}`);
        total += amount;
        lines.push({ label: labels.features?.[feature] ?? feature, amount });
    }

    const incomplete = !configuration.duration || !configuration.footage || !configuration.versions;
    return {
        total,
        lines,
        partial: incomplete,
        note: incomplete
            ? "Uzupełnij wymagane wybory — brakujące odpowiedzi liczymy w wariancie podstawowym."
            : "Suma uwzględnia długość filmu, materiał źródłowy, dodatki i wersje.",
    };
}
