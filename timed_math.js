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

    let totalTime = (conf.totalTime || 15*60) * 1000;

    function newState(lastState) {
        var best = 0;
        if(lastState) {
            if(lastState.highScore)
                best = lastState.highScore;
            if(lastState.numCorrect > best)
                best = lastState.numCorrect;
        }

        return {
            numCorrect   : 0,
            numIncorrect : 0,

            highScore  : best,
            timeLeft : totalTime,

            lastState : lastState,
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
        conf.onDone();
        clearInterval(timer);
        saveState();
    }

    function update() {
        state.minutesLeft = Math.floor(state.timeLeft/(60000));
        state.secondsLeft = Math.floor((state.timeLeft%60000)/1000);
        if(state.secondsLeft < 10)
            state.secondsLeft = "0" + state.secondsLeft.toString();

        onUpdate();
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

                update();
            }, 1000
        );
    }

    function newProblem() {
// XXX dependency on mathulars:
        let operands = mathulars.operands(2, 2, 12);
        state.correctAnswer = operands[0] * operands[1];
        conf.problemField.textContent = operands.join(' x ');
    }

    let answerField = conf.answerField;
    answerField.addEventListener(
        "keydown", event => {
            if(typeof timer === 'undefined') {
                startTimer();
            }

            if(event.keyCode === 13) { // return key
                if(answerField.value == state.correctAnswer) {
                    state.numCorrect++;
                    onRight();
                } else {
                    state.numIncorrect++;
                    onWrong();
                }
                answerField.value = '';
                newProblem();
                update();
            }
        }
    );

    newProblem();
    update();

    return state;
};

