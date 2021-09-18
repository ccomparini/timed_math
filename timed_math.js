function timedMath(conf) {
    /*
       Features we want:
         - something nice for display of progress
         - make the timer work. something nice when it ends.
         - right/wrong answer feedback:
           - wrong answer given should show the correct answer
           - right answer given should do something .. nicer
         - ideally we could save progress somewhere?
     */

    let totalTime = (conf.totalTime || 15*60) * 1000;
    let state = {
        numCorrect   : 0,
        numIncorrect : 0,

        timeLeft : totalTime,
    };
    let timer;

    function beDone() {
        state.timeLeft = 0;
        clearInterval(timer);
    }

    function startTimer() {
        let startTime = Date.now();
        clearInterval(timer);
        timer = setInterval(
            function() {
                state.timeLeft = totalTime - (Date.now() - startTime);

                if(state.timeLeft <= 0) {
                    beDone();
                }
            }, 1000
        );
    }

    function newProblem() {
// XXX dependency on mathulars:
        let operands = mathulars.operands(2, 2, 12);
        state.correctAnswer = operands[0] * operands[1];
        conf.problemField.textContent = operands.join(' x ');
    }

/*
// XXX only start this when the user starts (on first input, say)
// ALSO make it be periodic and update the timer
    // stop after 15 minutes:
    let time_is_up = false;
    setTimeout(function() { state.timeLeft = true; }, state.timeLeft);
 */

    let answerField = conf.answerField;
    answerField.addEventListener(
        "keydown", event => {
            if(typeof timer === 'undefined') {
                startTimer();
            }

            if(event.keyCode === 13) { // return key
                if(answerField.value == state.correctAnswer) {
                    state.numCorrect++;
                } else {
                    state.numIncorrect++;
                }
                answerField.value = '';
                newProblem();
                //stui.update();
            }
        }
    );

    newProblem();

    return state;
};

