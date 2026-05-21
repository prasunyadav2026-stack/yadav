/* ======================================= */
/* VARIABLES */
/* ======================================= */
const firebaseConfig = {
  apiKey: "AIzaSyAEzCQvZGaNZJiXb1KsbwaWOnzrEUzO_44",
  authDomain: "sarkari-rojgar-wala-e78dc.firebaseapp.com",
  projectId: "sarkari-rojgar-wala-e78dc",
  storageBucket: "sarkari-rojgar-wala-e78dc.firebasestorage.app",
  messagingSenderId: "631297693422",
  appId: "1:631297693422:web:0f1fb327bc4799904bc5ff",
  measurementId: "G-VGCKK23NL5"
};
firebase.initializeApp(firebaseConfig);

const database = firebase.database();

let currentQuestion = 0;
let score = 0;
let selectedAnswer = "";
let questionData = [];
let totalTimeMinutes = 0;
let timeLeft = 7200;
let interval;
let userAnswers = {};
let isResumeMode = false;


/* ======================================= */
/* HTML ELEMENTS */
/* ======================================= */

const mainContainer =
document.querySelector(".main-container");

const quizContainer =
document.querySelector(".quiz-container");

const resultContainer =
document.querySelector(".result-container");

const examSelect =
document.getElementById("examSelect");

const dateSelect =
document.getElementById("dateSelect");

const shiftSelect =
document.getElementById("shiftSelect");

const startTestBtn =
document.getElementById("startTestBtn");

const nextBtn =
document.getElementById("nextBtn");

const prevBtn =
document.getElementById("prevBtn");

const submitBtn =
document.getElementById("submitBtn");

const restartBtn =
document.getElementById("restartBtn");
const viewSolutionBtn =
document.getElementById(
"viewSolutionBtn"
);

const solutionContainer =
document.getElementById(
"solutionContainer"
);

const questionText =
document.getElementById("questionText");

const optionButtons =
document.querySelectorAll(".option-btn");

const questionNumber =
document.getElementById("questionNumber");

const timer =
document.getElementById("timer");


/* ======================================= */
/* IMAGE */
/* ======================================= */

const questionImage =
document.createElement("img");

questionImage.id = "questionImage";

questionImage.style.maxWidth = "100%";

questionImage.style.marginTop = "15px";

questionImage.style.borderRadius = "10px";

questionImage.style.display = "none";

document
.querySelector(".question-box")
.appendChild(questionImage);


/* ======================================= */
/* SAVE TEST STATE */
/* ======================================= */

function saveTestState(){

    const testState = {

        currentQuestion: currentQuestion,

        score: score,

        timeLeft: timeLeft,

        userAnswers: userAnswers,

        exam: examSelect.value,

        date: dateSelect.value,

        shift: shiftSelect.value,

        questionData: questionData,

        studentName:
        document.getElementById("studentName").value,

        studentMobile:
        document.getElementById("studentMobile").value

    };

    localStorage.setItem(
        "testState",
        JSON.stringify(testState)
    );

}


/* ======================================= */
/* LOAD TEST STATE */
/* ======================================= */

function loadTestState(){

    const savedData =
    localStorage.getItem("testState");

    if(savedData){

        const testState =
        JSON.parse(savedData);

        currentQuestion =
        testState.currentQuestion || 0;

        score =
        testState.score || 0;

        timeLeft =
        testState.timeLeft || 7200;

        userAnswers =
        testState.userAnswers || {};

        questionData =
        testState.questionData || [];

        isResumeMode = true;

        return testState;

    }

    return null;

}


/* ======================================= */
/* LOAD EXAMS */
/* ======================================= */

function loadExams(){

    database.ref()
    .once("value", function(snapshot){

        let data = snapshot.val();

        examSelect.innerHTML = `
        <option value="">
            Select Exam
        </option>`;

        for(let exam in data){

            if(exam === "results"){
                continue;
            }

            examSelect.innerHTML += `
            <option value="${exam}">
                ${exam.toUpperCase()}
            </option>`;
        }

    });

}

loadExams();


/* ======================================= */
/* LOAD DATES */
/* ======================================= */

examSelect.addEventListener("change", function(){

    let exam = examSelect.value;

    database.ref(`${exam}`)
    .once("value", function(snapshot){

        let data = snapshot.val();

        dateSelect.innerHTML = `
        <option value="">
            Select Date
        </option>`;

        for(let date in data){

            dateSelect.innerHTML += `
            <option value="${date}">
                ${date}
            </option>`;
        }

    });

});


/* ======================================= */
/* LOAD SHIFTS */
/* ======================================= */

dateSelect.addEventListener("change", function(){

    let exam = examSelect.value;

    let date = dateSelect.value;

    database.ref(`${exam}/${date}`)
    .once("value", function(snapshot){

        let data = snapshot.val();

        shiftSelect.innerHTML = `
        <option value="">
            Select Shift
        </option>`;

        for(let shift in data){

            shiftSelect.innerHTML += `
            <option value="${shift}">
                ${shift.toUpperCase()}
            </option>`;
        }

    });

});


