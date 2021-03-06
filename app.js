let express = require("express"),
    app = express(),
    http = require("http").Server(app),
    io = require("socket.io")(http),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    Room = require("./models/room");
    
//mongoose.connect("mongodb://localhost/deja_q", { useNewUrlParser: true });
mongoose.connect("mongodb://deja-q-admin:dejaqpw01@ds225902.mlab.com:25902/deja-q", { useNewUrlParser: true });
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

app.get("/", function(req, res) {
    Room.find({}, function(err, rooms) {
        if (err) {
            console.log(err);
        } else {
            res.render("home", {rooms: rooms});  
        }
    });
});

app.get("/room/:roomId", function(req, res) {
    let roomId = req.params.roomId;
    
    Room.findById(roomId, function(err, foundRoom) {
        if (err || !foundRoom) {
            //console.log(err);
            res.redirect("/bizarroWorld");
        } else {
            console.log("Room is " + foundRoom["name"]);
            res.render("room", {
                roomId: roomId,
                roomName: foundRoom["name"],
                queue: foundRoom["queue"],
            });
        }
    });
});

app.post("/createRoom", function(req, res) {
    let newRoom = req.body.newRoom;

    Room.create({
        name: newRoom,
        queue: []
    }, function(err, room) {
        if (err) {
            console.log(err);
            console.log("Couldn't create new room!");
        } else {
            console.log("Successfully created room " + newRoom + "!!");
        }
    });
    res.redirect("/");
});

app.get("/destroyRoom/:roomId", function(req, res) {
    let roomId = req.params.roomId;
    Room.findById(roomId, function(err, foundRoom) {
        if (err || !foundRoom) {
            //console.log(err);
            console.log("couldn't find room..");
            console.log(roomId);
        } else {
            let roomName = foundRoom["name"];
            
            Room.deleteOne({_id: roomId}, function(err, room) {
                if (err) {
                    //console.log(err);
                    console.lgo(roomId);
                    console.log(roomName);
                    console.log("couldn't delete room..");
                } else {
                    console.log("Successfully deleted " + roomName + "!!");
                }
            });
        }
    });
    
    res.redirect("/");
});

app.get("/bizarroWorld", function(req, res) {
    let rand = Math.random();
    if (rand < 0.5) {
        res.redirect("http://www.zombo.com/");
    } else {
        res.send("Aren't we all just the universe loving, hating, and trying to figure itself out?");      
    }
});

app.get("*", function(req, res) {
   res.redirect("/bizarroWorld"); 
});

io.on('connection', function(socket){
    console.log('A user connected!');
    
    socket.on('disconnect', function(){
        console.log('A user disconnected!');
    });
    
    socket.on('enqueue', function(roomNStudent){
        let roomID = roomNStudent["room"];
        let student = roomNStudent["student"];
        student = student.replace(/\s+$/, '');
        
        io.emit('enqueue', student);
        
        Room.updateOne({
            _id: roomID
        },
        {
            $push: {queue: student}
        }, function(err, doc) {
            if (err) {
                console.log(err);
                console.log("Couldn't add new student!");
            } else {
                Room.findOne({_id: roomID}, function(err, room) {
                    if (err) {
                        console.log(err);
                    } else {
                        try {
                            console.log("Successfully added " + student + " in: " + room.name);
                        } catch(err) {
                            console.log(err);
                        }
                    }
                });
            }
        });
        
    });
        
    socket.on('dequeue', function(roomNStudent){
        let roomID = roomNStudent["room"];
        let student = roomNStudent["student"];
        student = student.replace(/\s+$/, '');   // OK BUT WHY!!!
        
        io.emit('dequeue', student);
        
        Room.updateOne({
            _id: roomID
        },
        {
            $pull: {queue: student}
        }, function(err, room) {
            if (err) {
                console.log(err);
                console.log("Failed to remove " + student + " in " + room.name);
            } else {
                Room.findOne({_id: roomID}, function(err, room) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Successfully removed " + student + " in: " + room.name);
                    }
                });
            }
        });
    });
});

http.listen(process.env.PORT, process.env.IP, function() {
    console.log("Server is listening!!!\nCheck https://q-totype-marshmallowsunshinecafe.c9users.io/");
});