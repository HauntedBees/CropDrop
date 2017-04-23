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
var menuNav = {
	showAbout: function() {
		sounds.playSound("tap");
		$("#aboutMenu,#optionsOverlay").show();
		$("body").attr("data-inMenu", "true");
	},
	showError: function(error) {
		sounds.playSound("success");
		$("#inError").text(error);
		$("#fullError").show();
	},
	showSettings: function() {
		sounds.playSound("tap");
		$("#sounds").text(settings.playSounds ? "Sound On" : "Sound Off");
		$("#musics").text(settings.playMusic ? "Music On" : "Music Off");
		$("#grafs").text(settings.HDgrafs ? "HD Graphics On" : "HD Graphics Off");
		$("#optionsMenu,#optionsOverlay").show();
		$("body").attr("data-inMenu", "true");
	},
	exitSettingsOrAbout: function() {
		sounds.playSound("tap");
		SaveGame();
		$("#optionsMenu,#optionsOverlay,#aboutMenu").hide();
		$("body").attr("data-inMenu", "false");
	},
	switchIntoGame: function() {
		music.stopAll();
		music.playFresh("happy");
		$("#mainMenu,#levelSelect").hide();
		$("#game").show();
		$("body").attr("data-state", "game");
	},
	switchToLevelSelect: function() {
		sounds.playSound("tap");
		$("#mainMenu,#levelSelect").hide();
		$("#levelSelect").show();
		$("body").attr("data-state", "levelSelect");
		$(".selectedLevel").removeClass("selectedLevel");
		var $selected = $(".levelIcon:not(.complete):first");
		if(!$selected.length) { $selected = $(".levelIcon:first"); }
		$selected.addClass("selectedLevel");
		var levelNum = parseInt($selected.text());
		menuNav.setUpLevelSelect(levelNum);
		$("#levelDisplay").scrollLeft($selected.position().left);
	},
	setUpLevelSelect: function(levelNum) {
		$("#levelInfo").attr("data-level", levelNum);
		var thisLevel = levelData[levelNum];
		$("#levelInfoText").text((levelNum == 0 ? "Tutorial: " : "Mission: ") + thisLevel.mission);

		var html = "<div class='infoBar time'><span>" + GetTimeAsString(thisLevel.time) + "</span></div>";
		var crops = Object.keys(thisLevel.req);
		for(var i = 0; i < crops.length; i++) {
			html += "<div class='infoBar " + crops[i] + "'><span>" + thisLevel.req[crops[i]] + "</span></div>";
		}
		if(thisLevel.restrictions !== undefined) {
			for(var i = 0; i < thisLevel.restrictions.length; i++) {
				html += "<div class='infoBar " + thisLevel.restrictions[i] + " forbidden'><span>0</span></div>";
			}
		}
		$("#levelInfoRequirements").html(html);

		if(levelsCompleted[levelNum] !== undefined) {
			var li = levelsCompleted[levelNum];
			var dt = li.bestTime;
			if(!isNaN(levelNum)) { dt = thisLevel.time - li.bestTime; }
			$("#levelInfoScoreSection").html("Best Score: " + li.highScore + "<br>Best Time: " + GetTimeAsString(dt));
		} else {
			$("#levelInfoScoreSection").html("");
		}
	},
	returnToMainMenu: function() {
		sounds.playSound("tap");
		$("#game, #levelSelect").hide();
		$("#mainMenu").show();
		$("body").attr("data-state", "mainMenu");
	},
	exitApp: function() {
		sounds.playSound("yes");
		music.stopAll();
		navigator.app.exitApp();
	},
	backInGame: function() {
		if(wateringGame.paused) {
			$(".quitToMenu").click();
			$("#tutorial, #pointerFinal").hide();
		} else {
			$("#pause").click();
		}
	},
	quitToMenuInGame: function() {
		music.stopFull("happy");
		music.play("nochains");
		$(".overlayTap, .overlayButtons, .overlayAltText").hide();
		$(".fullCoverText").removeClass("large medium small");
		$("#tutorial, #pointerFinal, #pointer").hide();
		if(wateringGame.inStoryMode) {
			menuNav.switchToLevelSelect();
		} else {
			menuNav.returnToMainMenu();
		}
		var keys = Object.keys(levelsCompleted);
		for(var i = 0; i < keys.length; i++) {
			$("#levelIcon" + keys[i]).addClass("complete");
		}
	}
};