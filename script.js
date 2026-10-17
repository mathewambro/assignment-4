/*
    Name: Mathew Ambrosino
    Date: 10.16.2026
    CSC 372-01

    script.js for the TVmaze Gallery. Searches the TVmaze API for shows 
    that match the visitor's guery, builds a card for each result with DOM
    methods, and uses each show's id to load its main cast with a second
    request.
*/

"use strict";

const BASE_URL = "https://api.tvmaze.com";
const MAX_RESULTS = 10;
const MAX_CAST = 5;
let latestSearch = 0;

window.addEventListener("load", init);

function init() {
    id("search-form").addEventListener("submit", handleSubmit);
    id("search-input").value = "office";
    searchShows("office");
}

function handleSubmit(event) {
    event.preventDefault();

    let query = id("search-input").value.trim();

    if (query === "") {
        latestSearch++;
        clearGallery();
        showStatus("Please enter a show title or keyword.", "error");
        id("search-input").focus();
    } else {
        searchShows(query);
    }
}

async function searchShows(query) {
    latestSearch++;
    let searchId = latestSearch;

    clearGallery();
    showStatus("Searching for \"" + query + "\"...", "loading");

    try {
        let url = BASE_URL + "/search/shows?q=" + encodeURIComponent(query);
        let response = await fetch(url);
        await statusCheck(response);

        let results = await response.json();

        if (searchId === latestSearch) {
            displayResults(results.slice(0, MAX_RESULTS), query);
        }
    } catch (error) {
        if (searchId === latestSearch) {
            showStatus(getErrorMessage(error), "error");
        }
    }
}

function displayResults(results, query) {
    if (results.length === 0) {
        showStatus("No shows found for \"" + query + "\". Try another search.", "info");
        return;
    }

    let noun = results.length === 1 ? "show" : "shows";
    showStatus("Showing " + results.length + " " + noun + " for \"" + query + "\".", "info");

    let gallery = id("gallery");

    results.forEach(function (result) {
        gallery.appendChild(buildCard(result.show));
    });
}

function buildCard(show) {
    let card = document.createElement("article");
    card.classList.add("card");
    card.appendChild(buildImage(show));

    let body = document.createElement("div");
    body.classList.add("card-body");

    let title = document.createElement("h2");
    title.textContent = show.name || "Untitled show";
    body.appendChild(title);

    body.appendChild(buildDetails(show));

    let summary = document.createElement("p");
    summary.classList.add("summary");
    summary.textContent = getSummaryText(show.summary);
    body.appendChild(summary);

    let castHeading = document.createElement("h3");
    castHeading.textContent = "Main cast";
    body.appendChild(castHeading);

    let castList = document.createElement("ul");
    castList.classList.add("cast");
    body.appendChild(castList);
    loadCast(show.id, castList);

    body.appendChild(buildLink(show));

    card.appendChild(body);
    return card;
}

function buildImage(show) {
    if (show.image && show.image.medium) {
        let image = document.createElement("img");
        image.src = show.image.medium;
        image.alt = "Poster for " + (show.name || "this show");
        return image;
    }

    let placeholder = document.createElement("div");
    placeholder.classList.add("no-image");
    placeholder.textContent = "No image available";
    return placeholder;
}

function buildDetails(show) {
    let details = document.createElement("dl");
    details.classList.add("details");

    let genres = "No genres listed";
    if (show.genres && show.genres.length > 0) {
        genres = show.genres.join(", ");
    }

    let rating = "Not rated yet";
    if (show.rating && show.rating.average !== null && show.rating.average !== undefined) {
        rating = show.rating.average + " / 10";
    }

    addDetail(details, "Premiered:", formatPremiere(show.premiered));
    addDetail(details, "Last updated:", formatUpdated(show.updated));
    addDetail(details, "Genres:", genres);
    addDetail(details, "Rating:", rating);

    return details;
}

function addDetail(list, label, value) {
    let row = document.createElement("div");
    let term = document.createElement("dt");
    let description = document.createElement("dd");

    term.textContent = label;
    description.textContent = value;

    row.appendChild(term);
    row.appendChild(description);
    list.appendChild(row);
}

function buildLink(show) {
    if (!show.url) {
        let note = document.createElement("p");
        note.textContent = "TVmaze link unavailable";
        return note;
    }

    let link = document.createElement("a");
    link.classList.add("card-link");
    link.href = show.url;
    link.textContent = "View on TVmaze";
    return link;
}

async function loadCast(showId, castList) {
    showCastMessage(castList, "Loading cast...");

    try {
        let response = await fetch(BASE_URL + "/shows/" + showId + "/cast");
        await statusCheck(response);

        let cast = await response.json();

        if (cast.length === 0) {
            showCastMessage(castList, "No cast information available.");
            return;
        }

        castList.textContent = "";

        cast.slice(0, MAX_CAST).forEach(function (member) {
            let item = document.createElement("li");
            let actorName = "Unknown actor";

            if (member.person && member.person.name) {
                actorName = member.person.name;
            }

            if (member.character && member.character.name) {
                actorName += " as " + member.character.name;
            }

            item.textContent = actorName;
            castList.appendChild(item);
        });
    } catch (error) {
        if (error.status === 429) {
            showCastMessage(castList, "Too many requests. Cast could not be loaded right now.");
        } else {
            showCastMessage(castList, "Cast could not be loaded.");
        }
    }
}

function showCastMessage(castList, message) {
    castList.textContent = "";

    let item = document.createElement("li");
    item.textContent = message;
    castList.appendChild(item);
}

function getSummaryText(summaryHtml) {
    if (!summaryHtml) {
        return "No summary available.";
    }

    let parsedSummary = new DOMParser().parseFromString(summaryHtml, "text/html");
    let summaryText = parsedSummary.body.textContent.trim();

    return summaryText || "No summary available.";
}

function formatPremiere(dateString) {
    if (!dateString) {
        return "Unknown";
    }

    let date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatUpdated(seconds) {
    if (!seconds) {
        return "Unknown";
    }

    let date = new Date(seconds * 1000);
    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

function statusCheck(response) {
    if (!response.ok) {
        let error = new Error("HTTP " + response.status);
        error.status = response.status;
        throw error;
    }

    return response;
}

function getErrorMessage(error) {
    if (error.status === 429) {
        return "Too many requests right now. Wait a few seconds and try again.";
    }

    return "Could not load shows. Check your connection and try again.";
}

function showStatus(message, type) {
    let status = id("status");
    status.classList.remove("loading", "error", "info");
    status.classList.add(type);
    status.textContent = message;
}

function clearGallery() {
    id("gallery").textContent = "";
}

function id(idName) {
    return document.getElementById(idName);
}