import { SoundMgmt } from "./utils/Sound";
import { getSong, loadModel, getTextures } from "./utils/accessors";
import { DiscoGummyStage } from "./stages/DiscoGummyStage";
import { PixelStage } from "./stages/PixelStage";
import { ProjectionStage } from "./stages/ProjectionStage";
import { Stage } from "./stages/Stage";
import "./style.css";
import { ElectricEelStage } from "./stages/ElectricEelStage";


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
      const player = await audio(getSong('space'));
      const model = await loadModel('Andreas');
      const backgroundTextures = getTextures('nebulae');
      stage = new ElectricEelStage(player, canvas, model, backgroundTextures);
  }
  else if (name === 'Helena') {
      const player = await audio(getSong('docu'));
      const model = await loadModel('Helena');
      const backgroundTextures = getTextures('asteroids');
      stage = new ProjectionStage(player, canvas, model, backgroundTextures);
  }
  else if (name === 'Sabine') {
      const player = await audio(getSong('lofi'));
      const model = await loadModel('Sabine');
      const backgroundTextures = getTextures('brown_clouds');
      stage = new DiscoGummyStage(player, canvas, model, backgroundTextures);
  }
  else if (name === 'Luis') {
      const player = await audio(getSong('lifelike'));
      const model = await loadModel('Luis');
      const backgroundTextures = getTextures('polluted');
      stage = new PixelStage(player, canvas, model, backgroundTextures);
  }
  else {
      throw Error(`Unknown setup: ${name}`);
  }


  stage.loop();
}

main();
