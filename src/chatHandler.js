class chatHandler {
	constructor(chatBotSettings) {
		this.settings = chatBotSettings;
	}

	say(message, parentID) {
		if (message == null) {
			throw new Error("Message cannot be null");
		}

		if (this.settings.italic) {
			message = `/me ${message}`;
		}

		if (!this.settings.replyToMessage || parentID == null) {
			ComfyJS.Say(message);
		} else {
			ComfyJS.Reply(parentID, message);
		}
	}
}

export default chatHandler;
