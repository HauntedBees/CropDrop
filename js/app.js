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
(function () {
	document.addEventListener("deviceready", function () {
		settings.device = device.platform.toLowerCase();
		document.body.className = settings.device;
		if(window.cordova.platformId !== "browser") {
			StatusBar.hide();
		}
		FastClick.attach(document.body);
		document.addEventListener("pause", function() {
			if($("body").attr("data-state") == "game") {
				music.stop("happy");
				if(!wateringGame.paused) {
					wateringGame.paused = true;
					$(".sprite").addClass("paused");
					sounds.playSound("tap");
					$(".overlayButtons, .overlayAltText").hide();
					$(".overlayTap, #overlayButtonsA, #overlayText").show();
					$(".fullCoverText").removeClass("large medium shmedium small");
					$("#overlayText").text("Paused");
				}
			} else {
				music.stop("nochains");
			}
		});
		document.addEventListener("resume", function() {
			if($("body").attr("data-state") == "game") {
				music.play("happy");
			} else {
				music.play("nochains");
			}
		});
		document.addEventListener("touchmove", function(e) {
			if($(e.target).closest('.scrollable').length == 0) { 
				e.preventDefault();
				return false;
			}
		}, false);
		document.addEventListener("backbutton", function(e) {
			e.preventDefault();
			BackPress();
			return false;
		}, false);
	}, false);
	document.body.className = "browser";
	if(navigator.userAgent.indexOf("Chrome") != -1 )  { document.body.className += " chrome"; }
	$("body").attr("data-state", "mainMenu");
	$("body").attr("data-inMenu", "false");
	LoadGame();
	music.play("nochains");
	var html = "<div class='sprite rowB' data-x='A' data-y='B' id='cropA_B'></div>";
	var res = "";
	for(var y = 0; y < 8; y++) {
		res += "<div class='cropRow'>";
		for(var x = 0; x < 6; x++) {
			res += html.replace(/A/g, x).replace(/B/g, y);
		}
		res += "</div>";
	}
	$("#cropGame").html(res);
	$(".cropRow:nth-last-child(2)").addClass("whackerRow");

	document.addEventListener("keyup", function(e) {
		if (e.keyCode != 27) { return true; }
		e.preventDefault();
		BackPress();
		return false;
	}, false);

	SetUpLevelSelect();
	setInterval(function() { $(".anim").toggleClass("f2"); }, 250);
	
	$("#quit").on("click", menuNav.exitApp);
	$("#about").on("click", menuNav.showAbout);
	$(".gardenButton").on("click", beeGarden.start);
	$(".settingsGear").on("click", menuNav.showSettings);
	$("#leave").on("click", function() {
		wateringGame.inStoryMode = false;
		menuNav.quitToMenuInGame();
	});
	$(".quitToMenu").on("click", menuNav.quitToMenuInGame);
	$(".toMainMenu").on("click", menuNav.returnToMainMenu);
	$(".exitSettings, #optionsOverlay").on("click", menuNav.exitSettingsOrAbout);
	$("#risingMode").on("click", function() { sounds.playSound("tap"); wateringGame.start(6, 8, 1); menuNav.switchIntoGame(); });
	$("#endlessMode").on("click", function() { sounds.playSound("tap"); wateringGame.start(6, 8, 2); menuNav.switchIntoGame(); });
	$("#levelSelBtn").on("click", function() {
		sounds.playSound("tap");
		for(var i = 0; i < levelData.length; i++) {
			if(levelsCompleted[i] === undefined) {
				wateringGame.start(6, 8, 2, i, i == 0);
				menuNav.switchIntoGame();
				return;
			}
		}
		menuNav.switchToLevelSelect();
	});
	$("#newGame").on("click", function() { sounds.playSound("tap"); wateringGame.start(6, 8, wateringGame.mode, wateringGame.levelNum, false); });
	$("#nextLevel").on("click", function() { sounds.playSound("tap"); wateringGame.start(6, 8, 2, wateringGame.levelNum + 1, false); });
	
	$("#navRight").on("click", function() { scoreDisplay.switchState(1) });
	$("#navLeft").on("click", function() { scoreDisplay.switchState(-1) });
	
	$("#pause").on("click", function() {
		wateringGame.paused = true;
		$(".sprite").addClass("paused");
		sounds.playSound("tap");
		$(".overlayButtons, .overlayAltText").hide();
		$(".overlayTap, #overlayButtonsA, #overlayText").show();
		$(".fullCoverText").removeClass("large medium shmedium small");
		$("#overlayText").text("Paused");
	});
	$(".unpause").on("click", function() {
		wateringGame.paused = false;
		$(".sprite").removeClass("paused");
		sounds.playSound("yes");
		$(".overlayTap").hide();
	});
	$("#okError, .exitError, #errorBg").on("click", function() {
		sounds.playSound("tap");
		$("#fullError").hide();
	});
	
	var count6 = (window.screen.width / 6.5);
	count6 = count6 - (count6) % 16;
	var ratio = (count6 / 192) * 100;
	$("#content").css("zoom", ratio + "%");
	$("#loadingScreen").hide();
	$("#mainMenu").show();
}());

function BackPress() {
	if($("body").attr("data-inMenu") == "true") {
		menuNav.exitSettingsOrAbout();
	} else if($("body").attr("data-state") == "levelSelect") {
		menuNav.returnToMainMenu();
	} else if($("body").attr("data-state") == "mainMenu") {
		menuNav.exitApp();
	} else if($("body").attr("data-state") == "game") {
		menuNav.backInGame();
	}
}