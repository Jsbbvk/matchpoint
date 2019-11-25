


const CREATING = 0;
const WAITING = 1;
const VOTING = 2;
const RESULTS = 3;

var gamestate = -1;

var isLeaving = false;


window.onpagehide = function() {
    if (!isLeaving) socket.emit('delete player', roomID, nameID);
};


socket.on('get room id', function(cb){
    cb&&cb(roomID);
});


function leave(e) {
    e.preventDefault();
    socket.emit('delete player', roomID, nameID, function() {
        isLeaving = true;
        location.reload();
    });
}

function endGame(e) {
    e.preventDefault();
    socket.emit('end game', roomID);
}


$("#end-game-button").unbind().on("click tap", endGame);
$("#leave-game-button").unbind().on('click tap', leave);

socket.on('game ended', function() {
    backToWaitingRoom(function() {
        displayPrevScore = true;
        displayWaitingRoom();
    });
});

socket.on('display current view', function(gamestart, gs) {
    if (!gamestart) {
        //go to main menu
        backToWaitingRoom(function() {
            displayPrevScore=true;
            displayWaitingRoom();
        });
    } else {

        $('#playing').fadeOut(400, function() {
            $('#create-answer, #waiting-answers, #voting, #voting-section, #result-section').css('display','none');

            $("#menu").removeClass('mSlideDown');
            $("#menu").removeClass('mSlideUp');
            document.getElementById('toggleMenuButton').innerHTML = '<i class="fas fa-caret-down"></i>';
            $('#toggleMenuButton').css('top', '100%');
            menuActive = false;

            updateScoreboard();

            socket.removeAllListeners("player answered question");
            socket.removeAllListeners("player continue");
            socket.removeAllListeners("player selected answer");

            if (gs == CREATING) {
                if (gamestate != CREATING && gamestate != WAITING) {
                    displayAnswerPrompts();
                    $('#playing').fadeIn(400);
                } else if (gamestate == WAITING) {
                    displayWaitingForAnswers();
                    $('#playing').fadeIn(400);
                }
            } else if (gs==VOTING) {
                displayVoting(function() {
                    $('#voting').css('display','block');
                    $('#voting-section').css('display','block');
                    $('#playing').fadeIn(400);
                });
            } else if (gs==RESULTS) {
                displayResults(function() {
                    $('#voting').css('display','block');
                    $('#result-section').css('display','block');
                    $('#playing').fadeIn(400);
                });
            }
            gamestate = gs;
        });
    }
});


var resetting = false;
socket.on('player leave', function(gamestart, id) {
    if (gamestart && !resetting) {
        //playing
        if (nameID > id) nameID--;
        resetting = true;


        backToWaitingRoom(function() {
            $('#playerLeaveNotification').fadeIn(1500, function() {
                socket.emit('end game', roomID);
            }).fadeOut(400, function() {
                resetting = false;
                displayPrevScore=true;

                $('#create-answer, #waiting-answers, #voting, #result-section').css('display','none');
                $('#voting-section').css('display','block');
                displayWaitingRoom();
            });
        });


    } else {
        //waiting
        if (id==nameID) {
            isLeaving = true;
            location.reload();
        } else {
            if (nameID > id) nameID--;

            socket.emit("get players", roomID, function(p){
                displayPlayersInWaiting(p);
            });

        }
    }
});

