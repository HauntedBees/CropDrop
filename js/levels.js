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
	$("#sounds").on("click", function() {
		settings.playSounds = !settings.playSounds;
		$("#sounds").text(settings.playSounds ? "Sound On" : "Sound Off");
		sounds.playSound("tap");
	});
	$("#musics").on("click", function() {
		settings.playMusic = !settings.playMusic;
		if(!settings.playMusic) {
			music.stopAll();
		} else {
			music.play("nochains");
		}
		sounds.playSound("tap");
		$("#musics").text(settings.playMusic ? "Music On" : "Music Off");
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
	$("#gplay").on("click", function() { sounds.playSound("tap"); });
	$("#fbConnect").on("click", function() {
		sounds.playSound("tap");
		fbFuncs.connectClick();
	});
	$("#fbConnectScores").on("click", function() {
		sounds.playSound("tap");
		fbFuncs.connectClick(true);
	});
}
var scoreDisplay = {
	navState: 0,
	switchState: function(delta) {
		sounds.playSound("wood");
		var newState = scoreDisplay.navState + delta;
		if(newState < 0 || newState > 2) { return; }
		if(scoreDisplay.navState == 0) {
			$("#overlayText").hide();
		} else if(scoreDisplay.navState == 1) {
			if(fbFuncs.connected) {
				$("#overlayFBScores").hide();
			} else {
				$("#overlayLocalStats").hide();
			}
		} else if(scoreDisplay.navState == 2) {
			$("#overlayFBTimes").hide();
		}
		var lNum = wateringGame.getLevelNumForScores();
		if(newState == 0) {
			$("#overlayText, #navRight").show();
			$("#navLeft").hide();
			$(".fullCoverText").removeClass("large small").addClass("medium");
		} else if(newState == 1) {
			if(fbFuncs.connected) {
				$("#overlayFBScores, #navLeft, #navRight").show();
				$(".fullCoverText").removeClass("medium small").addClass("large");
				var li = levelsCompleted[lNum];
				$(".yourScore").text(li === undefined ? "None Yet!" : li.highScore);
				$("#fbScoresInner").html("<div class='loading'></div>");
				fbFuncs.getFriendScores(lNum, "score");
			} else {
				$(".fullCoverText").removeClass("large small").addClass("medium");
				$("#overlayLocalStats, #navLeft").show();
				$("#navRight").hide();
				var li = levelsCompleted[lNum];
				if(li === undefined) {
					$(".yourScore").text("None Yet!");
					$(".yourTime").text("None Yet!");
				} else {
					$(".yourScore").text(li.highScore);
					$(".yourTime").text(GetTimeAsString((lNum == "E" || lNum == "Q") ? li.bestTime : (levelData[lNum].time - li.bestTime)));
				}
			}
		} else if(newState == 2) {
			$(".fullCoverText").removeClass("medium small").addClass("large");
			$("#overlayFBTimes, #navLeft").show();
			$("#navRight").hide();
			var li = levelsCompleted[lNum];
			$(".yourTime").text(li === undefined ? "None Yet!" : GetTimeAsString((lNum == "E" || lNum == "Q") ? li.bestTime : (levelData[lNum].time - li.bestTime)));
			$("#fbTimesInner").html("<div class='loading'></div>");
			fbFuncs.getFriendScores(lNum, "time");
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
	bortLessPump: { tomato: 0.15, strawberry: 0.15, cucumber: 0.15, carrot: 0.23, corn: 0.23, pumpkin: 0.09 },
	migaPumpkin: { tomato: 0.31, strawberry: 0.31, cucumber: 0.1, carrot: 0, corn: 0.1, pumpkin: 0.08 },
	cornStrob: { tomato: 0.35, strawberry: 0.14, cucumber: 0.35, carrot: 0.1	, corn: 0.03, pumpkin: 0.03 }
};
var levelData = [
	{ mission: "Harvest 15 vegetables.", req: { any: 15 }, time: 5940, dist: "standard" },

	{ mission: "Harvest 30 vegetables in under a minute.", req: { any: 30 }, time: 60, dist: "standardEasy" },
	{ mission: "Harvest 20 tomatoes in under a minute.", req: { tomato: 20 }, time: 60, dist: "easyBonusTomatoes" },
	{ mission: "Harvest 100 vegetables in under five minutes.", req: { any: 100 }, time: 300, dist: "standardEasy" },
	{ mission: "Harvest 10 corn in under two minutes.", req: { corn: 10 }, time: 120, dist: "bonusCorn" },
	{ mission: "Harvest two pumpkins in under three minutes.", req: { pumpkin: 2 }, time: 180, dist: "standard" },

	{ mission: "Get 1500 points in under a minute.", req: { score: 1500 }, time: 60, dist: "standard" },
	{ mission: "Harvest 10 tomatos, cucumbers, and strawberries in under two minutes.", req: { tomato: 10, cucumber: 10, strawberry: 10 }, time: 120, dist: "standardEasy" },
	{ mission: "Harvest 10 carrots and 10 corn in under three minutes.", req: { carrot: 10, corn: 10 }, time: 180, dist: "standard" },
	{ mission: "Get 2000 points and 5 corn in under two minutes.", req: { score: 2000, corn: 5 }, time: 120, dist: "standard" },
	{ mission: "Get 1000 points without harvesting a single cucumber!", req: { score: 1000 }, restrictions: ["cucumber"], time: 600, dist: "lessCucumbers" },

	{ mission: "Harvest three pumpkins in under five minutes.", req: { pumpkin: 3 }, time: 300, dist: "pumpkinBenefit" },
	{ mission: "Get 3000 points in under a minute.", req: { score: 3000 }, time: 60, dist: "standard" },
	{ mission: "Harvest thirty tomatos and no carrots.", req: { tomato: 30 }, restrictions: ["carrot"], time: 600, dist: "standardEasy" },
	{ mission: "Get 1000 points in under 2 minutes without harvesting a single tomato!", req: { score: 1000 }, restrictions: ["tomato"], time: 120, dist: "standardEasy" },
	{ mission: "Don't harvest any tomatos, cucumbers, or strawberries! Also get 1000 point I guess.", req: { score: 1000 }, restrictions: ["tomato", "cucumber", "strawberry"], time: 600, dist: "bortLessPump" },

	{ mission: "Get 1000 points in under 3 minutes... but only harvests of three crops or more will give you points!", req: { score: 1000 }, minHarvest: 3, time: 180, dist: "standard" },
	{ mission: "Harvest 500 vegetables in under 6 minutes.", req: { any: 500 }, time: 360, dist: "standard" },
	{ mission: "Get 1500 points in under 2 minutes... but only harvests of four crops or more will give you points!", req: { score: 1500 }, minHarvest: 4, time: 120, dist: "standard" },
	{ mission: "Get 2000 points in under 3 minutes without harvesting any pumpkins.", req: { score: 2000 }, restrictions: ["pumpkin"], time: 180, dist: "migaPumpkin" },
	{ mission: "Get 2000 points, harvesting no corn or strawberries. Only harvests of three crops or more will give you points!", req: { score: 2000 }, restrictions: ["corn", "strawberry"], minHarvest: 3, time: 600, dist: "cornStrob" },

	{ mission: "Harvest the required number of each crop in under 5 minutes.", req: { tomato: 120, strawberry: 120, cucumber: 120, carrot: 20, corn: 20, pumpkin: 4 }, time: 300, dist: "standard" },
	{ mission: "Get 10000 points in under 2 minutes.", req: { score: 10000 }, time: 120, dist: "standard" },
	{ mission: "Get 4200 points in under 3 minutes without harvesting cucumbers, carrots, or pumpkins.", req: { score: 4200 }, restrictions: ["cucumber", "carrot", "pumpkin"], time: 180, dist: "twentythree" },
	{ mission: "Get 2000 points in one minute... but only harvests of four crops or more will give you points!", req: { score: 2000 }, time: 60, minHarvest: 4, dist: "standard" },
	{ mission: "Harvest 20 pumpkins and get 5000 points in under 6 minutes... but only harvests of five crops or more will give you points!", req: { score: 5000, pumpkin: 20 }, time: 360, minHarvest: 5, dist: "migaPumpkin" }
];