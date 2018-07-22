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
import { colors, lighter, darker } from './colors';
import { updateChartData } from './chart';
import GameWorld from './gameWorld';
import {
    isCollisionWith,
    setVelocity,
    withDefault,
    applyForceAtTarget
} from './util';

/************
    Set Up
 ************/
const world = new GameWorld(400, 400);
// const acceleration = ;
// const maxSpeed = ;
/****************
    Play Space
 ****************/

var ball = Bodies.circle(
    world.centerX,
    world.centerY,
    world.unit * 1.5, // radius
    {
        friction: 0.05,
        frictionAir: 0.05,
        frictionStatic: 0.05,
        restitution: 0.9,
        label: 'ball',
        density: world.unit,
        render: {
            fillStyle: darker(colors.yellow, 10)
        }
    },
    20 // maxSides
);

ball.collisionHandler = isCollisionWith(ball)({
    pellet() {
        setVelocity(Vector.mult(this.velocity, world.unit / 3))(this);
    } // best keep the multiplier small, world.unit sends it off screen fast // setVelocity works much better than applyForce, not sure why
});

const makePellet = (x, y) => {
    const pellet = Bodies.circle(
        x,
        y,
        world.unit * 0.75,
        {
            render: {
                fillStyle: lighter(colors.yellow, 10)
            },
            label: 'pellet',
            isSensor: true // prevents ball from bouncing off the pellet
            // isStatic: true // unclear if this helps in this case
        },
        20
    );

    pellet.collisionHandler = isCollisionWith(pellet)({
        ball() {
            Composite.remove(world.engine.world, this);
        }
    });

    return pellet;
};

const Ghost = (x, y) => {
    const ghost = Bodies.circle(
        x,
        y,
        world.unit * 2,
        {
            friction: 0.05,
            frictionAir: 0.03,
            frictionStatic: 0,
            restitution: 0.5,
            label: 'ghost',
            density: world.unit,
            render: {
                fillStyle: colors.red
            }
        },
        20
    );

    ghost.collisionHandler = isCollisionWith(ghost)({
        wall() {
            if (Vector.magnitude(this.velocity) > 3) {
                Composite.remove(world.engine.world, this);
            }
        }
    });

    return ghost;
};

World.add(world.engine.world, [
    makePellet(world.centerX, world.centerY + 20),
    makePellet(world.centerX, world.centerY + 40),
    makePellet(world.centerX, world.centerY + 60),
    makePellet(world.centerX, world.centerY + 80),
    Ghost(world.centerX, world.centerY + 100),
    Ghost(world.centerX, world.centerY + 140),
    ball
]);

Engine.run(world.engine);
Render.run(world.render);

const keys = {};
document.body.addEventListener('keydown', ({ key }) => {
    keys[key] = true;
});
document.body.addEventListener('keyup', ({ key }) => {
    keys[key] = false;
});

const magnitudeMult = 1;

const controlForces = withDefault(
    {
        ArrowUp: {
            x: 0,
            y: -world.unit * magnitudeMult
        },
        ArrowDown: {
            x: 0,
            y: world.unit * magnitudeMult
        },
        ArrowLeft: {
            x: -world.unit * magnitudeMult,
            y: 0
        },
        ArrowRight: {
            x: world.unit * magnitudeMult,
            y: 0
        }
    },
    () => world.unitVectors.zero
);

const handleKeyInputs = () => {
    const vector = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].reduce(
        (vector, key) =>
            keys[key] ? Vector.add(vector, controlForces[key]) : vector,
        world.unitVectors.zero
    );

    Vector.magnitude(vector) > 0 && applyForceAtTarget(vector)(ball);
    const { x, y } = ball.velocity;

    const clampedVelocty = {
        x: Math.abs(x) > 7 ? Math.sign(x) * 7 : x,
        y: Math.abs(y) > 7 ? Math.sign(y) * 7 : y
    };
    Body.setVelocity(ball, clampedVelocty);
};

Events.on(world.engine, 'beforeTick', handleKeyInputs);

Events.on(world.engine, 'collisionStart', event =>
    event.pairs.forEach(({ bodyA, bodyB }) => {
        bodyA.collisionHandler && bodyA.collisionHandler(event);
        bodyB.collisionHandler && bodyB.collisionHandler(event);
    })
);

/***************
    Game Meta
 ***************/
let measurements = [];
Events.on(world.engine, 'beforeTick', () => {
    if (ball.speed < 0.2 && measurements.length > 0) {
        console.log(ball.speed);
        console.log('dump');
        updateChartData(console.ident(measurementsToCharData(measurements)));
        measurements = [];
    }
    if (ball.speed > 0.2)
        measurements.push({ speed: ball.speed, ball, time: Date.now() });
});

function measurementsToCharData(measurements) {
    // console.log(measurements);
    return measurements.reduce(
        (acc, { speed, time }, i, arr) =>
            acc.concat({
                speed,
                time: i > 0 ? Math.abs(arr[i - 1].time - time) : 0
            }),
        []
    );
}
