import Pomodoro from "./timer.js";
import configs from "../configs.js";
import chatHandler from "./chatHandler.js";

const bot = new chatHandler(configs.chatBotSettings);

const pomodoro = new Pomodoro(
	configs.settings,
	configs.responses,
	configs.obs,
	configs.discord,
	configs.messages,
	bot
);

const responses = configs.responses;

function processResponse(status, messageID) {
	if (status.body.message) {
		bot.say(status.body.message, messageID);
	}
}

function processCommand(command, message, messageID, flags) {
	let status = null;
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
			status = pomodoro.pause();
		} else if (message === "resume") {
			// !timer resume
			status = pomodoro.resume();
		} else if (message === "reset") {
			// !timer reset
			status = pomodoro.reset();
		} else if (message === "stop") {
			// !timer stop
			status = pomodoro.stop();
		} else if (message === "skip") {
			// !timer skip
			status = pomodoro.skip();
		} else if (message.startsWith("add")) {
			// !timer add 60
			let time = parseInt(message.split(" ")[1]);
			let newTime = pomodoro.getTime() + time;

			pomodoro.setTime(newTime);
		} else if (message.startsWith("cycle")) {
			// !timer cycle 5
			let cycle = parseInt(message.split(" ")[1]);
			status = pomodoro.setCycle(cycle);
		} else if (message.startsWith("goal")) {
			// !timer goal 5
			let goal = parseInt(message.split(" ")[1]);
			status = pomodoro.setGoal(goal);
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

ComfyJS.onCommand = (user, command, message, flags, extra) => {
	processCommand(command, message, extra.id, flags);
};
