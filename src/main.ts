import { Mesh, BufferGeometry, Material } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DiscoGummyStage } from "./utils/DiscoGummyStage";
import { ElectricEelStage } from "./utils/ElectricEelStage";
import { SoundMgmt } from "./utils/Sound";
import "./style.css";

async function audio() {
  const player = new SoundMgmt();
  await player.loadFromUrl("./penguinmusic.mp3"); // https://michaellangbein.github.io/presents
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

  const player = await audio();

  const loader = new GLTFLoader();
  const group = await loader.loadAsync("https://michaellangbein.github.io/presents/helena.glb");
  const model = group.scene.children[0] as Mesh<BufferGeometry, Material>;

  const stage = new ElectricEelStage(player, canvas, model);

  stage.loop();
}

main();
