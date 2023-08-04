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

    let onUpdate = conf.onUpdate || function() { };
    let onRight  = conf.onRight  || function() { };
    let onWrong  = conf.onWrong  || function() { };

    let totalTime = (conf.totalTime || 15*60); // units: seconds!

    function newState(lastState) {
        var highScores = { }; // keys are totalTime, values are states
        var best = 0;
        if(lastState) {
            if(lastState.highScores) {
                highScores = lastState.highScores;
                if(totalTime in highScores) {
                    best = highScores[totalTime].numCorrect;
                }
            }
        }

        return {
            totalTime    : totalTime,
            numCorrect   : 0,
            numIncorrect : 0,

            highScore  : best,  // high score for selected total time
            timeLeft   : totalTime,
            highScores : highScores,
        }
    }

    function updateHighScores(state) {
        let hs = state.highScores;

        if(state.numCorrect > state.highScore) {
            hs[totalTime] = Object.assign({}, state);
            delete hs[totalTime].highScores;
        }
    }

    let state = newState(loadState());
    let timer;

    function loadState() {
        let state;
        try {
            // can this possibly be right?
            const cookies = document.cookie;
            // do we need to url-decode?
            state = JSON.parse(cookies);
        } catch (error) {
            // no state or it was unparseable.  just make a new one.
            state = newState({});
        }
        return state;
    }

    function saveState() {
        document.cookie = JSON.stringify(state);
    }

    function beDone() {
        state.timeLeft = 0;
        updateHighScores(state);
        conf.onDone();
        clearInterval(timer);
        saveState();
    }

    function update() {
        state.minutesLeft = Math.floor(state.timeLeft / 60);
        state.secondsLeft = Math.floor(state.timeLeft % 60);
        if(state.secondsLeft < 10)
            state.secondsLeft = "0" + state.secondsLeft.toString();

        onUpdate();
    }

    function startTimer() {
        let startTime = Date.now();
        clearInterval(timer);
        timer = setInterval(
            function() {
                state.timeLeft = (totalTime*1000 - (Date.now() - startTime))/1000;
                if(state.timeLeft <= 0) {
                    beDone();
                }

                update();
            }, 1000
        );
    }

    function newProblem() {
// XXX dependency on mathulars:
        let operands = mathulars.operands(2, 2, 12);
        state.correctAnswer = operands[0] * operands[1];
        // randomly do division or multiplication:
        if(Math.random() < 0.5) {
            conf.problemField.textContent = operands.join(' x ');
        } else {
            let tmp = operands[0];
            operands[0] = state.correctAnswer;
            state.correctAnswer = tmp;
            conf.problemField.textContent = operands.join(' ÷ ');
        }
    }

    let answerField = conf.answerField;
    answerField.addEventListener(
        "keydown", event => {
            if(typeof timer === 'undefined') {
                startTimer();
            }

            if(event.keyCode === 13) { // return key
                if(answerField.value) {
                    let doNewProblem = true;
                    if(answerField.value == state.correctAnswer) {
                        if(state.timeLeft > 0)
                            state.numCorrect++;
                        onRight();
                    } else {
                        if(state.timeLeft > 0)
                            state.numIncorrect++;
                        onWrong();
                        doNewProblem = false;
                    }
                    answerField.value = '';
                    if(doNewProblem)
                        newProblem();
                    update();
                }
            }
        }
    );

    newProblem();
    update();

    return state;
};

