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
		$("#whackerPos").text(settings.whackerRight ? "Right-Handed" : "Left-Handed");
		$("#sounds").text(settings.playSounds ? "Sound On" : "Sound Off");
		if(settings.playSounds) {
			$("#soundSlider").show();
			$("#soundSlider > .centernum").text(settings.soundVol);
		} else {
			$("#soundSlider").hide();
		}
		$("#musics").text(settings.playMusic ? "Music On" : "Music Off");
		if(settings.playMusic) {
			$("#musicSlider").slideDown();
			$("#musicSlider > .centernum").text(settings.musicVol);
		} else {
			$("#musicSlider").hide();
		}
		$("#grafs").text(settings.HDgrafs ? "HD Graphics On" : "HD Graphics Off");
		$("#timer").text(settings.timer ? "Endless Mode Time Limit On" : "Endless Mode Time Limit Off");
		$("#acc").text(settings.accGrafs == 0 ? "Standard Vision" : (settings.accGrafs == 1 ? "Colored Outlines" : "Colorblind Mode"));
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
		$(".fullCoverText").removeClass("large medium shmedium small");
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