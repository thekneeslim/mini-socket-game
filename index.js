var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const connections = []

// configure app to use ejs for templates
app.set('view engine', 'ejs');
app.use(express.static('public'))

app.get('/', function(req, res){
  res.render('index');
});

io.on('connection', function(socket){
  console.log('NEW USER CONNECTED');
  console.log("Socket ID:", socket.id);
  console.log(`## New connection (${socket.id}). Total unregistered: ${connections.length}.`)

  socket.on('disconnect', function(){
    // find the connection and remove  from the collection
    let connection = findConnection(socket.id)
    console.log("Disconnecting connection:", connection);

    if (connection) {
      connections.splice(connections.indexOf(connection), 1)
      if (connection.user) {
        socket.broadcast.emit('left', connection.user)
        socket.broadcast.emit('online', connections)
        console.log(`## ${connection.user.name}(${connection.id}) disconnected. Remaining: ${connections.length}.`)
      } else {
        console.log(`## Connection (${connection.id}) (${socket.id}) disconnected. Remaining: ${connections.length}.`)
      }
    }
    socket.disconnect()
  });

  // listen for a chat message from a socket and broadcast it
  socket.on('join', (userInfo) => {
    connections.push({id: socket.id, user: userInfo})
    let connection = findConnection(socket.id)
    console.log("Connections:", connections);

    if (connections.length == 1) {
      console.log("Changing status to True for ", connections[0].user.name);
      connections[0].user.status = true;
    }

    socket.emit('welcome', userInfo)
    socket.broadcast.emit('joined', userInfo)
    io.sockets.emit('online', connections)

    console.log(`## ${connection.user.name} joined the chat on (${connection.id}).`)
  })

  socket.on('chat message', function(msg){
    let connection = findConnection(socket.id)
    console.log("connection user:", connection.user);
    console.log("Connection:", connection);
    // broadcast to other users
    // socket.broadcast.emit('chatMessage', {message: msg, user: connection.user})
    io.sockets.emit('chatMessage', {message: msg, user: connection.user})

    console.log(`## ${connection.user.name} said: ${msg}`)
  });
});

function findConnection (id) {
  return connections.filter(function (c) { return c.id === id })[0]
}

http.listen(3000, function(){
  console.log('listening on *:3000');
});
