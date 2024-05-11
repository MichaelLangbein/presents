// https://github.com/joeiddon/perlin/blob/master/perlin.js

type Vec2 = { x: number; y: number };

export class PerlinNoise {
  private gradients: Map<string, Vec2> = new Map();
  private memory: Map<string, number> = new Map();

  private randVector(): Vec2 {
    let theta = Math.random() * 2 * Math.PI;
    return { x: Math.cos(theta), y: Math.sin(theta) };
  }
  private dot_prod_grid(x: number, y: number, vx: number, vy: number) {
    let g_vect: Vec2;
    let d_vect = { x: x - vx, y: y - vy };
    if (this.gradients.get(`${vx}, ${vy}`)) {
      g_vect = this.gradients.get(`${vx}, ${vy}`)!;
    } else {
      g_vect = this.randVector();
      this.gradients.set(`${vx}, ${vy}`, g_vect);
    }
    return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
  }

  private smootherStep(x: number) {
    return 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
  }

  private interpolate(x: number, a: number, b: number) {
    return a + this.smootherStep(x) * (b - a);
  }

  public get(x: number, y: number) {
    if (this.memory.get(`${x}, ${y}`)) return this.memory.get(`${x}, ${y}`)!;
    let xf = Math.floor(x);
    let yf = Math.floor(y);
    //interpolate
    let tl = this.dot_prod_grid(x, y, xf, yf);
    let tr = this.dot_prod_grid(x, y, xf + 1, yf);
    let bl = this.dot_prod_grid(x, y, xf, yf + 1);
    let br = this.dot_prod_grid(x, y, xf + 1, yf + 1);
    let xt = this.interpolate(x - xf, tl, tr);
    let xb = this.interpolate(x - xf, bl, br);
    let v = this.interpolate(y - yf, xt, xb);
    this.memory.set(`${x}, ${y}`, v);
    return v;
  }
}

// Standard Normal variate using Box-Muller transform.
export function gaussianRandom(mean = 0, stdev = 1) {
  const u = 1 - Math.random(); // Converting [0,1) to (0,1]
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Transform to the desired mean and standard deviation:
  return z * stdev + mean;
}
