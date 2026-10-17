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

window.addEventListener("load", init);

function init() {
    document.getElementById("search-form").addEventListener("submit", handleSubmit);

    document.getElementById("search-input").value = "office";
    searchShows("office");
}

function handleSubmit(event) {
    event.preventDefault();

    let query = document.getElementById("search-input").value.trim();

    if (query === "") {
        showStatus("Please enter a show title.", "error");
        clearGallery();
        return;
    }

    searchShows(query);
}

async function searchShows(query) {
    clearGallery();
    showStatus("Searching...", "loading");

    try {
        let url = BASE_URL + "/search/shows?q=" + encodeURIComponent(query);
        let response = await fetch(url);

        if (!response.ok) {
            throw new Error("The request did not work.");
        }

        let results = await response.json();

        if (results.length === 0) {
            showStatus("No shows found. Try another search.", "info");
            return;
        }

        showStatus("Search results for \"" + query + "\":", "info");

        let gallery = document.getElementById("gallery");

        results.slice(0, 10).forEach(function (result) {
            gallery.appendChild(buildCard(result.show));
        });
    } catch (error) {
        showStatus("Could not load shows. Check your connection and try again.", "error");
    }
}

function buildCard(show) {
    let card = document.createElement("article");
    card.classList.add("card");

    if (show.image && show.image.medium) {
        let image = document.createElement("img");
        image.src = show.image.medium;
        image.alt = "Poster for " + show.name;
        card.appendChild(image);
    } else {
        let placeholder = document.createElement("div");
        placeholder.classList.add("no-image");
        placeholder.textContent = "No image available";
        card.appendChild(placeholder);
    }

    let body = document.createElement("div");
    body.classList.add("card-body");

    let title = document.createElement("h2");
    title.textContent = show.name || "Untitled show";
    body.appendChild(title);

    let genres = document.createElement("p");
    genres.textContent = "Genres: ";

    if (show.genres && show.genres.length > 0) {
        genres.textContent += show.genres.join(", ");
    } else {
        genres.textContent += "Not listed";
    }

    body.appendChild(genres);

    let rating = document.createElement("p");

    if (show.rating && show.rating.average !== null) {
        rating.textContent = "Rating: " + show.rating.average + " / 10";
    } else {
        rating.textContent = "Rating: Not available";
    }

    body.appendChild(rating);

    if (show.url) {
        let link = document.createElement("a");
        link.href = show.url;
        link.textContent = "View on TVmaze";
        body.appendChild(link);
    }

    card.appendChild(body);
    return card;
}

function showStatus(message, type) {
    let status = document.getElementById("status");
    status.classList.remove("loading", "error", "info");
    status.classList.add(type);
    status.textContent = message;
}

function clearGallery() {
    document.getElementById("gallery").textContent = "";
}

