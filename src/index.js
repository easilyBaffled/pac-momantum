import { Engine, Render, World, Bodies, Body, Vector } from 'matter-js';
import $ from 'jquery';

console.clear();
console.ident = val => (console.log(val), val);

const createWorld = (width, height) => ({
    width,
    height,
    top: 0,
    bottom: height,
    left: 0,
    right: width,
    centerX: width / 2,
    centerY: height / 2,
    unit: width / 100
});

const vectors = {
    up: Vector.create(0, -1),
    down: Vector.create(0, 1),
    left: Vector.create(-1, 0),
    right: Vector.create(1, 0),
    zero: Vector.create(0, 0)
};

const Wall = (x, y, width, height, options = {}) =>
    Bodies.rectangle(
        x,
        y,
        width,
        height,
        Object.assign(options, { isStatic: true })
    );

const world = createWorld(400, 400);

const unitVectors = {
    up: Vector.create(0, -1 / world.unit),
    down: Vector.create(0, 1 / world.unit),
    left: Vector.create(-1 / world.unit, 0),
    right: Vector.create(1 / world.unit, 0),
    zero: Vector.create(0, 0)
};

const engine = Engine.create();
engine.enableSleeping = true;

const render = Render.create({
    element: document.body,
    engine,
    options: {
        width: world.width,
        height: world.height,
        wireframes: false
    }
});

var topWall = Wall(
    world.centerX,
    world.top,
    world.width + world.unit,
    world.unit * 2
);
var leftWall = Wall(
    world.left,
    world.centerY,
    world.unit * 2,
    world.height + world.unit
);
var rightWall = Wall(
    world.right,
    world.centerY,
    world.unit * 2,
    world.height + world.unit
);

var bottomWall = Wall(
    world.centerX,
    world.bottom,
    world.width + world.unit,
    world.unit * 2
);
// bottomWall.restitution = 2;
var ball = Bodies.circle(
    world.centerX,
    world.centerY,
    world.unit * 2,
    {
        density: world.unit
    },
    20
);

ball.friction = 0.05;
ball.frictionAir = 0.0005;
ball.restitution = 0.9;

World.add(engine.world, [topWall, leftWall, rightWall, ball, bottomWall]);

Engine.run(engine);
Render.run(render);

const setVelocity = vector => target => Body.setVelocity(target, vector);

const applyForceAtTarget = vector => target =>
    Body.applyForce(target, target.position, vector);

document.addEventListener('keyup', ({ key }) => {
    const applyVelocity =
        key === 'ArrowUp'
            ? applyForceAtTarget({ x: 0, y: -world.unit * 4 })
            : key === 'ArrowDown'
              ? applyForceAtTarget({ x: 0, y: world.unit * 4 })
              : key === 'ArrowLeft'
                ? applyForceAtTarget({ x: -world.unit * 4, y: 0 })
                : key === 'ArrowRight'
                  ? applyForceAtTarget({ x: world.unit * 4, y: 0 })
                  : applyForceAtTarget(unitVectors.zero);

    applyVelocity(ball);
});
