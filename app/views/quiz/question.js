var ModelModule = require("../../shared/model/model");
var model = ModelModule.Model();

console.log(JSON.stringify(model.questions));

var question = model.questions;

exports.load = function(args){
	var page = args.object;
	page.bindingContext = question;
}
