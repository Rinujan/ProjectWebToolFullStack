var mongoose = require("mongoose");

var projectSchema=  new mongoose.Schema({
	projectName: String,
	projectImage: String, 
	projectDescription: String,
	projectResources:String,
	projectuser:{
		id:{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username:String,
	},
	todos: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref:"Todos"
		}
	]
	
});

module.exports = mongoose.model("Project", projectSchema);