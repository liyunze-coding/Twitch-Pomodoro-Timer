import OBSHandler from "./OBS.js";
import discordMessage from "./discordWebhook.js";
import controller from "./controller.js";
import credentials from "../credentials.js";

function response(status, message) {
	return {
		status: status,
		body: {
			message: message,
		},
	};
}

function formatTime(time, showHours, showHoursIf00) {
	const hours = Math.floor(time / 3600);
	const minutes = showHours
		? Math.floor((time % 3600) / 60)
		: Math.floor(time / 60);
	const seconds = time % 60;

	const pad = (num) => (num < 10 ? `0${num}` : num);

	const formattedHours = pad(hours);
	const formattedMinutes = pad(minutes);
	const formattedSeconds = pad(seconds);

	let timeString;

	if (showHours && (showHoursIf00 || hours !== 0)) {
		timeString = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
	} else {
		timeString = `${formattedMinutes}:${formattedSeconds}`;
	}

	return timeString;
}

class Pomodoro {
	constructor(settings, responses, obs, discord, messages, ads, bot) {
		this.time = settings.workTime; // time on timer
		this.goal = settings.defaultPomoNumber * 2; // goal = number of pomodoro cycles
		this.workTime = settings.workTime; // seconds of work time
		this.breakTime = settings.breakTime; // seconds of break time
		this.longBreakTime = settings.longBreakTime;

		this.settings = settings; // other settings (constant)
		this.responses = responses;
		this.obs = obs;
		this.discord = discord;
		this.messages = messages;

		this.controller = new controller(settings);
		this.bot = bot;
		this.ads = ads;

		this.interval = null;
		this.isStarting = false;
		this.isRunning = false;
		this.isPaused = false;
		this.cycle = 0; // current pomodoro cycle

		this.timerState = "work"; // start, work, break, long break, finished

		this.label = settings.workLabel;

		if (this.obs.changeScenes) {
			this.obsHandler = new OBSHandler(obs);
			this.obsHandler.connect();
		}

		this.updateDisplay();
	}

	sendMessage(message) {
		message = message.replace("{channel}", `${credentials.channel}`);

		this.bot.say(message);
	}

	updateTimer() {
		// seconds to 00:00 format
		let timeString = formatTime(
			this.time,
			this.settings.showHours,
			this.settings.showHoursIf00
		);

		this.controller.updateTime(timeString);
	}

	updateDisplay() {
		this.updateTimer();

		let displayCycleNum = Math.ceil(this.cycle / 2);
		let displayGoalNum = Math.ceil(this.goal / 2);

		// update cycle counter
		this.controller.updateCycle(
			`Pomo ${displayCycleNum}/${displayGoalNum}`
		);

		// update label
		this.controller.updateLabel(this.label);
	}

	async _breaktime() {
		this.timerState = "break";
		this.label = this.settings.breakLabel;
		this.time = this.breakTime;
		this.controller.playBreakSound();

		// OBS change scenes
		if (this.obs.changeScenes) {
			let currentScene = await this.obsHandler.getScene();
			if (!this.obs.dontChangeOnScenes.includes(currentScene)) {
				this.obsHandler.changeScene(this.obs.sceneBreak);
			}
		}

		// Discord notification
		if (this.discord.sendDiscord) {
			let message = this.discord.content;
			message = message.replace("{role}", `<@&${this.discord.roleID}>`);

			discordMessage(this.discord.webHookURL, message);
		}

		if (this.messages.sendMessages) {
			for (let i = 0; i < this.messages.onBreakTimeStart.length; i++) {
				this.sendMessage(this.messages.onBreakTimeStart[i]);
			}
		}

		this.updateDisplay();
	}

	async _longbreaktime() {
		this.timerState = "long break";
		this.label = this.settings.longBreakLabel;
		this.time = this.longBreakTime;

		this.controller.playLongBreakSound();

		// OBS change scenes
		if (this.obs.changeScenes) {
			let currentScene = await this.obsHandler.getScene();
			if (!this.obs.dontChangeOnScenes.includes(currentScene)) {
				this.obsHandler.changeScene(this.obs.sceneBreak);
			}
		}

		// Discord notification
		if (this.discord.sendDiscord) {
			let message = this.discord.content;
			message = message.replace("{role}", `<@&${this.discord.roleID}>`);

			discordMessage(this.discord.webHookURL, message);
		}

		if (this.messages.sendMessages) {
			for (let i = 0; i < this.messages.onBreakTimeStart.length; i++) {
				this.sendMessage(this.messages.onBreakTimeStart[i]);
			}
		}
	}

