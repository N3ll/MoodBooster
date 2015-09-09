var model = require("../../shared/model/model").model;
var observableModule = require("data/observable");
var indexOfQuestion;
var page;

var quiz = new observableModule.Observable({
	"questions":
	model.questions
});

exports.load = function(args){
	page = args.object; 
	selectQuestion(0);
	indexOfQuestion=0;
}

function selectQuestion(questionIndex){
	var currentQuestion = model.questions[questionIndex];

	var context = {
		questionText: currentQuestion.Question,
		answers: [],
		viewPrev:"",
		viewNext:""
	};

	// console.log(questionIndex);
	if(questionIndex===0){
		context.viewPrev = "collapsed";
	}else{
		context.viewPrev = "visible";
	};

	if(questionIndex===model.questions.length-1){
		context.viewNext = "collapsed";
	}else{
		context.viewNext = "visible";
	};


	for (var i = 0; i < currentQuestion.Answers.length; i++) {
		var ans = new observableModule.Observable();
		ans.set("index",  (i + 1)+". ");
		ans.set("answer", currentQuestion.Answers[i].Answer);
		ans.set("answerWeight",  currentQuestion.Answers[i].Weight);

		context.answers.push(ans);
	};

	page.bindingContext = context;//quiz;
}

exports.changeQuestion = function(args){
	var button = args.object;
	if(button.text === "Next"){
		indexOfQuestion++;
	}else if(button.text === "Previous"){
		indexOfQuestion--;
	}

	selectQuestion(indexOfQuestion);
}

exports.saveAnswer = function(args){
	var answer = args.view.bindingContext;
	answer.set("isSelected", true);
    console.log(JSON.stringify(args.view.bindingContext));
}
