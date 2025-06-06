// Three versions of the word "Bomma" in English, Telugu, and Tamil
const bommaVersions = ["Bomma", "బొమ్మ", "பொம்மா"]; // English, Telugu, Tamil

// Target element to display the word
const displayElement = document.getElementById("bomma-word");

// Function to switch between versions
let index = 0;
function switchBomma() {
    displayElement.textContent = bommaVersions[index];
    index = (index + 1) % bommaVersions.length; // Cycle through versions
}

// Set interval to change the word every 2 seconds
setInterval(switchBomma, 2000);