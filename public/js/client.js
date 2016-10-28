document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM loaded");
  var i = 0;
  var z = 0;
  var socket = io();
  var turnStatus = false;
  // create an object for storing our user
  var user = {
    name: 'apple',
    icon: '',
    status: false,
    score: 0
  }

  // BORDER FOR CLICKED icon
  $(":radio").click(function() {
    $(this).closest("div").addClass("clickedIcon")
    // $(this).closest("div").addClass("clickedIcon").parent.siblings.removeClass("clickedIcon");
  })


  // FORM SUBMISSION TO JOIN CHAT
  $('#JoinForm').submit(function (event) {
    var iconStatus = $('#JoinForm input[name="avatar"]:checked').val()
    if (!iconStatus) {
      user.icon = 'thumbs outline down icon'
    } else {
      user.icon = $('#JoinForm input[name="avatar"]:checked').val()
    }

    user.name = $('#JoinForm input[name=name]').val();
    user.status = false;
    if (user.name.length === 0) return false

    socket.emit('join', {user: user})
    $('#sendJoin').focus()
    $('#dimmerInput').removeClass('active')

    return false
  })

  // APPENDING LAYOUT
  socket.on('layout', function (user) {
    var word = user.word

    // Appending question/guessing/word inputs
    if (user.userInfo.user.status){
      turnStatus = true;
      $("#trueStatus").css("visibility", "visible")
      $("#guesingWord").text("" + word + "")
    } else {
      $("#falseStatus").css("visibility", "visible")
    }

    $("#chatContainer").css("visibility", "visible")

    // enable the form and add welcome message
    $("#noticeUpdate").empty()
    $("#noticeUpdate").append(
      '<button class="ui teal button maxWidth" id="notice' + z + '"> Welcome ' + user.userInfo.user.name + '!</button>'
    )
    fadeEmpty(z)
    z++
  })

  // message received that new user has joined the chat
  socket.on('joined', function (user) {
    console.log(user.name + ' joined the chat.')
  })

  // UPDATE SIDEBAR
  socket.on('online', function (connections) {
    console.log("connections:", connections);
    drawSideBar(connections)
  })

  // sending a message
  $('#questionForm').submit(function(){
    socket.emit('chat message', $('#question').val());
    $('#question').val('');
    return false;
  });

  // appending the message to chatbox
  socket.on('chatMessage', function(msg){
    // console.log("User:", user);
    if (turnStatus) {
      $('#chatBox').append(
        '<div class="ui icon message messageLength" id="messageInput' + i + '">' +
          '<div id="statusMsg' + i + '" class="messageIcon">' +
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
        '<div class="ui icon message messageLength" id="messageInput' + i + '">' +
          '<div id="statusMsg' + i + '" class="messageIcon">' +
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
      '<button class="ui orange button maxWidth" id="notice' + z + '">Nope! Try again!</button>'
    )
    fadeEmpty(z)
    z++
  })

  // Broadcast to wrong answer
  socket.on('failedGuess', function (wrongAnswer) {
    // $("#noticeUpdate").empty()
    $("#noticeUpdate").append(
      '<button class="ui orange button maxWidth" id="notice' + z + '">' + wrongAnswer + ' was wrongly guessed!</button>'
    )
    fadeEmpty(z)
    z++
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
    console.log("Right Answer:", rightAnswer);
    var answer = rightAnswer.answer.charAt(0).toUpperCase() + rightAnswer.answer.slice(1);
    var user = rightAnswer.user.user.user.name
    var score = rightAnswer.user.user.user.score
    var connection = rightAnswer.connections
    $("#noticeUpdate").empty()
    $("#noticeUpdate").append(
      '<button class="ui green button maxWidth">' + answer + ' was correctly guessed by ' + user + '!!!</button>'
    )
    $('#guessForm :input').attr("disabled", true);

    $(".previousAnswers").append(
      '<button class="ui blue button">' +  answer + '</button>'
    )

    if (turnStatus) {
      $("#noticeUpdate").append(
        '<button class="ui blue button maxWidth" id="resetBtn">Reset?</button>'
      )
    }
    drawSideBar(connection)
  })

  // RESETTING
  $(document).on('click','#resetBtn',function() {
    socket.emit('reset');
  });

  socket.on('resetting', function (newWord) {
    if (turnStatus) {
      $("#guesingWord").empty()
      $("#guesingWord").text("" + newWord + "")
    }
    $('#guessForm :input').attr("disabled", false);
    $(".failedGuess").empty()
    $("#chatBox").empty()
    $("#noticeUpdate").empty()


  })

  // =============== FUNCTIONS ===============

  function fadeEmpty(num) {
    setTimeout(function(){
      $('#notice' + num + '').remove()
    }, 3000);
  }

  function drawSideBar(connections) {
    console.log("Inside function", connections);
    // var description = "The role of the moderator will be allocated to one person. The rest of the participants will have to ask the moderator questions resuting in yes/no answers. A point will be given to the person who guessed the word correctly"

    $("#userBar").empty()
    $("#userBar").append(
      '<a class="item" data-inverted="" data-tooltip="Are you ready to play? :)" data-position="right center">' +
      'GUESS ME!!!' +
      '<i class="help icon"></i>' +
      '</a>'
    )

    for (var k = 0; k< connections.length; k++) {
      $("#userBar").append(
        '<a class="item" data-inverted="" data-tooltip="Score: ' + connections[k].user.user.score + '" data-position="right center">' +
        '<i class="' + connections[k].user.user.icon + '"></i>' +
        connections[k].user.user.name +
        '</a>'
      )
    }
  }

})
