meSing.js
=========

meSing.js is a JavaScript singing synthesis library that uses the Web Audio API's DSP capabilities in conjunction with the meSpeak.js speech synthesis library to provide a vocal synthesizer for the web. First, the lyrics with corresponding MIDI notes are parsed and fed to meSpeak.js; the resulting text-to-speech output is then converted into a series of AudioBufferSourceNodes, which are subsequently processed and adjusted for pitch, rhythm, and expression.


Pitchshifting techniques currently implemented are: feeding the synthesized audio through a multiband vocoder (based on Chris Wilson's 2012 demo), directly adjusting the audio playback rate, and manipulating the "pitch" parameter of the meSpeak.js synthesizer. 

Rhythmic adjustments occur directly on the PCM level via slicing and concatenating the Float32Arrays containing audio channel data, as well as using the Web Audio API’s clock to schedule vocoder events.


The demo showcases an example usage of meSing.js: a songwriting tool that provides both lyrical and melodic suggestions, using the singing synthesis to rapidly prototype the vocal line. The step sequencer-like input grid layout is derived from musicologist Kyle Adams' approach to interpreting and analyzing hip hop, and is particularly well suited to lyric and rhyme analysis.


Multiple approaches were taken and experimented with while developing meSing.js, each with its own performance and usability benefits and drawbacks; a discussion of these approaches can provide insight into creating libraries atop the Web Audio API.


Demo: http://usdivad.com/mesing