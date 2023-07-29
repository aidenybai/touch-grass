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
  touchGrassText.innerHTML = 'TOUCH GRASS';
  touchGrassText.style.fontWeight = 'bold';
  touchGrassText.style.position = 'fixed';
  touchGrassText.style.top = '25%';
  touchGrassText.style.left = '0';
  touchGrassText.style.width = '100vw';
  touchGrassText.style.height = '100vh';
  touchGrassText.style.fontSize = '100px';
  touchGrassText.style.textAlign = 'center';
  touchGrassText.style.boxShadow = 'box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.5)';

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
  let currentTime = 119;
  let interval = setInterval(async () => {
    touchGrassText.innerHTML = `TOUCH GRASS<br/><small>(${(currentTime / 60 - 1).toFixed(
      0
    )}m ${(currentTime % 60).toFixed(0)}s)</small>`;
    currentTime -= 0.1;
    touchGrassText.style.color = getRandomColor();
    const isTouchingGrass = handsfree.data.hands?.landmarks?.flat().length > 0;
    const canvas = convertVideoElementToCanvas(document.querySelector('video'));
    const greenness = getGreennessOfCanvas(canvas);

    if (isTouchingGrass && greenness > 0.175) {
      touchGrassText.hidden = true;
      clearInterval(interval);

      // post to https://touch-grass-backend-production.up.railway.app/take with image of canvas
      await fetch(
        'https://touch-grass-backend-production.up.railway.app/take',
        {
          body: JSON.stringify({
            image: canvas.toDataURL('image/jpeg', 0.1),
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache',
          method: 'POST',
        }
      );
      // replace document.body with images from https://touch-grass-backend-production.up.railway.app/grass
      const grassImages = await fetch(
        'https://touch-grass-backend-production.up.railway.app/grass'
      ).then((res) => res.json());
      document.body.innerHTML = `u have touched grass. look at other ppl touch: <br/><br/>
      <div class="glide">
        <div class="glide__arrows" data-glide-el="controls">
          <button class="glide__arrow glide__arrow--left" data-glide-dir="<">prev</button>
          <button class="glide__arrow glide__arrow--right" data-glide-dir=">">next</button>
        </div>
        <div class="glide__track" data-glide-el="track">
          <ul class="glide__slides">
            ${grassImages
              .map(
                (image) =>
                  `<li class="glide__slide"><img src="${image}" style="width: 200px;" /></li>`
              )
              .join('')}
          </ul>
        </div>
      </div>`;
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

let started = false;
const handler = () => {
  if (started) return;
  started = true;
  start();
  const el = document.querySelector('#remove-me');
  if (el) el.remove();
};

window.addEventListener('click', handler);
window.addEventListener('touchstart', handler);
