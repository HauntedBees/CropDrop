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
function SetUpLevelSelect() {
	var res = "<div class='scrollable'>";
	for(var i = 0; i < levelData.length; i++) {
		res += "<div id='levelIcon" + i + "' class='levelIcon" + (i % 5 == 0?" bigLevelIcon":"") + "'><div>" + i + "</div></div>";
	}
	res += "</div>";
	$("#levelDisplay").html(res);
	$("#levelDisplay > div").css("width", $(".levelIcon").length * 300 + "px");
	$(".levelIcon").on("click", function() {
		if($(this).hasClass("selectedLevel")) {
			$("#beginLevel").click();
		} else {
			$(".selectedLevel").removeClass("selectedLevel");
			$(this).addClass("selectedLevel");
			sounds.playSound("wood");
		}
		var levelNum = parseInt($(this).text());
		menuNav.setUpLevelSelect(levelNum);
	});
	var keys = Object.keys(levelsCompleted);
	for(var i = 0; i < keys.length; i++) {
		$("#levelIcon" + keys[i]).addClass("complete");
	}
	
	$("#beginLevel").on("click", function() {
		sounds.playSound("yes");
		var levelNum = parseInt($("#levelInfo").attr("data-level"));
		wateringGame.start(6, 8, 2, levelNum, levelNum == 0);
		menuNav.switchIntoGame();
	});
	$("#whackerPos").on("click", function() {
		settings.whackerRight = !settings.whackerRight;
		$("#whackerPos").text(settings.whackerRight ? "Right-Handed" : "Left-Handed");
		if(!settings.whackerRight) {
			$("#weedWhackBtn").before($("#innerCropInfo"));
		} else {
			$("#innerCropInfo").before($("#weedWhackBtn"));
		}
		sounds.playSound("tap");
	});
	$("#sounds").on("click", function() {
		settings.playSounds = !settings.playSounds;
		$("#sounds").text(settings.playSounds ? "Sound On" : "Sound Off");
		if(settings.playSounds) {
			$("#soundSlider").show();
			$("#soundSlider > .centernum").text(settings.soundVol);
		} else {
			$("#soundSlider").hide();
		}
		sounds.playSound("tap");
	});
	$("#musics").on("click", function() {
		settings.playMusic = !settings.playMusic;
		if(!settings.playMusic) {
			music.stopAll();
			$("#musicSlider").hide();
		} else {
			music.play("nochains");
			$("#musicSlider").show();
			$("#musicSlider > .centernum").text(settings.musicVol);
		}
		sounds.playSound("tap");
		$("#musics").text(settings.playMusic ? "Music On" : "Music Off");
	});
	$("#soundSlider > .dir").on("click", function() {
		var dir = $(this).hasClass("r") ? 1 : -1;
		var newVal = settings.soundVol + dir;
		if(newVal < 1) { newVal = 1; } else if(newVal > 10) { newVal = 10; }
		settings.soundVol = newVal;
		sounds.playSound("tap");
		$("#soundSlider > .centernum").text(settings.soundVol);
	});
	$("#musicSlider > .dir").on("click", function() {
		var dir = $(this).hasClass("r") ? 1 : -1;
		var newVal = settings.musicVol + dir;
		if(newVal < 1) { newVal = 1; } else if(newVal > 10) { newVal = 10; }
		settings.musicVol = newVal;
		music.updateVolume();
		sounds.playSound("tap");
		$("#musicSlider > .centernum").text(settings.musicVol);
	});
	$("#grafs").on("click", function() {
		settings.HDgrafs = !settings.HDgrafs;
		if(!settings.HDgrafs) {
			$("#game").removeClass("HD");
		} else {
			$("#game").addClass("HD");
		}
		sounds.playSound("tap");
		$("#grafs").text(settings.HDgrafs ? "HD Graphics On" : "HD Graphics Off");
	});
	$("#acc").on("click", function() {
		settings.accGrafs = (settings.accGrafs + 1) % 3;
		$("#game").removeClass("acc cb");
		if(settings.accGrafs == 1) {
			$("#game").addClass("acc");
		} else if(settings.accGrafs == 2) {
			$("#game").addClass("cb");
		}
		sounds.playSound("tap");
		$("#acc").text(settings.accGrafs == 0 ? "Standard Vision" : (settings.accGrafs == 1 ? "Colored Outlines" : "Colorblind Mode"));
	});
	$("#timer").on("click", function() {
		settings.timer = !settings.timer;
		sounds.playSound("tap");
		$("#timer").text(settings.timer ? "Endless Mode Time Limit On" : "Endless Mode Time Limit Off");
	});
	$("#gplay").on("click", function() { sounds.playSound("tap"); });
}
var scoreDisplay = {
	navState: 0,
	switchState: function(delta, noSound) {
		if(!noSound) { sounds.playSound("wood"); }
		var newState = scoreDisplay.navState + delta;
		if(newState < 0 || newState > 2) { return; }
		if(scoreDisplay.navState == 0) {
			$("#overlayText").hide();
		} else if(scoreDisplay.navState == 1) {
			$("#overlayLocalStats").hide();
		} else if(scoreDisplay.navState == 2) {
			$("#overlayFBTimes").hide();
		}
		var lNum = wateringGame.getLevelNumForScores();
		if(newState == 0) {
			$("#overlayText, #navRight").show();
			$("#navRight > div").text("Scores").css("margin-left", "-35px");
			$("#navLeft").hide();
			$(".fullCoverText").removeClass("large small").addClass("medium");
		} else if(newState == 1) {
			$("#navLeft > div").text("Info").css("margin-left", "-15px");
			$(".fullCoverText").removeClass("large small").addClass("medium");
			$("#overlayLocalStats, #navLeft").show();
			$("#navRight").hide();
			var li = levelsCompleted[lNum];
			if(li === undefined) {
				$(".yourScore").text("None Yet!");
				$(".yourTime").text("None Yet!");
			} else {
				$(".yourScore").text(li.highScore);
				$(".yourTime").text(GetTimeAsString(li.bestTime));
			}
		} else if(newState == 2) {
			$(".fullCoverText").removeClass("medium small").addClass("large");
			$("#overlayFBTimes, #navLeft").show();
			$("#navLeft > div").text("Scores").css("margin-left", "-35px");
			$("#navRight").hide();
			var li = levelsCompleted[lNum];
			$(".yourTime").text(li === undefined ? "None Yet!" : GetTimeAsString(li.bestTime));
		}
		scoreDisplay.navState = newState;
	}
};

