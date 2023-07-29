import Handsfree from 'handsfree';

const start = () => {
  const handsfree = new Handsfree({
    hands: {
      enabled: true,
      maxNumHands: 4,
      minDetectionConfidence: 0.8,
      minTrackingConfidence: 0.75,
    },
    assetsPath: '/PUBLIC/assets',
  });

  handsfree.disablePlugins('browser');
  handsfree.disablePlugins('core');
  handsfree.plugin.palmPointers.disable();
  handsfree.start();

  const touchGrassText = document.createElement('div');
  touchGrassText.innerText = 'TOUCH GRASS';
  touchGrassText.style.fontWeight = 'bold';
  touchGrassText.style.position = 'fixed';
  touchGrassText.style.top = '40%';
  touchGrassText.style.left = '0';
  touchGrassText.style.width = '100vw';
  touchGrassText.style.height = '100vh';
  touchGrassText.style.fontSize = '100px';
  touchGrassText.style.textAlign = 'center';

  document.body.appendChild(touchGrassText);

  const goodJobText = document.createElement('div');
  goodJobText.innerText = 'good job :)) keep touching it';
  goodJobText.style.fontWeight = 'bold';
  goodJobText.style.position = 'fixed';
  goodJobText.style.top = '40%';
  goodJobText.style.left = '0';
  goodJobText.style.width = '100vw';
  goodJobText.style.height = '100vh';
  goodJobText.style.fontSize = '50px';
  goodJobText.style.textAlign = 'center';

  document.body.appendChild(goodJobText);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let index = 0; index < 6; index++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const convertVideoElementToCanvas = (video) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  const getGreennessOfCanvas = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let greenPixels = 0;

    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      if (green > red && green > blue && alpha > 0) {
        greenPixels++;
      }
    }
    return greenPixels / (canvas.width * canvas.height);
  };

  touchGrassText.hidden = false;
  goodJobText.hidden = true;

  let audioPlaying = false;
  setInterval(() => {
    touchGrassText.style.color = getRandomColor();
    const isTouchingGrass = handsfree.data.hands?.landmarks?.flat().length > 0;
    const canvas = convertVideoElementToCanvas(document.querySelector('video'));
    const greenness = getGreennessOfCanvas(canvas);

    if (isTouchingGrass && greenness > 0.05) {
      touchGrassText.hidden = true;
      goodJobText.hidden = false;
    } else {
      touchGrassText.hidden = false;
      goodJobText.hidden = true;
      if (audioPlaying) return;
      const audio = new Audio('/audio/linus.mp3');
      audio.play();
      audio.onended = () => {
        audioPlaying = false;
      };
      audioPlaying = true;
    }
  }, 100);
};

window.addEventListener('click', () => {
  start();
  document.querySelector('#remove-me').remove();
});
