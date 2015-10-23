/*
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *    * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *    * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// Since all this stuff depends on global data, just wrap it all in a clousure
// for tidyness, and so we can call it multiple times.
function vocoder(ctx, cb, mb, oscFreq) {

  var audioContext = null;
  var modulatorBuffer = null;
  var carrierBuffer = null;
  var modulatorNode = null;
  var carrierNode = null;
  var vocoding = false;

  var FILTER_QUALITY = 6;  // The Q value for the carrier and modulator filters

  // These are "placeholder" gain nodes - because the modulator and carrier will get swapped in
  // as they are loaded, it's easier to connect these nodes to all the bands, and the "real"
  // modulator & carrier AudioBufferSourceNodes connect to these.
  var modulatorInput = null;
  var carrierInput = null;

  var modulatorGain = null;
  var modulatorGainValue = 1.0;

  // noise node added to the carrier signal
  var noiseBuffer = null;
  var noiseNode = null;
  var noiseGain = null;
  var noiseGainValue = 0.2;

  // Carrier sample gain
  var carrierSampleNode = null;
  var carrierSampleGain = null;
  var carrierSampleGainValue = 0.0;

  // Carrier Synth oscillator stuff
  var oscillatorNode = null;
  var oscillatorType = 4;   // CUSTOM
  var oscillatorGain = null;
  var oscillatorGainValue = 1.0;
  var oscillatorDetuneValue = 0;
  var FOURIER_SIZE = 2048;
  var wavetable = null;
  var wavetableSignalGain = null;
  var WAVETABLEBOOST = 40.0;
  var SAWTOOTHBOOST = 0.40;

  // These are the arrays of nodes - the "columns" across the frequency band "rows"
  var modFilterBands = null;    // tuned bandpass filters
  var modFilterPostGains = null;  // post-filter gains.
  var heterodynes = null;   // gain nodes used to multiply bandpass X sine
  var powers = null;      // gain nodes used to multiply prev out by itself
  var lpFilters = null;   // tuned LP filters to remove doubled copy of product
  var lpFilterPostGains = null;   // gain nodes for tuning input to waveshapers
  var carrierBands = null;  // tuned bandpass filters, same as modFilterBands but in carrier chain
  var carrierFilterPostGains = null;  // post-bandpass gain adjustment
  var carrierBandGains = null;  // these are the "control gains" driven by the lpFilters

  var vocoderBands;
  var numVocoderBands;

  var hpFilterGain = null;

  function shutOffCarrier() {
    oscillatorNode.stop(0);
    oscillatorNode = null;
    noiseNode.stop(0);
    noiseNode = null;
    carrierSampleNode.stop(0);
    carrierSampleNode = null;
  }

  function selectSawtooth() {
    if (wavetableSignalGain)
      wavetableSignalGain.gain.value = SAWTOOTHBOOST;
    if (oscillatorNode)
      oscillatorNode.type = "sawtooth";
  }

  function selectWavetable() {
    if (wavetableSignalGain)
      wavetableSignalGain.gain.value = WAVETABLEBOOST;
    if (oscillatorNode)
      oscillatorNode.setPeriodicWave ?
      oscillatorNode.setPeriodicWave(wavetable) :
    oscillatorNode.setWaveTable(wavetable);
    wavetableSignalGain.gain.value = WAVETABLEBOOST;
  }

  function onUpdateModGain(event, ui) {
    modulatorGainValue = ui.value;
    if (modulatorGain)
      modulatorGain.gain.value = ui.value;
  }

  // sample-based carrier
  function onUpdateSampleLevel(event, ui) {
    carrierSampleGainValue = ui.value;
    if (carrierSampleGain)
      carrierSampleGain.gain.value = ui.value;
  }

  // noise in carrier
  function onUpdateSynthLevel(event, ui) {
    oscillatorGainValue = ui.value;
    if (oscillatorGain)
      oscillatorGain.gain.value = ui.value;
  }

  // noise in carrier
  function onUpdateNoiseLevel(event, ui) {
    noiseGainValue = ui.value;
    if (noiseGain)
      noiseGain.gain.value = ui.value;
  }

  // this function will algorithmically re-calculate vocoder bands, distributing evenly
  // from startFreq to endFreq, splitting evenly (logarhythmically) into a given numBands.
  // The function places this info into the global vocoderBands and numVocoderBands variables.
  function generateVocoderBands(startFreq, endFreq, numBands) {
    // Remember: 1200 cents in octave, 100 cents per semitone

    var totalRangeInCents = 1200 * Math.log( endFreq / startFreq ) / Math.LN2;
    var centsPerBand = totalRangeInCents / numBands;
    var scale = Math.pow( 2, centsPerBand / 1200 );  // This is the scaling for successive bands

    vocoderBands = [];
    var currentFreq = startFreq;

    for (var i=0; i<numBands; i++) {
      vocoderBands[i] = new Object();
      vocoderBands[i].frequency = currentFreq;
      //console.log( "Band " + i + " centered at " + currentFreq + "Hz" );
      currentFreq = currentFreq * scale;
    }

    numVocoderBands = numBands;
  }

  function loadNoiseBuffer() {  // create a 5-second buffer of noise
      var lengthInSamples =  5 * audioContext.sampleRate;
      noiseBuffer = audioContext.createBuffer(1, lengthInSamples, audioContext.sampleRate);
      var bufferData = noiseBuffer.getChannelData(0);

      for (var i = 0; i < lengthInSamples; ++i) {
        bufferData[i] = (2*Math.random() - 1);  // -1 to +1
      }
  }

  function initBandpassFilters() {
    // When this function is called, the carrierNode and modulatorAnalyser
    // may not already be created.  Create placeholder nodes for them.
    modulatorInput = audioContext.createGain();
    carrierInput = audioContext.createGain();

    if (modFilterBands == null)
      modFilterBands = new Array();

    if (modFilterPostGains == null)
      modFilterPostGains = new Array();

    if (heterodynes == null)
      heterodynes = new Array();

    if (powers == null)
      powers = new Array();

    if (lpFilters == null)
      lpFilters = new Array();

    if (lpFilterPostGains == null)
      lpFilterPostGains = new Array();

    if (carrierBands == null)
      carrierBands = new Array();

    if (carrierFilterPostGains == null)
      carrierFilterPostGains = new Array();

    if (carrierBandGains == null)
      carrierBandGains = new Array();

      var waveShaperCurve = new Float32Array(65536);
      // Populate with a "curve" that does an abs()
      var n = 65536;
      var n2 = n / 2;

      for (var i = 0; i < n2; ++i) {
        x = i / n2;

        waveShaperCurve[n2 + i] = x;
        waveShaperCurve[n2 - i - 1] = x;
      }

    // Set up a high-pass filter to add back in the fricatives, etc.
    // (this isn't used by default in the "production" version, as I hid the slider)
    var hpFilter = audioContext.createBiquadFilter();
    hpFilter.type = "highpass";
    hpFilter.frequency.value = 8000; // or use vocoderBands[numVocoderBands-1].frequency;
    hpFilter.Q.value = 1; //  no peaking
    modulatorInput.connect( hpFilter);

    hpFilterGain = audioContext.createGain();
    hpFilterGain.gain.value = 0.0;

    hpFilter.connect( hpFilterGain );
    hpFilterGain.connect( audioContext.destination );

    //clear the arrays
    modFilterBands.length = 0;
    modFilterPostGains.length = 0;
    heterodynes.length = 0;
    powers.length = 0;
    lpFilters.length = 0;
    lpFilterPostGains.length = 0;
    carrierBands.length = 0;
    carrierFilterPostGains.length = 0;
    carrierBandGains.length = 0;

    var outputGain = audioContext.createGain();
    outputGain.connect(audioContext.destination);

    var rectifierCurve = new Float32Array(65536);
    for (var i=-32768; i<32768; i++)
      rectifierCurve[i+32768] = ((i>0)?i:-i)/32768;

    for (var i=0; i<numVocoderBands; i++) {
      // CREATE THE MODULATOR CHAIN
      // create the bandpass filter in the modulator chain
      var modulatorFilter = audioContext.createBiquadFilter();
      modulatorFilter.type = "bandpass";  // Bandpass filter
      modulatorFilter.frequency.value = vocoderBands[i].frequency;
      modulatorFilter.Q.value = FILTER_QUALITY; //  initial quality
      modulatorInput.connect(modulatorFilter);
      modFilterBands.push(modulatorFilter);

      // Now, create a second bandpass filter tuned to the same frequency -
      // this turns our second-order filter into a 4th-order filter,
      // which has a steeper rolloff/octave
      var secondModulatorFilter = audioContext.createBiquadFilter();
      secondModulatorFilter.type = "bandpass";  // Bandpass filter
      secondModulatorFilter.frequency.value = vocoderBands[i].frequency;
      secondModulatorFilter.Q.value = FILTER_QUALITY; //  initial quality
      modulatorFilter.chainedFilter = secondModulatorFilter;
      modulatorFilter.connect(secondModulatorFilter);

      // create a post-filtering gain to bump the levels up.
      var modulatorFilterPostGain = audioContext.createGain();
      modulatorFilterPostGain.gain.value = 6;
      secondModulatorFilter.connect(modulatorFilterPostGain);
      modFilterPostGains.push(modulatorFilterPostGain);

      // Create the sine oscillator for the heterodyne
      var heterodyneOscillator = audioContext.createOscillator();
      heterodyneOscillator.frequency.value = vocoderBands[i].frequency;

      heterodyneOscillator.start(0);

      // Create the node to multiply the sine by the modulator
      var heterodyne = audioContext.createGain();
      modulatorFilterPostGain.connect(heterodyne);
      heterodyne.gain.value = 0.0;  // audio-rate inputs are summed with initial intrinsic value
      heterodyneOscillator.connect(heterodyne.gain);

      var heterodynePostGain = audioContext.createGain();
      heterodynePostGain.gain.value = 2.0;    // GUESS:  boost
      heterodyne.connect(heterodynePostGain);
      heterodynes.push(heterodynePostGain);


      // Create the rectifier node
      var rectifier = audioContext.createWaveShaper();
      rectifier.curve = rectifierCurve;
      heterodynePostGain.connect(rectifier);

      // Create the lowpass filter to mask off the difference (near zero)
      var lpFilter = audioContext.createBiquadFilter();
      lpFilter.type = "lowpass";  // Lowpass filter
      lpFilter.frequency.value = 5.0; // Guesstimate!  Mask off 20Hz and above.
      lpFilter.Q.value = 1; // don't need a peak
      lpFilters.push(lpFilter);
      rectifier.connect(lpFilter);

      var lpFilterPostGain = audioContext.createGain();
      lpFilterPostGain.gain.value = 1.0;
      lpFilter.connect(lpFilterPostGain);
      lpFilterPostGains.push(lpFilterPostGain);

      var waveshaper = audioContext.createWaveShaper();
      waveshaper.curve = waveShaperCurve;
      lpFilterPostGain.connect(waveshaper);


      // Create the bandpass filter in the carrier chain
      var carrierFilter = audioContext.createBiquadFilter();
      carrierFilter.type = "bandpass";
      carrierFilter.frequency.value = vocoderBands[i].frequency;
      carrierFilter.Q.value = FILTER_QUALITY;
      carrierBands.push(carrierFilter);
      carrierInput.connect(carrierFilter);

      // We want our carrier filters to be 4th-order filter too.
      var secondCarrierFilter = audioContext.createBiquadFilter();
      secondCarrierFilter.type = "bandpass";  // Bandpass filter
      secondCarrierFilter.frequency.value = vocoderBands[i].frequency;
      secondCarrierFilter.Q.value = FILTER_QUALITY; //  initial quality
      carrierFilter.chainedFilter = secondCarrierFilter;
      carrierFilter.connect(secondCarrierFilter);

      var carrierFilterPostGain = audioContext.createGain();
      carrierFilterPostGain.gain.value = 10.0;
      secondCarrierFilter.connect(carrierFilterPostGain);
      carrierFilterPostGains.push(carrierFilterPostGain);

      // Create the carrier band gain node
      var bandGain = audioContext.createGain();
      carrierBandGains.push(bandGain);
      carrierFilterPostGain.connect(bandGain);
      bandGain.gain.value = 0.0;  // audio-rate inputs are summed with initial intrinsic value
      waveshaper.connect(bandGain.gain);  // connect the lp controller

      bandGain.connect(outputGain);
    }


    // Now set up our wavetable stuff.
    var real = new Float32Array(FOURIER_SIZE);
    var imag = new Float32Array(FOURIER_SIZE);
    real[0] = 0.0;
    imag[0] = 0.0;
    for (var i=1; i<FOURIER_SIZE; i++) {
      real[i]=1.0;
      imag[i]=1.0;
    }

    wavetable = (audioContext.createPeriodicWave) ?
      audioContext.createPeriodicWave(real, imag) :
      audioContext.createWaveTable(real, imag);
    loadNoiseBuffer();
  }

  function setupVocoderGraph() {
    initBandpassFilters();
  }

  function createCarriersAndPlay(output) {
    carrierSampleNode = audioContext.createBufferSource();
    carrierSampleNode.buffer = carrierBuffer;
    carrierSampleNode.loop = true;

    carrierSampleGain = audioContext.createGain();
    carrierSampleGain.gain.value = carrierSampleGainValue;
    carrierSampleNode.connect(carrierSampleGain);
    carrierSampleGain.connect(output);

    // The wavetable signal needs a boost.
    wavetableSignalGain = audioContext.createGain();

    oscillatorNode = audioContext.createOscillator();
    if (oscillatorType == 4) { // wavetable
      oscillatorNode.setPeriodicWave ?
      oscillatorNode.setPeriodicWave(wavetable) :
      oscillatorNode.setWaveTable(wavetable);
      wavetableSignalGain.gain.value = WAVETABLEBOOST;
    } else {
      oscillatorNode.type = oscillatorType;
      wavetableSignalGain.gain.value = SAWTOOTHBOOST;
    }
    oscillatorNode.frequency.value = oscFreq;
    oscillatorNode.detune.value = oscillatorDetuneValue;
    oscillatorNode.connect(wavetableSignalGain);

    oscillatorGain = audioContext.createGain();
    oscillatorGain.gain.value = oscillatorGainValue;

    wavetableSignalGain.connect(oscillatorGain);
    oscillatorGain.connect(output);

    noiseNode = audioContext.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;
    noiseGain = audioContext.createGain();
    noiseGain.gain.value = noiseGainValue;
    noiseNode.connect(noiseGain);

    noiseGain.connect(output);
    oscillatorNode.start(0);
    noiseNode.start(0);
    carrierSampleNode.start(0);

  }

  function vocode() {
    if (vocoding) {
      if (modulatorNode) {
        modulatorNode.stop(0);
      }
      shutOffCarrier();
      vocoding = false;
      return;
    }

    createCarriersAndPlay(carrierInput);

    vocoding = true;

    modulatorNode = audioContext.createBufferSource();
    modulatorNode.buffer = modulatorBuffer;
    modulatorGain = audioContext.createGain();
    modulatorGain.gain.value = modulatorGainValue;
    modulatorNode.connect(modulatorGain);
    modulatorGain.connect(modulatorInput);
    modulatorNode.start(0);
  }

  // Initialization function for the page.
  function init(ctx, carrierB, modulatorB) {
    audioContext = ctx;
    carrierBuffer = carrierB;
    modulatorBuffer = modulatorB;
    generateVocoderBands(55, 7040, 28);
    // Set up the vocoder chains
    setupVocoderGraph();
    vocode();
  }

  // kick out the jams
  init(ctx, cb, mb);

  return {
    modulatorNode: modulatorNode,
    modulatorGain: modulatorGain,
    synthLevel: oscillatorGain,
    noiseNode: noiseGain,
    oscillatorNode: oscillatorNode
  };
}