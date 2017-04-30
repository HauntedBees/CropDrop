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
var tutorialStates = [
	{requiredClick: [3, 4], text: "Hey kid, wanna see a dead body? Tap the sapling the floating hand is pointing at!"}, 
	{requiredClick: [4, 4], text: "Just kidding! No dead body, just strawberries! Tapping a crop will make it grow to maturity, and make all the crops around it grow a bit, too! Now tap the sapling next to the one you just tapped!"},
	{requiredClick: [1, 1], text: "Wow! When two or more crops of the same type are fully grown and next to each other, they'll be harvested! That's the goal of the game! Harvesting crops! Now try tapping THIS sapling!"},
	{requiredClick: [1, 3], text: "That was a cucumber! Most crops have three stages from sapling to fully grown. Now, you COULD tap the cucumber right below this one... but why not tap the one below that instead?"}, 
	{requiredClick: [2, 6], text: "Bam! The cucumber in between the two you tapped grew two stages on its own! That's three crops in a row, which obviously means BONUS POINTS! Excellent! Now check out this carrot."},
	{requiredClick: [4, 5], text: "Yep! Carrots only have two stages, so if you tap one and it has any carrot neighbors, they'll reach maturity right away! Now let's check out corn!"},
	{requiredClick: [4, 7], text: "Now try the corn at the bottom..."},
	{requiredClick: [4, 6], text: "Look at that! The corn in between the two you tapped isn't fully grown yet! Corn has FOUR stages instead of the three that strawberries, cucumbers, and tomatoes have!"},
	{requiredClick: [0, 7], text: "And finally, we have pumpkins. These guys are tricky... they have three stages like most of the other crops, but..."}, 
	{requiredClick: [0, 7], text: "Now it's fully matured... but what happens if you tap it again?"}, 
	{requiredClick: [0, 7], text: "Oh dang! It's rotten! If pumpkins are advanced past maturity, either by tapping them or by tapping a crop next to them, they'll wither away! Tap a withered pumpkin to remove it from the field."},
	{requiredClick: [0, 6], text: "You've got the basics down, but let me just show you what you can accomplish if you're precise in your harvesting choices. Try harvesting this cucumber..."}, 
	{requiredClick: [2, 5], text: "...and now pick this tomato!"}, 
	{requiredClick: 0, text: "Seven tomatoes in one harvest! And with a harvest that big you're gonna earn yourself some WEED WHACKERS! Tap the Weed Whacker button to use one!" },
	{lastStep: true, text: "Amazing! The weeds were whacked! Use these babies if you're ever in trouble, but remember: you gotta earn 'em! That's the tutorial! Harvest one more crop to beat the level!"}
];
var tutorialHandler = {
	state: 0,
	start: function() {
		tutorialHandler.state = 0;
		$("#tutorial").show();
		$("#pointerFinal").show();
		var tempBoard = [
			"000000",
			"020000",
			"020000",
			"020000",
			"200110",
			"000040",
			"033140",
			"500040"
		];
		for(var y = 0; y < wateringGame.height; y++) {
			var tempRow = tempBoard[y].split("");
			for(var x = 0; x < wateringGame.width; x++) {
				wateringGame.board[y][x] = tutorialHandler.getCropFromInt(parseInt(tempRow[x]));
			}
		}
		tutorialHandler.updateState(true);
	},
	getCropFromInt: function(i) {
		return [{type: "tomato", stage: 0, finalStage: 2, score: 100},
				{type: "strawberry", stage: 0, finalStage: 2, score: 100},
				{type: "cucumber", stage: 0, finalStage: 2, score: 100},
				{type: "carrot", stage: 0, finalStage: 1, score: 75},
				{type: "corn", stage: 0, finalStage: 3, score: 150},
				{type: "pumpkin", stage: 0, finalStage: 2, score: 2000}][i];
	},
	updateState: function(immediate) {
		$("#tutorial > div").text(tutorialStates[tutorialHandler.state].text);
		if(!tutorialStates[tutorialHandler.state].lastStep) {
			var properCoords = tutorialStates[tutorialHandler.state].requiredClick;
			$("#pointer").show();
			if(properCoords == 0) {
				var pos = $("#weedWhackBtn").position();
				$("#pointer").animate({
					left: (pos.left + 150) + "px",
					top: (pos.top - 133) + "px"
				}, 500);
				return;
			}
			if(immediate) {
				setTimeout(function() {
					var pos = $("#crop" + properCoords[0] + "_" + properCoords[1]).position();
					$("#pointer").css({
						left: (pos.left + 150) + "px",
						top: (pos.top - 133) + "px"
					});
				}, 100);
			} else {
				var pos = $("#crop" + properCoords[0] + "_" + properCoords[1]).position();
				$("#pointer").animate({
					left: (pos.left + 150) + "px",
					top: (pos.top - 133) + "px"
				}, 500);
			}
		}
	},
	validMove: function($crop) {
		var success = tutorialStates[tutorialHandler.state].requiredClick == 0;
		if($crop == "weed") {
			if(success) {
				tutorialHandler.state++;
				tutorialHandler.updateState();
			}
			return success;
		}
		if(success) { return false; }
		if(tutorialStates[tutorialHandler.state].lastStep) { return true; }
		var $cell = $crop.parent();
		var x = parseInt($cell.attr("data-x"));
		var y = parseInt($cell.attr("data-y"));
		var properCoords = tutorialStates[tutorialHandler.state].requiredClick;
		if(x == properCoords[0] && y == properCoords[1]) {
			tutorialHandler.state++;
			tutorialHandler.updateState();
			return true;
		}
		return false;
	}
};