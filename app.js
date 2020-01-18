var express = require("express");
var app = express();
var flash = require("connect-flash");
var mongoose= require("mongoose");
var bodyParser = require("body-parser");
var Project= require("./models/projects");
var Todos=require("./models/todos");
var User=require("./models/user");
var methodOverride=require("method-override");

var passport=require("passport");
var LocalStrategy= require("passport-local");

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://localhost/projectTool", { useNewUrlParser: true });
mongoose.set('useUnifiedTopology', true);

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(require("express-session")({
	secret: "secret",
	resave: false,
	saveUninitialized: false
}));
app.use (passport.initialize());
app.use (passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.currentUser=req.user;
	res.locals.error=req.flash("error");
	res.locals.error2=req.flash("error2");

	next();
})

app.get("/", function(req,res){
	res.render("landing");
});

app.get("/projects",isLoggedIn, function(req,res){
	Project.find({}, function(err,allProjects){
		if(err){
			console.log(err);
		}
		else{
			res.render("projects/projects",{allProjects:allProjects});
		}
	});
});

app.post("/projects",isLoggedIn, function(req,res){
	var projectName= req.body.projectName;
	var projectImage=req.body.projectImage;
	var projectDescription=req.body.projectDescription;
	var projectResources=req.body.projectResources;
	var projectuser={
		id:req.user._id,
		username:req.user.username
	};

	var newProject= {
		projectName:projectName,
		projectImage:projectImage,
		projectDescription:projectDescription,
		projectResources:projectResources,
		projectuser:projectuser
	};

	Project.create(newProject,function(err,newProject){
		if(err){
			console.log(err);
		}
		else{
			res.redirect("/projects");
		}
	});

});

app.get("/projects/new",isLoggedIn, function(req,res){

	res.render("projects/new");
});

app.get("/projects/:id",isLoggedIn, function(req,res){
	Project.findById(req.params.id).populate("todos").exec(function(err,project){
		if (err){
			console.log(err);
		}
		else{
			res.render("projects/manage",{project:project});
		}
	});
});

app.post("/projects/:id/todos",isLoggedIn, function(req,res){
	Project.findById(req.params.id, function(err,project){
		if(err){
			console.log(err);
		}
		else{
			Todos.create(req.body.todos,function(err,Todos){
				if(err){
					console.log(err);
				}
				else{
					Todos.projectuser.id=req.user._id;
					Todos.projectuser.username=req.user.username;
					Todos.save();
					project.todos.push(Todos);
					project.save();
					res.redirect('/projects/'+ project._id);
				}
			})
		}
	})
});

app.delete("/projects/:id",checkPermissions, function(req,res){
	Project.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/projects");
		}
		else{
			res.redirect("/projects");
		}
	});
});
app.delete("/projects/:id/todos/:idtodo",checkPermissions2, function(req,res){
	Todos.findByIdAndRemove(req.params.idtodo,function(err){
		if(err){
			res.redirect("back");
		}
		else{
			res.redirect("back");
		}
	});
});

app.get("/projects/:id/edit", checkPermissions, function(req,res){

		Project.findById(req.params.id, function(err,project){
			res.render("projects/edit", {projects:project});
	});
	
});
app.put("/projects/:id", checkPermissions, function(req,res){
	Project.findByIdAndUpdate(req.params.id, req.body.projects, function(err,project){
		if(err){
			res.redirect("/projects");
		}
		else{
			res.redirect("/projects/" + req.params.id);
		}
	})
})


app.post("/register", function(req,res){
	var newUser= new User({username: req.body.username});

	User.register(newUser, req.body.password, function(err,user){
		if(err){
			req.flash("error2", err.message);
			return res.redirect("/");
		}
		passport.authenticate("local")(req,res,function(){
			res.redirect("/projects");
		})
	});
});
app.post("/login",passport.authenticate("local", {
	successRedirect: "/projects",
	failureRedirect: "/",
	failureFlash:true
}), function(req,res){
});
app.get("/logout", function(req,res){
	req.logout();
	res.redirect("/");
});

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "Please Log In to continue");
	res.redirect("/");
}

function checkPermissions(req,res,next){
	if(req.isAuthenticated()){

		Project.findById(req.params.id, function(err,foundproject){
		if(err){
			res.redirect("back");
		}
		else{
			if(foundproject.projectuser.id.equals(req.user._id)){
				next();
			}
			else{
				req.flash("error","Error! You are not authorized");
				res.redirect("back");
			}
		}
	})
	}

	else{
		res.redirect("back");
	}
}
function checkPermissions2(req,res,next){
	if(req.isAuthenticated()){

		Todos.findById(req.params.idtodo, function(err,todos){
		if(err){
			res.redirect("back");
		}
		else{
			if(todos.projectuser.id.equals(req.user._id)){
				next();
			}
			else{
				req.flash("error","Error! You are not authorized");
				res.redirect("back");
			}
		}
	})
	}

	else{
		res.redirect("back");
	}
}
app.listen(3000, function(){
	console.log("Start up ProjectWebTool");
});