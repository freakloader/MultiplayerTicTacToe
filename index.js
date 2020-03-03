require('dotenv').config()
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(app.listen(process.env.PORT || 3001));

var path = require('path');
var bodyParser = require('body-parser');
var fs = require('fs')
var MongoClient = require('mongodb').MongoClient;
// var uri = "mongodb+srv://test1:t est1@cluster0-or75i.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(process.env.DB_CONNECT, { useNewUrlParser: true});
var bcrypt = require('bcrypt')
var jwt = require('jsonwebtoken')

var file = fs.readFileSync('./rooms.json');
// file = JSON.parse(file);     

var rooms = 0;//##Implement dB instead of this
var DB;

//For statically loading public folder
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended: true})); //Possible point of error in game names processing
app.use(express.json()); //Possible point of error in game names processing

const connection = client.connect()

app.get('/',function(req,res){
    // console.log(req.headers)
    // req.clearCookie()
    res.clearCookie()
    res.sendFile(path.resolve(__dirname+"/index.html"))
})

app.post('/signup', async function(req,res){
    // console.log(req.body)
    try
    {
        var collection = client.db("MultiTicTacToe").collection("users");
        
        connection.then(async ()=>{
        // client.connect(async err => {
            // var collection = client.db("MultiTicTacToe").collection("users");
            var user =  await collection.findOne(
                {
                    userID:req.body.signupemail
                }
            ).then(result => {
                // console.log("value of result:",result)
                    if(result){ 
                        // console.log("rsults")
                    //     // return result.userID;
                    //   console.log('Successfully found document:', result);
                        return result;
                    }
                    // else {
                    //   console.log("No document matches the provided query.");
                    // }
                }
            ).catch()
            console.log("Value of user:",user)
            console.log("Value of entered email:",req.body.signupemail)
            // console.log(typeof(user))
            if(user!= undefined || user!=null && user.userID == req.body.signupemail)
            {
                console.log("User exists")
                res.send("Userexists")
                // res.send("A user with the same email ID already exists.Try another emailID.")
            }
            else
            {
                console.log("User doesn't exist.Putting in DB")
                // Perform actions on the collection object
                let hashPass = await bcrypt.hash(req.body.signuppassword,10)
                collection.insertOne(
                    {
                        userID:req.body.signupemail,
                        userName:req.body.signupname,
                        userPassword:hashPass,
                        history:[]
                    }
                ).then(result=>{})
                .catch(result=>{})
                res.send("Signedup")
            }
            client.close();
        })
        // })
        // .then(client.close());
    }
    catch
    {
    //     console.log("incatch")
    //     res.status(500).send()
    }
    
    
});

app.post("/login",function(req,res){
    // console.log(req.body)
    console.log("In /login")
    try
    {
        var collection = client.db("MultiTicTacToe").collection("users");
        console.log("In /login try")
        // client.connect(async err => {
        connection.then(async ()=>{
       
            // var collection = client.db("MultiTicTacToe").collection("users");
            var user =  await collection.findOne(
                {
                    userID:req.body.loginemail
                }
            ).then(result => {
                // console.log("value of result:",result)
                    console.log("Result:",result)
                    if(result){ 
                        // console.log("rsults")
                    //     // return result.userID;
                    //   console.log('Successfully found document:', result);
                        return result;
                    }
                    // else {
                    //   console.log("No document matches the provided query.");
                    // }
                }
            ).catch(result=>{})
            // console.log("Value of user:",user)
            // console.log("Value of entered email:",req.body.loginemail)
            // console.log(typeof(user))

            console.log("/login user:",user)

            if(user == undefined || user==null)
            {
                console.log("User doesn't exist")
                res.send("Nosuchuser") //Add error message on frontend side   
            }  
                        
            if(user.userID == req.body.loginemail)
            {
                // console.log("User exists")
                // Perform actions on the collection object
                if(bcrypt.compare(req.body.loginpassword,user.userPassword))
                {
                    console.log("Login successful");
                    var user = {
                        // userID:req.body.loginemail,
                        name:user.userName,
                        ID:user.userID
                    }
                    let accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"10h"})
                    // res.json({accessToken:accessToken})
                      // res.set('accessToken', accessToken);
                    
                      // res.sne('/game');
                    // res.header('auth-token',accessToken);
                    // res.status(302).end();
                    
                    res.cookie('auth-token',accessToken)
                    res.cookie('userName',user.name)
                    console.log("header name:",user.name)
                    res.send('game')
                    // res.sendFile(path.resolve(__dirname+"/public/game.html"))
                }
                else
                    res.send("Wrongpassword")
            }
        })
        //     client.close();
        // })
        //.then(client.close());
    }
    catch
    {
        res.status(500).send()
    }
});

