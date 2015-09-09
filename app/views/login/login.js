var frameModule = require("ui/frame");
var observableModule = require("data/observable");

var config = require("../../shared/config"); 
var everlive = config.el;

var model = require("../../shared/model/model");

var user = new observableModule.Observable({
email:"user@domain.com",
password: "password"
});

exports.load = function(args){
	var page = args.object;
	page.bindingContext = user;
};

exports.register = function() {
	var topmost = frameModule.topmost();
	topmost.navigate("./views/register/register");
};

exports.signIn = function(){
	everlive.authentication.login(user.email,user.password)
	.then(function(){
		console.log("Yupiii");
		frameModule.topmost().navigate("./views/options/options");
	})
	.catch(function(error){
		console.log(JSON.stringify(error));
		console.log("Not so yupii");
	});
}

