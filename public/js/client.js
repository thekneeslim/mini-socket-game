document.addEventListener("DOMContentLoaded", function() {
  console.log("Second DOM loaded");
  var i = 0;
  var socket = io();
  // create an object for storing our user
  var user = {
    name: 'apple',
    status: false
  }

  // handle form submission for joining the chat
  $('#JoinForm').submit(function (event) {
    user.name = $('#JoinForm input').val();
    user.status = false;
    if (user.name.length === 0) return false

    console.log('Joining chat with name: ', user.name)
    socket.emit('join', {user: user})
    $('#sendJoin').focus()

    $('#dimmerInput').removeClass('active')

    // halt default form behaviour
    return false
  })

  socket.on('welcome', function (user) {
    console.log('Received welcome message: ', user)
    // enable the form and add welcome message

    // Appending question/guessing/word inputs
    if (user.status){
      $("#trueStatus").css("visibility", "visible")
      // $('#leftBar').append(
      //   '<div class="row apple">' +
      //     '<h4>Word to guess!</h4>' +
      //     '<h2>Test</h2>' +
      //   '</div>'
      // )
    } else {
      $("#falseStatus").css("visibility", "visible")
      // $('#leftBar').append(
      //   '<div class="row apple" data-tooltip="The more information you get, the closer you get!" data-inverted="" data-position="bottom right">' +
      //     '<h4>Type your question here!</h4>' +
      //     '<form id="questionForm" class="fluid">' +
      //       '<div class="ui fluid action input">' +
      //         '<input id="question" type="text">' +
      //         '<button class="ui icon teal button">' +
      //           '?' +
      //         '</button>' +
      //       '</div>' +
      //     '</form>' +
      //   '</div>' +
      //
      //   '<div class="row apple">' +
      //     '<h4>Know the answer? Guess it!</h4>' +
      //     '<div class="ui action input">' +
      //       '<input type="text">' +
      //       '<button class="ui icon teal button">' +
      //         'Guess!' +
      //       '</button>' +
      //     '</div>' +
      //   '</div>'
      // )
    }
  })

  // message received that new user has joined the chat
  socket.on('joined', function (user) {
    console.log(user.name + ' joined left the chat.')
  })

  // keep track of who is online
  socket.on('online', function (connections) {
    var names = ''
    console.log('Connections: ', connections)
    for (var i = 0; i < connections.length; ++i) {
      if (connections[i].user) {
        if (i > 0) {
          if (i === connections.length - 1) names += ' and '
          else names += ', '
        }
        names += connections[i].user.name
      }
    }
    // $('#connected').text(names)
  })

  // sending a message
  $('#questionForm').submit(function(){
    socket.emit('chat message', $('#question').val());
    $('#question').val('');
    return false;
  });

  // appending the message to chatbox
  socket.on('chatMessage', function(msg){
    console.log("Message received:", msg);
    // console.log("User:", user);
    $('#chatBox').append(
      '<div class="ui icon message">' +
        '<i class="notched circle loading icon"></i>' +
        '<div class="content">' +
          '<div class="header">' +
            msg.user.name +
           '</div>' +
          '<div><p id="messageInput' + i + '">' + msg.message + '</p></div>' +
        '</div>' +
      '</div>'
    )
    i++
  });


})
