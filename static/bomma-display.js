// Three versions of "Welcome to Bomma AI" in English, Telugu, and Tamil
const welcomeMessages = [
    "Welcome to Bomma AI", // English
    " Welcome to బొమ్మ AI" , // Telugu
    "Welcome to பொம்மா AI "  // Tamil
];

// Target element to display the message
const welcomeElement = document.getElementById("bomma-welcome");

// Function to switch between messages
let index = 0;
function switchWelcomeMessage() {
    welcomeElement.textContent = welcomeMessages[index];
    index = (index + 1) % welcomeMessages.length; // Cycle through messages
}

// Set interval to change the message every 3 seconds
setInterval(switchWelcomeMessage, 2000);
