import { SoundMgmt } from "./utils/Sound";
import "./style.css";
import { DiscoGummyStage } from "./stages/DiscoGummyStage";
import { ElectricEelStage } from "./stages/ElectricEelStage";
import { PixelStage } from "./stages/PixelStage";
import { GodRayStage } from "./stages/GodRayStage";
import { getSong, loadModel, getTextures } from "./utils/accessors";
import { ProjectionStage } from "./stages/ProjectionStage";




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

  const player = await audio(getSong('space'));
  const model = await loadModel('Helena');
  const backgroundTextures = getTextures('nebulae');

  const stage = new ProjectionStage(player, canvas, model, backgroundTextures);

  stage.loop();
}

main();
