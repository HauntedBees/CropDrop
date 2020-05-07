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
var wateringGame = {
	mode: 2, 
	modeTimerIdx: 0, modeCounter: 0, 
	totalMultiplier: 1, chainCount: 1, 
	timerIdx: 0,
	paused: false, gameIsOver: false, 
	inStoryMode: false, inTutorial: false, levelNum: 0, 
	soundPlayedHere: 0, minHarvestRequirement: 0, minChainRequirement: 0, 
	animating: false, animSpeed: 250, 
	width: 0, height: 0, 
	whackers: 0, whackQueued: false, 
	shipment: {}, restrictions: [], 
	start: function(width, height, mode, levelNumber, isTutorial) {
		wateringGame.gameIsOver = false;
		clearInterval(wateringGame.modeTimerIdx);
		clearInterval(wateringGame.timerIdx);
		music.playFresh("happy");
		$(".forbidden").removeClass("forbidden");
		$(".infoBar.main > span").text("0");
		$(".comboParticle,.poof,.bee,.scoreParticle,.timeParticle").remove();
		wateringGame.mode = mode || 2;
		wateringGame.restrictions = [];
		wateringGame.shipmentDifficulty = 1;
		wateringGame.inStoryMode = (levelNumber !== undefined);
		wateringGame.paused = true;
		$("#pointer,.overlayButtons,.overlayAltText,#beeFacts").hide();
		$(".overlayTap, #overlayText, #overlayButtonsNav").show();
		$(".fullCoverText").removeClass("large medium shmedium small").addClass("medium");
		if(wateringGame.inStoryMode) {
			$("#overlayButtonsD").show();
		} else {
			$("#overlayButtonsE").show();
		}
		if(!isTutorial) { $("#navRight").show(); } else { $("#navRight").hide(); }
		scoreDisplay.switchState(-scoreDisplay.navState, true);
		$("#navLeft").hide();
		wateringGame.shipment = {};
		$("#shipItems").html("<div class='infoBar OK'></div>");
		wateringGame.minHarvestRequirement = 0;
		wateringGame.minChainRequirement = 0;
		if(wateringGame.inStoryMode) {
			wateringGame.levelNum = levelNumber;
			var ld = levelData[levelNumber];
			if(ld === undefined) {
				menuNav.quitToMenuInGame();
				return;
			}
			wateringGame.whackers = Math.min(3, Math.floor(levelNumber / 8));
			wateringGame.initDistribution(ld.dist);
			wateringGame.minHarvestRequirement = ld.minHarvest || 0;
			wateringGame.minChainRequirement = ld.minChain || 0;
			$("#overlayText").text((levelNumber == 0 ? "Tutorial: " : "Mission: ") + ld.mission);
			wateringGame.createShipmentFromLevelData(ld);
		} else {
			wateringGame.whackers = (mode == 2 ? 0 : 10);
			wateringGame.levelNum = undefined;
			wateringGame.initDistribution("standard");
			if(mode == 2) {
				$("#overlayText").html("Endless Mode<br><span>The timer is counting down, and the only way to raise it is by harvesting crops. Get as high of a score as you can before time runs out! Ship desired crops as they appear to extend the timer!</span><br><br>");
			} else {
				$("#overlayText").html("Rising Mode<br><span>Every time you mature a crop, it will scatter seeds, planting saplings in the spaces next to it. Additionally, crops will slowly rise up from the bottom over time! Keep harvesting to prevent a garden overflow!</span><br><br>");
			}
		}
		$("#mainGame,#menuBtn,.gameOverTap,#gardenCropInfo,#leave").hide();
		$("#cropGame,.infoBar,#mainCropInfo,#pause").show();
		$("#shipText").text("Needed");
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
		wateringGame.timeSinceLastBee = 0;
		if(wateringGame.mode == 1) {
			wateringGame.timer = 0;
			wateringGame.modeTimerIdx = setInterval(wateringGame.handleMode1, 1000);
			$("#shipItems").html("Don't overflow the garden!");
			$("#cropTimer").text("0:00");			
		} else {
			if(wateringGame.inStoryMode) {
				wateringGame.timer = levelData[levelNumber].time;
				wateringGame.updateTimeDisplay();
			} else if(settings.timer === false) {
				wateringGame.timer = -1;
				$("#cropTimer").text("Endless");
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

		wateringGame.whackQueued = false;
		$("#weedWhackBtn > span").text("x" + wateringGame.whackers);
		$(document).off("click", "#weedWhackBtn");
		$(document).on("click", "#weedWhackBtn", function() {
			if(wateringGame.inTutorial && !tutorialHandler.validMove("weed")) { return; }
			if(wateringGame.whackQueued || wateringGame.whackers == 0) { return; }
			if(wateringGame.locked) {
				whackQueued = true;
			} else {			
				wateringGame.weedWhack();
			}
		});
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
			wateringGame.chainCount = 1;
			wateringGame.totalMultiplier = 1;
			wateringGame.soundPlayedHere = 0;
			setTimeout(wateringGame.attemptFinishTurn, wateringGame.gameSpeed);
		});
		wateringGame.settleBoard(true);
		wateringGame.drawBoard();
	},
	addWhacker: function() { $("#weedWhackBtn > span").text("x" + (++wateringGame.whackers)); },
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
		var res = SaveLevelStats(wateringGame.levelNum, wateringGame.score, wateringGame.lastedTime);
		if(res > 0) {
			appendedHtml += "<span class='additionalScoreInfo'>";
			if((res & 2) == 2) { appendedHtml += " New High Score!"; }
			if((res & 1) == 1) { appendedHtml += " New Best Time!"; }
			appendedHtml += "</span>";
		}
		appendedHtml += "<br><span class='additionalScoreInfo'>Your Score: " +  wateringGame.score + "</span><span class='additionalScoreInfo'>Your Time: " + GetTimeAsString(wateringGame.lastedTime) + "</span>";
		SaveGame();
		$(".fullCoverText").removeClass("large medium shmedium small");
		$(".overlayButtons, .overlayAltText").hide();
		$(".fullCoverText").addClass("shmedium");
		sounds.playSound("win");
		$(".overlayTap").show();
		setTimeout(function() { $("#overlayButtonsC").show(); }, 1000);
		$("#overlayText").show().html("Level Complete!" + appendedHtml);
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
			var max = RandRange(1, 4);
			for(var i = 0; i < max; i++) {
				var idx = RandRange(0, types.length);
				var mult = types[idx] == "pumpkin" ? 0.05 : ((types[idx] == "carrot" || types[idx] == "corn") ? 0.5 : 1);
				if(mult < 1) { max -= 1; }
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
		sounds.playSound("newShipment");
		$(".infoBar").slideDown();
	},
	appendCropToShipment: function(crop, min, max) {
		var count = RandRange(min, max);
		if(count <= 0) { return; }
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
				if(settings.timer === true) {
					wateringGame.timer += tAdd;
				}
				wateringGame.shipmentDifficulty++;
				if($(".timeParticle").length > 4) { $(".timeParticle:lt(3)").remove(); }
				$("#game").append("<div class='anim timeParticle'><span>" + tAdd + "</span></div>");
				sounds.playSound("completeShipment");
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
		appendedHtml += "<br><span class='additionalScoreInfo'>Your Score: " +  wateringGame.score + "</span><span class='additionalScoreInfo'>Your Time: " + GetTimeAsString(wateringGame.lastedTime) + "</span>";
		$(".overlayButtons, .overlayAltText").hide();
		$(".fullCoverText").removeClass("large medium shmedium small");
		$(".overlayTap").show();
		setTimeout(function() { $("#overlayButtonsB").show(); }, 1000);
		$(".fullCoverText").addClass("shmedium");
		$("#overlayText").show().html(t + appendedHtml);
	},
	advanceTimer: function() {
		if(wateringGame.paused) { return; }
		if(settings.timer === false) { return; }
		wateringGame.timer += (wateringGame.mode == 1) ? 1 : -1;
		wateringGame.lastedTime += 1;
		wateringGame.timeSinceLastBee += 1;
		wateringGame.updateTimeDisplay();
		if(wateringGame.lastedTime % 7 == 0 && Object.keys(wateringGame.shipment).length === 0 && wateringGame.mode == 2) {
			wateringGame.createNewShipment();
		}
		if(wateringGame.timeSinceLastBee >= 10 && Math.random() > 0.95) {
			wateringGame.spawnBee();
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
	spawnBee: function() {
		wateringGame.timeSinceLastBee = -5 * Math.random();
		var $crops = $(".cropRow > .sprite");
		var $chosen = $crops.eq(Math.floor(Math.random() * $crops.length));
		if($(".bee", $chosen).length) {
			wateringGame.timeSinceLastBee += 10;
			return;
		}
		$chosen.append("<div class='sprite small poof p1'></div>");
		setTimeout(function() {
			$(".poof.p1").removeClass("p1").addClass("p2");
			setTimeout(function() {
				$(".poof.p2").removeClass("p2").addClass("p3");
				$(".poof").parent().append("<div class='sprite small bee anim'></div>");
				setTimeout(function() { $(".poof.p3").remove(); }, 100);
			}, 100);
		}, 100);
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
				if(wateringGame.whackQueued) { wateringGame.weedWhack(); }
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
		if(pairPairs.length == 0 && wateringGame.whackers == 0) {
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
			if(wateringGame.whackQueued) { wateringGame.weedWhack(); }
			return;
		}
		var summationScore = 0, summationTime = 0;
		for(var i = 0; i < pairPairs.length; i++) {
			var pair = pairPairs[i];
			var score = 0, multiplier = 1, beeMultiplier = 1;
			var centerx = 0;
			for(var j = 0; j < pair.length; j++) { centerx += Math.floor(pair[j] / 10); }
			var pairLen = pair.length;
			centerx /= pairLen;
			var tileType = "";
			for(var j = 0; j < pairLen; j++) {
				var val = pair[j];
				var x = Math.floor(val/10);
				var y = val - (x * 10);
				var tile = wateringGame.board[y][x];
				if(tile != 0) {
					tileType = tile.type;
					var $info = $("#info_" + tile.type);
					var count = parseInt($info.text()) + 1;
					if($("#crop" + x + "_" + y + " .bee").length) {
						beeMultiplier += 0.1;
						var pollenCount = 2 + Math.ceil(Math.random() * 15);
						settings.pollen += pollenCount;
						SaveGame();
						if(pollenCount > 5) { pollenCount = 5; }
						var pollenCenterX = Math.ceil(pollenCount / 2);
						var pollenPos = $("#crop" + x + "_" + y).position();
						pollenPos.left += $("#crop" + x + "_" + y).width();
						for(var p = 0; p < pollenCount; p++) {
							var $poof = $("<div class='crop_particle sprite small poof'>");
							var rotation = "rotate(" + Math.floor(Math.random() * 360) + "deg)";
							var posMult = 1;
							if(window.innerHeight < window.innerWidth) { posMult = 0.9; } // landscape mode
							rotation = rotation + " " + $poof.css("transform");
							$poof.css({
								"-ms-transform": rotation,
								"-webkit-transform": rotation,
								"transform": rotation
							});
							$("#cropGame").append($poof);
							var dx = p - pollenCenterX;
							var path = new $.path.bezier({
								start: {
									x: pollenPos.left * posMult,
									y: pollenPos.top * posMult
								},
								end: {
									x: (pollenPos.left + (dx * 500)) * posMult, 
									y: (pollenPos.top + 4000) * posMult
								}
							});
							$poof.animate({path: path}, 2000, "swing", function() { $(this).remove() });
						}
					}
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
					var rotation = Math.floor(Math.random() * 360);
					var pos = $("#crop" + x + "_" + y).position();
					var posMult = 1;
					if(window.innerHeight < window.innerWidth) { posMult = 0.9; } // landscape mode
					$("#cropGame").append($newGuy);
					var path = new $.path.bezier({
						start: {
							x: pos.left * posMult,
							y: pos.top * posMult
						},
						end: {
							x: (pos.left + (x == centerx ? 0 : (x < centerx ? -500 : 500)))  * posMult, 
							y: (pos.top + 4000) * posMult
						}
					});
					var bonusRot = " " + $newGuy.css("transform");
					$newGuy.animate({path: path}, 2000, "swing", function() { $(this).remove() });
					$({deg: 0}).animate({deg: rotation}, {
						duration: 1500, 
						step: function(now) {
							$newGuy.css({
								transform: "rotate(" + now + "deg)" + bonusRot,
								"-ms-transform": "rotate(" + now + "deg)" + bonusRot,
								"-webkit-transform": "rotate(" + now + "deg)" + bonusRot
							});
						}
					});
				}
			}
			switch(tileType) {
				case "tomato":
				case "cucumber":
				case "strawberry":
				case "corn":
					if(pairLen > 5) { wateringGame.addWhacker(); }
					if(pairLen > 4) { wateringGame.addWhacker(); }
					break;
				case "carrot":
					if(pairLen > 3) { wateringGame.addWhacker(); }
					break;
				case "pumpkin":
					if(pairLen > 2) {
						wateringGame.addWhacker();
						wateringGame.addWhacker();
					}
					break;
			}
			var finalScore = Math.floor(wateringGame.totalMultiplier * score * beeMultiplier);
			if(wateringGame.soundPlayedHere != wateringGame.totalMultiplier) {
				var soundIdx = wateringGame.totalMultiplier == 1 ? 1 : (1 + parseInt((wateringGame.totalMultiplier - 1) / 0.25));
				if(soundIdx > 5) { soundIdx = 5; }
				sounds.playSound("harvest" + soundIdx);
				wateringGame.soundPlayedHere = wateringGame.totalMultiplier;
			}
			if(wateringGame.chainCount < wateringGame.minChainRequirement) { finalScore = 0; }
			if(finalScore > 0) {
				wateringGame.score += finalScore;
				summationScore += finalScore;
				wateringGame.shipScore(finalScore);
				if(wateringGame.mode == 2 && !wateringGame.inStoryMode) {
					var dt = Math.min(180, Math.floor(finalScore / 300));
					summationTime += dt;
					if(settings.timer === true) {
						wateringGame.timer += dt;
					}
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
		if(wateringGame.chainCount > 1) {
			$(".comboParticle").remove();
			$("#game").append("<div class='anim comboParticle'><span><span>" + wateringGame.chainCount + "</span>chain</span></div>");
			if(wateringGame.chainCount > 2) { wateringGame.addWhacker(); }
		}
		$("#cropScore").text(wateringGame.score);
		wateringGame.drawBoard();
		wateringGame.totalMultiplier += 0.4;
		wateringGame.chainCount += 1;
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
		wateringGame.replaceCrop($crop, tile, x, y);
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
				wateringGame.replaceCrop($("#crop" + x + "_" + y), wateringGame.board[y][x], x, y);
			}
		}
	},
	replaceCrop: function($crop, tile, x, y) {
		wateringGame.board[y][x] = tile;
		if(tile == 0) {
			$crop.empty();
			return;
		}
		var name = tile.type + "_" + tile.stage;
		$(".crop", $crop).remove();
		$crop.prepend("<div data-type='" + tile.type + "' data-stage='" + tile.stage + "' class='crop sprite c_" + name + "'></div>");
	},
	weedWhack: function() {
		wateringGame.whackers--;
		$("#weedWhackBtn > span").text("x" + wateringGame.whackers);
		sounds.playSound("mow");
		wateringGame.locked = true;
		$(".weedWhack").remove();
		$(".whackerRow").append("<div class='sprite weedWhack'></div>");
		setTimeout(function() {
			for(var x = wateringGame.width - 1; x >= 0; x -= 2) {
				var y = wateringGame.height - 1;//(x % 2 == 0 ? 1 : 2);
				wateringGame.shred(x, y);
			}
			wateringGame.attemptFinishTurn();
			$(".weedWhack").remove();
			wateringGame.whackQueued = false;
		}, 1000);
	},
	shred: function(x, y) {
		var $crop = $("#crop" + x + "_" + y);
		if(!$crop.length) { return; }
		wateringGame.replaceCrop($crop, 0, x, y);
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