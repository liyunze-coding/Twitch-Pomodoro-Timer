const configs = (function () {
	"use strict";

	const StreamerBotWS = {
		// StreamerBot WebSocket
		host: "127.0.0.1",
		port: 6968,
		endpoint: "/",
	};

	const settings = {
		channel: "RythonDev",

		// Time Configuration
		workTime: 50 * 60, // in seconds
		breakTime: 10 * 60, // in seconds
		longBreakTime: 15 * 60, // in seconds
		longBreakEvery: 3, // long break every x pomos
		defaultPomoNumber: 5,
		workTimeRemind: 25, // how many seconds before work time starts to remind
		sendWorkTimeRemind: true,

		startingTime: 5 * 60, // triggered by !start
		noLastBreak: true,
		showHours: false, // true: time in hh:mm:ss; false: time in mm:ss always
		showHoursIf00: false, // true: will show 00:mm:ss, false: will show mm:ss when hours is 0

		// Permission
		allowMods: true, // true or false

		// Label Configuration
		workLabel: "Work",
		breakLabel: "Break",
		longBreakLabel: "Break",
		finishLabel: "Finished!",
		startingLabel: "Starting",

		// Sound Configuration
		workSound: "./sounds/workSound.mp3", // works with any sound extension
		breakSound: "./sounds/breakSound.mp3", // ensure that the extension is put here
		longBreakSound: "./sounds/breakSound.mp3",
	};

	// note: replying + italic will just result in the bot mentioning you, instead of creating a reply thread
	const chatBotSettings = {
		italic: true, // true or false
	};

	// ADDITIONAL messages/Commands on work or break time
	const messages = {
		sendMessages: false, // true or false
		onBreakTimeStart: [], // [] on empty
		onWorkTimeStart: ["!setgame co-working & studying"],
	};

	// OBS > Tools > WebSocket Server Settings
	const obs = {
		changeScenes: true, // true or false
		sceneWork: "pomo", // scene name for when it's work time
		sceneBreak: "break", // scene name for when it's break time
		sceneOver: "break", // scene name for when pomodoros are all finished
		dontChangeOnScenes: ["AFK_Day", "AFK_Night"], // scenes to not change when timer state changes (e.g. You're AFK and you don't want to automatically switch scenes)
	};

	// Responses
	const responses = {
		workMsg: "It's work time 📏 📘", // works with emojis
		breakMsg: "Time for a break! 🎶 🎮",
		longBreakMsg: "Time for a long break! 👀",
		workRemindMsg: "Time to get ready for focus @{channel} 💻", // can be customized to anything
		notMod: "ur not mod LUL",
		modsNotAllowed: "Mods aren't allowed to use this command smh",
		notRunning: "The timer is not running to perform this command!",
		streamStarting: "Stream is starting!",
		wrongCommand: "Command not recognized!",
		timerRunning: "Timer is already started!",
		commandSuccess: "Done!",
		cycleWrong: "Cycle cannot be more than goal!",
		goalWrong: "Goal cannot be less than cycle!",
		finishResponse: "Good work today everyone 💪🏽",
		alreadyStarting:
			"The stream is already starting or the timer is running!",
	};

	// Personal addition, play ads at 1:50 before break starts
	const ads = {
		enabled: true,
		command: "!ads",
		timeBeforeBreakStarts: 60 + 50,
	};

	// Discord notifications
	const discord = {
		sendDiscord: false, // true or false, true = sends discord ping when break starts
		webHookURL:
			"https://discord.com/api/webhooks/1101518991492665404/ln0K_g1IFtSHMeBFVh7EiPv_H5Ha1iv1D8ywh-Y6SGnZs8wwTPKnSXR6abd2CO8qnfgR", // make sure to keep the "" around the url
		roleID: "1052576825504698388", // role id to ping, can be obtained by right clicking on the role (ensure to have developer mode on)
		content: "Stream is going on break! {role}", // message to send
	};

	return {
		StreamerBotWS,
		messages,
		settings,
		responses,
		discord,
		obs,
		chatBotSettings,
		ads,
	};
})();

export default configs;
