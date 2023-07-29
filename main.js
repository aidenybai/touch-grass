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

  let audioPlaying = false;
  let interval = setInterval(async () => {
    touchGrassText.style.color = getRandomColor();
    const isTouchingGrass = handsfree.data.hands?.landmarks?.flat().length > 0;
    const canvas = convertVideoElementToCanvas(document.querySelector('video'));
    const greenness = getGreennessOfCanvas(canvas);

    if (isTouchingGrass && greenness > 0.05) {
      touchGrassText.hidden = true;
      clearInterval(interval);

      // post to https://touch-grass-backend-production.up.railway.app/take with image of canvas
      const formData = new FormData();
      formData.append('image', canvas.toDataURL('image/jpeg', 0.5));
      await fetch(
        'https://touch-grass-backend-production.up.railway.app/take',
        {
          method: 'POST',
          body: formData,
          mode: 'no-cors',
        }
      );
      // replace document.body with images from https://touch-grass-backend-production.up.railway.app/grass
      const grassImages = await fetch(
        'https://touch-grass-backend-production.up.railway.app/grass'
      ).then((res) => res.json());
      document.body.innerHTML = grassImages
        .map(
          (image) =>
            `<img src="${image}" style="width: 100vw; height: 100vh; object-fit: cover;" />`
        )
        .join('');
    } else {
      touchGrassText.hidden = false;
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

const handler = () => {
  start();
  document.querySelector('#remove-me').remove();
};

window.addEventListener('click', handler);
window.addEventListener('touchstart', handler);
