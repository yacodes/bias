import * as faceapi from './face-api.js';

export const shuffle = a => {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

export const delay = async time => new Promise(resolve => setTimeout(resolve, time));

const genderD = {
  male: 'М',
  female: 'Ж',
  N: '☓'
};

const exprD = {
  angry: 'гнев',
  happy: 'счастье',
  sad: 'грусть',
  neutral: 'нейтральность',
  fearful: 'страх',
  surprised: 'удивление',
  disgusted: 'отвращение',
};

export const createLoader = async (text = 'Генерируем человека,<br/>которого не существует', isLoading = true, opacity = 1) => {
  const $preloader = document.createElement('div');
  $preloader.className = `preloader ${opacity < 1 ? 'transparent' : ''}`;
  $preloader.innerHTML = `
  <div>
    <div>${text}</div>
    ${isLoading ? `
      <div class="loading">
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
      </div>
    ` : ''}
  </div>
  `.replace('\n', '');
  return $preloader;
};

export const fadeIn = async ($el, time = 3000) => {
  $el.classList.add('fade-entering');
  $el.style.transition = `opacity ${time}ms ease 0s`;
  document.body.appendChild($el);
  await delay(10);
  $el.classList.add('fade-enter');
  await delay(time);
  $el.classList.remove('fade-entering');
  $el.classList.remove('fade-enter');
  $el.style.transition = '';
};

export const fadeOut = async ($el, time = 3000) => {
  $el.classList.add('fade-leaving');
  $el.style.transition = `opacity ${time}ms ease 0s`;
  await delay(10);
  $el.classList.add('fade-leave');
  await delay(time);
  $el.parentNode.removeChild($el);
  $el.transition = '';
  $el.classList.remove('fade-leaving');
  $el.classList.remove('fade-leave');
};

export const createImage = async index => new Promise(resolve => {
  const $img = document.createElement('img');
  $img.className = 'image';
  $img.onload = () => resolve($img);
  $img.src = `/persons/${index}.jpeg`;
});

export const analyzeImage = async ($img, type) =>
  await faceapi.detectAllFaces($img, type).withFaceLandmarks().withFaceDescriptors().withFaceExpressions().withAgeAndGender();

export const createCanvas = async ($img, data) => {
  const $canvas = document.createElement('canvas');
  $canvas.className = 'canvas';
  $canvas.width = window.innerHeight;
  $canvas.height = window.innerHeight;
  document.body.appendChild($canvas);

  faceapi.matchDimensions($canvas, $img);
  const resizedResults = faceapi.resizeResults(data, $img);
  faceapi.draw.drawDetections($canvas, resizedResults);
  faceapi.draw.drawFaceLandmarks($canvas, resizedResults);

  return $canvas;
};

export const createDataUI = async (data, title) => {
  const $root = document.createElement('div');
  $root.className = 'data';
  $root.innerHTML = `
    ${title ? `
      <div class="data-value" style="border-bottom: 0;">
        <span style="font-size: 70px; border-bottom: 3px solid #fff;">${title}</span>
      </div>
    ` : ''}
    <div class="data-value">
      <span>возраст</span><span>${parseFloat(data[0].age.toFixed(3))}</span>
    </div>
    <div class="data-value">
      <span>пол</span><span>${genderD[data[0].gender]} ${Math.floor(data[0].genderProbability * 100)}%</span>
    </div>
    ${Object.keys(data[0].expressions).sort((keyA, keyB) => data[0].expressions[keyB] - data[0].expressions[keyA]).map(key => `
      <div class="data-value">
        <span>${exprD[key]}</span><span>${parseFloat(data[0].expressions[key] * 100).toFixed(2)}%</span>
      </div>
    `).filter((str, i) => i <= 2).reduce((res, str) => res + str, '')}
  `;
  return $root;
};

export const recognize = async ({text, errorText, type, $img, title}) => {
  await delay(2000);
  let $text;
  if (text) {
    $text = await createLoader(text, true, 0.9);
    await fadeIn($text, 1500);
  }
  const data = await analyzeImage($img, type);
  if (text) {
    await fadeOut($text, 1500);
  }
  if (data[0]) {
    await delay(1000);
    const $canvas = await createCanvas($img, data);
    await delay(1000);
    const $details = await createDataUI(data, title);
    await fadeIn($details, 1500);
    await delay(5000);
    await Promise.all([
      fadeOut($details, 1500),
      fadeOut($canvas, 1500),
    ]);
  } else {
    const $error = await createLoader(errorText, false, 0.9);
    await fadeIn($error, 1500);
    await delay(5000);
    await fadeOut($error, 1500);
  }

  return data[0];
};

export const showAgeInaccurancy = async (data1 = {age: 0}, data2 = {age: 0}, data3 = {age: 0}) => {
  const $root = document.createElement('div');
  $root.className = 'results';
  $root.innerHTML = `
    <div class="data-value" style="border-bottom: 0;">
      <span style="font-size: 70px; border-bottom: 3px solid #fff;">Погрешности возраста</span>
    </div>
    <div class="row">
      <div class="td">&nbsp;</div>
      <div class="td">&nbsp;</div>
      <div class="td">СЕТЬ #1</div>
      <div class="td">СЕТЬ #2</div>
    </div>
    <div class="row">
      <div class="td">Возраст</div>
      <div class="td">${parseFloat(data1.age).toFixed(3)}</div>
      <div class="td">${parseFloat(data2.age).toFixed(3)}</div>
      <div class="td">${parseFloat(data3.age).toFixed(3)}</div>
    </div>
    <div class="row">
      <div class="td">Погрешность</div>
      <div class="td">&nbsp;</div>
      <div class="td">${data2.age ? parseFloat(Math.abs(parseFloat(data1.age).toFixed(3) - parseFloat(data2.age).toFixed(3))).toFixed(3) : 10}</div>
      <div class="td">${data3.age ? parseFloat(Math.abs(parseFloat(data1.age).toFixed(3) - parseFloat(data3.age).toFixed(3))).toFixed(3) : 10}</div>
    </div>
  `;
  await fadeIn($root, 1500);
  await delay(5000);
  await fadeOut($root, 1500);

  return [
    data2.age ? parseFloat(Math.abs(parseFloat(data1.age).toFixed(3) - parseFloat(data2.age).toFixed(3))).toFixed(3) : 10,
    data3.age ? parseFloat(Math.abs(parseFloat(data1.age).toFixed(3) - parseFloat(data3.age).toFixed(3))).toFixed(3) : 10,
  ];
};

export const showGenderInaccurancy = async (data1 = {gender: 'N', genderProbability: 1}, data2 = {gender: 'N', genderProbability: 1}, data3 = {gender: 'N', genderProbability: 1}) => {
  const $root = document.createElement('div');
  $root.className = 'results';
  $root.innerHTML = `
    <div class="data-value" style="border-bottom: 0;">
      <span style="font-size: 70px; border-bottom: 3px solid #fff;">Погрешности пола</span>
    </div>
    <div class="row">
      <div class="td">&nbsp;</div>
      <div class="td">&nbsp;</div>
      <div class="td">СЕТЬ #1</div>
      <div class="td">СЕТЬ #2</div>
    </div>
    <div class="row">
      <div class="td">Пол</div>
      <div class="td">${genderD[data1.gender]} ${Math.floor(data1.genderProbability * 100)}%</div>
      <div class="td">${genderD[data2.gender]} ${Math.floor(data2.genderProbability * 100)}%</div>
      <div class="td">${genderD[data3.gender]} ${Math.floor(data3.genderProbability * 100)}%</div>
    </div>
    <div class="row">
      <div class="td">Погрешность</div>
      <div class="td">&nbsp;</div>
      <div class="td">${data1.gender === data2.gender ? Math.abs(Math.floor(data1.genderProbability * 100) - Math.floor(data2.genderProbability * 100)) : 10}</div>
      <div class="td">${data1.gender === data3.gender ? Math.abs(Math.floor(data1.genderProbability * 100) - Math.floor(data3.genderProbability * 100)) : 10}</div>
    </div>
  `;
  await fadeIn($root, 1500);
  await delay(5000);
  await fadeOut($root, 1500);
  return [
    data1.gender === data2.gender ? Math.abs(Math.floor(data1.genderProbability * 100) - Math.floor(data2.genderProbability * 100)) : 10,
    data1.gender === data3.gender ? Math.abs(Math.floor(data1.genderProbability * 100) - Math.floor(data3.genderProbability * 100)) : 10
  ];
};

export const showEmotionInaccurancy = async (data1 = {expressions: []}, data2 = {expressions: []}, data3 = {expressions: []}) => {
  const $root = document.createElement('div');
  $root.className = 'results';
  const emotionKeys = Object.keys(data1.expressions).sort((keyA, keyB) => data1.expressions[keyB] - data1.expressions[keyA]);
  const e1K = emotionKeys[0];
  const e2K = emotionKeys[1];
  const e3K = emotionKeys[2];

  $root.innerHTML = `
    <div class="data-value" style="border-bottom: 0;">
      <span style="font-size: 70px; border-bottom: 3px solid #fff;">Погрешности эмоций</span>
    </div>
    <div class="row">
      <div class="td">&nbsp;</div>
      <div class="td">&nbsp;</div>
      <div class="td">СЕТЬ #1</div>
      <div class="td">СЕТЬ #2</div>
    </div>
    <div class="row">
      <div class="td">${exprD[e1K]}</div>
      <div class="td">${parseFloat(data1.expressions[e1K] * 100).toFixed(2)}</div>
      <div class="td">${parseFloat(data2.expressions[e1K] * 100).toFixed(2)}</div>
      <div class="td">${parseFloat(data3.expressions[e1K] * 100).toFixed(2)}</div>
    </div>
    <div class="row">
      <div class="td">${exprD[e2K]}</div>
      <div class="td">${parseFloat(data1.expressions[e2K] * 100).toFixed(2)}</div>
      <div class="td">${parseFloat(data2.expressions[e2K] * 100).toFixed(2)}</div>
      <div class="td">${parseFloat(data3.expressions[e2K] * 100).toFixed(2)}</div>
    </div>
    <div class="row">
      <div class="td">${exprD[e3K]}</div>
      <div class="td">${parseFloat(data1.expressions[e3K] * 100).toFixed(2)}</div>
      <div class="td">${parseFloat(data2.expressions[e3K] * 100).toFixed(2)}</div>
      <div class="td">${parseFloat(data3.expressions[e3K] * 100).toFixed(2)}</div>
    </div>
    <div class="row">
      <div class="td">Погрешность</div>
      <div class="td">&nbsp;</div>
      <div class="td">${data2.expressions[e1K] ? parseFloat(Math.abs(
      (parseFloat(data1.expressions[e1K] * 100).toFixed(2) - parseFloat(data2.expressions[e1K] * 100).toFixed(2)) -
      (parseFloat(data1.expressions[e2K] * 100).toFixed(2) - parseFloat(data2.expressions[e2K] * 100).toFixed(2)) -
      (parseFloat(data1.expressions[e3K] * 100).toFixed(2) - parseFloat(data2.expressions[e3K] * 100).toFixed(2)))).toFixed(2) : 10}</div>
      <div class="td">${data3.expressions[e1K] ? parseFloat(Math.abs(
      (parseFloat(data1.expressions[e1K] * 100).toFixed(2) - parseFloat(data3.expressions[e1K] * 100).toFixed(2)) -
      (parseFloat(data1.expressions[e2K] * 100).toFixed(2) - parseFloat(data3.expressions[e2K] * 100).toFixed(2)) -
      (parseFloat(data1.expressions[e3K] * 100).toFixed(2) - parseFloat(data3.expressions[e3K] * 100).toFixed(2)))).toFixed(2) : 10}</div>
    </div>
  `;
  await fadeIn($root, 1500);
  await delay(5000);
  await fadeOut($root, 1500);
  return [
    data2.expressions[e1K] ? parseFloat(Math.abs(
      (parseFloat(data1.expressions[e1K] * 100).toFixed(2) - parseFloat(data2.expressions[e1K] * 100).toFixed(2)) -
      (parseFloat(data1.expressions[e2K] * 100).toFixed(2) - parseFloat(data2.expressions[e2K] * 100).toFixed(2)) -
      (parseFloat(data1.expressions[e3K] * 100).toFixed(2) - parseFloat(data2.expressions[e3K] * 100).toFixed(2)))).toFixed(2) : 10,
    data3.expressions[e1K] ? parseFloat(Math.abs(
      (parseFloat(data1.expressions[e1K] * 100).toFixed(2) - parseFloat(data3.expressions[e1K] * 100).toFixed(2)) -
      (parseFloat(data1.expressions[e2K] * 100).toFixed(2) - parseFloat(data3.expressions[e2K] * 100).toFixed(2)) -
      (parseFloat(data1.expressions[e3K] * 100).toFixed(2) - parseFloat(data3.expressions[e3K] * 100).toFixed(2)))).toFixed(2) : 10
  ];
};

export const showGlobalErrorRate = async (d1, d2) => {
  const $root = document.createElement('div');
  $root.className = 'results';
  $root.innerHTML = `
    <div class="data-value" style="border-bottom: 0;">
      <span style="font-size: 70px; border-bottom: 3px solid #fff;">Общая погрешность</span>
    </div>
    <div class="row" style="border-bottom: 3px solid #ff1d15;">
      <div class="td" style="color: #ff1d15;">Сеть #1</div>
      <div class="td" style="color: #ff1d15;">${d1}</div>
    </div>
    <div class="row">
      <div class="td">Сеть #2</div>
      <div class="td">${d2}</div>
    </div>
  `;
  await fadeIn($root, 1500);
  await delay(5000);
  await fadeOut($root, 1500);
};
