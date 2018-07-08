import {
    Composite,
    Engine,
    Render,
    World,
    Bodies,
    Body,
    Vector,
    Events
} from 'matter-js';
import $ from 'jquery';

import { colors, lighter } from './colors';

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
engine.world.gravity = vectors.zero;
const render = Render.create({
    element: document.body,
    engine,
    options: {
        width: world.width,
        height: world.height,
        wireframes: false,
        showAngleIndicator: true
    }
});

var topWall = Wall(
    world.centerX,
    world.top,
    world.width + world.unit,
    world.unit * 4
);
var leftWall = Wall(
    world.left,
    world.centerY,
    world.unit * 4,
    world.height + world.unit
);
var rightWall = Wall(
    world.right,
    world.centerY,
    world.unit * 4,
    world.height + world.unit
);

var bottomWall = Wall(
    world.centerX,
    world.bottom,
    world.width + world.unit,
    world.unit * 4
);
// bottomWall.restitution = 2;
var ball = Bodies.circle(
    world.centerX,
    world.centerY,
    world.unit * 2,
    {
        label: 'ball',
        density: world.unit,
        fillStyle: colors.yellow
    },
    20
);

var pellet = Bodies.circle(
    world.centerX + 20,
    world.centerY + 20,
    world.unit,
    {
        fillStyle: lighter(colors.yellow),
        label: 'pellet',
        isStatic: true
    },
    20
);

ball.friction = 0.05;
ball.frictionAir = 0.001;
ball.restitution = 0.9;

World.add(engine.world, [
    pellet,
    topWall,
    leftWall,
    rightWall,
    ball,
    bottomWall
]);

Engine.run(engine);
Render.run(render);

const setVelocity = vector => target => Body.setVelocity(target, vector);

const applyForceAtTarget = vector => target =>
    Body.applyForce(target, target.position, vector);

document.addEventListener('keyup', ({ key }) => {
    const applyVelocity =
        key === 'ArrowUp'
            ? applyForceAtTarget({ x: 0, y: -world.unit * 2 })
            : key === 'ArrowDown'
              ? applyForceAtTarget({ x: 0, y: world.unit * 2 })
              : key === 'ArrowLeft'
                ? applyForceAtTarget({ x: -world.unit * 2, y: 0 })
                : key === 'ArrowRight'
                  ? applyForceAtTarget({ x: world.unit * 2, y: 0 })
                  : applyForceAtTarget(unitVectors.zero);

    applyVelocity(ball);
});

Events.on(engine, 'collisionStart', function(event) {
    var pairs = event.pairs;
    const pair = event.pairs.find(
        pair =>
            (pair.bodyA.label === 'ball' && pair.bodyB.label === 'pellet') ||
            (pair.bodyB.label === 'ball' && pair.bodyA.label === 'pellet')
    );
    if (pair) {
        console.log('HIT');
        const pellet = pair.bodyA.label === 'pellet' ? pair.bodyA : pair.bodyB;
        Composite.remove(engine.world, pellet);
    }
    // // change object colours to show those starting a collision
    // for (var i = 0; i < pairs.length; i++) {
    //     var pair = pairs[i];
    //     console.log(pair);
    //     pair.bodyA.render.fillStyle = '#ffff00';
    //     pair.bodyB.render.fillStyle = '#00ffff';
    // }
});
