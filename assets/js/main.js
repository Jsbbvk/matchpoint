

function displayAnswerPrompts() {
    gamestate = CREATING;
    updateScoreboard();
    socket.emit('get player prompts', roomID, nameID, function(pr) {
        $('#prompt').html(pr[0]);
        $('#answer').val("");
        $('#submitAnswerButton').off().on('click tap', submitFirstAnswer);
        $('#create-answer').fadeIn(400);
    });
}

function submitFirstAnswer() {
    var ans1 = $('#answer').val();
    if (/^\s*$/.test(ans1))return;

    $('#submitAnswerButton').off();

    socket.emit('answered prompt', roomID, nameID, ans1);
    $('#create-answer').fadeOut(400, function() {
        $('#answer').val("");
        $('#submitAnswerButton').off().on('click tap', submitSecondAnswer);

        socket.emit('get player prompts', roomID, nameID, function(pr) {
            $('#prompt').html(pr[1]);
            $('#create-answer').fadeIn(400);
        });
    });
}

function submitSecondAnswer() {
    var ans1 = $('#answer').val();
    if (/^\s*$/.test(ans1))return;

    $('#submitAnswerButton').off();

    socket.emit('answered prompt', roomID, nameID, ans1);
    $('#create-answer').fadeOut(400, function() {
        $('#answer').val("");
        displayWaitingForAnswers();
    });
}


function displayWaitingForAnswers() {
    gamestate = WAITING;
    $('#waiting-answers').fadeIn(400);
    var tt = false;
    socket.emit('get num finished prompts', roomID, function(numReady, numTotal) {
        $('#waiting-text').text(numReady + " / " + numTotal);
        if (numReady / numTotal >= 0.75) $('#waiting-text').css('color', '#1fb50e');
        else if (numReady / numTotal > 0.5) $('#waiting-text').css('color', '#f4cd07');
        else $('#waiting-text').css('color', '#bc3838');

        if (!tt&&numReady==numTotal) {
            socket.removeAllListeners("player answered question");
            $('#waiting-t1').text("Ready");
            tt = true;
            $('#waiting-answers').fadeOut(400, function() {
                displayVoting(function() {
                    $('#voting').fadeIn(400);
                });
            });
        }
    });

    socket.on('player answered question', function(numReady, numTotal) {
        $('#waiting-text').text(numReady + " / " + numTotal);
        if (numReady / numTotal >= 0.75) $('#waiting-text').css('color', '#1fb50e');
        else if (numReady / numTotal > 0.5) $('#waiting-text').css('color', '#f4cd07');
        else $('#waiting-text').css('color', '#bc3838');

        if (!tt && numReady==numTotal) {
            socket.removeAllListeners("player answered question");
            $('#waiting-t1').text("Ready");
            tt = true;
            $('#waiting-answers').fadeOut(400, function() {
                displayVoting(function() {
                    $('#voting').fadeIn(400);
                });
            });
        }
    });
}

