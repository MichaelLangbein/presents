const humanHearingMaxRate = 20_000; // Hz
const sampleRate = 2 * humanHearingMaxRate; // because signal reconstruction


export class SoundMgmt {
  private globalMusicBuffer: AudioBuffer | undefined;
  private rawMusicDataChannel0: Float32Array | undefined;
  private musicSource: AudioBufferSourceNode | undefined;
  private musicStartTime: number | undefined;
  private ctx: AudioContext | undefined;
  private outNode: GainNode | undefined;
  
  constructor() {
    const ctx = new AudioContext({ sampleRate });

    const gainNode = ctx.createGain();
    const gainValue = 0.05;
    const validFrom = 0;
    gainNode.gain.setValueAtTime(gainValue, validFrom);
    gainNode.connect(ctx.destination);

    this.ctx = ctx;
    this.outNode = gainNode;
  }

  async loadFromUrl(url: string) {
    const data = await fetch(url);
    const rawData = await data.arrayBuffer();
    const decodedData = await this.ctx!.decodeAudioData(rawData);
    this.globalMusicBuffer = decodedData;
    this.rawMusicDataChannel0 = new Float32Array(decodedData.getChannelData(0));
  }

  isPlaying() {
    return this.musicStartTime !== undefined;
  }

  play() {
    if (this.isPlaying()) {
        console.warn(`Playback is already running.`);
        return;
    }
    if (!this.globalMusicBuffer) throw new Error(`Need to load audio data first. Call "loadFromUrl(<url>)"`);

    this.musicSource = this.ctx!.createBufferSource();
    this.musicSource.buffer = this.globalMusicBuffer;
    this.musicSource.playbackRate.setValueAtTime(0.5, 0);
    this.musicSource.connect(this.outNode!);
    this.musicSource.start();
    this.musicStartTime = new Date().getTime();

    this.musicSource.onended = () => {
      this.musicStartTime = undefined;
      this.musicSource = undefined;
    };
  }

  stop() {
    this.musicSource?.stop();
  }

  getCurrentAmplitude() {
    if (!this.isPlaying()) return 0;

    const tNow = new Date().getTime();
    const deltaT = (tNow - this.musicStartTime!) / 1000;
    const i = sampleRate * deltaT;
    return this.rawMusicDataChannel0![i];

  }
}
