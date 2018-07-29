import {
    Composite,
    Engine,
    Render,
    World,
    Bodies,
    Body,
    Vector,
    Events,
    Svg
} from 'matter-js';
import { some } from 'lodash/fp';
import { colors, lighter, darker } from './colors';
import Chart from './chart';
import GameWorld from './gameWorld';
import {
    vectors,
    isCollisionWith,
    setVelocity,
    withDefault,
    applyForceAtTarget
} from './util';

// Docs http://brm.io/matter-js/docs/

/************
    Set Up
 ************/
const chart = new Chart();
const world = new GameWorld(400, 400);

const acceleration = world.unit * 0.2;
const maxSpeed = world.unit;
const friction = acceleration * 0.2;
document.getElementById('chartdiv').insertAdjacentHTML(
    'beforebegin',
    `<code id="data">
                ${JSON.stringify(
                    {
                        acceleration,
                        maxSpeed,
                        friction
                    },
                    null,
                    4
                )}
        </code>`
);

/****************
    Play Space
 ****************/

var ball = Bodies.circle(
    world.centerX,
    world.centerY,
    world.unit * 1.5, // radius
    {
        frictionAir: friction,
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
    const ghost = Bodies.circle(x, y, world.unit * 2, {
        friction: 0.05,
        frictionAir: 0.03,
        frictionStatic: 0,
        restitution: 0.5,
        label: 'ghost',
        sleepThreshold: 3000,
        density: world.unit,
        render: {
            fillStyle: colors.red
        }
    });

    ghost.collisionHandler = isCollisionWith(ghost)({
        wall() {
            if (Vector.magnitude(this.velocity) > 3) {
                Composite.remove(world.engine.world, this);
            }
        }
    });

    return ghost;
};

/*********************************
    Attempting to add SVG curve
 *********************************/
const path = document.getElementById('curved-path');

const vertexSets = [Svg.pathToVertices(path, 10)];

const terrain = Bodies.fromVertices(
    100,
    100,
    vertexSets,
    {
        isStatic: true,
        render: {
            fillStyle: colors.blue
        }
    },
    true
);
World.add(world.engine.world, [
    makePellet(world.centerX, world.centerY + 20),
    makePellet(world.centerX, world.centerY + 40),
    makePellet(world.centerX, world.centerY + 60),
    makePellet(world.centerX, world.centerY + 80),
    Ghost(world.centerX, world.centerY + 100),
    Ghost(world.centerX, world.centerY + 140),
    ball,
    terrain
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

const keyForceMapping = {
        ArrowUp: Vector.mult(vectors.up, acceleration),
        ArrowDown: Vector.mult(vectors.down, acceleration),
        ArrowLeft: Vector.mult(vectors.left, acceleration),
        ArrowRight: Vector.mult(vectors.right, acceleration)
    },
    controlForcesMapper = key => keyForceMapping[key] || vectors.zero;

const applyImpulseSpeed = (impulse, velocity, clamp) => {
    if (impulse === 0) return velocity;

    const { x, y } = Vector.mult(velocity, impulse);

    return {
        x: Math.abs(x) > clamp ? Math.sign(x) * clamp : x,
        y: Math.abs(y) > clamp ? Math.sign(y) * clamp : y
    };
};

const handleImpulseKeyInput = () => {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce((impulse, key) => {
        if (keys[key]) {
            keys[key] = false;
            return impulse + key;
        }
        return impulse;
    }, 0);
};

const handleDirectionKeyInput = () => {
    return ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].reduce(
        (vector, key) =>
            keys[key] ? Vector.add(vector, controlForcesMapper(key)) : vector,
        world.unitVectors.zero
    );
};

const handleKeyInputs = () => {
    const { velocity: initVelocity } = ball;

    const vector = handleDirectionKeyInput();
    // Speculative apply new force
    Vector.magnitude(vector) > 0 && applyForceAtTarget(vector)(ball);

    const { x, y } = ball.velocity;

    const clampedVelocity = {
        x: Math.abs(x) > maxSpeed ? initVelocity.x : x,
        y: Math.abs(y) > maxSpeed ? initVelocity.y : y
    };

    const impulseSpeed = handleImpulseKeyInput();
    const finalVelocity = applyImpulseSpeed(
        impulseSpeed * impulseSpeed,
        clampedVelocity,
        maxSpeed * 2.5
    );

    Body.setVelocity(ball, finalVelocity);
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
        chart.updateChartData(measurementsToCharData(measurements));
        measurements = [];
    }
    if (ball.speed > 0.2)
        measurements.push({
            speed: ball.speed,
            ball,
            time: Date.now(),
            keys
        });
});

function measurementsToCharData(measurements) {
    return measurements.reduce(
        (acc, { speed, time, keys }, i, arr) =>
            acc.concat(
                Object.assign(
                    {
                        speed,
                        time: i > 0 ? Math.abs(arr[0].time - time) : 0
                    },
                    keys
                )
            ),
        []
    );
}