/* ======================================= */
/* LOAD TEST INFO */
/* ======================================= */

shiftSelect.addEventListener("change", function(){

    let exam = examSelect.value;

    let date = dateSelect.value;

    let shift = shiftSelect.value;

    database.ref(`${exam}/${date}/${shift}`)
    .once("value", function(snapshot){

        let data = snapshot.val();

        questionData = data.questions;

        totalTimeMinutes = data.time;

        document.getElementById("totalQuestions")
        .innerText = questionData.length;

        document.getElementById("totalTime")
        .innerText = totalTimeMinutes + " Minutes";

    });

});


/* ======================================= */
/* START TEST */
/* ======================================= */

startTestBtn.addEventListener("click", function(){

    const savedTest =
    loadTestState();

    if(savedTest){

        if(confirm(
            "Previous Test Found. Resume?"
        )){

            mainContainer.style.display =
            "none";

            quizContainer.style.display =
            "block";

            document.getElementById(
            "liveExamName"
            ).innerText =
            savedTest.exam.toUpperCase();

            document.getElementById(
            "liveShiftName"
            ).innerText =
            savedTest.shift.toUpperCase();

            document.getElementById(
            "studentName"
            ).value =
            savedTest.studentName;

            document.getElementById(
            "studentMobile"
            ).value =
            savedTest.studentMobile;

            loadQuestion();

            startTimer();

            return;

        }else{

           localStorage.removeItem(
    "testState"
    );

    location.reload();

        }

    }

    const studentName =
    document.getElementById("studentName").value;

    const studentMobile =
    document.getElementById("studentMobile").value;

    if(
        studentName === "" ||
        studentMobile === "" ||
        examSelect.value === "" ||
        dateSelect.value === "" ||
        shiftSelect.value === ""
    ){

        alert("Please Fill All Details");

        return;
    }

    mainContainer.style.display = "none";

    quizContainer.style.display = "block";

    document.getElementById("liveExamName")
    .innerText = examSelect.value.toUpperCase();

    document.getElementById("liveShiftName")
    .innerText = shiftSelect.value.toUpperCase();

    loadQuestion();

    startTimer();

});


/* ======================================= */
/* LOAD QUESTION */
/* ======================================= */

function loadQuestion(){

    let q = questionData[currentQuestion];

    questionNumber.innerText =
    `Question ${currentQuestion + 1}
    of ${questionData.length}`;

    questionText.innerText =
    q.question;


    /* IMAGE */

    if(q.image){

        questionImage.src = q.image;

        questionImage.style.display =
        "block";

    }else{

        questionImage.style.display =
        "none";

    }


    /* OPTIONS */

    if(Array.isArray(q.options)){

        optionButtons[0].innerText =
        q.options[0];

        optionButtons[1].innerText =
        q.options[1];

        optionButtons[2].innerText =
        q.options[2];

        optionButtons[3].innerText =
        q.options[3];

    }else{

        optionButtons[0].innerText =
        q.options.A;

        optionButtons[1].innerText =
        q.options.B;

        optionButtons[2].innerText =
        q.options.C;

        optionButtons[3].innerText =
        q.options.D;

    }


    selectedAnswer = "";

    optionButtons.forEach(function(btn){

        btn.style.background =
        "#e2e8f0";

    });


    /* RESTORE ANSWER */

    if(userAnswers[currentQuestion]){

        optionButtons.forEach(function(btn){

            if(
                btn.innerText ===
                userAnswers[currentQuestion]
            ){

                btn.style.background =
                "#93c5fd";

                selectedAnswer =
                btn.innerText;

            }

        });

    }


    /* PREV BUTTON */

    /* BUTTON CONTROL */


/* FIRST QUESTION */

if(currentQuestion === 0){

    prevBtn.style.display =
    "none";

    nextBtn.style.display =
    "block";

    submitBtn.style.display =
    "none";

}


/* LAST QUESTION */

else if(

    currentQuestion ===
    questionData.length - 1

){

    prevBtn.style.display =
    "block";

    nextBtn.style.display =
    "none";

    submitBtn.style.display =
    "block";

}


/* MIDDLE QUESTIONS */

else{

    prevBtn.style.display =
    "block";

    nextBtn.style.display =
    "block";

    submitBtn.style.display =
    "none";

}

}


/* ======================================= */
/* OPTION CLICK */
/* ======================================= */

optionButtons.forEach(function(button){

    button.addEventListener("click", function(){

        selectedAnswer =
        button.innerText;

        userAnswers[currentQuestion] =
        selectedAnswer;

        saveTestState();

        optionButtons.forEach(function(btn){

            btn.style.background =
            "#e2e8f0";

        });

        button.style.background =
        "#93c5fd";

    });

});


