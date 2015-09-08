var frameModule = require("ui/frame");

exports.startQuiz=function(){
	frameModule.topmost().navigate("./views/quiz/question");
}
 


exports.openGallery = function(){
	frameModule.topmost().navigate("./views/gallery/gallery");
}