	async _worktime() {
		this.timerState = "work";
		this.label = this.settings.workLabel;
		this.time = this.workTime;

		this.sendMessage(this.responses.workMsg);

		this.controller.playWorkSound();

		if (this.obs.changeScenes) {
			let currentScene = await this.obsHandler.getScene();

			if (!this.obs.dontChangeOnScenes.includes(currentScene)) {
				this.obsHandler.changeScene(this.obs.sceneWork);
			}
		}

		if (this.messages.sendMessages) {
			for (let i = 0; i < this.messages.onWorkTimeStart.length; i++) {
				this.sendMessage(this.messages.onWorkTimeStart[i]);
			}
		}
	}

	async finishTimer() {
		if (!this.isRunning) {
			return response(400, this.responses.notRunning);
		}

		this.controller.playBreakSound();

		this.cycle = this.goal;

		this.timerState = "finished";
		this.label = this.settings.finishLabel;
		this.isRunning = false;
		this.stop();

		// OBS change scenes
		if (this.obs.changeScenes) {
			let currentScene = await this.obsHandler.getScene();
			if (!this.obs.dontChangeOnScenes.includes(currentScene)) {
				this.obsHandler.changeScene(this.obs.sceneOver);
			}
		}

		// Discord notification
		if (this.discord.sendDiscord) {
			let message = this.discord.content;
			message = message.replace("{role}", `<@&${this.discord.roleID}>`);

			discordMessage(this.discord.webHookURL, message);
		}
	}

	_startTime() {
		this.timerState = "start";
		this.label = this.settings.startingLabel;
		this.time = this.settings.startingTime;
	}

	// !start
	streamStart() {
		if (this.isRunning) {
			return response(400, this.responses.timerRunning);
		}

		// this.isRunning = true;
		// this.isRunning = true;
		this.isStarting = true;
		this._startTime();

		let status = this.startTimer();

		if (status.status === 200) {
			return response(200, this.responses.streamStarting);
		} else {
			return status;
		}
	}

	async handleStartTimeOver() {
		await this._worktime();
		this.reset();
		this.updateDisplay();
	}

	async handleWorkTimeOver() {
		// 1: cycle is up, 2: long break 3: break
		if (
			(this.cycle === this.goal && this.settings.noLastBreak) ||
			this.cycle > this.goal
		) {
			await this.finishTimer();
			this.updateDisplay();

			this.sendMessage(this.responses.finishResponse);
		} else if (this.cycle % (this.settings.longBreakEvery * 2) === 0) {
			this.sendMessage(this.responses.longBreakMsg);

			await this._longbreaktime();
		} else {
			this.sendMessage(this.responses.breakMsg);

			await this._breaktime();
		}
	}

	async handleBreakTimeOver() {
		if (this.cycle >= this.goal) {
			await this.finishTimer();
			this.updateDisplay();
			this.sendMessage(this.responses.finishResponse);
		} else {
			this.sendMessage(this.responses.workMsg);
			await this._worktime();
		}
	}

	playAd() {
		this.sendMessage(this.ads.command);
	}

