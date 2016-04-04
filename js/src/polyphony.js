var singer1;

window.onload = function() {
    console.log("asdf");
    var defaultParams = $.extend({}, meSing.defaults);
    defaultParams.bpm = 60;

    var params1 = $.extend({}, defaultParams);
    var params2 = $.extend({}, defaultParams);
    var params3 = $.extend({}, defaultParams);
    var params4 = $.extend({}, defaultParams);

    // Templates
    params1.textinput =     ["","","","","","","","", "","","","","","","","",
                             "","","","","","","","", "","","","","","","","",
                             "","","","","","","","", "","","","","","","","",
                             "","","","","","","","", "","","","","","","",""];
    params1.midinoteinput = ["","","","","","","","", "","","","","","","","",
                             "","","","","","","","", "","","","","","","","",
                             "","","","","","","","", "","","","","","","","",
                             "","","","","","","","", "","","","","","","",""];

    // Testing
    // params1.textinput = ["la","","","","la","","","", "one","","","","","","","",
    //                     "two","","","","la","","","", "la","","","","","","","",
    //                     "three","","","","","","","", "","","","","","","","",
    //                     "four","","","","","","","", "","","","","","","","",];
    // params1.midinoteinput = ["88","","","89","","","","", "91","","","","","","","",
    //                     "91","","","","","93","","", "","","91","","","","","",
    //                     "69","","","","","","","", "","","","","","","","",
    //                     "67","","","","","","","", "","","","","","","","",];

    // params2.textinput = ["hi","","hi","","","","","", "yeah","","","","yeah","","","",
    //                     "yeah","","","","","","","", "yeah","","","","","","","",
    //                     "","","","","","","","", "yeah","","","","","","","",
    //                     "yeah","","","","","","","", "yeah","","","","","","","",];
    // params2.midinoteinput = ["60","","67","","","","","", "72","","","","71","","","",
    //                     "76","","","","","","","", "","","","","","","","",
    //                     "75","","","","","","","", "","","","","","","","",
    //                     "74","","","","","","","", "","","","","","","","",];


    // Kino
    params1.textinput =     ["I'll","","sing","","","","in","", "dreams","","","","too","","far","",
                             "","","to","","bring","","","", "back","","","here","","","but","",
                             "You'll","","sing","","","","in","", "spring","","","","too","","near","",
                             "","","for","","kings","","to","", "see","","what","","we","","see",""];
    params1.midinoteinput = ["62","","61","","","","65","", "57","","","","55","","63","",
                             "","","61","","69","","","", "67","","","61","","","64","",
                             "62","","61","","","","65","", "57","","","","56","","63","",
                             "","","61","","70","","69","", "67","","65","","64","","57",""];


    params2.textinput =     ["Po-","","-ly","","po-","-ly-","-i-","-phon-", "-y","","po-","-ly-","-i-","-phon-","-y","",
                             "po-","","-ly-","","-phon-","","-y","po-", "-ly-","-phon-","-y","oh","po-","-ly-","-phon-","-y",
                             "Po-","","-ly","","po-","-ly-","-i-","-phon-", "-y","","po-","-ly-","-i-","-phon-","-y","",
                             "po-","","-ly","","po-","","-ly","po-", "-ly","po-","-ly-","-i-","-phon-","-y","pol-","-y"];
    params2.midinoteinput = ["62","","64","","65","69","71","69", "65","","64","62","64","65","67","",
                             "65","","67","","69","","64","67", "65","64","70","69","67","69","65","69",
                             "62","","64","","65","69","71","69", "65","","64","62","64","67","65","",
                             "64","","69","","67","","65","67", "65","64","70","69","67","69","65","69"];
    params2.midinoteinput = params2.midinoteinput.map(function(note) {
        parsedNote = parseInt(note);
        console.log("parsed note: " + parsedNote);
        if (parsedNote.toString() !== "NaN") {
            return (parsedNote + 12) + "";
        }
        else {
            return "";
        }
    });
    console.log(params2.midinoteinput);

    singer1 = new meSing.Singer(params1);
    singer2 = new meSing.Singer(params2);
    singer1.initGrid();
    singer2.initGrid();

    // singer1.initDisplay();
    // singer1.setVoices();


    var singers = [singer1, singer2];
    var chorus = new meSing.Chorus(singers);


    // // initialize the index display with kyle adams-style grid
    // var displayGrid = $("#msDisplay");
    // var steps = singer1.params.steps;
    // var numMeasures = singer1.params.numMeasures;
    // var widthScale = 90; // i.e. scale to x%
    // var textinput = singer1.params.textinput;
    // var midinoteinput = singer1.params.midinoteinput;

    // for (var i=0; i<steps.length; i++) {
    //     var col = $("<div class='col-a' id='label" + i + "'><strong>" + steps[i] + "</strong></div>");
    //     col.css("width", (widthScale/steps.length) + "%");
    //     displayGrid.append(col);
    // }
    // for (var i=0; i<numMeasures; i++) {
    //     displayGrid.append($("<br>"));

    //     for (var j=0; j<steps.length; j++) {
    //         var inputIdx = (i*steps.length) + j;
    //         var id = "measure"+i+"step"+j;
    //         var col = $("<div class='col-a' id='"+id+"'><input class='textinput' type='text' value='" + textinput[inputIdx] + "'/><br><input class='midinoteinput' type='text' value='" + midinoteinput[inputIdx] + "'/></div>");
    //         col.css("width", (widthScale/steps.length) + "%");
    //         displayGrid.append(col);
    //     }

    //     displayGrid.append($("<br>"));
    // }


    // // custom metro function
    // var metroFunction = function(stepNum, stepId) {
    //     var labelId = "label" + stepNum;
    //     var inputs = $("#"+stepId+">input[type='text']");
    //     $(".col-a").removeClass("playing");
    //     $("input[type='text']").removeClass("playing");
    //     $("#" + labelId).addClass("playing");
    //     for (var i=0; i<inputs.length; i++) {
    //         var input = inputs[i];
    //         if (input !== undefined && input.value.length > 0) {
    //             inputs.addClass("playing");
    //         }
    //     }
    // };
    // singer1.setMetroFunction(metroFunction);


    // les boutons
    $("#startBtn").on("click", function(){
        // singer1.setVoices();
        if (Object.keys(singer1.lyricToVoice).length > 0) {
            chorus.startAll();
        }
        else {
            $("#voicesStatus").text("please set voices before starting audio");
        }

        $("#startBtn").prop("disabled", true);
    });
    $("#stopBtn").on("click", function(){
        chorus.stopAll();

        $("#startBtn").prop("disabled", false);
    });
    $("#setVoicesBtn").on("click", function(){
        chorus.setAllVoices();
        
        $("#startBtn").prop("disabled", true);
        $("#stopBtn").prop("disabled", true);
    });

    // testing rhymebrain api
    $.getJSON("http://rhymebrain.com/talk?function=getRhymes&word=hello&maxResults=20", function(data) {
        console.log(data);
    });
};