function authenticateToken(req,res,next)
{
    console.log("In authenticate token")
    
    let Cookie = req.headers['cookie']
    let output = {};
    Cookie.split(/\s*;\s*/).forEach(function(pair) {
        pair = pair.split(/\s*=\s*/);
        output[pair[0]] = pair[1]
    });
    // let json = JSON.stringify(output, null, 4);
    // console.log("Cookie",output);


    // console.log("Cookei list",Cookie)
    //Making sure that we have a authHeader.It will either return undefined or the actual token
    // console.log("Cookie:",typeof(Cookie))   
    let token = output && output['auth-token']
    if(token == null)
        return res.status(401).sendFile(path.resolve(__dirname+"/public/forbidden.html"))
    
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user) => {
        if(err)
        {
            console.log(err)
            return res.status(403).sendFile(path.resolve(__dirname+"/public/expired.html"))
            // return res.status(403).send()

        }    
        // console.log("User:",user)
        req.user = user 
        next() 
    })
}

app.get('/game',authenticateToken,function(req,res){
    // console.log("In /game")
    console.log(req.user)
    res.sendFile(path.resolve(__dirname+"/public/game.html"))
})

app.get('/game/singleplayer',authenticateToken,function(req,res){
    res.sendFile(path.resolve(__dirname+"/public/singlegame.html"))
})

app.get('/userinfo',authenticateToken,function(req,res){
    
    user = JSON.stringify(req.user)
    res.send(user)
})

app.get('/game/twoplayer',authenticateToken,function(req,res){
    res.set('mode','newgame')
    res.sendFile(path.resolve(__dirname+"/public/twogame.html"))
})

app.get('/logout',function(req,res){
    // console.log(req.headers)
    // req.clearCookie()
    res.clearCookie('auth-token')
    res.clearCookie('userName')
    // res.redirect('/')
})

app.post('/roomlength',function(req,res){
    // io.on('connection',function(socket){
        // console.log("In roomlength",req.body.ID)
        console.log("In /roomlength:",req.body.ID)
        var roomID = io.nsps['/'].adapter.rooms[req.body.ID];
        console.log("RoomID:",roomID)
        if(roomID && roomID.length < 2)
        {
            res.send("Notfull")
        }
        else if(roomID && roomID.length >= 2)
            res.send("Full")
        else
            res.send("Invalid")
    // })
})

app.get('/history',authenticateToken,function(req,res){
    res.sendFile(path.resolve(__dirname+"/public/history.html"))
})

app.get('/matchdata',authenticateToken,function(req,res){
    try
    {
        var collection = client.db("MultiTicTacToe").collection("users");
        console.log("In matchdata")
        connection.then(async ()=>{
        // client.connect(async err => {
            var Cookie = req.headers['cookie']
            var output = {};
            Cookie.split(/\s*;\s*/).forEach(function(pair) {
                pair = pair.split(/\s*=\s*/);
                output[pair[0]] = pair[1]
            });
            console.log("Username:",req.user.ID)
            
            var user = await collection.findOne(
                {
                    userID:req.user.ID
                }//,
                // {
                //     $orderby: { "history.date":-1 }
                // }
            ).then(result => {
                // console.log("value of result:",result)
                    if(result){ 
                        // console.log("rsults")
                    //     // return result.userID;
                    //   console.log('Successfully found document:', result);
                        return result;
                    }
                    // else {
                //   console.log("No document matches the provided query.");
                    // }
                }
            ).catch(result=>{})

            console.log(user)
            res.send(user)
        })
        //     client.close();
        // })
        //.then(client.close())
    }
    catch
    {}
})