	startTimer() {
		if (this.isRunning) {
			return response(400, this.responses.timerRunning);
		}

		this.isRunning = true;
		this.cycle++;
		this.updateDisplay();

		if (this.timerState === "work") {
			this._worktime();
		} else if (this.timerState === "start") {
			this._startTime();
		}

		// start timer
		this.interval = setInterval(async () => {
			this.updateTimer();
			// if paused, do not decrement time
			if (!this.isPaused) {
				this.time--;
			}

			this.updateTimer();

			// send message if work time reminder is enabled
			if (
				["break", "long break"].includes(this.timerState) &&
				this.time === this.settings.workTimeRemind &&
				this.settings.sendWorkTimeRemind
			) {
				this.sendMessage(this.responses.workRemindMsg);
			}

			// do !ads command (if enabled)
			if (
				this.ads.enabled &&
				this.timerState === "work" &&
				this.time === this.ads.timeBeforeBreakStarts
			) {
				this.playAd();
			}

			// if time is up
			if (this.time <= 0) {
				this.cycle++;
				console.log(this.cycle, this.goal);
				if (this.timerState === "start") {
					// Starting time is up, work time paused.
					await this.handleStartTimeOver();
				} else if (this.timerState === "work") {
					// Work time is up
					await this.handleWorkTimeOver();
				} else {
					// break time is up
					await this.handleBreakTimeOver();
				}

				this.updateDisplay();
			}
		}, 1000);

		return response(200);
	}

	stop() {
		clearInterval(this.interval);
		this.isRunning = false;
	}

	pause() {
		// if already paused, do nothing
		// if not running, do nothing
		if (this.isPaused || !this.isRunning) {
			return response(400, this.responses.notRunning);
		}

		// pause timer
		this.isPaused = true;
		return response(200, this.responses.commandSuccess);
	}

	resume() {
		if (!this.isPaused) {
			return response(400, this.responses.timerRunning);
		} else if (this.timerState === "finished") {
			// Finished but want to resume:
			// Goal incremented by 1, pomodoro resumed

			// increment goal
			this.timerState = "work";
			this.goal++;
			this._worktime();
			this.startTimer();

			return response(200);
		}

		this.isPaused = false;
		return response(200, this.responses.commandSuccess);
	}

	reset() {
		if (!this.isRunning) {
			return response(400, this.responses.notRunning);
		}
		this.time = this.settings.workTime;
		this.cycle = 0;
		this.stop();
		this.updateDisplay();
	}

	skip() {
		if (!this.isRunning || this.isPaused) {
			return response(400, this.responses.notRunning);
		}

		this.time = 1; // skip to 00:01
		this.updateDisplay();
	}

	setTime(time) {
		if (isValidNum(time)) {
			this.time = parseInt(time);
			this.updateDisplay();
			return response(200, this.responses.commandSuccess);
		} else {
			return response(400, this.responses.wrongCommand);
		}
	}

	getTime() {
		return this.time;
	}

	setCycle(cycle) {
		if (!isValidNum(cycle)) {
			return response(400, this.responses.cycleWrong);
		}

		if (cycle > this.goal) {
			return response(400, this.responses.cycleWrong);
		}

		let remainder = this.cycle % 2;
		this.cycle = cycle * 2 - remainder;

		this.updateDisplay();
		return response(200, this.responses.commandSuccess);
	}

	getCycle() {
		return this.cycle;
	}

	setGoal(goal) {
		if (!isValidNum(goal)) {
			return response(400, this.responses.goalWrong);
		}
		if (goal < this.cycle) {
			return response(400, this.responses.goalWrong);
		}

		this.goal = goal * 2;
		this.updateDisplay();
		return response(200, this.responses.commandSuccess);
	}

	getGoal() {
		return this.goal;
	}

	setWorkDuration(duration) {
		if (!isValidNum(duration)) {
			return response(400, this.responses.goalWrong);
		}

		this.workTime = duration;
		// if work timer hasn't started yet,
		if (!this.isRunning || this.isStarting) {
			this.time = duration;
		}

		this.updateDisplay();

		return response(200, this.responses.commandSuccess);
	}

	setBreakDuration(duration) {
		if (!isValidNum(duration)) {
			return response(400, this.responses.goalWrong);
		}

		this.breakTime = duration;
		this.updateDisplay();

		return response(200, this.responses.commandSuccess);
	}

	setLongBreakDuration(duration) {
		if (!isValidNum(duration)) {
			return response(400, this.responses.goalWrong);
		}

		this.longBreakTime = duration;
		this.updateDisplay();

		return response(200, this.responses.commandSuccess);
	}
}

function isValidNum(value) {
	return (
		(typeof value === "number" || typeof value === "string") &&
		/^\d+$/.test(value.toString()) &&
		Number(value) > 0
	);
}

export default Pomodoro;
