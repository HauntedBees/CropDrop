<?php
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
	header("Access-Control-Allow-Origin: *");
	header("Content-Type: application/json");
	if(!isset($_GET["function"])) { echo "{\"success\": false}"; exit; }
	final class Db {
		protected static $dbInstance;
		public static function factory(){
			if(!self::$dbInstance){
				$c = parse_ini_file("/whatever/your/path/to/your/config/is/config.ini", true);
				self::$dbInstance = new PDO("mysql:host=".$c["database"]["host"].";dbname=".$c["database"]["schema"], $c["database"]["username"], $c["database"]["password"]);
			}
			return self::$dbInstance;
		}
	}
	class WebServiceMethods {
		private $pdo;
		public function __construct() { $this->pdo = Db::factory(); }
		public function Fail($msg) { echo "{\"success\": false, \"message\": \"$msg\" }"; exit; }
		public function Test() { echo json_encode(["success" => true, "args" => func_get_args()]); }
		public function SaveUser() {
			if(!isset($_POST["userid"])) { $this->Fail("Invalid User ID"); }
			if(!isset($_POST["name"])) { $this->Fail("Invalid Name"); }
			if(!isset($_POST["picURL"])) { $this->Fail("Invalid Pic URL"); }
			$userId = $_POST["userid"];
			$userName = $_POST["name"];
			$picURL = $_POST["picURL"];
			if(!ctype_digit($userId)) { $this->Fail("Invalid User ID"); }
			if(strlen($userName) > 75) { $this->Fail("Invalid Name"); }
			if(strlen($picURL) > 255) { $this->Fail("Invalid Pic URL"); }
			if(strpos($picURL, "https://scontent.xx.fbcdn.net/v/") !== 0) { $this->Fail("Invalid Pic URL"); }
			$q = $this->pdo->prepare("SELECT COUNT(*) FROM cropUsers WHERE fbID = :i");
			$q->execute(array("i" => $userId));
			if(intval($q->fetchColumn()) == 0) {
				$q2 = $this->pdo->prepare("INSERT INTO cropUsers (fbID, name, picURL) VALUES (:i, :n, :p)");
				$q2->execute(array("i" => $userId, "n" => $userName, "p" => $picURL));
			} else {
				$q2 = $this->pdo->prepare("UPDATE cropUsers SET name = :n, picURL = :p WHERE fbID = :i");
				$q2->execute(array("i" => $userId, "n" => $userName, "p" => $picURL));
			}
			echo json_encode(["success" => true, "result" => "Saved that shite!"]);
		}
		public function SubmitScore() {
			if(!isset($_POST["userid"])) { $this->Fail("Invalid User ID"); }
			if(!isset($_POST["level"])) { $this->Fail("Invalid Level"); }
			if(!isset($_POST["score"])) { $this->Fail("Invalid Score"); }
			if(!isset($_POST["time"])) { $this->Fail("Invalid Time"); }
			$userId = $_POST["userid"];
			$level = $_POST["level"];
			$score = $_POST["score"];
			$time = $_POST["time"];
			if(!ctype_digit($userId)) { $this->Fail("Invalid User ID"); }
			if(!ctype_digit($level) || $level <= 0 || $level > 101) { $this->Fail("Invalid Level"); }
			if(!ctype_digit($score) || $score < 0) { $this->Fail("Invalid Score"); }
			if(!ctype_digit($time) || $time < 0) { $this->Fail("Invalid Time"); }
			
			$q = $this->pdo->prepare("SELECT COUNT(*) FROM cropScores WHERE fbID = :i AND level = :l");
			$q->execute(array("i" => $userId, "l" => $level));
			if(intval($q->fetchColumn()) == 0) {
				$q2 = $this->pdo->prepare("INSERT INTO cropScores (fbID, level, score, time) VALUES (:i, :l, :s, :t)");
				$q2->execute(array("i" => $userId, "l" => $level, "s" => $score, "t" => $time));
			} else {
				$q2 = $this->pdo->prepare("UPDATE cropScores SET score = :s, time = :t WHERE fbID = :i AND level = :l");
				$q2->execute(array("i" => $userId, "l" => $level, "s" => $score, "t" => $time));
			}
			echo json_encode(["success" => true, "result" => "Saved that shit!"]);
		}
		public function GetHighScoresOrTimes() {
			if(!isset($_GET["users"])) { $this->Fail("Invalid User List A"); }
			if(!isset($_GET["level"])) { $this->Fail("Invalid Level"); }
			if(!isset($_GET["type"])) { $this->Fail("Invalid Type"); }
			$level = $_GET["level"];
			$type = $_GET["type"];
			if(!ctype_digit($level) || $level <= 0 || $level > 101) { $this->Fail("Invalid Level"); }
			if($type != "score" && $type != "time") { $this->Fail("Invalid Type"); }
			
			$users = $_GET["users"];
			if($users === null || !is_array($users)) { $this->Fail("Invalid User List"); }
			$ulen = count($users);
			
			$params = array("l" => $level);
			$inQueryArray = array();
			for($i = 0; $i < $ulen; $i++) {
				$user = $users[$i];
				$params["u$i"] = $user;
				$inQueryArray[] = ":u$i";
			}
			$inQuery = implode(", ", $inQueryArray);
			$q = $this->pdo->prepare("SELECT u.fbID, u.name, u.picURL, s.$type FROM cropScores s INNER JOIN cropUsers u ON s.fbID = u.fbID WHERE s.level = :l AND (s.fbID IN ($inQuery) OR s.fbID LIKE 'T%') ORDER BY s.$type DESC LIMIT 0, 10");
			$q->execute($params);
			echo json_encode(["success" => true, "result" => $q->fetchAll(PDO::FETCH_ASSOC)]);
		}
	}
	$ws = new WebServiceMethods();
	$m = [$ws, $_GET["function"]];
	$callable_name = "";
	if(is_callable($m, false, $callable_name)) {
		$len = strlen("WebServiceMethods::");
		if(substr($callable_name, 0, $len) === "WebServiceMethods::") {
			if($_SERVER["REQUEST_METHOD"] === 'POST') {
				call_user_func($m);
			} else {
				$params = [];
				$pos = strpos($_SERVER["QUERY_STRING"], "&");
				if($pos !== false) { $params = explode("/", substr($_SERVER["QUERY_STRING"], $pos + 1)); }
				call_user_func_array($m, $params);
			}
			return;
		}
	}
	echo "{\"success\": false}";
?>