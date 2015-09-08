var config = require("../../shared/config"); 
var frameModule = require("ui/frame");
var observableModule = require("data/observable");
var everlive = config.el;


var user = new observableModule.Observable({
	email:"",
	password:""
});

var attr = {
	Email:user.email
}

exports.load = function(args){
	var page = args.object;
	page.bindingContext = user;
}

exports.register = function(){
	console.log(user.email +", "+user.password);
	everlive.Users.register(user.email,user.password,attr)
		.then(function(){
			console.log ("Hello, "+ user.email + "!");
			frameModule.topmost().navigate("./views/options/options");
		})
		.catch(function(error){
			console.log(JSON.stringify(error));
		});
} 