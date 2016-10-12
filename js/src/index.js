var singer;
var chorus;

window.onload = function() {
    console.log("asdf");
    singer = new meSing.Singer(meSing.defaults);
    singer.initGrid();
    chorus = new meSing.Chorus([singer]);
    // singer.initDisplay();
    // singer.setVoices();

    // autocomplete
    var suggestedLyrics = [
        "home",
        "cheer",
        "bang",
        "raise",
        "axe",
        "crown",
        "king",
        "sleep",
        "deaf",
        "jar",
        "main",
        "moon",
        "queer",
        "tripe",
        "found",
        "veal",
        "wear",
        "yam",
        "zap"
    ];

    // var getRhymes = function(word) {
    //     var url = "http://rhymebrain.com/talk?function=getRhymes&maxResults=10&word=" + word
    // }

    // initialize the index display with kyle adams-style grid
    var displayGrid = $("#msDisplay");
    var steps = singer.params.steps;
    var numMeasures = singer.params.numMeasures;
    var widthScale = 90; // i.e. scale to x%
    var textinput = singer.params.textinput;
    var midinoteinput = singer.params.midinoteinput;

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


    // $(".textinput").autocomplete({
    //     source: suggestedLyrics,
    //     // minLength: 1,
    //     autoFocus: true
    // });

    $(".textinput").autocomplete({
        source: function(request, response) {
            // example:
            // http://rhymebrain.com/talk?function=getRhymes&maxResults=10&word=javascript
            $.get("http://rhymebrain.com/talk", {
                function: "getRhymes",
                maxResults: 10,
                word: request.term
            }, function(data) {
                var filteredData = data.filter(function(obj) {
                    return obj["syllables"] < 2;
                });
                var words = filteredData.map(function(obj) {
                    return obj["word"];
                });
                response(words);
            })
        },
        minLength: 0
    });

    $(".textinput").focus(function() {
        $(this).autocomplete("search", $(this).val())
    });


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
    singer.setMetroFunction(metroFunction);


    // les boutons
    $("#startBtn").on("click", function(){
        // singer.setVoices();
        if (Object.keys(singer.lyricToVoice).length > 0) {
            singer.metro.start(); 
        }
        else {
            $("#voicesStatus").text("please set voices before starting audio");
        }

        $("#startBtn").prop("disabled", true);
    });
    $("#stopBtn").on("click", function(){
        singer.metro.stop();
        singer.lyricsCount = 0;
        if (singer.voice) {
            singer.voice.modulatorGain.disconnect(); // not the best way to do this
        }
        singer.voice = null;

        $("#startBtn").prop("disabled", false);
    });
    $("#setVoicesBtn").on("click", function(){
        console.log("setvoicesbtn clicked");
        
        for (var i=0; i<numMeasures; i++) {
            for (var j=0; j<steps.length; j++) {
                //console.log(i + ", " + j);
                var inputIdx = (i*steps.length) + j;
                var id = "measure"+i+"step"+j;
                var inputs = $("#" + id);
                var t = inputs.find(".textinput").val();
                var m = inputs.find(".midinoteinput").val();

                var data = {
                    "text": "",
                    "midinote": ""
                }

                if (t) {
                    data.text = t;
                }
                if (m) {
                    data.midinote = m;
                }

                singer.setGridData(data, i, j);
            }
        }

        console.log(singer.grid[0][0]);
        singer.setVoices();
        
        $("#startBtn").prop("disabled", true);
        $("#stopBtn").prop("disabled", true);
    });

    // testing rhymebrain api
    $.getJSON("http://rhymebrain.com/talk?function=getRhymes&word=hello&maxResults=20", function(data) {
        console.log(data);
    });
};