import {
    Composite,
    Engine,
    Render,
    Bodies,
    Vector,
    Events,
    Svg,
    Vertices
} from 'matter-js';

import { colors, lighter, darker } from './colors';
import GameWorld from './gameWorld';
import {
    vectors,
    setCollisions,
    setVelocity,
    applyForceAtTarget
} from './util';

// Docs http://brm.io/matter-js/docs/

/************
    Set Up
 ************/
const world = new GameWorld(400, 400);

// Primary control variables, set asside for easy access
const acceleration = world.unit * 0.7;
const maxSpeed = world.unit * 4;
const friction = acceleration * 0.01;

// Display galues for debugging
document.getElementById('control-values').innerText = JSON.stringify(
    {
        acceleration,
        maxSpeed,
        friction
    },
    null,
    4
).replace(/(^\s+)(?!")/gm, '');

/****************
    Game Bodies
    Pac - player character
    Pellet - dots that will boost Pac's accelleration on impact
    Ghost - non-static balls that will be removed on a hard enough impact with the wall
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

    pac.collisionHandler = setCollisions(pac, {
        pellet() {
            setVelocity(Vector.mult(this.velocity, world.unit * 0.35), this);
        }
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

    pellet.collisionHandler = setCollisions(pellet, {
        pac() {
            Composite.remove(world.engine.world, this);
        }
    });

    return pellet;
};

const Ghost = (x, y) => {
    const ghost = Bodies.circle(x, y, world.unit * 2, {
        frictionAir: 0.03,
        restitution: 0.5,
        label: 'ghost',
        sleepThreshold: 3000,
        density: world.unit * 0.05,
        render: {
            fillStyle: colors.red
        }
    });

    ghost.collisionHandler = setCollisions(ghost, {
        wall() {
            if (Vector.magnitude(this.velocity) > 5) {
                Composite.remove(world.engine.world, this);
            }
        }
    });

    return ghost;
};

// Body colision detection
Events.on(world.engine, 'collisionStart', event =>
    event.pairs.forEach(({ bodyA, bodyB }) => {
        bodyA.collisionHandler && bodyA.collisionHandler(event);
        bodyB.collisionHandler && bodyB.collisionHandler(event);
    })
);

/*********************************
    SVG -> Body
 *********************************/
const halfpipeTemplate = document.querySelector('#halfpipe-svg');
const halfpipePath = document
    .importNode(halfpipeTemplate.content, true) // convert template to element
    .querySelector('path');

const halfpipeVertices = Svg.pathToVertices(halfpipePath, 10);
const scaledHalfPipe = Vertices.scale(halfpipeVertices, 1.2, 1.4);
const vertexSets = [scaledHalfPipe];

const terrain = Bodies.fromVertices(
    134,
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

/****************
    Game World    
 ****************/
const pac = Pac(world.unit * 1.5, world.height * 0.75);

world.addBodies(
    ...Array.from({ length: 4 }, (_, i) =>
        Pellet(world.unit * 1.5 + i, world.height * 0.65 - i * 20)
    ),
    ...Array.from({ length: 4 }, (_, i) =>
        Pellet(250 + i, world.height * 0.25 + i * 25)
    ),
    Pellet(134, 20),
    Ghost(260, world.height * 0.5),
    Ghost(260, world.height * 0.6),
    Ghost(260, world.height * 0.7),
    Ghost(260, world.height * 0.8),
    pac,
    terrain
);

Engine.run(world.engine);
Render.run(world.render);

/***************
    Controles
 ***************/
const keyForceMapping = {
        ArrowUp: Vector.mult(vectors.up, acceleration),
        ArrowDown: Vector.mult(vectors.down, acceleration),
        ArrowLeft: Vector.mult(vectors.left, acceleration),
        ArrowRight: Vector.mult(vectors.right, acceleration)
    },
    controlForcesMapper = key =>
        Vector.mult(keyForceMapping[key] || vectors.zero, acceleration);

// collect key presses
let keys = [];
document.body.addEventListener('keyup', ({ key }) => keys.push(key));

Events.on(world.engine, 'beforeTick', event => {
    // Use the space key stops player movement right away
    if (keys.includes(' ')) setVelocity(vectors.zero, pac);
    else {
        // Combine all arrow key vectors into one impuls vector
        const nextAccelVector = keys.reduce((finalVector, key) => {
            // Convert key press to direction vector
            const directionVector = controlForcesMapper(key);

            return Vector.add(finalVector, directionVector);
        }, vectors.zero);

        Vector.magnitude(nextAccelVector) > 0 &&
            applyForceAtTarget(nextAccelVector, pac); // <-- need a way to clamp pac's total speed
    }
    // reset down keys
    keys = [];
});
