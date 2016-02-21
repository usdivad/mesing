var session;

window.onload = function() {
    console.log("asdf");
    session = new meSing.Session();
    session.initDisplay();
    // session.setVoices();

    $("#startBtn").on("click", function(){
        // session.setVoices();
        if (Object.keys(session.lyricToVoice).length > 0) {
            session.metro.start(); 
        }
        else {
            $("#voicesStatus").text("please set voices before starting audio");
        }
    });
    $("#stopBtn").on("click", function(){
        session.metro.stop();
        session.lyricsCount = 0;
        session.voice.modulatorGain.disconnect(); // not the best way to do this
        session.voice = null;
    });
    $("#setVoicesBtn").on("click", function(){
        session.setVoices();
    });
};