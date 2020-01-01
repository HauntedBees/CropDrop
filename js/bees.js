/*Copyright 2017 Sean Finch

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
var beeGarden = {
    start: function() {
        sounds.playSound("tap");
        clearInterval(wateringGame.modeTimerIdx);
		clearInterval(wateringGame.timerIdx);
		$("#pointer").hide();
		$(".forbidden").removeClass("forbidden");
		$(".overlayTap").hide();
		$(".infoBar.main > span").text("0");
		$(".comboParticle,.poof,.bee,.scoreParticle,.timeParticle").remove();
		$(".overlayButtons, .overlayAltText,.overlayTap, #overlayText, #overlayButtonsNav,#mainGame,#menuBtn,.gameOverTap,.infoBar,#mainCropInfo,#pause").hide();
		$(".fullCoverText").removeClass("large medium shmedium small").addClass("medium");
		$("#cropGame,#gardenCropInfo,#leave,#beeFacts").show();
        $("#pollenCount").text("Pollen Gathered: " + settings.pollen);
        $("#shipText").text("Your Garden");
        $("#shipItems").html("<span class='gardenInfo'>Welcome to your garden. Bees bring the pollen they gather here to help crops grow. When a crop is ready to harvest, tap it to receive a message from the bees.</span>");
        wateringGame.board = settings.garden;
        wateringGame.width = 6;
        wateringGame.height = 8;
        var lastVisit = (new Date() - new Date(settings.lastGardenVisit)) / 60000; // in minutes
        beeGarden.growVeggies(lastVisit);
        var maxCropsToGenerate = (settings.pollen / 20) - settings.cropsGrown;
        if(maxCropsToGenerate > 0) {
            while(lastVisit > 5 && maxCropsToGenerate > 0) {
                lastVisit -= 5;
                if(Math.random() > 0.65) {
                    maxCropsToGenerate -= 1;
                    beeGarden.addVeggie();
                }
            }
        }
        settings.lastGardenVisit = new Date();
        settings.garden = wateringGame.board;
        SaveGame();
        wateringGame.drawBoard();
        var $crops = $(".cropRow > .sprite > .sprite");
        var numBees = $crops.length;
        if(numBees > 20) {
            numBees = 10 + Math.floor(Math.random() * 10);
        } else {
            numBees = Math.floor(Math.random() * numBees / 1.5);
        }
        while(numBees-- > 0) {
            var $chosen = $crops.eq(Math.floor(Math.random() * $crops.length)).parent();
            if($(".bee", $chosen).length) { continue; }
            $chosen.append("<div class='sprite small bee anim'></div>");
        }
        menuNav.switchIntoGame();
        $(document).off("click", ".crop");
		$(document).on("click", ".crop", function() {
			var $parent = $(this).parent();
			var x = parseInt($parent.attr("data-x"));
			var y = parseInt($parent.attr("data-y"));
			var tile = wateringGame.board[y][x];
			if(tile.stage != tile.finalStage) { return; }
            beeGarden.showMessage();
            wateringGame.board[y][x] = 0;
            settings.garden[y][x] = 0;
            wateringGame.drawBoard();
            SaveGame();
		});
    },
    growVeggies: function(timeElapsed) {
        for(var y = 0; y < 8; y++) {
            for(var x = 0; x < 6; x++) {
                var crop = wateringGame.board[y][x];
                if(crop == 0 || crop.stage == crop.finalStage) { continue; }
                crop.age += timeElapsed;
                while(crop.age >= crop.timeToGrow && crop.stage < crop.finalStage) {
                    crop.age -= crop.timeToGrow;
                    crop.stage += 1;
                }
            }
        }
    },
    addVeggie: function() {
        var attemptsBeforeGivingUp = 10;
        while(attemptsBeforeGivingUp > 0) {
            attemptsBeforeGivingUp--;
            var x = Math.floor(Math.random() * 6);
            var y = Math.floor(Math.random() * 8);
            if(wateringGame.board[y][x] != 0) { continue; }
            settings.cropsGrown++;
            var type = ["carrot", "corn", "cucumber", "strawberry", "tomato", "pumpkin"][Math.floor(Math.random() * 6)];
            wateringGame.board[y][x] = {
                type: type, 
                stage: 0,
                finalStage: wateringGame.getFinalStage(type),
                age: 0,
                timeToGrow: beeGarden.getTimeToGrow(type)
            };
            return;
        }
    },
    getTimeToGrow: function(type) {
        switch(type) {
            case "carrot":
            case "strawberry": return 60;
            case "corn": return 180;
            case "cucumber":return 120;
            case "tomato": return 240;
            case "pumpkin": return 360;
        }
    },
    showMessage: function(i) {
        sounds.playSound("bweep");
        $(".fullCoverText").addClass("medium");
        $("#overlayButtonsF,.overlayTap,#overlayText").show();
        var msg = beeGarden.messages[i || Math.floor(Math.random() * beeGarden.messages.length)];
        var resHTML = msg[0] + " the Bee says...<br class='gap'><span class='message'>" + msg[1] + "</span>"; 
        if(msg[2] !== undefined) { resHTML += "<span class='msgsource'><a href='" + msg[2] + "'>Source</a></span>"; }
        $("#overlayText").html(resHTML);
    },
    messages: [
        ["Barry", "You like jazz?"],
        ["Sasha", "Q: Who is a bee's favorite singer?<br><br>A: BEE-yonce!"],
        ["Beth", "Beekeeping has been practiced for over 15,000 years!", " https://en.wikipedia.org/wiki/Bee"],
        ["Monica", "Honey bees perform 80% of all flower pollination in the world!", "https://www.greenpeace.org/usa/sustainable-agriculture/save-the-bees/"],
        ["Phoebe", "Honey bees can fly at 24.1 kilometers per hour (or 15 miles per hour)! For comparison, the average human's sprinting speed is 25.6kph (15.9mph).", "http://www.utahcountybeekeepers.org/fun_facts.html"],
        ["Rachel", "Q: Why are bees so self-confident?<br><br>A: Because they BEE-lieve in themselves!"],
        ["Janice", "Honey never spoils, and is the only food that contains all the necessary substances to sustain life!", "http://www.utahcountybeekeepers.org/fun_facts.html"],
        ["Emily", "Two children are playing on the beach and a bee flies by and lands on their sand castle. One lifts up his shovel to smack the bee, but the other stops him and says \"You can't! The bees are too powerful. Harm even one of them and you will doom us all!\" The boy lowers his shovel and says \"Yes you are correct, I was a fool.\" Both children say in unison \"Bees are an important part of our ecosystem.\""],
        ["Carol", "When you see a bee, the best thing to do is to inform her of her identity by spelling 'URAB' out loud."],
        ["Susan", "Q: Why don't bees gossip?<br><br>A: Because they mind their own BEEsness! Ha ha, remember that next time you want to tell all the girls at the book club about my husband's affair CAROL."],
        ["Mabel", "Bees are pretty good students - their report cards are always all B's!"],
        ["Wendy", "The only bees that die when stinging are honey bees; the rest are good-to-go after stinging!", "http://www.utahcountybeekeepers.org/fun_facts.html"],
        ["Julia", "It was William Shakespeare who once wrote \"to bee, or not to bee. THAT is the question!\" The answer to said question, is, of course, to bee."],
        ["Cecilia", "The English alphabet is arranged the way it is so that the first thing anyone learns about it is 'a bee!'"],
        ["Brigid", "Bees are the only insects that create food that humans can eat. So maybe don't try eating anything that bugs like dung beetles make!", "https://www.ontariohoney.ca/kids-zone/bee-facts"],
        ["Hana", "hello i am a bee :)"],
        ["Rosanna", "Remember to bee yourself! After all, there's no one else like you, so there's nobody to replace you if you're pretending to bee someone else!!"],
        ["Franciska", "Honey bees make a lot of excess honey; up to 45.4kg (100lb)! Beekeepers only harvest this extra honey, so the bees still have more than enough for themselves.", "https://www.ontariohoney.ca/kids-zone/bee-facts"],
        ["Shanaia", "You can basically put honey on just about anything you want. It is gooey and delicious."],
        ["Sierra", "This guy Chad won't stop texting me even though I stopped responding to him like a week ago. It's really BUGGING me!"],
        ["Angela", "Bees are the masters of interpretive dance - they communicate with very elaborate dances which can be used to direct other bees to where flower patches and water sources are!", "https://en.wikipedia.org/wiki/Waggle_dance"],
        ["Aiden", "Save the bees!"],
        ["Preeti", "Q: What is a bee's favorite type of sandwich?<br><br>A: Peanut Butter and Royal Jelly!"],
        ["Tabitha", "Football is a sport."],
        ["Hyacinth", "Eat your beets!"],
        ["Rose", "The average beehive will fly up to 144,841 kilometers (90,000 miles) - enough to orbit the Earth three times - to collect one kilogram of honey. And I WOULD FLY 90,000 MORE, JUST TO BE THE BEE WHO'D FLY 180,000 MILES TO FALL DOWN AT YOUR DOOR. DA DAT-DA!", "https://www.benefits-of-honey.com/honey-bee-facts.html"],
        ["Daisy", "Q: What's brown and sticky?<br><br>A: The rare and mysterious Poo Bee."],
        ["Peach", "I know honey is nice, but remember: lots of bees don't produce honey, and all bees are very important to our environment! The fight to save the bees is a fight for EVERYONE!"],
        ["Ginger", "You can grow some wildflowers in your balcony or yard to help bees out!", "https://www.buzzaboutbees.net/save-the-bees.html"],
        ["Autumn", "It's possible that one of the toxins in bee venom may help prevent HIV.", "https://mentalfloss.com/article/53691/13-fascinating-facts-about-bees"],
        ["Peggy", "Don't use pesticides that can hurt bees! We do so much for you humans, do your part to help US now!"],
        ["Aly", "Humans see color in red, green, and blue, but bees see in blue, green, and ultraviolet!", "https://www.buzzaboutbees.net/bee-facts.html"],
        ["Chloe", "The land of 'Milk and Honey' is actually a few kilometers away a shopping mall parking lot in Minnesota."],
        ["Selena", "Bees have solved the 'travelling salesman problem' - the problem of finding the shortest route between several points. That's something even humans can't do easily!", "https://mentalfloss.com/article/53691/13-fascinating-facts-about-bees"],
        ["Jaclyn", "Honey bee swarms look pretty intimidating, but usually bees in swarms aren't very aggressive at all. If you see one, call a beekeeper to relocate it!", "https://en.wikipedia.org/wiki/Swarming_(honey_bee)"],
        ["Hanna", "Although honey bees are very social, many types of bees are very solitary and roam the world on their own.", "https://en.wikipedia.org/wiki/Bee"],
        ["Denise", "Help the Bee Mafia has kidnapped my husband and if I don't keep making bee jokes for this game they'll--WHAT DO BEES WAX THEIR CARS WITH? BEESWAX! HA HA HA HA!"],
        ["Nahla", "Bumblebees are cute!"],
        ["Tanisha", "Someone once said that according to all known laws of aviation, there is no way that a bee should be able to fly. They were wrong. Bees are pretty magical, but how we fly is perfectly scientifically sound!"],
        ["Yetunde", "Bee-flies are flies, not bees, but they mimic the looks and behavior of bees to trick other animals into thinking they can sting! Although bee-flies can't sting like bees can, they are still important pollinators!", "https://en.wikipedia.org/wiki/Bombyliidae"],
        ["Bushra", "Bee orchid flowers resemble bees perched on a pink flower, which lures male bees to try to mate with them! Please do not try to mate with flowers.", "https://en.wikipedia.org/wiki/Ophrys_apifera"],
        ["Farah", "There is a group of birds known as Bee-eaters and, as their name implies, us bees are not fans of them.", "https://en.wikipedia.org/wiki/Bee-eater"],
        ["Jana", "'Squash Bees' are a type of bee that pollinate squashes and gourds. It is NOT an instruction! DO NOT SQUASH BEES!", "https://en.wikipedia.org/wiki/Squash_bee"],
        ["Laila", "The Hindu god of human love, Kamadeva, wields a bow made of sugarcane, with a string of honeybees!", "https://en.wikipedia.org/wiki/Kamadeva"],
        ["Joan", "Aristaeus is the Greek god of bees! Apollo is his dad!", "https://en.wikipedia.org/wiki/Aristaeus"],
        ["Alice", "Bhramari, the Hindu goddess of bees, holds a mace, trident, sword, and shield in her four hands. Bees, hornets and wasps cling to her body. Clearly you don't want to get on her bad side.", "https://en.wikipedia.org/wiki/Bhramari"],
        ["Ana", "Colel Cab and Ah-Muzen-Cab are the Mayan goddess and god of bees.", "https://en.wikipedia.org/wiki/List_of_Maya_gods_and_supernatural_beings"],
        ["Milo", "If your name is Melissa, then your name comes from the Greek word for 'honey bee!' If your name isn't Melissa, you should either marry someone named Melissa or have a child named Melissa! It'll make the bees happy!", "https://en.wikipedia.org/wiki/Melissa"],
        ["Mai", "In Egyptian mythology, it was said that bees grew from the tears of Ra, the sun god, when they landed on sand. So, hey, if the other strategies to save the bees aren't panning out, maybe try making some dieties cry in the desert or something.", "https://en.wikipedia.org/wiki/Bee_(mythology)"],
        ["Mona", "The San people of the Kalahari Desert in Southern Africa tell the story of a bee who planted a seed in a mantis's body. That seed grew to become the first human. So, you're welcome.", "https://en.wikipedia.org/wiki/Bee_(mythology)"],
        ["Nadia", "The theft of honeybees is referred to as bee rustling. Stealing bees doesn't make you a cowboy, though. It makes you a jerk!", "https://en.wikipedia.org/wiki/Bee_rustling"],
        ["Nehal", "Q: What do bees style their hair with?<br><br>A: Honeycombs!"],
        ["Rita", "If you ever call your significant other 'honey' you owe us like five bucks because of intellectual property laws and stuff."],
        ["Saadia", "You're great. Keep up the good work! We're all rooting for you!"],
        ["Samar", "Q: What is a bee's favorite kind of music?<br><br>A: Disco! There's no joke here; us bees just really love disco.", "https://www.hauntedbees.com/beemusicfacts.html"],
        ["Wafaa", "Don't forget to get enough sleep tonight!"],
        ["Vilma", "Q: What do you call a bee hip-hop group?<br><br>A: The BEE-stie Boys!"],
        ["Inday", "When was the last time you ate? Make sure you're eating enough to stay healthy!"],
        ["Azhar", "What do you and bees have in common? We're both cute and important! Never forget that!"],
        ["Bita", "A bee flies into a bar and orders some mead. The bartender says \"We don't serve bees here!\" The bee replied \"Ouch. That really stings.\""],
        ["Daria", "If you see a bee the ground not moving around too much near sunset, maybe give her some sugar water to give her the boost she needs to get back home before the sun goes down!"],
        ["Nika", "Do you know my favorite song? It goes kind of like this: bzzzzzzzzz bzzzz bzbz bzzzzz bzzzzzz bzz bzzzzzzz. No? Oh well. Hope I didn't get it stuck in your head!"],
        ["Mahtab", "Q: Why did the bee cross the road?<br><br>To get to a flower or something, probably. That's what bees usually do."],
        ["Shai", "Be sure to thank your local beekeepers!"],
        ["Kira", "Q: What is a bee's favorite hairstyle?<br><br>A: PIGtails. No? How about a BOOfaunt? That's all I got."],
        ["Zohreh", "Q: Why are bees so healthy?<br><br>A: They have lots of Vitamin Bee!"],
        ["Deborah", "Global climate change caused and influenced by humans doesn't just endanger bees, but all living things on Earth! Yes, including you humans. Support efforts to help counter the damage we've already done and to prevent additional damage!"],
        ["Hana", "Remember, bees only sting when they feel threatened! Easy way to not get stung? Don't threaten us! You humans use guns when you feel threatened, so give us a break with your bee fears! Humans don't even make honey!"],
        ["Sinta", "Q: What flies around and says 'buyy buyy'?<br><br>A: A bee that didn't have access to the full alphabet. Or a capitalist bee. I dunno. I'm pretty tired right now, friend. I think I might take a CAT-nap!"],
        ["Rina", "Nectar is delicious. You should try some sometime!"],
        ["Mingxia", "Carpenter bees pollinate some plants that honey bees don't! See? The more bees the merrier!", "https://pestworldforkids.org/pest-guide/bees/#Carpenter-Bees"],
        ["Xiaoling", "Killer bee stings aren't any more dangerous than the stings of regular honey bees, but killer bees usually attack in greater numbers, so there are a lot MORE stings!", "https://pestworldforkids.org/pest-guide/bees/#Killer-Bees"],
        ["Guiying", "Q: Where do bees go to have bonfires?<br><br>A: The beech!"],
        ["Miyuki", "Bees contribute 651 million pounds to the British economy. That's more than the Royal Family brings in! Maybe the Queen should be a Queen Bee!", "https://www.telegraph.co.uk/news/earth/wildlife/11679210/Bees-contribute-more-to-British-economy-than-Royal-Family.html"],
        ["Megumi", "You can grow some chives on your windowsill for bees to pollinate. Not only are you helping bees, but you also get chives! Win/win!", "https://www.cnn.com/2017/03/20/world/bees-eco-solutions/"],
        ["Zivar", "Q: What's a bee's favorite part of school?<br><br>A: The Spelling Bee! But actually bees aren't capable of spelling as they do not have a written language. Just so you know. Didn't want to mislead you there. It's just joke."],
        ["Mina", "Of the 100 crops that provide 90% of the world's food, over 70 are pollinated by bees! Including COCOA, STRAWBERRIES and VANILLA. If we lose bees, we lose Neapolitan ice cream, and so much more!", "https://www.un.org/apps/news/story.asp?NewsID=37731#.WQbOnty1uHt"],
        ["Sherine", "I bet you were expecting a bee fact or joke, but nope! It's just me. No facts or jokes here! Sorry!"],
        ["Yumi", "Beep beep! Boop!"],
        ["Eun-young", "It is not recommended to eat bees."],
        ["Ji-yeon", "You can tell babies anything and they'll believe you. So every time you see a baby, tell them how great bees are, and how important it is to save them! Also tell them that supporting bees will make them popular and attractive!"],
        ["Hyun-a", "Q: What's a bee's favorite sport?<br><br>A: Bee-MX racing!"],
        ["Spodra", "Most bees are black and yellow! What, you already knew that? Well I'M SORRY THAT NOT EVERY BEE FACT IS SUPER INFORMATIVE AND UNCOMMON KNOWLEDGE. How about this, then? The genus of black dwarf honey bees is <i>Apis andreniformis</i>. Bet you didn't know THAT, did you smarty pants??!", "https://en.wikipedia.org/wiki/Apis_andreniformis"],
        ["Velma", "Bees have really long tongues for licking up nectar. If human tongues were as long as bee tongues are, proportional to their heads, it'd probably be really hard to talk!", "http://www.sciencekids.co.nz/sciencefacts/animals/beeandwasp.html"],
        ["Camellia", "Male bees, or drones, only have one job: to mate with the queen. Likewise, the queen bee's job is to just lay eggs all the time. Exciting lives.", "http://www.sciencekids.co.nz/sciencefacts/animals/beeandwasp.html"],
        ["Zita", "Bees live on every continent except Antarctica! Which makes sense if you know literally anything about Antarctica.", "https://kids.sandiegozoo.org/animals/insects/bee"],
        ["Tatiana", "Colony Collapse Disorder is a huge threat to bees, and, consequentially, the entire world! Support organizations dedicated to bee research and recovery!", "https://en.wikipedia.org/wiki/Colony_collapse_disorder"],
        ["Sonia", "Q: What is a bee's favorite hydrocarbon?<br><br>A: BEE-nz[<i>a</i>]anthracene!"],
        ["Mairead", "A wise woman once said \"those who are good to bees will go far in life.\" This is totally a real quote and not something I just made up! Some famous philosopher said it! Seriously!"],
        ["Olga", "I'm too tired from all of my Bee Duties to come up with any jokes or puns. Uhh... \"beef\" starts with \"bee,\" that's funny, right? Come on, work with me here! I've been a real BUSY BEE!"],
        ["Lamia", "If you put a bee in your shirt pocket with some candy, she'll probably be confused but also pretty okay with it because candy is sugary and sugar is tasty!"],
        ["Sitara", "Q: What's the best thing about bees?<br><br>A: Trick question! Bees are perfect in every way!"],
        ["Anneliese", "Q: What do you call a hippie bee?<br><br>A: A BEEtnik!"],
        ["Bee", "My name is Bee and I am a bee. Think I got made fun of a lot in school? Well, you're wrong! Bees do not have a concept of 'school' because we are bees."],
        ["Marianne", "Fruits and vegetables are great! Some are crunchy, some are sweet, and best of all, you can eat! Them! You can eat them! That was a little bit of Bee Poetry for ya. Hope you liked it!"],
        ["Yasmin", "Q: What is a bee's favorite vegetable?<br><br>A: BEEts! But actually, though, bees pollinate lots of different crops, and some specialize in just one specific type! Pretty cool, huh?"],
        ["Shoshana", "Bees are such good dancers because we can move to the BEEt! Like the 'beat,' but with 'BEE' in it. Not like beets the vegetable. It's a complicated joke, I know."],
        ["Noya", "Q: You know what's a really funny bee joke?<br><br>A: Just take some word that starts with 'b' or 'be' and just replace it with 'BEE.' Comedy gold."],
        ["Hila", "IT'S HIP TO HUG BEES!"],
        ["craig", "Approximately 5,380 honey bees fit into a burrito.", "https://twitter.com/relativebot/status/835607014768267264"]
    ]
};