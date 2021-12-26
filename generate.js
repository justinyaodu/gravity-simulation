class Random {
  static integer(min, max) {
    return min + Math.floor((max - min) * Math.random());
  }

  static sawtooth(max) {
    const value = Math.floor(Math.random() * (max * (max + 1) / 2));
    let total = 0;
    for (let i = 1; i < max; i++) {
      total += i;
      if (value < total) return i;
    }
    return max;
  }

  static sum(min, max, count) {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Random.integer(min, max);
    }
    return total;
  }

  static unitVector() {
    const angle = Math.random() * 2 * Math.PI;
    return [Math.cos(angle), Math.sin(angle)];
  }
}

const TIER_FACTOR = 256;

const TIER_MOON = 0;
const TIER_PLANET = TIER_MOON + 1;
const TIER_STAR = TIER_PLANET + 1;

const ORBIT_SPACING = 1.5;

const childrenByTier = [
  () => 0,
  () => 2 - Random.sawtooth(2), // () => 4 - Random.sawtooth(4),
  () => Random.sum(1, 3, 3), // () => Random.sum(1, 3, 4)
];

class Body {
  constructor(mass) {
    this.mass = mass;
    this.groupMass = this.mass;
    this.radius = Math.pow(this.mass, 1/3);
    this.children = [];
    this.influenceAccel = 0;
    this.orbitRadius = 0;
    this.orbitVelocity = 0;
    this.posX = 0;
    this.posY = 0;
    this.velX = 0;
    this.velY = 0;
  }

  split(tier) {
    const extraChildren = childrenByTier[tier]();
    if (extraChildren == 0) return;

    for (let i = 0; i < extraChildren; i++) {
      const childMass = Random.integer(1, 8) * this.mass / TIER_FACTOR;
      const child = new Body(childMass);
      this.children.push(child);

      child.split(tier - 1);
      this.groupMass += child.groupMass;
    }
  }

  toObject() {
    const obj = {};

    const keys = [
      "mass", "groupMass", "radius", "orbitRadius", "orbitVelocity",
      "posX", "posY", "velX", "velY"
    ];
    for (const key of keys) {
      obj[key] = this[key];
    }

    obj["children"] = this.children.map(c => c.toObject());
    return obj;
  }

  toString() {
    return JSON.stringify(this.toObject(), null, 2);
  }

  computeOrbits() {
    const surfaceAccel = this.mass / (this.radius * this.radius);

    if (this.children.length == 0) {
      this.influenceAccel = surfaceAccel;
      return;
    }

    let innerMass = this.mass;
    let prevRadius = this.radius;
    let prevBorderAccel = surfaceAccel;

    for (const child of this.children) {
      child.computeOrbits();

      const borderAccel = Math.min(prevBorderAccel, child.influenceAccel);
      const minOrbitRadius = Math.sqrt(this.mass / borderAccel) + Math.sqrt(child.mass / borderAccel);
      child.orbitRadius = prevRadius + (minOrbitRadius - prevRadius) * ORBIT_SPACING;
      child.orbitVelocity = Math.sqrt(innerMass / child.orbitRadius);

      innerMass += child.groupMass;
      prevRadius = child.orbitRadius;
      prevBorderAccel = Body.sphereOfInfluenceOuterBorderAccel(this, child);
    }

    this.influenceAccel = prevBorderAccel;
  }

  computePositions() {
    if (this.children.length == 0) return;

    for (const child of this.children) {
      const [rx, ry] = Random.unitVector();
      child.posX = this.posX + rx * child.orbitRadius;
      child.posY = this.posY + ry * child.orbitRadius;
      child.velX = this.velX + ry * child.orbitVelocity;
      child.velY = this.velY - rx * child.orbitVelocity;
    }

    let comX = this.posX * this.mass;
    let comY = this.posY * this.mass;
    for (const child of this.children) {
      comX += child.posX * child.groupMass;
      comY += child.posY * child.groupMass;
    }
    comX /= this.groupMass;
    comY /= this.groupMass;

    let deltaPosX = this.posX - comX;
    let deltaPosY = this.posY - comY;
    this.posX += deltaPosX;
    this.posY += deltaPosY;
    for (const child of this.children) {
      child.posX += deltaPosX;
      child.posY += deltaPosY;
    }

    let momentumX = this.velX * this.mass;
    let momentumY = this.velY * this.mass;
    for (const child of this.children) {
      momentumX += child.velX * child.groupMass;
      momentumY += child.velY * child.groupMass;
    }

    let deltaVelX = this.velX - (momentumX / this.groupMass);
    let deltaVelY = this.velY - (momentumY / this.groupMass);
    this.velX += deltaVelX;
    this.velY += deltaVelY;
    for (const child of this.children) {
      child.velX += deltaVelX;
      child.velY += deltaVelY;
    }

    for (const child of this.children) {
      child.computePositions();
    }
  }

  static sphereOfInfluenceOuterBorderAccel(body, child) {
    const m1 = body.mass;
    const m2 = child.mass;
    const x2 = child.orbitRadius;

    const a = m2 - m1;
    const b = 2 * m1 * x2;
    const c = -m1 * x2 * x2;
    const x = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);

    return m1 / (x * x);
  }

  allBodies(bodies = []) {
    bodies.push(this);
    this.children.forEach(child => child.allBodies(bodies));
    return bodies;
  }
}

function generateSystem() {
  const root = new Body(TIER_FACTOR * TIER_FACTOR);
  root.split(TIER_STAR);
  root.computeOrbits();
  root.computePositions();
  return root.allBodies();
}
