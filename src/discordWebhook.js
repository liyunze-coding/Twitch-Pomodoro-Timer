function discordMessage(webhookURL, message) {
	var xhr = new XMLHttpRequest();
	xhr.open("POST", webhookURL, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(
		JSON.stringify({
			content: message,
		})
	);
}

export default discordMessage;
