import * as Tone from 'tone';
import * as utils from './utils';

const FREQS = [...new Array(80).keys()].map(v => v + 20);
const WAVES = ['square', 'triangle', 'sawtooth'];
const MAX_GAIN = 1; // 100 – 200
let isStarted = false;

const ratesToTime = {
  '1n': rate => rate < 50,
  '2n': rate => rate < 100,
  '4n': rate => rate < 150,
  '8n': rate => rate < 200,
  '16n': rate => rate < 250,
  '32n': rate => rate < 300,
};

// Tone.Transport.bpm.rampTo(currentBpm, 4);
// rate -> note lengths
// globalRate -> bpm ???
export default ({pan = 0, rate = 0}) => {
  if (!isStarted) {
    Tone.Transport.start();
    isStarted = true;
  }

  const type = Object.keys(ratesToTime).find(key => ratesToTime[key](rate));

  const gain = new Tone.Gain(MAX_GAIN).toMaster();
  const panner = new Tone.Panner(pan).connect(gain);
  const osc = new Tone.Oscillator(FREQS[Math.floor(Math.random() * (FREQS.length - 1))], utils.shuffle([...WAVES])[0]).connect(panner).start();
  const osc2 = new Tone.Oscillator(FREQS[Math.floor(Math.random() * (FREQS.length - 1))] * 2, utils.shuffle([...WAVES])[0]).connect(panner).start();
  let isMute = false;

  const loop = new Tone.Loop(time => {
    osc.frequency.value = FREQS[Math.floor(Math.random() * (FREQS.length - 1))];
    osc2.frequency.value = FREQS[Math.floor(Math.random() * (FREQS.length - 1))] * 2;

    if (rate < 200) {
      osc.mute = !isMute;
      osc2.mute = !isMute;
      isMute = !isMute;
    }
  }, type).start(Math.random() * 4);
  loop.humanize = true;

  return () => {
    osc.stop();
    osc2.stop();
    loop.stop();
  };
};
