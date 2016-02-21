var meSing = meSing || {};

meSing.defaults = {
    steps: "1e&a2e&a3e&a4e&a",
    numMeasures: 4,
    bpm: 60,
    // textinput: ["Row","","","","row","","","","row","","","your","boat","","","",
    //             "gent-","","","-lee","down","","","the","stream","","","","","","","",
    //             "Merr-","","-il-","-lee","Merr-","","-il-","-lee","Merr-","","-il-","-lee","Merr-","","-il-","-lee",
    //             "life","","","is","but","","","a","dream","","dream","","dream","","dream","",           
    //            ],
    textinput: ["Some","","","","where","","","","o-","","-ver","the","rain-","","-bow","",
                "way","","","","up","","","","high","","","","","","","",
                "And","","","","the","","","","dreams","","that","you","dream","","of","",
                "once","","in","a","lull-","","-a-","","-by","","","","","","","",],
    // midinoteinput: [60,"","","",60,"","","",60,"","",62,64,"","","",
    //             64,"","",62,64,"","",65,67,67,67,67,"","","","",
    //             72,"",72,72,67,"",67,67,64,"",64,64,60,"",60,60,
    //             67,"","",65,64,"","",62,60,"",64,"",67,"",72,"",
    //            ],
    midinoteinput: ["60","","","","72","","","","71","","67","69","71","","72","",
                "60","","","","69","","","","67","","","","","","","",
                "57","","","","65","","","","64","","60","62","64","","65","",
                "62","","59","60","62","","64","","60","60","60","60","","","","",],
    wordgap: 50,
    // speed: 40 * 6 / 2,
    // speed: 200,
    speed: 320,
};

meSing.midiToHz = function(midi) {
    return (440 / 32) * (Math.pow(2,((midi - 9) / 12)));
};

meSing.concatFloat32Arrays = function(a1, a2) {
    var arr = new Float32Array(a1.length + a2.length);
    console.log("a1:" + a1.length + ", a2:" + a2.length + ", arr:" + arr.length);
    arr.set(a1);
    arr.set(a2, a1.length);
    return arr;
};

meSing.cleanString = function(s) {
    return s.replace(/[^A-Za-z0-9\s]/g, "");
};

meSing.validInput = function(input) {
    return (input !== undefined && input.length > 0);
};

meSing.bpmToMs = function(bpm) {
    return (60/bpm) * 1000;
}


/*
 * Session class
 */
