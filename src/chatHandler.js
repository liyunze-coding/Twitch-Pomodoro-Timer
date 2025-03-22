export default class chatHandler {
	constructor(chatBotSettings, SBClient) {
		this.settings = chatBotSettings;
		this.SBClient = SBClient;
	}

	async say(message, messageID = null) {
		if (message == null) {
			throw new Error("Message cannot be null");
		}

		if (this.settings.italic) {
			message = `/me ${message}`;
		}

		await this.SBClient.doAction("796ecdc6-99a5-4144-a208-ed7bd46cb635", {
			message: message,
		});
	}
}
