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
(function () {
	document.addEventListener("deviceready", function () {
		settings.device = device.platform.toLowerCase();
		document.body.className = settings.device;
		if(window.cordova.platformId == "browser") {
			facebookConnectPlugin.browserInit("1873235692953878");
		} else {
			StatusBar.hide();
		}
		setTimeout(fbFuncs.fbCheck, 500);
		/*StatusBar.overlaysWebView(true);
		StatusBar.backgroundColorByHexString("#FFFFFF");
		StatusBar.styleDefault();*/
		FastClick.attach(document.body);
		if(navigator.notification) { // may not be needed
			window.alert = function (message) {
				navigator.notification.alert(message, null, "Crops", "OK"); // message, callback, title, buttonName
			};
		}
		document.addEventListener("pause", function() {
			if($("body").attr("data-state") == "game") {
				music.stop("happy");
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
			if($("body").attr("data-inMenu") == "true") {
				menuNav.exitSettingsOrAbout();
			} else if($("body").attr("data-state") == "levelSelect") {
				menuNav.returnToMainMenu();
			} else if($("body").attr("data-state") == "mainMenu") {
				menuNav.exitApp();
			} else if($("body").attr("data-state") == "game") {
				menuNav.backInGame();
			}
			return false;
		}, false);
	}, false);
	document.body.className = "browser";
	$("body").attr("data-state", "mainMenu");
	$("body").attr("data-inMenu", "false");
	LoadGame();
	music.play("nochains");
	var html = "<div class='sprite' data-x='A' data-y='B' id='cropA_B'></div>";
	var res = "";
	for(var y = 0; y < 8; y++) {
		res += "<div class='cropRow'>";
		for(var x = 0; x < 6; x++) {
			res += html.replace(/A/g, x).replace(/B/g, y);
		}
		res += "</div>";
	}
	$("#cropGame").html(res);
	
	SetUpLevelSelect();
	setInterval(function() { $(".anim").toggleClass("f2"); }, 250);
	
	$("#quit").on("click", menuNav.exitApp);
	$("#about").on("click", menuNav.showAbout);
	$(".settingsGear").on("click", menuNav.showSettings);
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
		$(".fullCoverText").removeClass("large medium small");
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