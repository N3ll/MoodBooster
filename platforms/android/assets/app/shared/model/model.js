var Everlive = require("../EverliveSDK.JS/everlive.all.min");
var config = require("../../shared/config"); 
var everlive = new Everlive(config.EveliveAPI);
var query = new Everlive.Query();

var model = {};

var expandExpr = {
	"Answers":{
		"TargetTypeName" : "Answers",
		"Fields" : {"Answer":1, "Weight":1}
	} 
};
console.log("Start getting data")


query.expand(expandExpr).select("Question","Type","Answers").order("Order");

var questions = everlive.data("Questions");

questions.get(query)
	.then(function(data){
		// console.log(JSON.stringify(data));
		model.questions = data.result;
		console.log("get question "+JSON.stringify(model));
	},
	function(error){
		console.log("error: "+ JSON.stringify(error));
	});


//Get jokes
query = new Everlive.Query();
query.select("Joke","Category");
var jokes = everlive.data("Jokes");

jokes.get(query)
	.then(function(data){
		// console.log(JSON.stringify(data));
		model.jokes = data.result;
		console.log("get jokes "+JSON.stringify(model));
	},
	function(error){
		console.log("error: "+ JSON.stringify(error));
	});

exports.model = model;