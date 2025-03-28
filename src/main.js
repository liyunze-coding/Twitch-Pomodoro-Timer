import Pomodoro from "./timer.js";
import configs from "../configs.js";
import chatHandler from "./chatHandler.js";

const SBClient = new StreamerbotClient({
	host: configs.StreamerBotWS.host,
	port: configs.StreamerBotWS.port,
	endpoint: configs.StreamerBotWS.endpoint,
});
const bot = new chatHandler(configs.chatBotSettings, SBClient);

const pomodoro = new Pomodoro(
	configs.settings,
	configs.responses,
	configs.obs,
	configs.discord,
	configs.messages,
	configs.ads,
	bot
);

const responses = configs.responses;

function processResponse(status, messageID) {
	if (status.body.message) {
		bot.say(status.body.message);
	}
}

function parseDuration(duration) {
	let time = null;
	if (/^\d+:\d+$/.test(duration)) {
		let [minutes, seconds] = duration.split(":");
		time = parseInt(minutes) * 60 + parseInt(seconds);
	} else if (/^\d+:\d+:\d+$/.test(duration)) {
		let [hours, minutes, seconds] = duration.split(":");
		time =
			parseInt(hours) * 60 * 60 +
			parseInt(minutes) * 60 +
			parseInt(seconds);
	} else if (/^\d+$/.test(duration)) {
		time = parseInt(duration); // seconds
	}

	return time;
}

function processCommand(command, message, messageID, flags) {
	let status = null;
	command = command.toLowerCase();
	message = message.toLowerCase();
	if (command === "timer") {
		// Permission check
		if (!(flags.broadcaster || (configs.settings.allowMods && flags.mod))) {
			if (!configs.settings.allowMods && flags.mod) {
				bot.say(responses.modsNotAllowed, messageID);
			} else {
				bot.say(responses.notMod, messageID);
			}
			return;
		}

		if (message === "start") {
			// !timer start
			status = pomodoro.startTimer();
		} else if (/^\d+:\d+$/.test(message)) {
			// !timer 00:00
			let [minutes, seconds] = message.split(":");
			let time = parseInt(minutes) * 60 + parseInt(seconds);
			status = pomodoro.setTime(time);
		} else if (/^\d+:\d+:\d+$/.test(message)) {
			// !timer 00:00:00

			let [hours, minutes, seconds] = message.split(":");
			let time =
				parseInt(hours) * 60 * 60 +
				parseInt(minutes) * 60 +
				parseInt(seconds);

			status = pomodoro.setTime(time);
		} else if (/^\d+$/.test(message)) {
			// !timer 600 (seconds)
			// only runs if timer is running

			let time = parseInt(message); // seconds
			status = pomodoro.setTime(time);
		} else if (message === "pause") {
			// !timer pause
			status = pomodoro.pause(true);
		} else if (message === "resume") {
			// !timer resume
			status = pomodoro.pause(false);
		} else if (
			message === "reset" ||
			message === "clear" ||
			message === "finish"
		) {
			// !timer reset
			status = pomodoro.finishTimer();
		} else if (message === "skip") {
			// !timer skip
			status = pomodoro.skip();
		} else if (message.startsWith("add")) {
			// !timer add 60
			let time = parseDuration(message.split(" ")[1]);
			let newTime = pomodoro.getTime() + time;

			status = pomodoro.setTime(newTime);
		} else if (message.startsWith("sub")) {
			// !timer sub 60
			let time = parseDuration(message.split(" ")[1]);
			let newTime = pomodoro.getTime() - time;

			if (newTime < 1) newTime = 1;

			status = pomodoro.setTime(newTime);
		} else if (message.startsWith("cycle")) {
			// !timer cycle 5
			let cycle = parseInt(message.split(" ")[1]);
			status = pomodoro.setCycle(cycle);
		} else if (message.startsWith("goal")) {
			// !timer goal 5
			let goal = parseInt(message.split(" ")[1]);
			status = pomodoro.setGoal(goal);
		} else if (
			message.startsWith("setwork") ||
			message.startsWith("setworktime")
		) {
			// !timer setwork 600
			let duration = message.split(" ").slice(1).join(" ");
			duration = parseDuration(duration);

			status = pomodoro.setWorkDuration(duration);
		} else if (
			message.startsWith("setbreak") ||
			message.startsWith("setbreaktime")
		) {
			// !timer setbreak 600
			let duration = message.split(" ").slice(1).join(" ");
			duration = parseDuration(duration);

			status = pomodoro.setBreakDuration(duration);
		} else if (
			message.startsWith("setlongbreak") ||
			message.startsWith("setlongbreaktime")
		) {
			// !timer setlongbreak 600
			let duration = message.split(" ").slice(1).join(" ");
			duration = parseDuration(duration);

			status = pomodoro.setLongBreakDuration(duration);
		} else {
			// unrecognized command
			status = {
				status: 400,
				body: {
					message: responses.wrongCommand,
				},
			};
		}
	} else if (command === "start") {
		// !start
		status = pomodoro.streamStart();
	}

	if (status) {
		processResponse(status, messageID);
	}
}

// ComfyJS.onCommand = (user, command, message, flags, extra) => {
// 	processCommand(command, message, extra.id, flags);
// };

setTimeout(() => {
	pomodoro.startTimer();
}, 3000);

SBClient.on("Twitch.ChatMessage", (data) => {
	const payload = data.data;

	let command = payload.message.message.split(" ")[0];

	// remove !
	if (command.startsWith("!")) {
		command = command.slice(1);
	} else {
		return;
	}

	// const user = payload.message.displayName;

	const message = payload.message.message.split(" ").slice(1).join(" ");
	const messageID = payload.messageId;

	// iterate through payload.message.badges
	// each iteration has name in an object
	// if name is "moderator" or "broadcaster", set flags.mod or flags.broadcaster to true
	const badges = payload.message.badges;

	const flags = {
		broadcaster: false,
		mod: false,
	};

	badges.forEach((badge) => {
		if (badge.name === "broadcaster") {
			flags.broadcaster = true;
		} else if (badge.name === "moderator") {
			flags.mod = true;
		}
	});

	// console.log(payload);

	// console.log("processing", command, message, messageID, flags);

	processCommand(command, message, messageID, flags);
});
