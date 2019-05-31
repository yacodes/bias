import * as faceapi from './face-api.js';
import * as utils from './utils';
import sound from './sound';

const indexes = utils.shuffle([...Array(99).keys()]);
let currentIndex = 0;
let firstErrorRate = 0;
let secondErrorRate = 0;
let isFinished = false;

window.addEventListener('keypress', e => {
  if (e.code === 'KeyS') {
    isFinished = true;
  }
});

let networks = [new faceapi.TinyFaceDetectorOptions(), new faceapi.MtcnnOptions()];

export const run = async () => {
  console.log(firstErrorRate, secondErrorRate, currentIndex);
  networks = utils.shuffle(networks);
  if (!indexes[currentIndex]) return null;
  const $preview = await utils.createLoader(`Раунд ${currentIndex + 1}`);

  await utils.fadeIn($preview, 1500);
  await utils.delay(5000);
  await utils.fadeOut($preview, 1500);
  await utils.delay(2000);
  const $loader = await utils.createLoader('Генерируем человека,<br/>которого не существует');
  await utils.fadeIn($loader, 1500);
  const $img = await utils.createImage(indexes[currentIndex]);
  await utils.delay(1000);
  await utils.fadeOut($loader, 1500);
  await utils.fadeIn($img, 1500);

  const rootData = await utils.recognize({
    $img,
    title: 'Исходные данные',
    errorText: 'Исходные данные отсутствуют',
    type: new faceapi.SsdMobilenetv1Options(),
  });

  let unsound1 = sound({pan: -1, rate: firstErrorRate});

  const firstNeuralData = await utils.recognize({
    $img,
    title: 'Результаты распознавания сети #1',
    text: 'Первая нейронная сеть<br/>пытается распознать изображение',
    errorText: 'Первая нейронная сеть<br/>не смогла распознать изображение',
    type: networks[0],
  });

  unsound1();
  let unsound2 = sound({pan: 1, rate: secondErrorRate});

  const secondNeuralData = await utils.recognize({
    $img,
    title: 'Результаты распознавания сети #2',
    text: 'Вторая нейронная сеть<br/>пытается распознать изображение',
    errorText: 'Вторая нейронная сеть<br/>не смогла распознать изображение',
    type: networks[1],
  });

  unsound1 = sound({pan: -1, rate: firstErrorRate});

  await utils.delay(2000);
  const [a1Inc, a2Inc] = await utils.showAgeInaccurancy(rootData, firstNeuralData, secondNeuralData);

  await utils.delay(2000);
  const [g1Inc, g2Inc] = await utils.showGenderInaccurancy(rootData, firstNeuralData, secondNeuralData);

  await utils.delay(2000);
  const [e1Inc, e2Inc] = await utils.showEmotionInaccurancy(rootData, firstNeuralData, secondNeuralData);

  firstErrorRate = parseFloat(Number(firstErrorRate) + Number(a1Inc) + Number(g1Inc) + Number(e1Inc)).toFixed(3);
  secondErrorRate = parseFloat(Number(secondErrorRate) + Number(a2Inc) + Number(g2Inc) + Number(e2Inc)).toFixed(3);

  await utils.delay(2000);
  await utils.showGlobalErrorRate(firstErrorRate, secondErrorRate);
  unsound1();
  unsound2();

  // Results
  await utils.delay(2000);
  await utils.fadeOut($img, 1500);
  await utils.delay(2000);
  currentIndex++;

  if (isFinished) {
    const $finish = await utils.createLoader(`Конец`, false);
    await utils.fadeIn($finish, 1500);
    return null;
  }

  return run();
};

export const init = async () => {
  await faceapi.loadSsdMobilenetv1Model('/models');
  await faceapi.loadTinyFaceDetectorModel('/models');
  await faceapi.loadMtcnnModel('/models');
  await faceapi.loadFaceLandmarkModel('/models');
  await faceapi.loadFaceRecognitionModel('/models');
  await faceapi.loadFaceExpressionModel('/models');
  await faceapi.loadAgeGenderModel('/models');
  const $start = await utils.createLoader(`Нажмите пробел,<br/> чтобы начать`, false);
  await utils.fadeIn($start, 1500);
  await new Promise(resolve => window.addEventListener('keypress', ev => ev.code === 'Space' ? resolve() : null));
  await utils.fadeOut($start, 1500);
  run();
};

window.addEventListener('load', init, {passive: true});