/* ======================================= */
/* NEXT BUTTON */
/* ======================================= */

nextBtn.addEventListener("click", function(){

    if(selectedAnswer === ""){

        alert("Please Select An Option");

        return;

    }

    let correctAnswer =
    questionData[currentQuestion].answer;


    if(selectedAnswer === correctAnswer){

        score++;

    }

    currentQuestion++;

    saveTestState();

    if(currentQuestion >= questionData.length){

        submitTest();

        return;

    }

    loadQuestion();

});


/* ======================================= */
/* PREVIOUS BUTTON */
/* ======================================= */

prevBtn.addEventListener("click", function(){

    if(currentQuestion > 0){

        currentQuestion--;

        saveTestState();

        loadQuestion();

    }

});


/* ======================================= */
/* TIMER */
/* ======================================= */

function startTimer(){

    if(!isResumeMode){

        timeLeft =
        totalTimeMinutes * 60;

    }

    interval = setInterval(function(){

        let minutes =
        Math.floor(timeLeft / 60);

        let seconds =
        timeLeft % 60;

        seconds =
        seconds < 10
        ? "0" + seconds
        : seconds;

        timer.innerText =
        `${minutes}:${seconds}`;

        timeLeft--;

        saveTestState();

        if(timeLeft < 0){

            clearInterval(interval);

            submitTest();

        }

    }, 1000);

}


/* ======================================= */
/* SUBMIT TEST */
/* ======================================= */

submitBtn.addEventListener("click", function(){

    submitTest();

});
function showSolutions(){

    solutionContainer.innerHTML = "";

    solutionContainer.style.display =
    "block";

    questionData.forEach(function(q,index){

        let div =
        document.createElement("div");

        div.className =
        "solution-question";

        let optionsHTML = "";

        let correctAnswer =
        q.answer;

        let studentAnswer =
        userAnswers[index];



        let optionsArray = [];



        if(Array.isArray(q.options)){

            optionsArray = q.options;

        }else{

            optionsArray = [

                q.options.A,

                q.options.B,

                q.options.C,

                q.options.D

            ];

        }



        optionsArray.forEach(function(opt){

            let className =
            "normal-option";



            if(opt === correctAnswer){

                className =
                "correct-answer";

            }



            if(
                opt === studentAnswer &&
                studentAnswer !== correctAnswer
            ){

                className =
                "wrong-answer";

            }



            optionsHTML += `

            <div class="${className}"
            style="
            padding:10px;
            margin-top:8px;
            border-radius:8px;
            ">

            ${opt}

            </div>

            `;

        });



        div.innerHTML = `

        <h3>
        Question ${index + 1}
        </h3>

        <p style="
        font-weight:bold;
        margin-top:10px;
        ">
        ${q.question}
        </p>

        ${q.image
        ?
        `<img src="${q.image}"
        style="
        max-width:100%;
        margin-top:10px;
        border-radius:10px;
        ">`
        :
        ""
        }

        ${optionsHTML}

        <p style="
        margin-top:15px;
        font-weight:bold;
        ">
        Your Answer:
        ${studentAnswer || "Not Answered"}
        </p>

        <p style="
        color:green;
        font-weight:bold;
        ">
        Correct Answer:
        ${correctAnswer}
        </p>

        `;

        solutionContainer.appendChild(div);

    });

}


function submitTest(){

    clearInterval(interval);

    quizContainer.style.display =
    "none";

    resultContainer.style.display =
    "block";

    let total =
    questionData.length;

    let wrong =
    total - score;

    document.getElementById(
    "studentResultName"
    ).innerText =
    document.getElementById(
    "studentName"
    ).value;

    document.getElementById(
    "resultTotalQuestion"
    ).innerText = total;

    document.getElementById(
    "correctAnswers"
    ).innerText = score;

    document.getElementById(
    "wrongAnswers"
    ).innerText = wrong;

    document.getElementById(
    "finalScore"
    ).innerText = score;


    /* SAVE RESULT */

    database.ref("results").push({

        studentName:
        document.getElementById(
        "studentName"
        ).value,

        studentMobile:
        document.getElementById(
        "studentMobile"
        ).value,

        exam:
        examSelect.value,

        date:
        dateSelect.value,

        shift:
        shiftSelect.value,

        totalQuestions:
        total,

        correctAnswers:
        score,

        wrongAnswers:
        wrong,

        finalScore:
        score,

        submittedAt:
        new Date().toLocaleString()

    });


    /* CLEAR STORAGE */

    localStorage.removeItem(
    "testState"
    );

}


/* ======================================= */
/* RESTART */
/* ======================================= */

restartBtn.addEventListener("click", function(){

    localStorage.removeItem(
    "testState"
    );

    location.reload();

});
viewSolutionBtn.addEventListener(
"click",
function(){

    showSolutions();

});