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

meSing.midiToHz = function(midi) {
    return (440 / 32) * (Math.pow(2,((midi - 9) / 12)));
};


/*
 * Session class
 */
meSing.Session = function() {
    this.ctx = new AudioContext();
    // this.vocoder = vocoder(this.ctx);
    this.voices = [];
    this.grid = $("#msDisplay"); //todo: else create element
    this.metro = T("interval");


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
        if (pitch === undefined || pitch.length == 0) {
            // pitch = Math.random()*100;
            return [];
        }
        if (text === undefined || text.length == 0) {
            return [];
        }
        var ab = this.ctx.createBufferSource();
        ab.id = Math.floor(Math.random()*100000000);
        var speechData = meSpeak.speak(text, {
            pitch: pitch,
            rawdata: "ArrayBuffer",
        });
        var v;
        var session = this;
        this.ctx.decodeAudioData(speechData, function(decodedData) {
            ab.buffer = decodedData;
            
            ab.connect(session.ctx.destination);
            
            // ab.loop = true;
            // ab.start();
            console.log(ab);

            console.log("just created " + ab.id);
            session.voices.push(ab);

            // Voice
            // v = vocoder(session.ctx, ab, ab);
            // this.voices.push(v);
        });
    },

    playVoice: function(text, pitch) {
if (!meSpeak.isConfigLoaded()) {
            console.log("config not yet loaded; please wait");
            return;
        }
        if (pitch === undefined || pitch.length == 0) {
            // pitch = Math.random()*100;
            return [];
        }
        if (text === undefined || text.length == 0) {
            return [];
        }
        var ab = this.ctx.createBufferSource();
        ab.id = Math.floor(Math.random()*100000000);
        var speechData = meSpeak.speak(text, {
            pitch: pitch,
            rawdata: "ArrayBuffer",
        });
        var v;
        var session = this;
        this.ctx.decodeAudioData(speechData, function(decodedData) {
            ab.buffer = decodedData;
            
            ab.connect(session.ctx.destination);
            
            // ab.loop = true;
            ab.start();
            console.log(ab);

            console.log("just created " + ab.id);
            session.voices.push(ab);

            // Voice
            // v = vocoder(session.ctx, ab, ab);
            // this.voices.push(v);
        });        
    },

    setVoices: function() {
        var steps = meSing.defaults.steps.length;
        var measures = meSing.defaults.numMeasures;
        this.voices = []; // garbage coll?

        // BAD! causes overflow
        for (var i=0; i<measures; i++) {
            for (var j=0; j<steps; j++) {
                var id = "#measure"+i+"step"+j;
                var text = $(id + " > .textinput").val();
                var midinote = $(id + " > .midinoteinput").val();
                this.addVoice(text, midinote);
            }
        }
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
 * Voice class
 */
meSing.Voice = function(text, midinote) {

}

/*
if we do it syllable by syllable...
make a Voice class that when played will .start() and duplicate the buffer node

*/