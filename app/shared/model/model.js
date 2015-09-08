var Everlive = require("../EverliveSDK.JS/everlive.all.min");
var config = require("../../shared/config"); 
var everlive = new Everlive(config.EveliveAPI);
var query = new Everlive.Query();


exports.Model=function(){

var model = {
questions : [],
jokes : []
};

// exports.questions = function(callback){
// 	console.log("In getData")

// //Get questions with answers
// var expandExpr = {
// 		"Answers":{
// 			"TargetTypeName" : "Answers",
// 			"Fields" : {"Answer":1, "Weight":1}
// 		}
// 	};

// query.expand(expandExpr).select("Question","Type","Answers");

// var data = everlive.data("Questions");

// data.get(query)
// 		.then(function(data){
// 			// console.log(JSON.stringify(data));

// 			 if(typeof (callback) === "function"){
// 			 	callback(data.result[0].Question)
// 			 }else{
// 			 	console.log("nope");
// 			 };
// 		},
// 		function(error){
// 			console.log("error: "+ JSON.stringify(error));
// 		});

// 	return data.result;
// };

// exports.jokes = function(callback){
// //Get jokes
// query = new Everlive.Query();
// query.select("Joke","Category");
// var data = everlive.data("Jokes");
// data.get(query)
// 		.then(function(data){
// 			// console.log(JSON.stringify(data.result[0].Joke));
// 			jokes = data.result;
// 			 if(typeof (callback) === "function"){
// 			 	callback(data.result[0].Joke)
// 			 }else{
// 			 	console.log("nope");
// 			 };
// 			// console.log(jokes);
// 		},
// 		function(error){
// 			console.log("error: "+JSON.stringify(error));
// 		});
// }; 

(function(){
	console.log('f1');

var expandExpr = {
	"Answers":{
		"TargetTypeName" : "Answers",
		"Fields" : {"Answer":1, "Weight":1}
	}
};

query.expand(expandExpr).select("Question","Type","Answers");
// console.log(JSON.stringify(query));
var data = everlive.data("Questions");

data.get(query)
	.then(function(data){
		// console.log(JSON.stringify(data));
		model.questions = data.result;
		console.log("get question function "+JSON.stringify(model.questions));
	},
	function(error){
		console.log("error: "+ JSON.stringify(error));
	});
})();

(function(){
	console.log('f2');
//Get jokes
query = new Everlive.Query();
query.select("Joke","Category");
var data = everlive.data("Jokes");

data.get(query)
	.then(function(data){
		// console.log(JSON.stringify(data));
		model.jokes = data.result;
	},
	function(error){
		console.log("error: "+ JSON.stringify(error));
	});
})();

return model;
}