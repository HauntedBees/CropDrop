/*Crop Drop
Copyright (C) 2017 Sean Finch

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
var SAVEDATAVERSION = "1s";
var settings = {
	device: "browser",
	playSounds: true,
	soundVol: 10,
	playMusic: true,
	musicVol: 10,
	wasUsingFB: false,
	HDgrafs: false,
	timer: true, 
	whackerRight: true, 
	accGrafs: 0,
	lastGardenVisit: new Date(),
	garden: [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]],
	cropsGrown: 0, 
	pollen: 0
};
var levelsCompleted = {};
var sounds = {
	bweep: "assets/sounds/whoppy.wav", wood: "assets/sounds/woodclick.wav", tap: "assets/sounds/tap3.wav",
	yes: "assets/sounds/confirmyes.wav", win: "assets/sounds/win.wav", lose: "assets/sounds/lose.wav",
	harvest1: "assets/sounds/harvest1.wav", harvest2: "assets/sounds/harvest2.wav", harvest3: "assets/sounds/harvest3.wav", 
	harvest4: "assets/sounds/harvest4.wav", harvest5: "assets/sounds/harvest5.wav", success: "assets/sounds/success.wav",
	newShipment: "assets/sounds/notify.wav", completeShipment: "assets/sounds/chaching.wav", mow: "assets/sounds/mow.wav", 
	playSound: function(id) {
		if(!settings.playSounds) { return; }
		if(settings.device == "android") {
			var Yanap = cordova.plugins.Yanap;
			var s = new Yanap.AudioInstance(Yanap.AUDIO_TYPE.SOUND);
			s.load("file:///android_asset/www/" + sounds[id]);
			var volume = (id.indexOf("harvest") == 0 ? 0.4 : 0.7)  * (settings.soundVol / 10);
			s.setVolume(volume, volume);
			s.play();
		} else {
			var s = new Audio(sounds[id]);
			s.volume = (id.indexOf("harvest") == 0 ? 0.4 : 0.7)  * (settings.soundVol / 10);
			s.play();
		}
	}
};
var music = {
	happy: new Audio("assets/sounds/happy.mp3"),
	nochains: new Audio("assets/sounds/nochains.mp3"),
	playFresh: function (id) { music[id].currentTime = 0; music.play(id); },
	play: function (id) {
		if(settings.playMusic) {
			music[id].volume = 0.5 * (settings.musicVol / 10);
			music[id].loop = true;
			music[id].play();
		}
	},
	updateVolume: function() {
		music["happy"].volume = 0.5 * (settings.musicVol / 10);
		music["nochains"].volume = 0.5 * (settings.musicVol / 10);
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
	if(settings.timer === undefined) { settings.timer = true; }
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