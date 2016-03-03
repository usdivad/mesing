var session;

window.onload = function() {
    console.log("asdf");
    session = new meSing.Session(meSing.defaults);
    session.initGrid();
    // session.initDisplay();
    // session.setVoices();

    // initialize the index display with kyle adams-style grid
    var displayGrid = $("#msDisplay");
    var steps = session.params.steps;
    var numMeasures = session.params.numMeasures;
    var widthScale = 90; // i.e. scale to x%
    var textinput = session.params.textinput;
    var midinoteinput = session.params.midinoteinput;

    for (var i=0; i<steps.length; i++) {
        var col = $("<div class='col-a' id='label" + i + "'><strong>" + steps[i] + "</strong></div>");
        col.css("width", (widthScale/steps.length) + "%");
        displayGrid.append(col);
    }
    for (var i=0; i<numMeasures; i++) {
        displayGrid.append($("<br>"));
        for (var j=0; j<steps.length; j++) {
            var inputIdx = (i*steps.length) + j;
            var id = "measure"+i+"step"+j;
            var col = $("<div class='col-a' id='"+id+"'><input class='textinput' type='text' value='" + textinput[inputIdx] + "'/><br><input class='midinoteinput' type='text' value='" + midinoteinput[inputIdx] + "'/></div>");
            col.css("width", (widthScale/steps.length) + "%");
            displayGrid.append(col);
        }
        displayGrid.append($("<br>"));
    }


    // custom metro function
    var metroFunction = function(stepNum, stepId) {
        var labelId = "label" + stepNum;
        var inputs = $("#"+stepId+">input[type='text']");
        $(".col-a").removeClass("playing");
        $("input[type='text']").removeClass("playing");
        $("#" + labelId).addClass("playing");
        for (var i=0; i<inputs.length; i++) {
            var input = inputs[i];
            if (input !== undefined && input.value.length > 0) {
                inputs.addClass("playing");
            }
        }
    };
    session.setMetroFunction(metroFunction);


    // les boutons
    $("#startBtn").on("click", function(){
        // session.setVoices();
        if (Object.keys(session.lyricToVoice).length > 0) {
            session.metro.start(); 
        }
        else {
            $("#voicesStatus").text("please set voices before starting audio");
        }

        $("#startBtn").prop("disabled", true);
    });
    $("#stopBtn").on("click", function(){
        session.metro.stop();
        session.lyricsCount = 0;
        if (session.voice) {
            session.voice.modulatorGain.disconnect(); // not the best way to do this
        }
        session.voice = null;

        $("#startBtn").prop("disabled", false);
    });
    $("#setVoicesBtn").on("click", function(){
        session.setVoices();
        
        $("#startBtn").prop("disabled", true);
        $("#stopBtn").prop("disabled", true);
    });

    // testing rhymebrain api
    $.getJSON("http://rhymebrain.com/talk?function=getRhymes&word=hello&maxResults=20", function(data) {
        console.log(data);
    });
};