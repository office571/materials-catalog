const searchInput = document.getElementById("searchInput");
const priceFilter = document.getElementById("priceFilter");
const sizeFilter = document.getElementById("sizeFilter");
const originInput = document.getElementById("originInput");
const distanceFilter = document.getElementById("distanceFilter");
const applyDistance = document.getElementById("applyDistance");
const resultCount = document.getElementById("resultCount");
const clearFilters = document.getElementById("clearFilters");
const noResults = document.getElementById("noResults");
const items = document.querySelectorAll(".catalog-item");
const sectionTitles = document.querySelectorAll(".section-title");

let distanceService = null;
let mapsReady = false;

window.initGoogleMaps = function () {
    if (window.google && window.google.maps) {
        distanceService = new window.google.maps.DistanceMatrixService();
        mapsReady = true;
        console.log("Google Maps is ready");
    } else {
        mapsReady = false;
        console.warn("Google Maps loaded, but maps services are not available yet.");
    }
};

// Extra safety: if Google Maps loads before this file finishes, mark it ready.
if (window.google && window.google.maps && !mapsReady) {
    window.initGoogleMaps();
}

function filterMaterials() {
    const searchText = searchInput.value.toLowerCase().trim();
    const maxPrice = priceFilter.value;
    const selectedSize = sizeFilter.value;
    const maxTravelMinutes = distanceFilter.value;
    let visibleCount = 0;

    items.forEach((item) => {
        const name = item.dataset.name.toLowerCase();
        const price = Number(item.dataset.price);
        const sizes = item.dataset.size.toLowerCase().split(" ");
        const travelMinutes = Number(item.dataset.travelMinutes);

        const matchesSearch = name.includes(searchText);
        const matchesPrice = maxPrice === "all" || price <= Number(maxPrice);
        const matchesSize = selectedSize === "all" || sizes.includes(selectedSize.toLowerCase());
        const matchesDistance = maxTravelMinutes === "all" || (travelMinutes > 0 && travelMinutes <= Number(maxTravelMinutes));

        if (matchesSearch && matchesPrice && matchesSize && matchesDistance) {
            item.classList.remove("hidden");
            visibleCount++;
        } else {
            item.classList.add("hidden");
        }
    });

    sectionTitles.forEach((title) => {
        const group = title.nextElementSibling;
        const hasVisibleItems = group && group.querySelector(".catalog-item:not(.hidden)");
        title.classList.toggle("hidden", !hasVisibleItems);
        if (group) group.classList.toggle("hidden", !hasVisibleItems);
    });

    resultCount.textContent = `${visibleCount} material${visibleCount === 1 ? "" : "s"} found`;
    noResults.style.display = visibleCount === 0 ? "block" : "none";
}

function updateTravelTimes() {
    const origin = originInput.value.trim();
    const maxTravelMinutes = distanceFilter.value;

    if (maxTravelMinutes === "all") {
        filterMaterials();
        return;
    }

    if (!origin) {
        alert("Enter a job site address before using the travel-time filter.");
        return;
    }

    if ((!mapsReady || !distanceService) && window.google && window.google.maps) {
        window.initGoogleMaps();
    }

    if (!mapsReady || !distanceService) {
        alert("Google Maps is not ready yet. Wait a few seconds and try again. If it still fails, check that your API key replaced YOUR_GOOGLE_MAPS_API_KEY in catalog.html.");
        return;
    }

    const destinations = Array.from(items).map((item) => {
        const [lat, lng] = item.dataset.location.split(",").map(Number);
        return new google.maps.LatLng(lat, lng);
    });

    distanceService.getDistanceMatrix(
        {
            origins: [origin],
            destinations,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL,
        },
        (response, status) => {
            if (status !== "OK") {
                alert("Could not calculate travel time. Check the address and Google Maps API key.");
                return;
            }

            const elements = response.rows[0].elements;

            items.forEach((item, index) => {
                const element = elements[index];
                const travelText = item.querySelector(".travel-time");

                if (element.status === "OK") {
                    const minutes = Math.round(element.duration.value / 60);
                    item.dataset.travelMinutes = String(minutes);
                    travelText.textContent = `Travel time: ${minutes} min (${element.distance.text})`;
                } else {
                    item.dataset.travelMinutes = "999999";
                    travelText.textContent = "Travel time: unavailable";
                }
            });

            filterMaterials();
        }
    );
}

searchInput.addEventListener("input", filterMaterials);
priceFilter.addEventListener("change", filterMaterials);
sizeFilter.addEventListener("change", filterMaterials);
distanceFilter.addEventListener("change", () => {
    if (distanceFilter.value === "all") filterMaterials();
});
applyDistance.addEventListener("click", updateTravelTimes);

clearFilters.addEventListener("click", () => {
    searchInput.value = "";
    priceFilter.value = "all";
    sizeFilter.value = "all";
    originInput.value = "";
    distanceFilter.value = "all";

    items.forEach((item) => {
        item.dataset.travelMinutes = "";
        const travelText = item.querySelector(".travel-time");
        if (travelText) travelText.textContent = "Travel time: enter job site";
    });

    filterMaterials();
});

filterMaterials();
