var mongoose = require("mongoose");

var todosSchema = mongoose.Schema({
	Backlog: String,
	Ready:String,
	OnGoing:String,
	Completed:String,
	projectuser:{
		id:{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username:String,
	}

}); 

module.exports = mongoose.model("Todos", todosSchema);