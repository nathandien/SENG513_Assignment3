var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http, { wsEngine: 'ws' });
var users = [];
var messages = [];

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

	// Generates a username based off time
	var username = 'User'	+ (new Date().getUTCMilliseconds().toString());
	// Logs user connection to console
	var connectMsg = username + ' has connected';
	console.log(connectMsg);
	socket.broadcast.emit('server message', connectMsg);
	// Pushes username to list of connected users
	users.push(username);
	// Displays generated username to client
	socket.emit('client message', 'You are ' + username);
	// Displays users currently connected to server to new client
	socket.emit('client message', 'Users connected:' + users);
	// Displays all old messages to new client
	socket.emit('display messages', messages);
	// Sends new username to userlist of other clients
	socket.broadcast.emit('add user', username);
	// Sends userlist to new client
	for(let aName of users) {
		socket.emit('add user', aName);
	}
	// Adds new user to other clients' userlist
	socket.on('get userlist', function() {
		socket.broadcast.emit('add user', username);
	});
	
	// User disconnected from server
	socket.on('disconnect', function(){
		var disconnectMsg = username + ' has disconnected';
		// Log to console
		console.log(disconnectMsg);
		// Emit disconnect message to other clients
		io.emit('server message', disconnectMsg);
		// Deletes oldest message if number of stored messages > 200
		if(messages.length > 200) {
			messages.shift();
		}
		// Empties userlist of other clients
		io.emit('disconnect', username);
		// Filters out current username and removes them from connected users
		users = users.filter(function(obj) {
			return obj !== username;
		});
		// Sends up-to-date userlist to all clients
		for(let aName of users) {
			io.emit('add user', aName);
		}
	});
	
	socket.on('chat message', function(msg){
		// Gets current time
		var d = new Date();
		var time = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
		// Form message
		time = username.concat('(' + time + ')');
		msg = time.concat(":", msg);
		
		// Logs message to console
		console.log(msg);
		// Stores message
		messages.push(msg);
		// Deletes oldest message if number of stored messages > 200
		if(messages.length > 200) {
			messages.shift();
		}

		socket.emit('client message', msg);
		// Emit message to all clients
		socket.broadcast.emit('server message', msg);
		
	});
	
	socket.on('change name', function(name){
		
		var nameUsed = false;
		
		// Check if name is already in use
		for(let aName of users) {
			if(aName.toLowerCase() === name.toLowerCase()) {
				nameUsed = true;
				break;
			}
		}
		
		if(nameUsed !== true) {
			// Empties userlist of other clients
			io.emit('disconnect', username);
			// Filters out current username and removes them from connected users
			users = users.filter(function(obj) {
				return obj !== username;
			});
			users.push(name);
			
			// Sends up-to-date userlist to all clients
			for(let aName of users) {
				io.emit('add user', aName);
			}
			
			// Gets current time
			var msg = username + ' has changed their name to ' + name;
		

			// Changes username
			username = name;
			// Stores message
			messages.push(msg);
			

			if(messages.length > 200) {
				messages.shift();
			}
			
			io.emit('client message', msg);
		}
		else {
			
			socket.emit('server message', name + " is already being used!");
			
		}
	});
	
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
/*
window.onload = function() {

    var messages = [];
    var socket = io.connect('http://localhost:3700');
    var field = document.getElementById("field");
    var sendButton = document.getElementById("send");
    var content = document.getElementById("content");
    var name = document.getElementById("name");

    socket.on('message', function (data) {
        if(data.message) {
            messages.push(data);
            var html = '';
            for(var i=0; i<messages.length; i++) {
                html += '<b>' + (messages[i].username ? messages[i].username : 'Server') + ': </b>';
                html += messages[i].message + '<br />';
            }
            content.innerHTML = html;
        } else {
            console.log("There is a problem:", data);
        }
    });

    sendButton.onclick = function() {
        if(name.value == "") {
            alert("Please type your name!");
        } else {
            var text = field.value;
            socket.emit('send', { message: text, username: name.value });
        }
    };

 */