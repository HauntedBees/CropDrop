/*Copyright 2017 Sean Finch

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
var SAVEDATAVERSION = "0.BEEP";
var settings = {
	device: "browser",
	playSounds: true,
	playMusic: true,
	wasUsingFB: false,
	HDgrafs: false,
	whackerRight: true, 
	accGrafs: 0,
	lastGardenVisit: new Date(),
	garden: [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]],
	cropsGrown: 0, 
	pollen: 0
};
var levelsCompleted = {};
var sounds = {
	bweep: "assets/sounds/whoppy.wav", wood: "assets/sounds/woodclick.wav", tap: "assets/sounds/tap.wav",
	yes: "assets/sounds/confirmyes.wav", win: "assets/sounds/win.wav", lose: "assets/sounds/lose.wav",
	harvest1: "assets/sounds/harvest1.wav", harvest2: "assets/sounds/harvest2.wav", harvest3: "assets/sounds/harvest3.wav", 
	harvest4: "assets/sounds/harvest4.wav", harvest5: "assets/sounds/harvest5.wav", success: "assets/sounds/success.wav",
	newShipment: "assets/sounds/notify.wav", completeShipment: "assets/sounds/chaching.wav", mow: "assets/sounds/mow.wav", 
	playSound: function(id) {
		if(!settings.playSounds) { return; }
		var s = new Audio(sounds[id]);
		s.volume = id.indexOf("harvest") == 0 ? 0.4 : 0.7;
		s.play();
	}
};
var music = {
	happy: new Audio("assets/sounds/happy.mp3"),
	nochains: new Audio("assets/sounds/nochains.mp3"),
	playFresh: function (id) { music[id].currentTime = 0; music.play(id); },
	play: function (id) {
		if(settings.playMusic) {
			music[id].volume = 0.5;
			music[id].loop = true;
			music[id].play();
		}
	},
	stopFull: function (id) { music[id].pause(); music[id].currentTime = 0; },
	stop: function (id) { music[id].pause(); },
	stopAll: function() {
		music.stopFull("happy");
		music.stopFull("nochains");
	}
};
function RandRange(min, max) {
	var diff = max - min;
	return min + Math.floor(Math.random() * diff);
}
function SaveLevelStats(levelNum, score, time) {
	if(levelsCompleted[levelNum] === undefined) {
		levelsCompleted[levelNum] = { highScore: score, bestTime: time };
		fbFuncs.saveScore(levelNum, score, time);
		SaveGame();
		return 3;
	} else {
		var changes = 0;
		var ld = levelsCompleted[levelNum];
		if(score > ld.highScore) { ld.highScore = score; changes += 2; }
		if(levelNum == "E") {
			if(time > ld.bestTime) { ld.bestTime = time; changes += 1; }
		} else {
			if(time < ld.bestTime) { ld.bestTime = time; changes += 1; }
		}
		levelsCompleted[levelNum] = ld;
		if(changes > 0) {
			fbFuncs.saveScore(levelNum, ld.highScore, ld.bestTime);
			SaveGame();
		}
		return changes;
	}
}
function GetTimeAsString(dt) {
	var minutes = Math.floor(dt / 60);
	var seconds = dt - (minutes * 60);
	return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

function SaveGame() {
	window.localStorage.setItem("settings" + SAVEDATAVERSION, JSON.stringify(settings));
	window.localStorage.setItem("levelsCompleted" + SAVEDATAVERSION, JSON.stringify(levelsCompleted));
}
function LoadGame() {
	var s = window.localStorage.getItem("settings" + SAVEDATAVERSION);
	if(s != null) { settings = JSON.parse(s); }
	if(settings.HDgrafs) { $("#game").addClass("HD"); }
	if(settings.accGrafs == 1) {
		$("#game").addClass("acc");
	} else if(settings.accGrafs == 2) {
		$("#game").addClass("cb");
	}
	if(settings.whackerRight) { $("#innerCropInfo").before($("#weedWhackBtn")); }
	var l = window.localStorage.getItem("levelsCompleted" + SAVEDATAVERSION);
	if(l != null) { levelsCompleted = JSON.parse(l); }
}