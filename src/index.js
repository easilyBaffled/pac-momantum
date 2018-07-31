import {
    Composite,
    Engine,
    Render,
    World,
    Bodies,
    Body,
    Vector,
    Events,
    Svg,
    Vertices
} from 'matter-js';
import { some } from 'lodash/fp';
import { colors, lighter, darker } from './colors';
import Chart from './chart';
import GameWorld from './gameWorld';
import {
    vectors,
    isCollisionWith,
    setVelocity,
    applyForceAtTarget
} from './util';

// Docs http://brm.io/matter-js/docs/

/************
    Set Up
 ************/
const chart = new Chart();
const world = new GameWorld(400, 400);

const acceleration = world.unit * 0.7;
const maxSpeed = world.unit * 4;
const friction = acceleration * 0.01;
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

const Pac = (x, y) => {
    const pac = Bodies.circle(
        x,
        y,
        world.unit * 1.5, // radius
        {
            frictionAir: friction,
            restitution: 0.5,
            label: 'pac',
            density: world.unit,
            render: {
                fillStyle: darker(colors.yellow, 10)
            }
        },
        20 // maxSides
    );

    pac.collisionHandler = isCollisionWith(pac)({
        pellet() {
            setVelocity(Vector.mult(this.velocity, world.unit / 3))(this);
        } // best keep the multiplier small, world.unit sends it off screen fast // setVelocity works much better than applyForce, not sure why
    });

    return pac;
};

const Pellet = (x, y) => {
    const pellet = Bodies.circle(
        x,
        y,
        world.unit * 0.75,
        {
            render: {
                fillStyle: lighter(colors.yellow, 10)
            },
            label: 'pellet',
            isSensor: true // prevents pac from bouncing off the pellet
            // isStatic: true // unclear if this helps in this case
        },
        20
    );

    pellet.collisionHandler = isCollisionWith(pellet)({
        pac() {
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
const halfPipe = document.getElementById('curved-path');
const halfPipeVertices = Svg.pathToVertices(halfPipe, 10);
const scaledHalfPipe = Vertices.scale(halfPipeVertices, 1.2, 1.4);

const vertexSets = [scaledHalfPipe];

const terrain = Bodies.fromVertices(
    136,
    65,
    vertexSets,
    {
        isStatic: true,
        render: {
            fillStyle: colors.blue
        }
    },
    true
);

const pac = Pac(world.unit * 1.5, world.height * 0.75);

World.add(world.engine.world, [
    ...Array.from({ length: 6 }, (_, i) =>
        Pellet(world.unit * 1.5, world.height * 0.75 - i * 25)
    ),
    ...Array.from({ length: 5 }, (_, i) =>
        Pellet(250 + i * 2.5, world.height * 0.25 + i * 20)
    ),
    Ghost(262.5, world.height * 0.5),
    Ghost(262.5, world.height * 0.5 + 40),
    pac,
    terrain
]);

Engine.run(world.engine);
Render.run(world.render);

const keyForceMapping = {
        ArrowUp: Vector.mult(vectors.up, acceleration),
        ArrowDown: Vector.mult(vectors.down, acceleration),
        ArrowLeft: Vector.mult(vectors.left, acceleration),
        ArrowRight: Vector.mult(vectors.right, acceleration)
    },
    controlForcesMapper = key => keyForceMapping[key] || vectors.zero;

const applyImpulseSpeed = (impulse, clamp, velocity) => {
    if (impulse === 0) return velocity;

    const { x, y } = Vector.mult(velocity, impulse);

    return {
        x: Math.abs(x) > clamp ? Math.sign(x) * clamp : x,
        y: Math.abs(y) > clamp ? Math.sign(y) * clamp : y
    };
};

document.body.addEventListener('keyup', ({ key }) => {
    const directionVector = controlForcesMapper(key);
    const vector = applyImpulseSpeed(acceleration, maxSpeed, directionVector);
    Vector.magnitude(vector) > 0 && applyForceAtTarget(vector)(pac);

    if (key === ' ') setVelocity(vectors.zero)(pac);
});

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
    if (pac.speed < 0.2 && measurements.length > 0) {
        chart.updateChartData(measurementsToCharData(measurements));
        measurements = [];
    }
    if (pac.speed > 0.2)
        measurements.push({
            speed: pac.speed,
            pac,
            time: Date.now()
            // keys
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
