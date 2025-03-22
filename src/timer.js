import OBSHandler from "./OBS.js";
import discordMessage from "./discordWebhook.js";
import controller from "./controller.js";

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

		this.workLabel = settings.workLabel; // label for work time
		this.breakLabel = settings.breakLabel; // label for break time
		this.longBreakLabel = settings.longBreakLabel; // label for long break time
		this.finishedLabel = settings.finishedLabel; // label for finished time
		this.startLabel = settings.startLabel; // label for start time

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

		this.obsHandler = null; // OBS handler

		if (this.obs.changeScenes) {
			this.obsHandler = new OBSHandler(obs);
		}

		this.updateTimer = this.updateTimer.bind(this);

		this.updateDisplay();
	}

	sendMessage(message) {
		if (!message) {
			return;
		}

		message = message.replace("{channel}", `${this.settings.channel}`);

		this.bot.say(message);
	}

	playAd() {
		this.sendMessage(this.ads.command);
	}

	startTimer() {
		if (this.isRunning && !isStarting) {
			this.bot.say(this.responses.timerRunning);
			return;
		}

		this.time = this.workTime;
		this.cycle = 0;
		this.isStarting = true;
		this.isRunning = true;

		this.controller.updateLabel(this.workLabel);

		// this.sendMessage(this.responses.workMsg);

		this.changeScene(this.obs.sceneWork);

		this.cycle++;
		this.updateDisplay();
		this.controller.playWorkSound();

		this.timer();
	}

	// update timer display
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

	timer() {
		this.updateTimer();

		if (this.isPaused && this.isRunning) {
			console.log("here for some reason");
			setTimeout(() => this.timer(), 1000);
			return;
		}

		this.time--;

		if (this.time >= 0) {
			// send work time remind / ads
			if (
				this.settings.sendWorkTimeRemind &&
				this.isBreakTime() &&
				this.time === this.settings.workTimeRemind
			) {
				this.bot.say(this.responses.workRemindMsg);
			} else if (
				this.isWorkTime() &&
				this.ads.enabled &&
				this.time === this.ads.timeBeforeBreakStarts
			) {
				this.playAd();
			}

			setTimeout(() => this.timer(), 1000);
			return;
		} else {
			if (this.cycle < this.goal && !this.settings.noLastBreak) {
				this.updateTimerWithNextCycle();
				this.timer();
			} else if (
				this.cycle < this.goal - 1 &&
				this.settings.noLastBreak
			) {
				this.updateTimerWithNextCycle();
				this.timer();
			} else {
				this.finishTimer();
			}
		}
	}

	finishTimer() {
		this.isRunning = false;
		this.isPaused = false;
		this.cycle = 0;

		this.controller.updateLabel(this.finishedLabel);
		this.controller.playFinishSound();
		this.changeScene(this.obs.sceneOver);

		this.sendMessage(this.responses.finishMsg);
	}

	isWorkTime() {
		return this.cycle % 2;
	}

	isBreakTime() {
		return !this.isWorkTime();
	}

	isLastBreak() {
		// check if it's the last break
		return this.cycle == this.goal;
	}

	isLongBreak() {
		return !(this.cycle % (this.settings.longBreakEvery * 2));
	}

	pause(pause) {
		if (!this.isRunning) {
			this.bot.say(this.responses.timerNotRunning);
			return;
		}

		this.isPaused = pause;
		return true;
	}

	updateTimerWithNextCycle() {
		this.cycle++;

		if (this.isWorkTime()) {
			this.time = this.settings.workTime;

			this.label = this.workLabel;
			this.timerState = "work";
			this.controller.updateLabel(this.workLabel);
			this.controller.playWorkSound();
			this.changeScene(this.obs.sceneWork);

			this.sendMessage(this.responses.workMsg);
		} else {
			if (this.isLongBreak()) {
				this.time = this.longBreakTime;
				this.label = this.longBreakLabel;
				this.timerState = "longBreak";
				this.controller.updateLabel(this.longBreakLabel);
				this.controller.playLongBreakSound();
				this.changeScene(this.obs.sceneBreak);

				this.sendMessage(this.responses.longBreakMsg);
			} else {
				this.time = this.breakTime;
				this.label = this.breakLabel;
				this.timerState = "break";
				this.controller.updateLabel(this.breakLabel);
				this.controller.playBreakSound();
				this.changeScene(this.obs.sceneBreak);

				this.sendMessage(this.responses.breakMsg);
			}

			if (this.settings.noLastBreak && this.cycle === this.goal) {
				this.finishTimer();
			}

			if (this.discord.sendDiscord) {
				let message = this.responses.discordMessage.replace(
					"{channel}",
					`${this.settings.channel}`
				);

				discordMessage.sendDiscordMessage(
					this.discord.webhookUrl,
					message
				);
			}
		}
	}

	skip() {
		if (this.isRunning) {
			this.time = 1;
		} else {
			this.bot.say(this.responses.timerNotRunning);
		}
	}

	changeScene(scene) {
		if (this.obs.changeScenes) {
			this.obsHandler.changeScene(scene);
		}
	}

	setTime(time) {
		if (!this.isRunning) {
			this.bot.say(this.responses.timerNotRunning);
			return;
		}

		if (!isValidNum(time)) {
			this.bot.say(this.responses.invalidTime);
			return;
		}

		this.time = time;

		this.updateDisplay();
		return true;
	}

	getTime() {
		return this.time;
	}

	setCycle(cycle) {
		if (!isValidNum(cycle)) {
			this.bot.say(this.responses.invalidCycle);
			return;
		}

		if (cycle > this.goal) {
			this.bot.say(this.responses.cycleWrong);
			return;
		}

		let newCycle = cycle * 2;

		if (this.isWorkTime()) {
			this.cycle = newCycle - 1;
		} else {
			this.cycle = newCycle;
		}

		this.updateDisplay();
		return true;
	}

	setGoal(goal) {
		if (!isValidNum(goal)) {
			this.bot.say(this.responses.invalidGoal);
			return;
		}

		if (goal < this.cycle) {
			this.bot.say(this.responses.goalWrong);
			return;
		}

		this.goal = goal * 2;

		this.updateDisplay();
		return true;
	}

	setWorkDuration(duration) {
		if (!isValidNum(duration)) {
			this.bot.say(this.responses.invalidWorkTime);
			return;
		}

		this.workTime = duration;

		this.updateDisplay();
		return true;
	}

	setBreakDuration(duration) {
		if (!isValidNum(duration)) {
			this.bot.say(this.responses.invalidBreakTime);
			return;
		}

		this.breakTime = duration;

		this.updateDisplay();
		return true;
	}

	setLongBreakDuration(duration) {
		if (!isValidNum(duration)) {
			this.bot.say(this.responses.invalidLongBreakTime);
			return;
		}

		this.longBreakTime = duration;

		this.updateDisplay();
		return true;
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