function displayVoting(cb) {
    gamestate = VOTING;
    $('#voting-section').css('display','block');
    socket.emit('get prompt info', roomID, function(p) {
        var pr = p.prompt;
        var pl = p.player;
        $('#voting-prompt').html(pr);

        var p1, p2;
        if (Math.random() > 0.5) {
            p1 = pl[0]; p2 = pl[1];
        } else {
            p1 = pl[1]; p2 = pl[0];
        }

        $('#vote-1').removeClass("selectedAnswer");
        $('#vote-2').removeClass("selectedAnswer");

        $('#vote-1').html("");
        $('#vote-1').removeClass("player-vote-div");
        $('#vote-1').attr("data-aid", p1.id);
        if (p1.id==nameID) {
            $('#vote-1').addClass("player-vote-div");

            var s1 = document.createElement("SPAN");
            s1.classList.add("player-span");
            s1.innerText = "Your Answer";
            $('#vote-1').append(s1);
            $('#vote-1').append(document.createElement("BR"));
        }
        var s2 = document.createElement("SPAN");
        s2.innerHTML = getAnswerFromPrompt(p1, pr);
        $('#vote-1').append(s2);

        $('#vote-2').html("");
        $('#vote-2').removeClass("player-vote-div");
        $('#vote-2').attr("data-aid", p2.id);
        if (p2.id==nameID) {
            $('#vote-2').addClass("player-vote-div");

            var s3 = document.createElement("SPAN");
            s3.classList.add("player-span");
            s3.innerText = "Your Answer";
            $('#vote-2').append(s3);
            $('#vote-2').append(document.createElement("BR"));
        }
        var s4 = document.createElement("SPAN");
        s4.innerHTML = getAnswerFromPrompt(p2, pr);
        $('#vote-2').append(s4);



        if (pl[0].id == nameID || pl[1].id == nameID) {
            selectedAID = -1;
            playerVotingReady();
        } else
            setupSelectableAnswers();

        cb&&cb();
    });
}

function getAnswerFromPrompt(p, a) {
    if (p.prompts[0]==a) return p.answers[0];
    else if (p.prompts[1]==a) return p.answers[1];
    else return null;
}

var selectedAID = -1;

function setupSelectableAnswers() {

    selectedAID = -1;
    $("#chooseAnswerButton").css("background-color", "white");
    $("#chooseAnswerButton").text("Select Answer");
    $('#vote-1').removeClass("selectedAnswer");
    $('#vote-2').removeClass("selectedAnswer");

    $("#vote-1, #vote-2").off().on("click tap", function(e) {
        e.preventDefault();
        if (!$(this).hasClass("selectedAnswer")) {

            $('#vote-1').removeClass("selectedAnswer");
            $('#vote-2').removeClass("selectedAnswer");


            $(this).addClass("selectedAnswer");
            selectedAID = $(this).attr("data-aid");

            $("#chooseAnswerButton").css("background-color", "#bdffbd");
            $("#chooseAnswerButton").text("Confirm");

        }
        else {
            $(this).removeClass("selectedAnswer");

            $("#chooseAnswerButton").css("background-color", "white");
            $("#chooseAnswerButton").text("Select Answer");

            selectedAID = -1;
        }
    });

    $('#chooseAnswerButton').off().on('click tap', function(e) {
        e.preventDefault();
        if (selectedAID==-1)return;
        playerVotingReady();
    });
}

function playerVotingReady() {
    $('#chooseAnswerButton').off();
    $("#vote-1, #vote-2").off();
    $("#chooseAnswerButton").css("background-color", "#40d15d");

    socket.on('player selected answer', function(numReady, numTotal) {
        $("#chooseAnswerButton").text(numReady + " / " + numTotal + " Ready");

        if (numReady==numTotal) {
            socket.removeAllListeners("player selected answer");
            $('#voting-section').fadeOut(400, function() {
                updateScoreboard();
                displayResults(function() {
                    $('#result-section').fadeIn(400);
                });
            });

        }
    });

    socket.emit('player selected answer', roomID, nameID, selectedAID);
}

