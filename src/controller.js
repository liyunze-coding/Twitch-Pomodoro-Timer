/**
 * Controller for HTML elements and audio
 */
class controller {
	constructor(settings) {
		this.settings = settings;

		// sounds
		this.breakTimeAudio = new Audio(settings.breakSound);
		this.workTimeAudio = new Audio(settings.workSound);
		this.longBreakTimeAudio = new Audio(settings.longBreakSound);

		// HTML elements (ensure defer tag is used so HTML elements are loaded)
		this.labelEl = document.getElementById("label");
		this.timerEl = document.getElementById("cd-timer");
		this.cycleEl = document.getElementById("cycle-counter");
	}

	updateLabel(newLabel) {
		this.labelEl.textContent = newLabel;
	}

	updateCycle(cycle) {
		this.cycleEl.textContent = cycle;
	}

	updateTime(time) {
		this.timerEl.textContent = time;
	}

	playWorkSound() {
		this.workTimeAudio.play();
	}

	playBreakSound() {
		this.breakTimeAudio.play();
	}

	playLongBreakSound() {
		this.longBreakTimeAudio.play();
	}
}

export default controller;
