document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM loaded");
  var i = 0;
  var socket = io();
  var turnStatus = false;
  // create an object for storing our user
  var user = {
    name: 'apple',
    icon: '',
    status: false
  }

  // highlight radio button$(function(){
  // $('#JoinForm input[name="avatar"]').click(function(){
  //   if ($(this).is(':checked')) {
  //     $(this).css("background-color", "black"));
  //   }
  // });

  // handle form submission for joining the chat
  $('#JoinForm').submit(function (event) {
    var iconStatus = $('#JoinForm input[name="avatar"]:checked').val()
    if (!iconStatus) {
      user.icon = 'thumbs outline down icon'
    } else {
      user.icon = $('#JoinForm input[name="avatar"]:checked').val()
    }
    console.log(user.icon);

    user.name = $('#JoinForm input[name=name]').val();
    console.log(user.name);
    user.status = false;
    if (user.name.length === 0) return false

    console.log('Joining chat with name: ', user.name)
    socket.emit('join', {user: user})
    $('#sendJoin').focus()
    $('#dimmerInput').removeClass('active')

    return false
  })

  // APPENDING LAYOUT
  socket.on('layout', function (user) {
    console.log('Received welcome message: ', user)
    var word = user.word
    console.log("Word:", word);
    // enable the form and add welcome message


    // Appending user to bar
    // $("#userBar").append(
    //   '<a class="item">' +
    //     '<i class="' + user.userInfo.user.icon + '"></i>' +
    //       user.userInfo.user.name +
    //   '</a>'
    // )

    // Appending question/guessing/word inputs
    if (user.userInfo.user.status){
      turnStatus = true;
      $("#trueStatus").css("visibility", "visible")
      $("#guesingWord").text(""+word+"")
    } else {
      $("#falseStatus").css("visibility", "visible")
    }
    $("#noticeUpdate").empty()
    $("#noticeUpdate").append(
      '<button class="ui teal button maxWidth"> Welcome ' + user.userInfo.user.name + '!</button>'
    )

    fadeEmpty()
;
  })

  // message received that new user has joined the chat
  socket.on('joined', function (user) {
    console.log(user.name + ' joined left the chat.')
  })

  // keep track of who is online
  socket.on('online', function (connections) {
    console.log(connections);
    $("#userBar").empty()
    $("#userBar").append(
      '<a class="item" data-tooltip="Add users to your feed" data-position="right center">' +
      '<i class="help icon"></i>' +
        'Instructions' +
      '</a>'
    )

    for (var k = 0; k< connections.length; k++) {
      $("#userBar").append(
        '<a class="item">' +
        '<i class="' + connections[k].user.user.icon + '"></i>' +
        connections[k].user.user.name +
        '</a>'
      )
    }


    // var names = ''
    // console.log('Connections: ', connections)
    // for (var i = 0; i < connections.length; ++i) {
    //   if (connections[i].user) {
    //     if (i > 0) {
    //       if (i === connections.length - 1) names += ' and '
    //       else names += ', '
    //     }
    //     names += connections[i].user.name
    //   }
    // }
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
    if (turnStatus) {
      $('#chatBox').append(
        '<div class="ui icon message" id="messageInput' + i + '">' +
          '<div id="statusMsg' + i + '">' +
            '<button class="ui negative button no">No</button>' +
            '<button class="ui positive button yes">Yes</button>' +
          '</div>' +
          '<div class="content">' +
            '<div class="header">' +
              msg.user.user.name +
             '</div>' +
            '<div><p>' + msg.message + '</p></div>' +
          '</div>' +
        '</div>'
      )
    } else {
      $('#chatBox').append(
        '<div class="ui icon message" id="messageInput' + i + '">' +
          '<div id="statusMsg' + i + '">' +
            '<i class="notched circle loading icon"></i>' +
          '</div>' +
          '<div class="content">' +
            '<div class="header">' +
              msg.user.user.name +
             '</div>' +
            '<div><p>' + msg.message + '</p></div>' +
          '</div>' +
        '</div>'
      )
    }
    i++
  });

  // HANDLE YES/NO CLICK
  $(document).on('click','.yes',function(){
    var iconID = $(this).parent().attr("id")
    var parentID = $(this).parent().parent().attr("id");
    socket.emit('update', {iconID: iconID, parentID: parentID, status: true})
  })

  $(document).on('click','.no',function(){
    var iconID = $(this).parent().attr("id")
    var parentID = $(this).parent().parent().attr("id");
    socket.emit('update', {iconID: iconID, parentID: parentID, status: false})
  })

  // updating status message
  socket.on('updating', function (msgUpdate) {
    var parentID =  msgUpdate.message.parentID
    var status = msgUpdate.message.status
    console.log(msgUpdate);

    $("#"+ msgUpdate.message.iconID + "").empty()

    if (status) {
      $("#"+ msgUpdate.message.iconID + "").append("<i class='checkmark icon'></i>")
      $("#"+ msgUpdate.message.parentID + "").addClass("blue")
    } else {
      $("#"+ msgUpdate.message.iconID + "").append("<i class='remove icon'></i>")
      $("#"+ msgUpdate.message.parentID + "").addClass("negative")
    }
  })

  // HANDLING GUESSING
  $('#guessForm').submit(function (event) {
    var answer = $('#guessForm input').val();
    if (user.name.length === 0) return false

    console.log('Guessing: ', answer.toLowerCase())
    socket.emit('guessAnswer', answer.toLowerCase())
    $('#sendGuess').focus()
    $('#guessForm input').val("");

    return false
  })

  // WRONG answer
  // Emit to person why guessed
  socket.on('userWrong', function (wrongAnswer) {
    // $("#noticeUpdate").empty()
    $("#noticeUpdate").append(
      '<button class="ui orange button maxWidth">Nope! Try again!</button>'
    )
    fadeEmpty()
  })

  // Broadcast to wrong answer
  socket.on('failedGuess', function (wrongAnswer) {
    // $("#noticeUpdate").empty()
    console.log(wrongAnswer);
    $("#noticeUpdate").append(
      '<button class="ui orange button maxWidth">' + wrongAnswer + ' was wrongly guessed!</button>'
    )
    fadeEmpty()
  })

  // Updating list of wrong answers
  socket.on('updateFailedList', function (wrongAnswer) {
    var answer = wrongAnswer.charAt(0).toUpperCase() + wrongAnswer.slice(1);
    $(".failedGuess").append(
      '<button class="ui orange button failedBtn">' + wrongAnswer + '</button>'
    )
  })

  // RIGHT ANSWER
  socket.on('rightAnswer', function (rightAnswer) {
    var answer = rightAnswer.answer.charAt(0).toUpperCase() + rightAnswer.answer.slice(1);
    var user = rightAnswer.user.user.user.name
    $("#noticeUpdate").empty()
    $("#noticeUpdate").append(
      '<button class="ui green button maxWidth">' + answer + ' was correctly guessed by ' + user + '!!!</button>'
    )
  })


  // =============== FUNCTIONS ===============

  function fadeEmpty() {
    // setTimeout(function(){
    //   $('#noticeUpdate').transition('fade')
    // }, 2000);
    setTimeout(function(){
      $('#noticeUpdate').empty()
    }, 2200);
  }

  // $('.ui.radio.checkbox').checkbox()

})
