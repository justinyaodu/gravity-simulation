let numFields = 0;

const ELEMENT = numFields++;
const POS_X = numFields++;
const POS_Y = numFields++;
const MASS = numFields++;
const VEL_X = numFields++;
const VEL_Y = numFields++;

const objs = [];
const timestep = 0.05;

const svg = document.getElementById("universe");
const objectsGroup = svg.getElementById("objects");

function createSVGElement(name) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}

function newObject(posX, posY, mass, velX, velY, fill) {
  const element = createSVGElement("circle");
  element.setAttribute("cx", posX);
  element.setAttribute("cy", posY);
  element.setAttribute("r", Math.pow(mass, 1/3));
  element.style = "fill: " + fill + ";";
  objectsGroup.appendChild(element);
  objs.push([element, posX, posY, mass, velX, velY]);
}

function tick(timestamp) {
  for (let i = 0; i < objs.length; i++) {
    for (let j = 0; j < objs.length; j++) {
      if (i == j) continue;

      const distX = objs[j][POS_X] - objs[i][POS_X];
      const distY = objs[j][POS_Y] - objs[i][POS_Y];
      const distSquared = distX * distX + distY * distY;
      const dist = Math.sqrt(distSquared);
      const accel = objs[j][MASS] / distSquared;
      const accelX = accel * distX / dist;
      const accelY = accel * distY / dist;
      objs[i][VEL_X] += accelX * timestep;
      objs[i][VEL_Y] += accelY * timestep;
    }
  }

  for (let i = 0; i < objs.length; i++) {
    objs[i][POS_X] += objs[i][VEL_X] * timestep;
    objs[i][POS_Y] += objs[i][VEL_Y] * timestep;
    objs[i][ELEMENT].setAttribute("cx", objs[i][POS_X]);
    objs[i][ELEMENT].setAttribute("cy", objs[i][POS_Y]);
  }
  window.requestAnimationFrame(tick);
}

function main() {
  const bodies = generateSystem();

  for (const body of bodies) {
    newObject(body.posX, body.posY, body.mass, body.velX, body.velY, "yellow");
  }

  let maxSquaredDistance = 0;
  for (const body of bodies) {
    maxSquaredDistance = Math.max(maxSquaredDistance, body.posX * body.posX + body.posY * body.posY);
  }

  const width = 2 * Math.sqrt(maxSquaredDistance) * 1.1;
  svg.setAttribute("viewBox", [-width / 2, -width / 2, width, width].join(" "));

  window.requestAnimationFrame(tick);
}

main();
