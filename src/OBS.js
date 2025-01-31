// a lot of code was stolen from nmsturcke
// reference: https://github.com/nmsturcke/Minimal-Pomo-Timer/blob/main/js/logic.js

class OBSHandler {
	constructor(config) {
		this.config = config;
		this.obsSocket = null;
	}

	generateUUID() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
			/[xy]/g,
			function (c) {
				const r = (Math.random() * 16) | 0;
				const v = c === "x" ? r : (r & 0x3) | 0x8;
				return v.toString(16);
			}
		);
	}

	async connect() {
		if (!this.config.port) return;

		console.debug(
			"Connecting to OBS WebSocket ws://localhost:",
			this.config.port
		);
		this.obsSocket = new WebSocket("ws://localhost:" + this.config.port);

		this.obsSocket.onopen = () => {
			console.log("Connected to OBS WebSocket");
		};

		this.obsSocket.onclose = () => {
			console.log("Disconnected from OBS WebSocket");
		};

		this.obsSocket.onerror = (error) => {
			console.error("OBS WebSocket error:", error);
		};

		this.obsSocket.onmessage = (message) => {
			const data = JSON.parse(message.data);
			if (data.op === 0) {
				this.authenticate(data.d);
			}
		};
	}

	async authenticate(data) {
		const passwordSalt = this.config.password + data.authentication.salt;

		const shaObj1 = new jsSHA("SHA-256", "TEXT");
		shaObj1.update(passwordSalt);
		const base64Secret = shaObj1.getHash("B64");

		const secretChallenge = base64Secret + data.authentication.challenge;

		const shaObj2 = new jsSHA("SHA-256", "TEXT");
		shaObj2.update(secretChallenge);
		const authString = shaObj2.getHash("B64");

		const authMessage = {
			op: 1,
			d: {
				rpcVersion: 1,
				authentication: authString,
			},
		};

		// Send the authentication message
		this.obsSocket.send(JSON.stringify(authMessage));
	}

	async changeScene(sceneName) {
		if (!this.config.port || !sceneName) return;

		const changeSceneMessage = {
			op: 6,
			d: {
				requestType: "SetCurrentProgramScene",
				requestId: this.generateUUID(),
				requestData: {
					sceneName: sceneName,
				},
			},
		};
		this.obsSocket.send(JSON.stringify(changeSceneMessage));
		console.log(`Scene changed to: ${sceneName}`);
	}

	async getScene() {
		if (!this.config.port) return;

		const getSceneMessage = {
			op: 6,
			d: {
				requestType: "GetCurrentProgramScene",
				requestId: this.generateUUID(),
			},
		};
		this.obsSocket.send(JSON.stringify(getSceneMessage));

		// return scene name
		return new Promise((resolve) => {
			this.obsSocket.onmessage = (message) => {
				const data = JSON.parse(message.data);
				if (data.d.requestId === getSceneMessage.d.requestId) {
					resolve(data.d.responseData.currentProgramSceneName);
				}
			};
		});
	}
}

// Usage
// const obsConfig = configs.obs;

// const obsHandler = new OBSHandler(obsConfig);
// obsHandler.connect();

export default OBSHandler;
