import { SoundMgmt } from "./utils/Sound";
import { getSong, loadModel, getTextures } from "./utils/accessors";
import { DiscoGummyStage } from "./stages/DiscoGummyStage";
import { ProjectionStage } from "./stages/ProjectionStage";
import { ElectricEelStage } from "./stages/ElectricEelStage";
import { CartoonStage } from "./stages/CartoonStage";
import { Stage } from "./stages/Stage";
import "./style.css";


const params = new URLSearchParams(window.location.search);
const name = params.get("q");



async function audio(songUrl: string) {
  const player = new SoundMgmt();
  await player.loadFromUrl(songUrl);
  const playButton = document.getElementById("playMusic") as HTMLButtonElement;
  playButton.addEventListener("click", () => {
    if (player.isPlaying()) {
      player.stop();
      playButton.innerHTML = "Play music";
    } else {
      player.play(() => (playButton.innerHTML = "Play music"));
      playButton.innerHTML = "Stop music";
    }
  });
  return player;
}

async function main() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  let stage: Stage;

  if (name === 'Andreas') {
      const { local, source } = getSong('space');
      const player = await audio(local);
      const model = await loadModel('Andreas') as any;
      const { source: textureSource, textures: backgroundTextures} = getTextures('nebulae');
      stage = new ElectricEelStage(player, canvas, model, backgroundTextures);
      document.getElementById('legal')!.innerHTML = `<a href="${source}">music</a>, <a href="${textureSource}">textures</a>`;
  }
  else if (name === 'Helena') {
      const { local, source} = getSong('docu');
      const player = await audio(local);
      const model = await loadModel('Helena') as any;
      const { source: textureSource, textures: backgroundTextures} = getTextures('asteroids');
      stage = new ProjectionStage(player, canvas, model, backgroundTextures);
      document.getElementById('legal')!.innerHTML = `<a href="${source}">music</a>, <a href="${textureSource}">textures</a>`;
  }
  else if (name === 'Sabine') {
      const { local, source} = getSong('lofi');
      const player = await audio(local);
      const model = await loadModel('Sabine') as any;
      const { source: textureSource, textures: backgroundTextures} = getTextures('brown_clouds');
      stage = new DiscoGummyStage(player, canvas, model, backgroundTextures);
      document.getElementById('legal')!.innerHTML = `<a href="${source}">music</a>, <a href="${textureSource}">textures</a>`;
  }
  else if (name === 'Luis') {
      const { local, source} = getSong('lifelike');
      const player = await audio(local);
      const model = await loadModel('Luis') as any;
      const { source: textureSource, textures: backgroundTextures} = getTextures('polluted');
      stage = new CartoonStage(player, canvas, model, backgroundTextures);
      document.getElementById('legal')!.innerHTML = `<a href="${source}">music</a>, <a href="${textureSource}">textures</a>`;
  }
  else {
      // throw Error(`Unknown setup: ${name}`);
        const { local, source} = getSong('lifelike');
        const player = await audio(local);
        const model = await loadModel('Luis') as any;
        const { source: textureSource, textures: backgroundTextures} = getTextures('polluted');
        stage = new DiscoGummyStage(player, canvas, model, backgroundTextures);
        document.getElementById('legal')!.innerHTML = `<a href="${source}">music</a>, <a href="${textureSource}">textures</a>`;
  }


  stage.loop();
}

main();
