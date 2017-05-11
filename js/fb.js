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
var fbFuncs = {
	authDetails: {}, 
	connected: false, 
	saveScore: function(level, score, time) {
		if(fbFuncs.authDetails.userID === undefined || !fbFuncs.connected) { return; }
		if(level == 0) {
			return;
		} else if(level == "E") {
			level = 100;
		} else if(level == "Q") {
			level = 101;
		}
		$.ajax({
			type: "POST", dataType: "JSON",
			url: "cropFBws.php?function=SubmitScore",
			data: { 
				"userid": fbFuncs.authDetails.userID,
				"level": level, 
				"score": score, 
				"time": time
			}, 
			success: function(data) {
				console.log(data);
			}
		});
	},
	fbCheck: function() {
		facebookConnectPlugin.getLoginStatus(
			function(res) {
				if(res.status == "connected") {
					$("#fbConnect").text("Disconnect from Facebook").attr("connected", "true");
					fbFuncs.authDetails = res.authResponse;
					fbFuncs.getBasicUserDetails();
				} else if(res.status == "unknown" && settings.wasUsingFB) {
					fbFuncs.clearBasicUserDetails();
					fbFuncs.connectClick();
				} else {
					fbFuncs.clearBasicUserDetails();
				}
			}, fbFuncs.clearBasicUserDetails);
	},
	getFriendScores: function (level, type) {
		if(level == 0) {
			return;
		} else if(level == "E") {
			level = 100;
		} else if(level == "Q") {
			level = 101;
		}
		facebookConnectPlugin.api(fbFuncs.authDetails.userID + "/friends?limit=1000", ["user_friends"], 
			function(res) {
				var users = [fbFuncs.authDetails.userID];
				for(var i = 0; i < res.data.length; i++) {
					users.push(res.data[i].id);
				}
				$.ajax({
					type: "GET", dataType: "JSON",
					url: "cropFBws.php?function=GetHighScoresOrTimes",
					data: { 
						"users": users,
						"level": level, 
						"type": type
					}, 
					success: function(data) {
						var $elem = (type == "score" ? $("#fbScoresInner") : $("#fbTimesInner"));
						if(!data.success) {
							$elem.text("Error Loading Friend Data");
							return;
						}
						if(data.result.length == 0) {
							$elem.text("No friends have completed this " + (level >= 100 ? "mode" : "level") + ". Tell someone to give it a try!");
							return;
						}
						var template = "<tr{4}><td class='num'>{3}.</td><td class='img'><img src='{0}'/></td><td class='name'>{1}</td><td class='val'>{2}</td></tr>";
						var html = "<table>";
						for(var i = 0; i < data.result.length; i++) {
							var res = data.result[i];
							var scoreVal = (type == "time" ? GetTimeAsString(res.time) : res.score);
							html += template.replace(/\{0\}/g, res.picURL).replace(/\{1\}/g, res.name).replace(/\{2\}/g, scoreVal).replace(/\{3\}/g, (i + 1))
											.replace(/\{4\}/g, (res.fbID == fbFuncs.authDetails.userID ? " class='that-me'" : ""));
						}
						html += "</table>"
						$elem.html(html);
					},
					error: function() {
						var $elem = (type == "score" ? $("#fbScoresInner") : $("#fbTimesInner"));
						$elem.text("Error Loading Friend Data");
					}
				});
			},
			function(res) { 
				menuNav.showError("Could not load Facebook friend data.");
			});
	},
	connectClick: function(fromScores) {
		if(typeof(facebookConnectPlugin) === "undefined") {
			menuNav.showError("The Facebook Plugin can't be found. If you're not the guy who made this game and you're seeing this, that's bad.");
			return;
		}
		if($("#fbConnect").attr("connected") == "true") {
			facebookConnectPlugin.logout(fbFuncs.clearBasicUserDetails, fbFuncs.clearBasicUserDetails);
			settings.wasUsingFB = false;
			SaveGame();
			return;
		}
		facebookConnectPlugin.login(["public_profile", "user_friends"], 
			function(res) {
				if(res.status == "connected") {
					$("#fbConnect").text("Disconnect from Facebook").attr("connected", "true");
					fbFuncs.authDetails = res.authResponse;
					fbFuncs.getBasicUserDetails();
					settings.wasUsingFB = true;
					if(fromScores) { scoreDisplay.switchState(-1); }
					SaveGame();
				} else {
					menuNav.showError("Could not log in to Facebook.");
					fbFuncs.clearBasicUserDetails();
				}
			}, function() { fbFuncs.clearBasicUserDetails("Could not connect to Facebook. Make sure you have an internet connection.") });
	},
	clearBasicUserDetails: function(error) {
		if(error !== undefined && typeof(error) === "string" && error != "OK") { menuNav.showError(error); }
		$("#fbConnect").text("Connect to Facebook").attr("connected", "false");
		fbFuncs.authDetails = {};
		fbFuncs.connected = false;
		$("#fbUserInfo").html("");
	}, 
	getBasicUserDetails: function() {
		facebookConnectPlugin.api(fbFuncs.authDetails.userID + "/?fields=first_name,picture.width(200).height(200)", ["public_profile"], 
			function(res) {
				$("#fbUserInfo").html("<img src='" + res.picture.data.url + "'/> " + res.first_name);
				fbFuncs.connected = true;
				$.ajax({
					type: "POST", dataType: "JSON",
					url: "cropFBws.php?function=SaveUser",
					data: { 
						"userid": fbFuncs.authDetails.userID,
						"name": res.first_name, 
						"picURL": res.picture.data.url
					}, 
					success: function(data) { }
				});
			},
			function(res) { fbFuncs.clearBasicUserDetails("An error occurred trying to connect with Facebook. Please try again later."); });
	}
};