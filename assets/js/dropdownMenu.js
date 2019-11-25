


var menuActive = false;
$('#toggleMenuButton').on('click', function(e) {
    e.preventDefault();
    menuActive = !menuActive;
    if (menuActive) {
        $("#menu").removeClass('mSlideUp');
        $("#menu").addClass('mSlideDown');
        document.getElementById('toggleMenuButton').innerHTML = '<i class="fas fa-caret-up"></i>';
        $(this).css('top', '-14%');
    } else {
        $("#menu").removeClass('mSlideDown');
        $("#menu").addClass('mSlideUp');
        document.getElementById('toggleMenuButton').innerHTML = '<i class="fas fa-caret-down"></i>';
        $(this).css('top', '100%');
    }
});

function updateScoreboard() {
    socket.emit('get players', roomID, function(pl){
        var s = "";
        for (var p of pl) {
            s += "<div class=\"row\">" +
                "<div class=\"col-6\"><h5>"+p.name+ ((p.id==nameID)?" (You)":"")+
                "</h5></div>" +
                "<div class=\"col-6\" id='sb-"+p.id+"'><h5>"+p.points+"</h5></div>" +
                "</div>";
        }
        document.getElementById('scoreboard').innerHTML = s;
    });
}