app.post('/addmatchdata',authenticateToken,function(req,res){
    try
    {
        console.log("In addmatch data")
        // console.log(req.body)
        var matchdata  = req.body
        var exists;

        matchdata.date = new Date(Date.now())//Date("<YYYY-mm-ddTHH:MM:ss>")
        var collection = client.db("MultiTicTacToe").collection("users");
        // console.log("Matchdata:",matchdata)
        connection.then(async ()=>{
                 
            var user = await collection.findOne(
            {
                // {
                    "userID":req.user.ID,
                    "history.matchID":matchdata.matchID
                // }
            }
            )
            console.log("Addmatchdata user:",user)

            // console.log(user.history)
            if(user)
            {
                for(i in user.history)
                {
                    if(user.history[i].matchID == matchdata.matchID)
                    {
                        console.log("In")
                        exists = true;
                        break;
                    }
                }
            }

            
            if(exists) //Update old score of same match
            {
                collection.updateOne(
                        
                    { 
                        userID:req.user.ID,
                        history:{ $elemMatch:{ matchID:matchdata.matchID }} // Query parameter
                    },
                    {
                        $set:
                        {
                            "history.$.playerAscore": matchdata.playerAscore,               // Replacement document
                            "history.$.playerBscore": matchdata.playerBscore,
                            "history.$.date":new Date(Date.now())
                        } 
                
                    },
                    // { upsert:true }                                          // Options
                
                    // { $set: { "grades.$" : matchdata } }
                    // { $push:{ history:matchdata } }
                ).then(result=>{ console.log("DB res:",result); res.send(result)})
                .catch(result=>{})
                
            }
            else   //Add new score
            {
                collection.updateOne(
                        
                    { userID:req.user.ID },
                    { $push:{ history:matchdata } }// Replacement document
                    
                    // { upsert:true }                                          // Options
                
                    // { $set: { "grades.$" : matchdata } }
                    // { $push:{ history:matchdata } }
                ).then(result=>{ console.log("DB res:",result); res.send(result)})
                .catch(result=>{})
            }
            res.send("Success")
        })
        // })
        //.then(client.close())
    }
    catch
    {}
})

// io.
io.on('connection',function(socket){
    // file = JSON.parse(file);
    console.log("In connection")
    //Creating a new room and notifying the creator of room. 
    socket.on('createNewGame',function(data){
        console.log("In new game")
        
        socket.join('Room-'+ ++rooms);
        console.log("P1 Joining room:",rooms)
        let room = rooms

        // file.rooms = file.rooms + 1;
        socket.emit('newGame',{
            name:data.name,
            room:'Room-'+ room
        })
    });
    
    //Connecting second player to room.
    socket.on('joinGame',function(data){
        console.log("in joingame")
        console.log("Room P1 joined:",data.room)
        // console.log("Joingame:",typeof(data.room))
        var roomID = io.nsps['/'].adapter.rooms[data.room];
        console.log("RoomID of joingame",roomID)
        // console.log(room.length)
        if(roomID && roomID.length == 1)
        {
            console.log("in joingame,just before joining")
            socket.join(data.room);
            io.in(data.room).clients((err,clients)=>{
                // console.log(clients)
            })
            socket.broadcast.to(data.room).emit('Player1',data);
            socket.emit('Player2',{
                name:data.name,
                room:data.room
            }) 
        }
        else
        {
            socket.emit('err',{
                message:'Sorry, The room is full!!'
            });
        }
    });
    
   //For updating P2's UI with P1's name    
   socket.on('player-1name',function(player1data){
       socket.broadcast.to(player1data.room).emit('player-1name',{
           oppname:player1data.name
       });
   });
                         
    //Handling turn
    socket.on('turnPlayed',function(data){
        console.log("In turn played",data)
        socket.broadcast.to(data.room).emit('playTurn',{
            position:data.position,
            room:data.room,
            oppmark:data.oppmark
        });
    });
    
    //Player requests opponent for a rematch
    socket.on("Playagain",function(data){
//       socket.broadcast.to(data.room).emit('Playagain');
       socket.broadcast.to(data.room).emit('Playagain');
    });
    
    //Player accepts opponent's request for a rematch
    socket.on("Challenge_accepted",function(data){
//        socket.broadcast.to(data.room).emit('Challenge_accepted');
        socket.broadcast.to(data.room).emit('Challenge_accepted');
    });
    
    //Player rejects opponent's request for a rematch
    socket.on("Challenge_rejected",function(data){
//        socket.broadcast.to(data.room).emit('Challenge_rejected');
        socket.broadcast.to(data.room).emit('Challenge_rejected');
    });  
    
    //Player has quit the game so notifying the opponent
    socket.on("Playerquit",function(data){
        console.log(typeof(data.room))
        socket.broadcast.to(data.room).emit("Opponentquit")
    });  
    
    // socket.on("disconnecting",function(){
    //     var self = this;
    //     var rooms = Object.keys(self.rooms);
    //     // console.log("Disconnecting")
    //     // console.log("Room length",rooms)
    //     var roomID = io.nsps['/'].adapter.rooms[rooms[0]];
    //     // console.log("roomID:",roomID)
    //     if(roomID)
    //     {
    //         // console.log("b4 dlte")
    //         delete io.sockets.adapter.rooms[rooms[0]];
    //     }
    //     // rooms.forEach(function(room){
    //     // });
    // });
});



// app.listen(process.env.PORT || 3001)


// app.listen(process.env.PORT || 3001,function(){
//     // console.log("Server running at port 3000")
// })