function displayResults(cb) {
    gamestate = RESULTS;
    setupContinueButton();
    socket.emit('get room info', roomID, function(rm) {

        document.getElementById("result-list").innerHTML = "";
        var pl = rm.player;

        var playerChosenAnswers = [];
        for (var i = 0; i < pl.length+1; i++) {
            playerChosenAnswers[i] = [];
        }

        for (var i = 0; i < pl.length; i++) {
            if (pl[i].selectedID==-1) continue;
            playerChosenAnswers[pl[i].selectedID].push(pl[i]);
        }

        var dList = [];

        for (var i = 0; i < 2; i++) {
            var pr = rm.prompts[rm.currentPrompt];
            var prPlayer = rm.prompts[rm.currentPrompt].player[i];
            var plChosenPlayers = playerChosenAnswers[prPlayer.id];

            var d = document.createElement("DIV");
            d.classList.add("result-choice");
            if (prPlayer.id==nameID) d.classList.add("result-pl");

            /* Start title */
            var title = document.createElement("P");
            title.classList.add("result-choice-title");

            var n = document.createElement("SPAN");
            n.classList.add("result-choice-name");
            n.innerText = prPlayer.name;
            if (prPlayer.id==nameID) n.innerText = prPlayer.name + " (You)";

            var np = document.createElement("SPAN");
            np.classList.add("result-choice-point");

            var p1L = (playerChosenAnswers[rm.prompts[rm.currentPrompt].player[0].id]==null)?
                0:playerChosenAnswers[rm.prompts[rm.currentPrompt].player[0].id].length;
            var p2L = (playerChosenAnswers[rm.prompts[rm.currentPrompt].player[1].id]==null)?
                0:playerChosenAnswers[rm.prompts[rm.currentPrompt].player[1].id].length;

            if (i==0) {
                if (p1L > p2L) np.innerText = "+2";
                else if (p1L == p2L) np.innerText = "+1";
                else np.innerText = "";
            } else {
                if (p2L > p1L) np.innerText = "+2";
                else if (p1L == p2L) np.innerText = "+1";
                else np.innerText = "";
            }

            title.appendChild(n); title.appendChild(np);
            d.appendChild(title); d.appendChild(document.createElement("HR"));
            /* End title */

            /* Start Answer */
            var ans = document.createElement("P");
            ans.classList.add("result-choice-text");
            ans.innerText = getAnswerFromPrompt(prPlayer, pr.prompt);
            d.appendChild(ans); d.appendChild(document.createElement("HR"));
            /* End Answer */

            /* Start Players */
            var sl = document.createElement("DIV");
            sl.classList.add("result-choice-players");

            for (var j = 0; j < plChosenPlayers.length; j++) {
                var slT = document.createElement("P");
                slT.classList.add("result-choice-player-title");
                if (plChosenPlayers[j].id == nameID)
                    slT.classList.add("result-pl");

                var sltN = document.createElement("SPAN");
                sltN.classList.add("result-choice-name");
                sltN.innerText = plChosenPlayers[j].name;
                if (plChosenPlayers[j].id==nameID)
                    sltN.innerText = plChosenPlayers[j].name + " (You)";


                var sltP = document.createElement("SPAN");
                sltP.classList.add("result-choice-point");
                sltP.innerText = "";

                slT.appendChild(sltN); slT.appendChild(sltP);
                sl.appendChild(slT);
            }
            d.appendChild(sl);
            /* End Players */

            dList.push(d);
        }

        for (var dp of dList) {
            document.getElementById("result-list").appendChild(dp);
        }
        cb&&cb();
    });
}

function setupContinueButton() {
    $("#continueButton").text("Continue");
    $('#continueButton').css("background-color","#bdffbd");

    $('#continueButton').off().on('click tap', function(e) {
        e.preventDefault();

        socket.on('player continue', function(numReady, numTotal, endRound) {
            $("#continueButton").text(numReady + " / " + numTotal + " Ready");
            $("#continueButton").css("background-color", "#40d15d");

            if (endRound) {
                socket.removeAllListeners("player continue");
                $('#voting').fadeOut(400, function() {
                    $('#result-section').css('display','none');
                    $('#voting-section').css('display','block');

                    displayAnswerPrompts();
                });
            } else if (numReady==numTotal) {
                socket.removeAllListeners("player continue");

                $('#voting').fadeOut(400, function() {
                    $('#result-section').css('display','none');
                    $('#voting-section').css('display','block');

                    displayVoting(function() {
                        $('#voting').fadeIn(400);
                    });
                });
            }
        });

        socket.emit('player continue', roomID, nameID);
    });
}