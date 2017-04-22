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
var wateringGame = {
	mode: 2, 
	modeTimerIdx: 0, modeCounter: 0, 
	totalMultiplier: 1,
	timerIdx: 0,
	paused: false, gameIsOver: false, 
	inStoryMode: false, inTutorial: false, levelNum: 0, 
	soundPlayedHere: 0, minHarvestRequirement: 0, 
	animating: false, animSpeed: 250, 
	width: 0, height: 0, 
	shipment: {}, restrictions: [], 
	start: function(width, height, mode, levelNumber, isTutorial) {
		wateringGame.gameIsOver = false;
		clearInterval(wateringGame.modeTimerIdx);
		clearInterval(wateringGame.timerIdx);
		music.playFresh("happy");
		$("#pointer").hide();
		$(".forbidden").removeClass("forbidden");
		$(".overlayTap").hide();
		$(".infoBar.main > span").text("0");
		wateringGame.mode = mode || 2;
		wateringGame.restrictions = [];
		wateringGame.shipmentDifficulty = 1;
		wateringGame.inStoryMode = (levelNumber !== undefined);
		wateringGame.paused = true;
		$(".overlayButtons, .overlayAltText").hide();
		$(".overlayTap, #overlayText, #overlayButtonsNav").show();
		$(".fullCoverText").removeClass("large medium small").addClass("medium");
		if(wateringGame.inStoryMode) {
			$("#overlayButtonsD").show();
		} else {
			$("#overlayButtonsE").show();
		}
		if(!isTutorial) { $("#navRight").show(); } else { $("#navRight").hide(); }
		scoreDisplay.navState = 0;
		$("#navLeft").hide();
		wateringGame.shipment = {};
		$("#shipItems").html("<div class='infoBar OK'></div>");
		wateringGame.minHarvestRequirement = 0;
		if(wateringGame.inStoryMode) {
			wateringGame.levelNum = levelNumber;
			var ld = levelData[levelNumber];
			if(ld === undefined) {
				menuNav.quitToMenuInGame();
				return;
			}
			wateringGame.initDistribution(ld.dist);
			wateringGame.minHarvestRequirement = ld.minHarvest || 0;
			$("#overlayText").text((levelNumber == 0 ? "Tutorial: " : "Mission: ") + ld.mission);
			wateringGame.createShipmentFromLevelData(ld);
		} else {
			wateringGame.levelNum = undefined;
			wateringGame.initDistribution("standard");
			if(mode == 2) {
				$("#overlayText").html("Endless Mode<br><span>The timer is counting down, and the only way to raise it is by harvesting crops. Get as high of a score as you can before time runs out! Ship desired crops as they appear to extend the timer!</span><br><br>");
			} else {
				$("#overlayText").html("Rising Mode<br><span>Every time you mature a crop, it will scatter seeds, planting saplings in the spaces next to it. Additionally, crops will slowly rise up from the bottom over time! Keep harvesting to prevent a garden overflow!</span><br><br>");
			}
		}
		$("#mainGame,#menuBtn,.gameOverTap").hide();
		$("#cropGame,#pauseBtn").show();
		wateringGame.board = [];
		wateringGame.width = width;
		wateringGame.height = height;
		for(var y = 0; y < height; y++) {
			var row = [];
			for(var x = 0; x < width; x++) { row.push(0); }
			wateringGame.board.push(row);
		}
		wateringGame.gameSpeed = 250;
		wateringGame.locked = false;
		wateringGame.score = 0;
		$("#cropScore").text("0");
		wateringGame.lastedTime = 0;
		if(wateringGame.mode == 1) {
			wateringGame.timer = 0;
			wateringGame.modeTimerIdx = setInterval(wateringGame.handleMode1, 1000);
			$("#shipItems").html("Don't overflow the garden!");
			$("#cropTimer").text("0:00");			
		} else {
			if(wateringGame.inStoryMode) {
				wateringGame.timer = levelData[levelNumber].time;
				wateringGame.updateTimeDisplay();
			} else {
				wateringGame.timer = 60;
				$("#cropTimer").text("1:00");
			}
		}
		wateringGame.timerIdx = setInterval(wateringGame.advanceTimer, 1000);
		var randomRange = (wateringGame.mode == 1) ? 0.2 : 1;
		var minRequired = (wateringGame.mode == 1) ? 14 : 24;
		wateringGame.inTutorial = isTutorial;
		$("#tutorial").hide();
		if(isTutorial) {
			tutorialHandler.start();
		} else {
			while(wateringGame.count() < minRequired) {
				randomRange += 0.1;
				for(var x = 0; x < wateringGame.width; x++) {
					for(var y = wateringGame.height - 1; y >= 0; y--) {
						if(wateringGame.board[y][x] == 0 && Math.random() < randomRange) {
							wateringGame.board[y][x] = wateringGame.getCrop();
						}
					}
				}	
			}
		}
		$(document).off("click", ".crop");
		$(document).on("click", ".crop", function() {
			if(wateringGame.locked) { return; }
			if(wateringGame.inTutorial && !tutorialHandler.validMove($(this))) { return; }
			var $parent = $(this).parent();
			var x = parseInt($parent.attr("data-x"));
			var y = parseInt($parent.attr("data-y"));
			var tile = wateringGame.board[y][x];
			if(tile.stage == tile.finalStage && tile.type != "pumpkin") { return; }
			wateringGame.locked = true;
			var type = tile.type;
			var spread = wateringGame.grow(x, y, true, type);
			wateringGame.grow(x - 1, y, false, type, !spread);
			wateringGame.grow(x + 1, y, false, type, !spread);
			wateringGame.grow(x, y + 1, false, type);
			wateringGame.grow(x, y - 1, false, type, true);
			sounds.playSound("bweep");
			wateringGame.totalMultiplier = 1;
			wateringGame.soundPlayedHere = 0;
			setTimeout(wateringGame.attemptFinishTurn, wateringGame.gameSpeed);
		});
		wateringGame.settleBoard(true);
		wateringGame.drawBoard();
	},
	count: function() {
		var count = 0;
		for(var x = 0; x < wateringGame.width; x++) {
			for(var y = 0; y < wateringGame.height; y++) {
				if(wateringGame.board[y][x] != 0) { count++; }
			}
		}
		return count;
	}, 
	winLevel: function() {
		if(wateringGame.gameIsOver) { return; }
		wateringGame.gameIsOver = true;
		clearInterval(wateringGame.modeTimerIdx);
		clearInterval(wateringGame.timerIdx);
		music.stopFull("happy");
		var appendedHtml = "";
		var res = SaveLevelStats(wateringGame.levelNum, wateringGame.score, wateringGame.timer);
		if(res > 0) {
			appendedHtml += "<br><span class='additionalScoreInfo'>";
			if((res & 2) == 2) { appendedHtml += " New High Score!"; }
			if((res & 1) == 1) { appendedHtml += " New Best Time!"; }
			appendedHtml += "</span>";
		}
		SaveGame();
		$(".fullCoverText").removeClass("large medium small");
		$(".overlayButtons, .overlayAltText").hide();
		$(".fullCoverText").addClass("small");
		sounds.playSound("win");
		$(".overlayTap").show();
		setTimeout(function() { $("#overlayButtonsC").show(); }, 1000);
		$("#overlayText").html("Level Complete!" + appendedHtml);
	},
	createNewShipment: function() {
		if(wateringGame.inTutorial){ return; }
		$("#shipItems").empty();
		difficulty = wateringGame.shipmentDifficulty;
		var types = ["strawberry", "tomato", "cucumber", "carrot", "corn", "pumpkin"];
		wateringGame.shipment = {};
		if(difficulty < 2) {
			wateringGame.appendCropToShipment(types[Math.floor(Math.random() * 3)], 3, difficulty * 5);
		} else if(difficulty < 4) {
			var max = RandRange(1, 2);
			for(var i = 0; i < max; i++) {
				var idx = RandRange(0, Math.min(3, types.length));
				wateringGame.appendCropToShipment(types[idx], 5, difficulty * 3);
				types.splice(idx, 1);
			}
		} else if(difficulty < 6) {
			var max = RandRange(1, 2);
			for(var i = 0; i < max; i++) {
				var idx = RandRange(0, Math.min(4, types.length));
				var mult = (types[idx] == "carrot" || types[idx] == "corn") ? 0.5 : 1;
				wateringGame.appendCropToShipment(types[idx], Math.floor(5 * mult), Math.floor(difficulty * 3 * mult));
				types.splice(idx, 1);
			}
		} else if(difficulty < 10) {
			var max = RandRange(1, 3);
			for(var i = 0; i < max; i++) {
				var idx = RandRange(0, Math.min(4, types.length));
				var mult = (types[idx] == "carrot" || types[idx] == "corn") ? 0.5 : 1;
				wateringGame.appendCropToShipment(types[idx], Math.floor(10 * mult), Math.floor(difficulty * 3 * mult));
				types.splice(idx, 1);
			}
		} else if(difficulty < 18) {
			var max = RandRange(1, 5);
			for(var i = 0; i < max; i++) {
				var idx = RandRange(0, types.length);
				var mult = types[idx] == "pumpkin" ? 0.05 : ((types[idx] == "carrot" || types[idx] == "corn") ? 0.5 : 1);
				wateringGame.appendCropToShipment(types[idx], Math.floor(15 * mult), Math.floor(difficulty * 4 * mult));
				types.splice(idx, 1);
			}
		} else {
			var max = RandRange(1, 5);
			for(var i = 0; i < max; i++) {
				var idx = RandRange(0, types.length);
				var mult = types[idx] == "pumpkin" ? 0.05 : ((types[idx] == "carrot" || types[idx] == "corn") ? 0.5 : 1);
				wateringGame.appendCropToShipment(types[idx], Math.floor(20 * mult), Math.floor(difficulty * 5 * mult));
				types.splice(idx, 1);
			}
		}
		sounds.playSound("harvest5");
		$(".infoBar").slideDown();
	},
	appendCropToShipment: function(crop, min, max) {
		var count = RandRange(min, max);
		wateringGame.shipment[crop] = count;
		$("#shipItems").append("<div class='infoBar " + crop + "' style='display:none'><span id='shipment_" + crop + "'>" + count + "</span></div>");
	},
	createShipmentFromLevelData: function(levelData) {
		$("#shipItems").empty();
		var crops = Object.keys(levelData.req);
		$("#overlayText").append("<div id='overlayTextCropInfo'></div>");
		for(var i = 0; i < crops.length; i++) {
			var crop = crops[i];
			var count = levelData.req[crop];
			wateringGame.shipment[crop] = count;
			$("#shipItems").append("<div class='infoBar " + crop + "'><span id='shipment_" + crop + "'>" + count + "</span></div>");
			$("#overlayTextCropInfo").append("<div class='infoBar " + crop + "'><span>" + count + "</span></div>");
		}
		if(levelData.restrictions !== undefined) {
			wateringGame.restrictions = levelData.restrictions;
			for(var i = 0; i < levelData.restrictions.length; i++) {
				var restrictedCrop = levelData.restrictions[i];
				$("#info_" + restrictedCrop).parent().addClass("forbidden");
				$("#overlayTextCropInfo").append("<div class='infoBar " + restrictedCrop + " forbidden'><span>0</span></div>");
			}
		}
	},
	shipCrop: function(crop) {
		if(wateringGame.restrictions.indexOf(crop) >= 0) {
			wateringGame.gameOver("Forbidden Shipment!");
			return;
		}
		if(wateringGame.shipment[crop] == undefined) { 
			if(wateringGame.shipment["any"] == undefined) { return; }
			crop = "any";
		}
		wateringGame.shipment[crop] -= 1;
		$("#shipment_" + crop).text(wateringGame.shipment[crop]);
		if(wateringGame.shipment[crop] <= 0) { delete wateringGame.shipment[crop]; }
		wateringGame.shipCompletionCheck();
	},
	shipScore: function(score) {
		if(wateringGame.shipment["score"] == undefined) { return; }
		wateringGame.shipment["score"] -= score;
		$("#shipment_score").text(wateringGame.shipment["score"]);
		if(wateringGame.shipment["score"] <= 0) {
			$("#shipment_score").text("0");
			delete wateringGame.shipment["score"];
		}
		wateringGame.shipCompletionCheck();
	},
	shipCompletionCheck: function() {
		if(Object.keys(wateringGame.shipment).length === 0) {
			if(wateringGame.inStoryMode) {
				wateringGame.winLevel();
			} else {
				var tAdd = 20 * Math.min(Math.ceil(wateringGame.shipmentDifficulty / 4), 8);
				wateringGame.timer += tAdd;
				wateringGame.shipmentDifficulty++;
				if($(".timeParticle").length > 4) { $(".timeParticle:lt(3)").remove(); }
				$("#game").append("<div class='anim timeParticle'><span>" + tAdd + "</span></div>");
			}
			$("#shipItems").html("<div class='infoBar OK'></div>");
		}
	},
	getLevelNumForScores: function() {
		if(wateringGame.inStoryMode) {
			return wateringGame.levelNum;
		} else if(wateringGame.mode == 2) {
			return "E";
		} else {
			return "Q";
		}
	},
	gameOver: function(t) {
		if(wateringGame.gameIsOver) { return; }
		wateringGame.gameIsOver = true;
		clearInterval(wateringGame.modeTimerIdx);
		clearInterval(wateringGame.timerIdx);
		music.stopFull("happy");
		sounds.playSound("lose");
		var appendedHtml = "";
		if(!wateringGame.inStoryMode) {	
			var res = SaveLevelStats(wateringGame.mode == 2 ? "E" : "Q", wateringGame.score, wateringGame.lastedTime);
			if(res > 0) {
				appendedHtml += "<br><span class='additionalScoreInfo'>";
				if((res & 2) == 2) { appendedHtml += " New High Score!"; }
				if((res & 1) == 1) { appendedHtml += " New Best Time!"; }
				appendedHtml += "</span>";
			}
		}
		$(".overlayButtons, .overlayAltText").hide();
		$(".fullCoverText").removeClass("large medium small");
		$(".overlayTap").show();
		setTimeout(function() { $("#overlayButtonsB").show(); }, 1000);
		$(".fullCoverText").addClass("small");
		$("#overlayText").show().html("Game Over<br>" + t + appendedHtml);
	},
	advanceTimer: function() {
		if(wateringGame.paused) { return; }
		wateringGame.timer += (wateringGame.mode == 1) ? 1 : -1;
		wateringGame.lastedTime += 1;
		wateringGame.updateTimeDisplay();
		if(wateringGame.lastedTime % 7 == 0 && Object.keys(wateringGame.shipment).length === 0 && wateringGame.mode == 2) {
			wateringGame.createNewShipment();
		}
		if(wateringGame.timer == 0) {
			wateringGame.gameOver("Time's Up!");
		}
	},
	updateTimeDisplay: function() {
		var minutes = Math.floor(wateringGame.timer / 60);
		var seconds = wateringGame.timer - (minutes * 60);
		$("#cropTimer").text(minutes + ":" + (seconds < 10 ? "0" : "") + seconds);
	},
	handleMode1: function() {
		if(wateringGame.paused) { return; }
		wateringGame.modeCounter++;
		var diff = Math.min(10, Math.max(10 * (100 - wateringGame.shipmentDifficulty) * 0.01, 2));
		if(wateringGame.modeCounter > diff) {
			wateringGame.modeCounter = 0;
			wateringGame.shipmentDifficulty++;
			if(wateringGame.raiseBoard()) {
				wateringGame.gameOver("Garden Overflow!");
				clearInterval(wateringGame.modeTimerIdx);
				clearInterval(wateringGame.timerIdx);
			}
			setTimeout(function() {
				wateringGame.drawBoard();
				wateringGame.locked = false;
			}, wateringGame.animSpeed);
		}
	},
	raiseBoard: function(instant) {
		wateringGame.locked = true;
		for(var x = 0; x < wateringGame.width; x++) {
			for(var y = 0; y < wateringGame.height; y++) {
				var crop = wateringGame.board[y][x];
				if(crop === 0) { continue; }
				if(y == 0) {
					$(".jumping1").removeClass("dropping jumping1");
					return true;
				}
				if(!instant) {
					var $crop = $("#crop" + x + "_" + y + " > .crop");
					$crop.addClass("dropping jumping1");
				}
				wateringGame.board[y - 1][x] = wateringGame.board[y][x];
			}
		}
		for(var x = 0; x < wateringGame.width; x++) {
			wateringGame.board[wateringGame.height - 1][x] = wateringGame.getCrop();
		}
		return false;
	},
	addNewToField: function() {
		var vals = [];
		for(var x = 0; x < wateringGame.width; x++) { vals.push(x); }
		while(vals.length > 0) {
			var idx = Math.floor(Math.random() * vals.length);
			var x = vals[idx];
			if(wateringGame.board[0][x] == 0) {
				wateringGame.board[0][x] = wateringGame.getCrop();
				return true;
			}
			vals.splice(idx, 1);
		}
		return false;
	},
	attemptFinishTurn: function() {
		var didChange = wateringGame.settleBoard();
		if(didChange) {
			setTimeout(function() {
				wateringGame.drawBoard();
				wateringGame.findPairs();
			}, wateringGame.animSpeed);
		} else {
			wateringGame.findPairs();
		}
	},
	findPossibilities: function() {
		var pairPairs = [];
		for(var x = 0; x < wateringGame.width; x++) {
			for(var y = 0; y < wateringGame.height; y++) {
				var tile = wateringGame.board[y][x];
				if(tile.type == "pumpkin") { return; }
				var pairs = wateringGame.getNeighbors(tile.type, x, y, [], true);
				if(pairs.length >= 2) { pairPairs.push(pairs); }
			}
		}
		if(pairPairs.length == 0) {
			clearInterval(wateringGame.timerIdx);
			wateringGame.gameOver("No More Options!");
		}
	},
	findPairSettle: function() {
		var addMore = wateringGame.addNewToField();
		wateringGame.settleBoard();
		if(addMore) {
			wateringGame.drawBoard();				
			wateringGame.findPairSettle();
		} else {
			wateringGame.drawBoard();
			wateringGame.findPossibilities();
		}
	},
	findPairs: function() {
		var pairPairs = [];
		for(var x = 0; x < wateringGame.width; x++) {
			for(var y = 0; y < wateringGame.height; y++) {
				var tile = wateringGame.board[y][x];
				if(tile.stage != tile.finalStage) { continue; }
				var pairs = wateringGame.getNeighbors(tile.type, x, y, []);
				if(pairs.length >= 2) { pairPairs.push(pairs); }
			}
		}
		if(pairPairs.length == 0) {
			if(wateringGame.mode == 2) {
				var addMore = wateringGame.addNewToField();
				wateringGame.settleBoard();
				wateringGame.findPairSettle();
			}
			wateringGame.locked = false;
			return;
		}
		var summationScore = 0, summationTime = 0;
		for(var i = 0; i < pairPairs.length; i++) {
			var pair = pairPairs[i];
			var score = 0, multiplier = 1;
			var centerx = 0;
			for(var j = 0; j < pair.length; j++) { centerx += Math.floor(pair[j] / 10); }
			var pairLen = pair.length;
			centerx /= pairLen;
			for(var j = 0; j < pairLen; j++) {
				var val = pair[j];
				var x = Math.floor(val/10);
				var y = val - (x * 10);
				var tile = wateringGame.board[y][x];
				if(tile != 0) {
					var $info = $("#info_" + tile.type);
					var count = parseInt($info.text()) + 1;
					$info.text(count);
					wateringGame.shipCrop(tile.type);
					if(pairLen >= wateringGame.minHarvestRequirement) {
						if(score == 0) { 
							score = tile.score;
						} else {
							score *= multiplier;
							multiplier *= 1.25;
						}
					}
					wateringGame.board[y][x] = 0;
					var $newGuy = $("<div class='crop_particle sprite c_" + tile.type + "'>");
					$("#cropGame").append($newGuy);
					var pos = $("#crop" + x + "_" + y).position();
					var path = new $.path.bezier({
						start: {
							x: pos.left,
							y: pos.top
						},
						end: {
							x: pos.left + (x == centerx ? 0 : (x < centerx ? -500 : 500)), 
							y: pos.top + 4000
						}
					});
					$newGuy.animate({path: path}, 2000, "swing", function() { $(this).remove() });
				}
			}
			var finalScore = Math.floor(wateringGame.totalMultiplier * score);
			if(wateringGame.soundPlayedHere != wateringGame.totalMultiplier) {
				var soundIdx = wateringGame.totalMultiplier == 1 ? 1 : (1 + parseInt((wateringGame.totalMultiplier - 1) / 0.25));
				if(soundIdx > 5) { soundIdx = 5; }
				sounds.playSound("harvest" + soundIdx);
				wateringGame.soundPlayedHere = wateringGame.totalMultiplier;
			}
			if(finalScore > 0) {
				wateringGame.score += finalScore;
				summationScore += finalScore;
				wateringGame.shipScore(finalScore);
				if(wateringGame.mode == 2 && !wateringGame.inStoryMode) {
					var dt = Math.min(180, Math.floor(finalScore / 250));
					summationTime += dt;
					wateringGame.timer += dt;
					wateringGame.updateTimeDisplay();
				}
			}
		}
		if(summationScore > 0) {
			if($(".scoreParticle").length > 4) { $(".scoreParticle:lt(3)").remove(); }
			$("#game").append("<div class='anim scoreParticle'><span>" + summationScore + "</span></div>");
		}
		if(summationTime >= 1) {
			if($(".timeParticle").length > 4) { $(".timeParticle:lt(3)").remove(); }
			$("#game").append("<div class='anim timeParticle'><span>" + summationTime + "</span></div>");
		}
		$("#cropScore").text(wateringGame.score);
		wateringGame.drawBoard();
		wateringGame.totalMultiplier += 0.4;
		setTimeout(wateringGame.attemptFinishTurn, wateringGame.gameSpeed);
	},
	getNeighbors: function(type, x, y, existing, ignoreStage) {
		existing = wateringGame.addMatch(type, x - 1, y, existing, ignoreStage);
		existing = wateringGame.addMatch(type, x + 1, y, existing, ignoreStage);
		existing = wateringGame.addMatch(type, x, y - 1, existing, ignoreStage);
		existing = wateringGame.addMatch(type, x, y + 1, existing, ignoreStage);
		return existing;
	},
	addMatch: function(type, x, y, existing, ignoreStage) {
		if(y >= wateringGame.height || y < 0 || x >= wateringGame.width || x < 0) { return existing; }
		var baby = wateringGame.board[y][x];
		if(baby == 0 || baby == null || baby == undefined) { return existing; }
		var val = x * 10 + y;
		var stageMatch = ignoreStage || baby.stage == baby.finalStage;
		if(baby.type == type && stageMatch && existing.indexOf(val) < 0) {
			existing.push(val);
			existing = wateringGame.getNeighbors(type, x, y, existing, ignoreStage);
		}
		return existing;
	},
	grow: function(x, y, toMax, type, noChild) {
		var $crop = $("#crop" + x + "_" + y);
		var shouldSpread = true;
		if(!$crop.length) { return; }
		var tile = wateringGame.board[y][x];
		if(tile == 0) {
			if(noChild) { return; }
			tile = {type: type, stage: 0, finalStage: wateringGame.getFinalStage(type), score: wateringGame.getPlantScore(type)};
		} else {
			if(tile.type == "pumpkin") {
				if(tile.stage == 2) {
					tile.stage = 3;
				} else if(tile.stage == 3) {
					if(toMax) {
						tile = 0;
						shouldSpread = false;
					}
				} else {
					tile.stage = toMax ? tile.finalStage : Math.min(tile.finalStage, tile.stage + 1);
				}
			} else {
				tile.stage = toMax ? tile.finalStage : Math.min(tile.finalStage, tile.stage + 1);
			}
		}
		$crop.empty();
		wateringGame.board[y][x] = tile;
		wateringGame.addCrop($crop, tile);
		return shouldSpread;
	},
	addCrop: function($crop, tile) {
		var name = tile.type + "_" + tile.stage;
		$crop.prepend("<div data-type='" + tile.type + "' data-stage='" + tile.stage + "' class='crop sprite c_" + name + "'></div>");
	},
	getPlantScore: function(type) {
		if(type == "pumpkin") { return 7500; }
		if(type == "corn") { return 150; }
		if(type == "carrot") { return 75; }
		return 100;
	},
	getFinalStage: function(type) { 
		if(type == "corn") { return 3; }
		if(type == "carrot") { return 1; }
		return 2;
	},
	drawBoard: function() {
		for(var x = 0; x < wateringGame.width; x++) {
			for(var y = 0; y < wateringGame.height; y++) {
				var $crop = $("#crop" + x + "_" + y);
				$crop.empty();
				var tile = wateringGame.board[y][x];
				if(tile != 0) { wateringGame.addCrop($crop, tile); }
			}
		}
	},
	initDistribution: function(dist) {
		if(typeof(dist) === "string") { dist = commonDistributions[dist]; }
		wateringGame.vdist = [];
		wateringGame.vdist[0] = dist.tomato;
		wateringGame.vdist[1] = wateringGame.vdist[0] + dist.strawberry;
		wateringGame.vdist[2] = wateringGame.vdist[1] + dist.cucumber;
		wateringGame.vdist[3] = wateringGame.vdist[2] + dist.carrot;
		wateringGame.vdist[4] = wateringGame.vdist[3] + dist.corn;
	},
	getCrop: function() {
		var r = Math.random();
		if(r <= wateringGame.vdist[0]) { return {type: "tomato", stage: 0, finalStage: 2, score: 100}; }
		if(r <= wateringGame.vdist[1]) { return {type: "strawberry", stage: 0, finalStage: 2, score: 100}; }
		if(r <= wateringGame.vdist[2]) { return {type: "cucumber", stage: 0, finalStage: 2, score: 100}; }
		if(r <= wateringGame.vdist[3]) { return {type: "carrot", stage: 0, finalStage: 1, score: 75}; }
		if(r <= wateringGame.vdist[4]) { return {type: "corn", stage: 0, finalStage: 3, score: 150}; }
		return {type: "pumpkin", stage: 0, finalStage: 2, score: 7500};
	},
	settleBoard: function(instant) {
		var numChanges = 0;
		for(var x = 0; x < wateringGame.width; x++) {
			for(var y = (wateringGame.height - 2); y >= 0; y--) {
				if(wateringGame.board[y + 1][x] == 0) {
					numChanges++;
					var dy = 1;
					while((y + dy) < wateringGame.height && wateringGame.board[y + dy][x] == 0) { dy++; }
					dy--;
					wateringGame.board[y + dy][x] = wateringGame.board[y][x];
					wateringGame.board[y][x] = 0;
					if(!instant) {
						var $crop = $("#crop" + x + "_" + y + " > .crop");
						$crop.addClass("dropping dropping" + dy);
					}
				}
			}
		}
		return (numChanges > 0);
	}
};