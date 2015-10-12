var meSing = meSing || {};

meSing.defaults = {
    steps: "1e&a2e&a3e&a4e&a",
    numMeasures: 4,
    bpm: 120,
    textinput: ["Row","","","","row","","","","row","","","your","boat","","","",
                "gent-","","","-ly","down","","","the","stream","","","","","","","",
                "Merr-","","-il-","-ly","Merr-","","-il-","-ly","Merr-","","-il-","-ly","Merr-","","-il-","-ly",
                "life","","","is","but","","","a","dream","","dream","","dream","","dream","",           
               ],
    midinoteinput: [60,"","","",60,"","","",60,"","",62,64,"","","",
                64,"","",62,64,"","",65,67,67,67,67,"","","","",
                72,"",72,72,67,"",67,67,64,"",64,64,60,"",60,60,
                67,"","",65,64,"","",62,60,"",64,"",67,"",72,"",
               ]
};

meSing.Session = function() {
    this.ctx = new AudioContext();
    this.voices = [];
    this.grid = $("#msDisplay"); //todo: else create element


    meSpeak.loadConfig("/js/lib/mespeak/mespeak_config.json");
    meSpeak.loadVoice("/js/lib/mespeak/voices/en/en-us.json", function() {
        console.log("mespeak voice loaded");
    });
};
meSing.Session.prototype = {
    constructor: meSing.Session,

    addVoice: function(text, pitch) {
        if (!meSpeak.isConfigLoaded()) {
            console.log("config not yet loaded; please wait");
            return;
        }
        if (pitch === undefined) {
            pitch = Math.random()*100;
        }
        var ab = this.ctx.createBufferSource();
        ab.id = Math.floor(Math.random()*100000000);
        var speechData = meSpeak.speak(text, {
            pitch: pitch,
            rawdata: "ArrayBuffer",
        });
        this.ctx.decodeAudioData(speechData, function(decodedData) {
            ab.buffer = decodedData;
            ab.connect(ctx.destination);
            // ab.loop = true;
            // ab.start();
            console.log("just created" + ab.id);
            this.voices.push(ab);
        });
    },

    initDisplay: function() {
        var steps = meSing.defaults.steps;
        var numMeasures = meSing.defaults.numMeasures;
        var widthScale = 90; // i.e. scale to x%
        var textinput = meSing.defaults.textinput;
        var midinoteinput = meSing.defaults.midinoteinput;

        for (var i=0; i<steps.length; i++) {
            var col = $("<div class='col-a'><strong>" + steps[i] + "</strong></div>");
            col.css("width", (widthScale/steps.length) + "%");
            this.grid.append(col);
        }
        for (var i=0; i<numMeasures; i++) {
            this.grid.append($("<br>"));
            for (var j=0; j<steps.length; j++) {
                var inputIdx = (i*steps.length) + j;
                var id = "measure"+i+"step"+j;
                var col = $("<div class='col-a' id='"+id+"'><input class='textinput' type='text' value='" + textinput[inputIdx] + "'/><br><input class='midinoteinput' type='text' value='" + midinoteinput[inputIdx] + "'/></div>");
                col.css("width", (widthScale/steps.length) + "%");
                this.grid.append(col);
            }
            this.grid.append($("<br>"));
        }
    }

};


/*
if we do it syllable by syllable...
make a Voice class that when played will .start() and duplicate the buffer node

*/