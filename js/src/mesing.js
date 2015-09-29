// testing
var ctx = new AudioContext();
var voices = [];
meSpeak.loadConfig("/js/lib/mespeak/mespeak_config.json");
meSpeak.loadVoice("/js/lib/mespeak/voices/en/en-us.json", function() {
    console.log("voice loaded");
});

var addVoice = function(text, pitch) {
    if (!meSpeak.isConfigLoaded()) {
        console.log("config not yet loaded; please wait");
        return;
    }
    if (pitch === undefined) {
        pitch = Math.random()*100;
    }
    var ab = ctx.createBufferSource();
    ab.id = Math.floor(Math.random()*100000000);
    var speechData = meSpeak.speak(text, {
        pitch: pitch,
        rawdata: "ArrayBuffer",
    });
    ctx.decodeAudioData(speechData, function(decodedData) {
        ab.buffer = decodedData;
        ab.connect(ctx.destination);
        ab.loop = true;
        ab.start();
        console.log(ab.id);
        voices.push(ab);
    });
};