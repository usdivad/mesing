var session;

window.onload = function() {
    console.log("asdf");
    session = new meSing.Session();
    session.initDisplay();
    // session.setVoices();

    $("#startBtn").on("click", function(){
        session.metro.start();
    });
    $("#stopBtn").on("click", function(){
        session.metro.stop();
        session.lyricsCount = 0;
    });
    $("#setVoicesBtn").on("click", function(){
        session.setVoices();
    });
};