meSing.Session = function(params) {
    var session = this;
    this.params = params;
    if (this.params === undefined) {
        this.params = meSing.defaults;
    }
    this.ctx = new AudioContext();
    this.voice = null;
    this.lyrics = [];
    this.lyricToVoice = {};
    this.lyricsCount = 0;
    this.voiceBuffer = null;
    this.grid = $("#msDisplay"); //todo: else create element
    this.metro = T("interval",
                    {interval: "BPM" + session.params.bpm + 
                               " L" + session.params.steps.length
                    },
                    function(count) {
                        var measureNum = Math.floor(count / session.params.steps.length) % session.params.numMeasures;
                        var stepNum = count % session.params.steps.length;
                        var stepId = "measure" + measureNum + "step" + stepNum;
                        var text = $("#" + stepId + " > .textinput").val();
                        var midinote = $("#" + stepId + " > .midinoteinput").val();
                        var labelId = "label" + stepNum;
                        var inputs = $("#"+stepId+">input[type='text']");
                        var duration = 0.8;
                        console.log(midinote);

                        
                        // increment lyrics count for offset testing (not needed now)
                        if (meSing.validInput(text)) {
                            session.lyricsCount++;
                        }

                        // create new voice (vocoder) if need be
                        if (!session.voice || (measureNum==0 && stepNum==0)) {
                            // this.voice = vocoder(session.ctx, textBuffer, textBuffer, freq);
                            var buf = session.voiceBuffer;
                            var freq = 60; // default

                            // if (meSing.validInput(midinote)) {
                            //     freq = meSing.midiToHz(midinote);
                            // }

                            session.voice = vocoder(session.ctx, buf, buf, freq);
                            console.log("new voice");
                        }

                        // change pitch of existing vocoder
                        if (meSing.validInput(midinote)) {
                            var midiNoteAdj = midinote - 24; // send pitch down by two octaves
                            var freq = meSing.midiToHz(midiNoteAdj);

                            session.voice.oscillatorNode.frequency.value = freq;
                            console.log("set voice freq to " + freq);

                            // console.log(session.voice);
                        }
                       
                        // display
                        $(".col-a").removeClass("playing");
                        $("input[type='text']").removeClass("playing");
                        $("#" + labelId).addClass("playing");
                        for (var i=0; i<inputs.length; i++) {
                            var input = inputs[i];
                            if (input !== undefined && input.value.length > 0) {
                                inputs.addClass("playing");
                            }
                        }

                        // console.log("m"+measureNum+"s"+stepNum);
                    }); // end metro

    $(document).ready(function() {
        meSpeak.loadConfig("/js/lib/mespeak/mespeak_config.json", function() {
            console.log("config done");
            $("#voicesStatus").text("meSpeak config loaded; setting voices, please wait...");

            meSpeak.loadVoice("/js/lib/mespeak/voices/en/en-us.json", function() {
                console.log("mespeak voice loaded");
                session.setVoices();
            });
        });
    });
};
meSing.Session.prototype = {
    constructor: meSing.Session,

    // add a voice, i.e. syllable with note associated, to the session
    addVoice: function(text, pitch, percentage) {
        if (!meSpeak.isConfigLoaded()) {
            var msg = "meSpeak config not yet loaded; please wait and try to set voices again";
            $("#voicesStatus").text(msg);
            return false;
        }
        if (pitch === undefined || pitch.length == 0) {
            // pitch = Math.random()*100;
            return false;
        }
        if (text === undefined || text.length == 0) {
            return false;
        }

        // audio buffer
        var ab = this.ctx.createBufferSource();
        ab.id = Math.floor(Math.random()*100000000);

        // clean up text
        var cleanText = meSing.cleanString(text);
        console.log("mespeak params: " + cleanText + ", " + pitch);

        // speech data
        var speechData = meSpeak.speak(cleanText, {
            pitch: pitch,
            rawdata: "ArrayBuffer",
            wordgap: this.params.wordgap,
            speed: this.params.speed,
        });

        // decode speech data
        var session = this;
        this.ctx.decodeAudioData(speechData, function(decodedData) {
            // add decoded data to buffer and connect to audiocontext
            ab.buffer = decodedData;
            ab.connect(session.ctx.destination);
            console.log(ab);

            // add audio buffer to voices obj
            session.lyricToVoice[text] = ab;
            // session.voicesSet = true;

            console.log("voices for " + (Object.keys(session.lyricToVoice).length+1) + " lyrics set and ready to go!");
        });

        return true;
    },

    // create a single audio buffer containing the entire passage, i.e.
    // all the vocalized lyrics in the session, in correct rhythm according
    // to bpm and steps/measures dictated
    createPassageFromVoices: function(voices) { 
        var numMeasures = this.params.numMeasures;
        var numSteps = this.params.steps.length;
        var sampleRate = this.ctx.sampleRate;
        var lyricsAll = [];
        var durationPerBeat = meSing.bpmToMs(this.params.bpm);
        var duration = durationPerBeat / (numMeasures); // per step
        // duration = 100;
        var durationSamples = Math.floor((duration/1000) * sampleRate);
        var totalSampleSize = durationSamples * numMeasures * numSteps;
        // var frameCount = this.ctx.sampleRate;
        var numChannels = 2;
        var audioBuffer = this.ctx.createBuffer(numChannels, totalSampleSize, sampleRate);
        var audioData = new Float32Array();

        console.log("durationPerBeat: " + durationPerBeat + ", durationPerSTep: " + duration + ", durationSamples:" + durationSamples);
        console.log("total sample size: " + totalSampleSize);
        // console.log(duration * numMeasures);

        // hard-coded testing
        // durationSamples = sampleRate/3;

        // testing reassignment
        // voices["Some"] = voices["-by"];

        // populate lyrics (ALL) first
        for (var i=0; i<numMeasures; i++) {
            for (j=0; j<numSteps; j++) {
                var id = "#measure"+i+"step"+j;
                var text = $(id + " > .textinput").val();
                var midinote = $(id + " > .midinoteinput").val();

                lyricsAll.push(text);
            }
        }

        // create the passage by iterating through lyrics
        for (var i=0; i<lyricsAll.length; i++) {
            var lyric = lyricsAll[i];
            if (meSing.validInput(lyric)) { // add the current voice buffer data to audio buffer
                var voice = voices[lyric];
                console.log(lyric + " -> " + voice);
                // console.log(voice);

                // // calculating offset samples (we don't need this now)
                // // var offset = (i/numMeasures) + (j/(numSteps*numMeasures));
                // var offsetBeats = i + (j/numSteps);
                // var offsetSamples = (offsetBeats/numMeasures) * durationSamples;
                // console.log("offsetBeats:" + offsetBeats + ", offsetSamples:" + offsetSamples);

                var voiceBufferData = voice.buffer.getChannelData(0); //.slice(0, durationSamples);
                var currentVoiceData = new Float32Array(durationSamples).map(function(n, i) {
                    if (i < voiceBufferData.length) {
                        return voiceBufferData[i];
                    }
                    else {
                        return 0;
                    }
                });

                audioData = meSing.concatFloat32Arrays(audioData, currentVoiceData);
                console.log("currentVoiceData.length:" + currentVoiceData.length + ", durationSamples:" + durationSamples);

            }
            else { // add blank space baby
                audioData = meSing.concatFloat32Arrays(audioData, new Float32Array(durationSamples));
            }
        }

        // finally, hook it up to the context
        audioBuffer.copyToChannel(audioData, 0, 0);
        this.voiceBuffer = audioBuffer;

        // input
        $("#startBtn").prop("disabled", false);
        $("#stopBtn").prop("disabled", false);

        console.log("done constructing passage from voices!");

    },

    // recursively create voices from lyrics
    createVoicesFromLyrics: function(lyrics, i) {

        // check if we've bottomed out
        if (i > lyrics.length) {
            $("#voicesStatus").text(lyrics.length + " voices loaded; 100% complete and ready to sing!");
            this.createPassageFromVoices(this.lyricToVoice);
            return;
        }

        // percentage complete
        var percentage = ((i+1)/lyrics.length) * 100;
        var lyric = lyrics[i];

        // add voice with single lyric
        if (lyric && this.addVoice(lyric.text, lyric.midinote, percentage)) {
            var msg = "adding voice (\"" + lyric.text + "\", " + lyric.midinote + "); " + percentage + "% complete, please wait...";

            console.log(msg);

            // update display
            $("#voicesStatus").text(msg);
        }
        else {
            msgOnFinished = "meSing voices not all loaded properly; please wait for meSpeak config to load and call setVoices() again";
        }

        // do the next voice
        var session = this;
        window.setTimeout(function() {
            session.createVoicesFromLyrics(lyrics, i+1);
        }, 1);

        // console.log(percentage);
        // $("#voicesStatus").text("adding voices; " + percentage + "% complete");
    },

    // setup lyrics and voices
    setVoices: function() {
        var numSteps = this.params.steps.length;
        var numMeasures = this.params.numMeasures;
        var texts = [];
        var notes = [];
        this.voices = []; // garbage coll?
        this.lyrics = [];
        var msgOnFinished = "done adding voices; 100% complete";

        // new recursive method
        // setup lyrics
        for (var i=0; i<numMeasures; i++) {
            for (var j=0; j<numSteps; j++) {
                var id = "#measure"+i+"step"+j;
                var text = $(id + " > .textinput").val();
                var midinote = $(id + " > .midinoteinput").val();
                // this.addVoice(text, midinote);

                if (meSing.validInput(text) && meSing.validInput(midinote)) {
                    // text = "(break)";
                    this.lyrics.push({
                        text: text,
                        midinote: midinote
                    });
                }
                texts.push(text);
                notes.push(midinote);
            }
        }

        
        // create voices and start the chain of events
        // this.lyricToVoice =  this.createVoicesFromLyrics(this.lyrics, 0);
        this.createVoicesFromLyrics(this.lyrics, 0);


        console.log(msgOnFinished);
        console.log(texts.join(" "));
    },

    // initialize the index display with kyle adams-style grid
    initDisplay: function() {
        var steps = this.params.steps;
        var numMeasures = this.params.numMeasures;
        var widthScale = 90; // i.e. scale to x%
        var textinput = this.params.textinput;
        var midinoteinput = this.params.midinoteinput;

        for (var i=0; i<steps.length; i++) {
            var col = $("<div class='col-a' id='label" + i + "'><strong>" + steps[i] + "</strong></div>");
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