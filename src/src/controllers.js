/**
 * @module controllers
 * @description Handles page controllers : accessabilty.
 */

/**
 * Close the accessabilty card by removing class and hiding it.
 */
export function closeMenu() {
	const menu = document.getElementById("sideMenu");
	menu.classList.remove("open");
	menu.style.display = "none";
}

/**
 * Toggle the accessabilty card open or closed.
 */
export function toggleMenu() {
	const menu = document.getElementById("sideMenu");
	menu.classList.toggle("open");
}

/**
 * Toggle a accessability card's active state and apply its related functionality.
 * @param {HTMLElement} element - The card element clicked.
 * @param {string} toolName - The name of the tool to toggle.
 */
export function toggleCard(element, toolName) {
	const isActive = element.classList.toggle("active");

	// if (isActive) {
	// 	activeTools.add(toolName);
	// 	activateTool(toolName);
	// } else {
	// 	activeTools.delete(toolName);
	// 	deactivateTool(toolName);
	// }

	// // Apply or revert tool behavior
	// if (toolName == "simpleFont") simpleFont_toggle();
	// else if (toolName == "biggerText") toggleTextSize();
	// else if (toolName == "desaturation") DesaturationToggle();
	// else if (toolName == "contrast") toggleColorScheme();
	// else if (toolName == "letterSpacing") toggleLetterSpacing();
	// else if (toolName == "lineSpacing") toggleLineSpacing();
	// else if (toolName == "readSpeaker") toggleSpeech();
	// else if (toolName == "cursor") toggleMapboxAccessibility();
	// else if (toolName == "pauseAnimation") pauseAnimationToggle();
}