var commonDistributions = {
	standardEasy: { tomato: 0.3, strawberry: 0.3, cucumber: 0.3, carrot: 0.1 },
	easyBonusTomatoes: { tomato: 0.4, strawberry: 0.3, cucumber: 0.3 },
	bonusCorn: { tomato: 0.27, strawberry: 0.27, cucumber: 0.27, carrot: 0, corn: 0.19 },
	standard: { tomato: 0.28, strawberry: 0.28, cucumber: 0.28, carrot: 0.07, corn: 0.06, pumpkin: 0.03 },
	pumpkinBenefit: { tomato: 0.27, strawberry: 0.27, cucumber: 0.27, carrot: 0.06, corn: 0.05, pumpkin: 0.08 },
	lessCucumbers: { tomato: 0.28, strawberry: 0.28, cucumber: 0.25, carrot: 0.08, corn: 0.07, pumpkin: 0.04 },
	twentythree: { tomato: 0.3, strawberry: 0.4, cucumber: 0.1, carrot: 0.05, corn: 0.1, pumpkin: 0.05 },
	bort: { tomato: 0.15, strawberry: 0.15, cucumber: 0.15, carrot: 0.2, corn: 0.2, pumpkin: 0.15 },
	migaPumpkin: { tomato: 0.31, strawberry: 0.31, cucumber: 0.1, carrot: 0, corn: 0.1, pumpkin: 0.08 },
	cornStrob: { tomato: 0.35, strawberry: 0.14, cucumber: 0.35, carrot: 0.1, corn: 0.03, pumpkin: 0.03 }
};
var levelData = [
	{ mission: "Harvest 20 crops.", req: { any: 20 }, time: 5940, dist: "standard" },
	// 1
	{ mission: "Harvest 30 crops in under a minute.", req: { any: 30 }, time: 60, dist: "standardEasy" },
	{ mission: "Harvest 20 tomatoes in under a minute.", req: { tomato: 20 }, time: 60, dist: "easyBonusTomatoes" },
	{ mission: "Harvest 100 crops in under five minutes.", req: { any: 100 }, time: 300, dist: "standardEasy" },
	{ mission: "Harvest 10 corn in under two minutes.", req: { corn: 10 }, time: 120, dist: "bonusCorn" },
	{ mission: "Harvest two pumpkins in under three minutes.", req: { pumpkin: 2 }, time: 180, dist: "standard" },
	// 6
	{ mission: "Get 1500 points in under a minute.", req: { score: 1500 }, time: 60, dist: "standard" },
	{ mission: "Harvest 10 tomatos, cucumbers, and strawberries in under two minutes.", req: { tomato: 10, cucumber: 10, strawberry: 10 }, time: 120, dist: "standardEasy" },
	{ mission: "Harvest 10 carrots and 10 corn in under three minutes.", req: { carrot: 10, corn: 10 }, time: 180, dist: "standard" },
	{ mission: "Get 2000 points and 5 corn in under two minutes.", req: { score: 2000, corn: 5 }, time: 120, dist: "standard" },
	{ mission: "Get 1000 points without harvesting a single cucumber!", req: { score: 1000 }, restrictions: ["cucumber"], time: 600, dist: "lessCucumbers" },
	// 11
	{ mission: "Harvest three pumpkins in under five minutes.", req: { pumpkin: 3 }, time: 300, dist: "pumpkinBenefit" },
	{ mission: "Get 1000 points in under three minutes... but only crops harvested in chains will give points!", req: { score: 1000 }, minChain: 2, time: 180, dist: "standardEasy" },
	{ mission: "Harvest thirty tomatos and no carrots.", req: { tomato: 30 }, restrictions: ["carrot"], time: 600, dist: "standardEasy" },
	{ mission: "Get 1000 points in under 2 minutes without harvesting a single tomato!", req: { score: 1000 }, restrictions: ["tomato"], time: 120, dist: "standardEasy" },
	{ mission: "Get 1000 points in under three minutes... but only crops harvested in 3-chains or higher will give points! ", req: { score: 1000 }, minChain: 3, time: 180, dist: "standard" },
	// 16
	{ mission: "Get 1000 points in under 3 minutes... but only harvests of three crops or more will give you points!", req: { score: 1000 }, minHarvest: 3, time: 180, dist: "standard" },
	{ mission: "Harvest 500 crops in under 6 minutes.", req: { any: 500 }, time: 360, dist: "standard" },
	{ mission: "Get 1500 points in under 2 minutes... but only harvests of four crops or more will give you points!", req: { score: 1500 }, minHarvest: 4, time: 120, dist: "standard" },
	{ mission: "Get 2000 points in under 3 minutes without harvesting any pumpkins.", req: { score: 2000 }, restrictions: ["pumpkin"], time: 180, dist: "migaPumpkin" },
	{ mission: "Get 2000 points, harvesting no corn or strawberries. Only harvests of three crops or more will give you points!", req: { score: 2000 }, restrictions: ["corn", "strawberry"], minHarvest: 3, time: 600, dist: "cornStrob" },
	// 21
	{ mission: "Harvest the required number of each crop in under 5 minutes.", req: { tomato: 120, strawberry: 120, cucumber: 120, carrot: 20, corn: 20, pumpkin: 4 }, time: 300, dist: "standard" },
	{ mission: "Get 10000 points in under 2 minutes.", req: { score: 10000 }, time: 120, dist: "standard" },
	{ mission: "Get 4200 points in under 3 minutes without harvesting cucumbers, carrots, or pumpkins.", req: { score: 4200 }, restrictions: ["cucumber", "carrot", "pumpkin"], time: 180, dist: "twentythree" },
	{ mission: "Get 2000 points in one minute... but only harvests of four crops or more will give you points!", req: { score: 2000 }, time: 60, minHarvest: 4, dist: "standard" },
	{ mission: "Harvest 20 pumpkins and get 5000 points in under 6 minutes... but only harvests of five crops or more will give you points!", req: { score: 5000, pumpkin: 20 }, time: 360, minHarvest: 5, dist: "migaPumpkin" }
];