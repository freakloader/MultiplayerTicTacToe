let transition = () =>{
    document.documentElement.classList.add('transition');
    window.setTimeout(()=>{
        document.documentElement.classList.remove('transition');
    },3000)
}


function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

var player,game;
var gameID = uuidv4();

(function()
{
    var arrTic = document.getElementsByClassName("box");
    var opp_name = document.getElementById("opp_name").innerHTML;
    
    
    var socket = io.connect()
    var ID;
    var Playername
    var gamemode;

    $(".choicebutton").hover(
        function () {
          $(this).toggleClass("btn-outline-dark");
        
        },
    );

    var user = $.get('/userinfo',result => {
        user = JSON.parse(result);
        return user
    }).then(result => {return result;})

    

    //Extracting name of user from cookie
    let output = {};
    document.cookie.split(/\s*;\s*/).forEach(pair => {
        pair = pair.split(/\s*=\s*/);
        output[pair[0]] = pair[1]
    });

    //Decoding URI encoding from name and selecting first name
    Playername = decodeURIComponent(output['userName']).split(/\s* \s*/)[0]
    // console.log("Global playername:",Playername)
    
    //Logging out and redirecting to login page
    document.getElementById("logout").onclick = function(event)
    {
        document.cookie = "";
        fetch('/logout',{
            method:"GET",
            headers : { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
            },
        })
        window.location.href="/";
    }
    
    //Player clicks on single player game-mode
    document.getElementById("Singleplayer").onclick = function(event)
    {
        document.getElementById("gamemode").setAttribute("style","display:none");
        document.getElementById("game").setAttribute("style","display:block");
        
        document.getElementById("opp_name").innerHTML = "CPU";
        document.getElementById("player_name").innerHTML = Playername;
        // console.log("Single player username:",Playername)
        
        document.getElementById("right_score").innerHTML = "CPU's score" + "<div id=\"oppscore\">0</div>";
        SingleGame(); 
    }
    
    function SingleGame()
    {   
        var gamestate = {
            finish:false,
            count:0,
        }
        gamemode="Single"
        
        console.log("In singlegame")
        document.getElementById("Playermarkbody").innerHTML = "You are "+ "<b>X</b>"+" in this game."
        $("#Playermark").modal("toggle");
        
        ID = setInterval(() => {
            Check(gamestate)
            // console.log("In setinterval")
            
            if(gamestate.count%2==0 && !gamestate.finish)
            {
                // console.log("Player's turn.Playerturn:",gamestate.playerturn)
                for(let i=0;i<arrTic.length;i++)
                {
                    arrTic[i].onclick = function(){
                        // console.log("In arrtic onclick")

                        if(this.getAttribute("checked")=="true" && gamestate.count%2!=0)
                        {
                            document.getElementById("Msgbody").innerHTML = "This tile is already selected and it's not your turn."
                            $("#Msg").modal("toggle");
                        }
                        else if(this.getAttribute("checked")=="true")
                        {
                            document.getElementById("Msgbody").innerHTML = "This tile is already selected."
                            $("#Msg").modal("toggle");

                        }
                        else if(gamestate.count%2!=0)
                        {
                            document.getElementById("Msgbody").innerHTML = "It's not your turn."
                            $("#Msg").modal("toggle");
                        }
                        else if(this.getAttribute("checked")!="true"  && gamestate.count%2==0)
                        {
                            // console.log("This is not checked")
                            this.setAttribute("checked","true");
                            document.getElementsByClassName("box")[i].style.setProperty("color","#05C8D7");
                            ++gamestate.count;
                            this.innerHTML = "X";
                            changeTurn(gamestate)
                            // console.log("Player's turn.Playerturn now:",gamestate.playerturn)
                        }
                    }
                }
            }
            else if(gamestate.count%2!=0 && !gamestate.finish)// && !gamestate.playerturn)
            {
                // console.log("Gamestate:",gamestate.finish)
                // console.log("CPU's turn.Playerturn:",gamestate.playerturn)
                setTimeout(() => {
                    var board = []
                    
                    for(let i=0;i<arrTic.length;i++)
                    {
                        board[i] = arrTic[i].innerHTML
                        if(board[i] == "")
                            board[i] = i;
                    }
                    
                    var cputurn = minimax(board,"O").index;
                    // console.log("CPU will play:",cputurn)
                    
                    if(arrTic[cputurn].getAttribute("checked")!="true" && gamestate.count < 9)
                    {
                        arrTic[cputurn].setAttribute("checked","true");
                        document.getElementsByClassName("box")[cputurn].style.setProperty("color","#E19A13");//#F1A007");
                        arrTic[cputurn].innerHTML = "O";
                        ++gamestate.count;
                        changeTurn(gamestate)
                        // console.log("CPU's turn.Playerturn now")
                    }
                },500);
            }
            // console.log("Previous has played. count:",gamestate.count)
            
            // console.log("In setinterval. Finish:",gamestate.finish)
        },1000);

        document.getElementById("resetbutton").onclick = function(){
            // console.log("In reset mode")    
            Reset(gamestate);      
        }

        document.getElementById("quitbutton").onclick = function(){
            // console.log("In quit mode")
            document.getElementById("Winmsgbody").innerHTML = "Loading main page ...";
            location.reload();
        }
    }

    function minimax(newBoard,player)
    {
        var availSpots = emptyIndexes(newBoard);

        if(winning(newBoard, "X"))
        {
            return {score:10};
        }
        else if(winning(newBoard, "O"))
        {
            return {score:-10};
        }
        else if(availSpots.length === 0)
        {
            return {score:0};
        }

        var moves = [];

        for (var i = 0; i < availSpots.length; i++)
        {
            var move = {};
            move.index = newBoard[availSpots[i]];
        
            //Set the empty spot to the current player
            newBoard[availSpots[i]] = player;
        
            //If collect the score resulted from calling minimax on the opponent of the current player
            if (player == "O")
            {
              var result = minimax(newBoard, "X");
              move.score = result.score;
            }
            else
            {
              var result = minimax(newBoard, "O");
              move.score = result.score;
            }
        
            //Reset the spot to empty
            newBoard[availSpots[i]] = move.index;
        
            //Push the object to the array
            moves.push(move);
        }

        var bestMove;
        if(player === "O")
        {
            var bestScore = 10000;
            for(var i = 0; i < moves.length; i++)
            {
                if(moves[i].score < bestScore)
                {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        }
        else
        {
            var bestScore = -10000;
            for(var i = 0; i < moves.length; i++)
            {
                if(moves[i].score > bestScore)
                {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        }

        return moves[bestMove];
    }


    function emptyIndexes(board)
    {
        var emptyspaces = []

        for(let i=0;i<board.length;i++)
            if(typeof(board[i]) === "number")
                emptyspaces.push(i)

        return emptyspaces
    }

    function winning(board, player)
    {
        if ((board[0] == player && board[1] == player && board[2] == player) ||
            (board[3] == player && board[4] == player && board[5] == player) ||
            (board[6] == player && board[7] == player && board[8] == player) ||
            (board[0] == player && board[3] == player && board[6] == player) ||
            (board[1] == player && board[4] == player && board[7] == player) ||
            (board[2] == player && board[5] == player && board[8] == player) ||
            (board[0] == player && board[4] == player && board[8] == player) ||
            (board[2] == player && board[4] == player && board[6] == player))
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    function Check(gamestate)
    {
        if(gamestate.count>4 && !gamestate.finish)
        {
            if(checkValue(0,1,2,gamestate))
            {
                gamestate.finish = true;
            }
            else if(checkValue(3,4,5,gamestate))
            {
                gamestate.finish = true;
            }
            else if(checkValue(6,7,8,gamestate))
            {
                gamestate.finish = true;
            }
            else if(checkValue(0,3,6,gamestate))
            {
                gamestate.finish = true;
            }
            else if(checkValue(1,4,7,gamestate))
            {
                gamestate.finish = true;
            }
            else if(checkValue(2,5,8,gamestate))
            {
                gamestate.finish = true;
            }
            else if(checkValue(0,4,8,gamestate))
            {
                gamestate.finish = true;
            }
            else if(checkValue(2,4,6,gamestate))
            {
                gamestate.finish = true;
            }
            else if(gamestate.count>=9)
            {
                clearInterval(ID);
                Show(gamestate);
            }
        }
    }

    function Show(gamestate)
    {
        if(gamestate.count != 9)
        {
            $(document).ready(function() { 
                $("#Winmsg").modal("show"); });
        }
        else
        {
            document.getElementById("Winmsgbody").innerHTML = "The match was a Draw" //"<p align='center'> The match was a DrawThe match</p>";
            $(document).ready(function() { 
            $("#Winmsg").modal("show"); });
        }
    
    }

    function checkValue(x,y,z,gamestate)
    {
        if(arrTic[x].innerHTML == "O" && arrTic[y].innerHTML == "O" && arrTic[z].innerHTML == "O" || arrTic[x].innerHTML == "X" && arrTic[y].innerHTML == "X" && arrTic[z].innerHTML == "X")
        {
            changeother(x,y,z);
            // console.log("Calling clear interval",ID)
            clearInterval(ID);
            Show(gamestate.count);
            if(arrTic[x].innerHTML == "O")
            {
                if(!gamestate.finish)
                {
                    document.getElementById("Winmsgbody").innerHTML = "<p align='center'>CPU wins</p>";
                    document.getElementById("oppscore").innerHTML++
                    document.getElementById("secondoppscore").innerHTML++
                }
            }
            else
            {
                if(!gamestate.finish)
                {
                    document.getElementById("Winmsgbody").innerHTML = "<p align='center'>You won</p>";
                    document.getElementById("playerscore").innerHTML++ 
                    document.getElementById("secondplayerscore").innerHTML++ 
                }
            }
            // console.log("In checkValue")
            // console.log("Gamemode:",gamemode)
            return true;
        }
        else
            return false;
    }

    function changeother(a,b,c)
    {
        for(var i=0;i<arrTic.length;i++)
        {
            if(i!=a && i!=b && i!=c)
            {
                arrTic[i].innerHTML ="";
            }
        }
    }

    function changeTurn(gamestate)
    {
        // console.log("In changeturn ",gamestate.count)
        if(gamestate.count%2==0)
        {
            document.getElementById("player_name").setAttribute("style","background-color:var(--select-color)");
            document.getElementById("opp_name").setAttribute("style","background-color:transparent");
        }
        else
        {
            document.getElementById("player_name").setAttribute("style","background-color:transparent");
            document.getElementById("opp_name").setAttribute("style","background-color:var(--select-color)");
        }
        
    }

    function Reset(gamestate)
    {
        gamestate.count = 0;
        gamestate.finish = false;
        changeTurn(gamestate)
        
        for(var i=0;i<arrTic.length;i++)
        {
            arrTic[i].setAttribute("checked","false");
            arrTic[i].innerHTML ="";
        }
        $("#Winmsg").modal("toggle");
        SingleGame()

    }

    //Player clicks on two player game-mode
    document.getElementById("Twoplayer").onclick = event => {
        gamemode="Twoplayer"
        event.preventDefault();
        // console.log("IN twoplayergame")
        document.getElementById("gamemode").setAttribute("style","display:none");
        document.getElementById("multimode").setAttribute("style","display:flex");
    }
    
    //Player clicks on newgame in two player mode
    document.getElementById("newgame").onclick = event => {

        //To let the game know that the player wants a two player mode
        gamemode="Twoplayer"
        // console.log("in two play newgame")
        document.getElementById("multimode").setAttribute("style","display:none");
        document.getElementById("game").setAttribute("style","display:block");

        document.getElementById("player_name").innerHTML = Playername;
        socket.emit('createNewGame',{
            name:Playername
        });
        player = new Player(Playername,"X");
    }
    
    //Joining an existing game
    document.getElementById("joingame").onclick = event => {
        event.preventDefault();
        var roomID = document.getElementById("roomID").value;
        // console.log("In joingame")

        document.getElementById("player_name").innerHTML = Playername;
        
        //Checking if entered roomID is valid or not,i.e., if the room has been created or not.
        $.post('/roomlength',{ID:roomID}, result => {
            // console.log("POSTING roomlength")

            if(!roomID)
            {
                document.getElementById("Msgbody").innerHTML = "Please enter the room ID before joining."
                $("#Msg").modal("show");
            }
            else if(result == "Full")
            {
                document.getElementById("Msgbody").innerHTML = "The room ID you entered is full.Please try some other room."
                $("#Msg").modal("toggle");
            }
            else if(result == "Invalid")
            {
                document.getElementById("Msgbody").innerHTML = "The room ID you entered doesn't exist yet.Please try some other room."
                $("#Msg").modal("toggle");
            }
            else if(result == "Notfull")
            {
                ChangepageTwoPlayer()
                // console.log("In joingame,just before emit")
                socket.emit("joinGame",{
                    name:Playername,
                    room:roomID
                });
                player = new Player(Playername,"O");
            }  
        }) 
    }
    
    //Match history click
    document.getElementById("History").onclick = () => {
        // console.log("In History mode");
        window.location.href="/history";
    }

    //Requesting the opponent for a rematch
    document.getElementById("resetbutton").onclick = () => {
        // console.log("In reset mode")    
        if(gamemode == "Single")
        {
            Reset();
        }
        else
        {
            let msg = "Waiting for "+"<b>"+opp_name+"</b>"+"'s reply";   
            game.showcustommodal(msg)
            game.Playagain(); 
        }       
    }
    
    //Quiting the game
    document.getElementById("quitbutton").onclick = () => {
        // console.log("In quit mode")
        if(gamemode == "Single")
        {
            game.showcustommodal("Loading main page ...");
            location.reload();
        }
        else
        {
            socket.emit("Playerquit",{
                room:game.getRoomID()
            })
            game.showcustommodal("Loading main page ...");
            location.reload();
        }
    }
    
    //Accepting the rematch request
    document.getElementById("yesbutton").onclick = () => {
        socket.emit("Challenge_accepted",{
            room:game.getRoomID()
       });
        game.Reset();
    }
    
    //Rejecting the rematch request
    document.getElementById("nobutton").onclick = () => {
        socket.emit("Challenge_rejected",{
            room:game.getRoomID()
       });
        game.showcustommodal("You have rejected the challenge. Redirecting you to the main page in 5 seconds.")
        setTimeout(function(){
            game.showcustommodal("Loading main page ...");
            location.reload()
        },5000);
    }

    //Two Player Game
    class Player
    {
        constructor(name,markname)
        {
            this.name = name;
            this.mark = markname;
            this.oppmark = markname == "O"?"X":"O";
            this.currentTurn = true;
            this.movesPlayed = 0;
            this.gamestarted = false;
        }   

        getgamestarted()
        {
           return this.gamestarted; 
        }
        
        setgamestarted()
        {
            this.gamestarted = true;
        }
        
        updatemovesnum()
        {
            this.movesPlayed++;
        }

        getmovesnum()
        {
            return this.movesPlayed;
        }

        setturn(turn)
        {
            this.currentTurn=turn;
            if(turn)
            {
                //Change turn color here
                document.getElementById("player_name").setAttribute("style","background-color:var(--select-color)");
                document.getElementById("opp_name").setAttribute("style","background-color:transparent");
                
            }
            else
            {
                //Change turn color here
                document.getElementById("player_name").setAttribute("style","background-color:transparent");
                document.getElementById("opp_name").setAttribute("style","background-color:var(--select-color)");
            }
        }

        getPlayerName()
        {
            return this.name;
        }

        getPlayerMark()
        {
            return this.mark;
        }
        
        setPlayerMark(mark)
        {
            this.mark = mark;
        }
        
        getOpponentMark()
        {
            return this.oppmark;
        }

        getcurrentTurn()
        {
            return this.currentTurn;
        }
    }
    
    class Game
    {
        constructor(roomID)
        {
            this.roomID = roomID;
            this.finish = false
            this.count = 0;
        }

        getRoomID()
        {
            return this.roomID;
        }
        
        updatecount()
        {
            this.count++;
        }
        
        getcount()
        {
            return this.count;
        }
        
        getfinish()
        {
            return this.finish;
        }
        
        setfinish(val)
        {
            this.finish = val;
        }
        
        setcount(val)
        {
            this.count = 0;
        }
        
        game()
        {
            for(let i=0;i<arrTic.length;i++)
            {
              arrTic[i].onclick = function(){
                  
                if(this.getAttribute("checked")=="true" && !player.getcurrentTurn() && !game.getfinish())
                {
                    document.getElementById("Msgbody").innerHTML = "This tile is already selected and it's not your turn."
                    $("#Msg").modal("toggle");
                }
                else if(this.getAttribute("checked")=="true" && !game.getfinish())
                {
                    document.getElementById("Msgbody").innerHTML = "This tile is already selected."
                    $("#Msg").modal("toggle");

                }
                else if(!player.getcurrentTurn() && !game.getfinish())
                {
                    document.getElementById("Msgbody").innerHTML = "It's not your turn."
                    $("#Msg").modal("toggle");
                }
                else if(this.getAttribute("checked")!="true" && player.getcurrentTurn() && !game.getfinish())
                {
                  this.setAttribute("checked","true");
                  this.innerHTML = player.getPlayerMark();

                  //Setting player's mark to blue color
                  document.getElementsByClassName("box")[i].style.setProperty("color","#05C8D7");
                  
                  player.setturn(false);
                  game.updatecount()
                  game.turnPlayed(i)
                }
                game.Check()
              }
            }  
        }
        
        showcustommodal(msg)
        {
            document.getElementById("Winmsgbody").innerHTML = msg;
        }
        
        turnPlayed(tile)
        {
            game.TurnCheck()
            socket.emit("turnPlayed",{
                position:tile,
                room:game.getRoomID(),
                oppmark:player.getPlayerMark()                      
           })
        }
        
        TurnCheck()
        {
            if(game.getcount() == 0 || player.getcurrentTurn())
            {
                document.getElementById("player_name").setAttribute("style","background-color:var(--select-color)");
                document.getElementById("opp_name").setAttribute("style","background-color:transparent"); 
            }
            else
            {
                document.getElementById("player_name").setAttribute("style","background-color:transparent");
                document.getElementById("opp_name").setAttribute("style","background-color:var(--select-color)");
            }
        }
        
        Check()
        {
          if(!game.getfinish())
          {
            // console.log("Game count:",game.getcount());
            if(game.checkValue(0,1,2))
            {
                game.setfinish(true);
                game.showresult();
            }
            else if(game.checkValue(3,4,5))
            {
                game.setfinish(true);
                game.showresult();
            }
            else if(game.checkValue(6,7,8))
            {
                game.setfinish(true);
                game.showresult();
            }
            else if(game.checkValue(0,3,6))
            {
                game.setfinish(true);
                game.showresult();
            }
            else if(game.checkValue(1,4,7))
            {
                game.setfinish(true);
                game.showresult();
            }
            else if(game.checkValue(2,5,8))
            {
                game.setfinish(true);
                game.showresult();
            }
            else if(game.checkValue(0,4,8))
            {
                game.setfinish(true);
                game.showresult();
            }
            else if(game.checkValue(2,4,6))
            {
                game.setfinish(true);
                game.showresult();
            }
            else if(game.getcount() == 9)
            {
                game.setfinish(true);
                game.showresult();
                document.getElementById("Winmsgbody").innerHTML = "The match was a Draw";
            } 
          }
        }
        
        showresult()
        {
            $("#Winmsg").modal("show");
        }
        
        //Shows request from other player's side
        Playagainshow()
        {
            $("#Winmsg").modal("toggle");
            document.getElementById("Playagainmsgbody").innerHTML = "<b>"+opp_name+"</b>" + " wants a rematch. Do you want to continue?"
            $("#Playagainmsg").modal("toggle");
        }
        
        checkValue(x,y,z)
        {
            // console.log("IN checkvalue")
            if(arrTic[x].innerHTML == "O" && arrTic[y].innerHTML == "O" && arrTic[z].innerHTML == "O" || arrTic[x].innerHTML == "X" && arrTic[y].innerHTML == "X" && arrTic[z].innerHTML == "X" )
            {
                game.changeother(x,y,z);
                let player_name = document.getElementById("player_name").innerHTML;
                
                if(arrTic[x].innerHTML == "O" && player.getPlayerMark() == "O" || arrTic[x].innerHTML == "X" && player.getPlayerMark() == "X")
                {
                    document.getElementById("Winmsgbody").innerHTML = "<b>"+player_name+"</b>"+" wins";
                    document.getElementById("playerscore").innerHTML++ 
                    document.getElementById("secondplayerscore").innerHTML++ 
                }
                else
                {
                    document.getElementById("Winmsgbody").innerHTML = "<b>"+opp_name+"</b>"+" wins";
                    document.getElementById("oppscore").innerHTML++
                    document.getElementById("secondoppscore").innerHTML++
                }

                // console.log("UUID:",gameID)
                let matchresult = {
                        matchID:gameID,
                        playerA:Playername,
                        playerAscore:document.getElementById("playerscore").innerHTML,
                        playerBscore:document.getElementById("oppscore").innerHTML,
                        playerB:opp_name
                }

                //Updating match result in DB
                $.post('/addmatchdata',matchresult, result => {
                    // console.log("POSTING addmatchdata")
                    // console.log("Result:",result)    
                });
                return true;
            }
          else
            return false;
        }
        
        changeother(a,b,c)
        {
          for(var i=0;i<arrTic.length;i++)
          {
            if(i!=a && i!=b && i!=c)
            {
                arrTic[i].innerHTML ="";
            }
          }
        }
        
        Playagain()
        {
            socket.emit("Playagain",{
                room:game.getRoomID()
           });
        }
        
        Reset()
        {
          game.setcount(0);
          game.TurnCheck();
          game.setfinish(false);
            
          if(player.getPlayerMark() == "X")
          {
              player.setPlayerMark("O");
              player.setturn(false);
          }
          else
          {
              player.setPlayerMark("X");
              player.setturn(true);
          }
        
          for(var i=0;i<arrTic.length;i++)
          {
            arrTic[i].setAttribute("checked","false");
            arrTic[i].innerHTML ="";
          }
          document.getElementById("Playermarkbody").innerHTML = "You are "+ "<b>"+player.getPlayerMark()+"</b>"+" in this game."
          $("#Playermark").modal("toggle");
          game.game()
        }
    }
    
    
    function ChangepageTwoPlayer()
    {
        document.getElementById("multimode").setAttribute("style","display:none");
        document.getElementById("game").setAttribute("style","display:block");
        document.getElementById("gameh1").setAttribute("style","display:none");
        document.getElementById("h2").setAttribute("style","display:flex");
        document.getElementById("gamelogo").setAttribute("style","display:block");
    }
    
    socket.on('newGame',function(data){
        document.getElementById('h2').innerHTML="Room ID:  "+ data.room;
       
        //Setting player_name on player-1 side
        document.getElementById('player_name').innerHTML = data.name; 

        game = new Game(data.room);
        // console.log("In new game event ")
        ChangepageTwoPlayer();
    })
    
    socket.on('Player1',function(data){
        player.setturn(true);
        // console.log("In Player1")
         
        //Setting opp_name on player-1 side
        document.getElementById('opp_name').innerHTML = data.name;

        //Updating opponent's name in global variable 'opp_name'
        opp_name = data.name;

        player.setgamestarted()
        
        document.getElementById("Playermarkbody").innerHTML = "You are "+"<b>"+player.getPlayerMark()+"</b>"+" in this game."
        $("#Playermark").modal("toggle");
        game.game()
        
        //Checking every five seconds if opponent in the same room has left the game or not
        var ID = game.getRoomID()
        setInterval(function(){
            
            $.post('/roomlength',{ID}, result => {
                // console.log("POSTING roomlength")
                if(result == "Notfull")
                {
                    game.showcustommodal("<b>"+opp_name+"</b>"+" has left the game.<br/>Redirecting you to the main page in 5 seconds.");
                    $("#Winmsg").modal("toggle");
                    setTimeout(function(){
                        game.showcustommodal("Loading main page ...");
                        location.reload()
                    },5000);
                }    
            });
        }, 5000);

        // console.log("In player1  on P1 side")
        socket.emit('player-1name',{
            name:player.getPlayerName(),
            room:game.getRoomID()
        });
        
    })
    
    socket.on('Player2',function(data){
        console.log("In Player2")
        player.setturn(false);
        player.setgamestarted()
        document.getElementById('player_name').innerHTML = data.name
        document.getElementById('h2').innerHTML="Room ID: "+data.room;  
        game = new Game(data.room)

        document.getElementById("Playermarkbody").innerHTML = "You are "+ "<b>"+player.getPlayerMark()+"</b>"+" in this game."
        $("#Playermark").modal("toggle");
        game.game()
        ChangepageTwoPlayer();
        
    })
    
    //Updating Player-1's Name in Player-2's UI
    socket.on('player-1name',function(data){
        document.getElementById('opp_name').innerHTML = data.oppname;

        //Updating opponent's name in global variable 'opp_name'
        opp_name = data.oppname;
        
        // console.log("In player-1name")
        
        //Checking every five seconds if opponent in the same room has left the game or not
        var ID = game.getRoomID()
        setInterval(function(){
            $.post('/roomlength',{ID}, function(result) {
                // console.log("POSTING roomlength")
                if(result == "Notfull")
                {
                    game.showcustommodal("<b>"+opp_name+"</b>"+" has left the game. <br/>Redirecting you to the main page in 5 seconds.");
                    $("#Winmsg").modal("toggle");
                    setTimeout(function(){
                        game.showcustommodal("Loading main page ...");
                        location.reload()
                    },5000);
                }    
            });
        }, 5000);  
    });
    
    //Tells current player that they can play their turn
    socket.on('playTurn',function(data){
        if(arrTic[data.position].getAttribute("checked")!="true")
        {
            arrTic[data.position].innerHTML = data.oppmark;
            arrTic[data.position].setAttribute("checked","true");
            //Setting opponent's mark to orange color
            document.getElementsByClassName("box")[data.position].style.setProperty("color","#E19A13");//#F1A007");
            game.updatecount();
            game.Check();
        }
        player.setturn(true);
        game.TurnCheck();
        game.game();
    });
    
    //Opponent wants to playagain
    socket.on("Playagain",() => {    
        game.Playagainshow()
    });
    
    //Opponent accepted rematch request
    socket.on("Challenge_accepted",() => {
        $("#Winmsg").modal("toggle");
        game.Reset();
    });
    
    //Opponent rejected rematch request
    socket.on("Challenge_rejected",() => {
        game.showcustommodal("<b>"+opp_name+"</b>"+" has rejected your challenge. Redirecting you to the main page in 5 seconds.")
        setTimeout(function(){
            game.showcustommodal("Loading main page ...");
            location.reload()
        },5000);
    });
    
    socket.on("Opponentquit",() => {
        game.showcustommodal("<b>"+opp_name+"</b>"+" has quit the game.Redirecting you to the main page in 5 seconds.");
        setTimeout(function(){
            game.showcustommodal("Loading main page ...");
            location.reload()
        },5000);
    });

            
    try
    {
        document.documentElement.addEventListener("click", function(event){
            
            // console.log("Global user:",user)
            if(gamemode=="Twoplayer" && !player.getgamestarted() && !game.getfinish())
            {
                //Adding an exception for homebutton
                if(event.target.id != 'gamelogo')
                {
                    document.getElementById("Msgbody").innerHTML = "The game hasn't started. The opponent hasn't joined yet."
                    $("#Msg").modal("toggle");
                }
            }
                
            //Making sure that 'closebutton', 'resetbutton' and 'quitbutton'  don't have event listeners attached
            if(event.target.id == "closebutton" || event.target.id == "resetbutton"  || event.target.id == "quitbutton")
                return;

            
            if(gamemode=="Twoplayer" && game.getfinish() == true && game.getcount()!=9)
            {
                let modaltext = document.getElementById("Winmsgbody").innerHTML
                modaltext = modaltext.substring(0,modaltext.indexOf(" ")) + " has won the game";
                
                //Todo On P1 side, won message replaces win msg.
                document.getElementById("Winmsgbody").innerHTML = modaltext
                $("#Winmsg").modal("show");
            }
        });
    }catch(err)
        {
        }
})();

