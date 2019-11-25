


var questionFile = require('../js/questions.json');
var questionList = questionFile.questions;

var queuedQuestions = [];

function resetQueuedQuestions() {
    for (var i = 0; i < questionList.length; i++) {
        queuedQuestions[i] = i;
    }
    shuffle(queuedQuestions);
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

resetQueuedQuestions();


module.exports = {
    getRandomPrompt: function() {
        var qqq = queuedQuestions.pop();
        var qObj = questionList[qqq];

        if (queuedQuestions.length==0) resetQueuedQuestions();

        var qText = qObj.prompt;

        qText = qText.replace("<BLANK>","_____");

        return qText;
    }
};