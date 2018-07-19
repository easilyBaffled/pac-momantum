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
import { clone } from 'lodash';
import { colors, lighter, darker } from './colors';
/**********
    Util
 ***********/
console.clear();
console.ident = val => (console.log(val), val);
console.con = val => condition => {
    if (condition(val)) console.log(val);
};
const withDefault = (obj, defaultFunc) =>
    new Proxy(obj, {
        get: (target, name) =>
            Reflect.get(target, name) || defaultFunc(name, target)
    });

const setVelocity = vector => target => Body.setVelocity(target, vector);

const applyVelocity = vector => target =>
    Body.setVelocity(target, Vector.add(vector, target.velocity));

const applyForceAtTarget = vector => target => {
    Body.applyForce(target, target.position, vector);
    target.torque = 0;
    console.log(target.speed);
};

const isCollisionWith = self => handlersDict => event => {
    const { bodyA, bodyB } = event.pairs.find(
        ({ bodyA, bodyB }) =>
            bodyA.label === self.label || bodyB.label === self.label
    );
    const target = bodyA === self ? bodyB : bodyA;
    handlersDict[target.label] &&
        handlersDict[target.label].bind(self)(target, event);
};

/************
    Set Up
 *************/
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

const Wall = (x, y, width, height, options = {}) => {
    const wall = Bodies.rectangle(
        x,
        y,
        width,
        height,
        Object.assign(options, {
            isStatic: true,
            label: 'wall',
            render: { fillStyle: colors.blue }
        })
    );

    wall.collisionHandler = isCollisionWith(wall)({
        ghost() {
            const originalRender = clone(this.render);
            this.render.fillStyle = lighter(colors.blue, 50);
            this.render.lineWidth = 3;
            this.render.strokeStyle = '#fff';
            setTimeout(() => (this.render = originalRender), 200);
        }
    });

    return wall;
};

const world = createWorld(800, 400);

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
    world.unit
);
var leftWall = Wall(
    world.left,
    world.centerY,
    world.unit,
    world.height + world.unit
);
var rightWall = Wall(
    world.right,
    world.centerY,
    world.unit,
    world.height + world.unit
);

var bottomWall = Wall(
    world.centerX,
    world.bottom,
    world.width + world.unit,
    world.unit
);

/****************
    Play Space
 *****************/

// bottomWall.restitution = 2;
var ball = Bodies.circle(
    world.centerX,
    world.centerY,
    world.unit * 1.5,
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
    20
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
            Composite.remove(engine.world, this);
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
                Composite.remove(engine.world, this);
            }
        }
    });

    return ghost;
};

World.add(engine.world, [
    makePellet(world.centerX, world.centerY + 20),
    makePellet(world.centerX, world.centerY + 40),
    makePellet(world.centerX, world.centerY + 60),
    makePellet(world.centerX, world.centerY + 80),
    Ghost(world.centerX, world.centerY + 100),
    Ghost(world.centerX, world.centerY + 140),
    topWall,
    leftWall,
    rightWall,
    ball,
    bottomWall
]);

Engine.run(engine);
Render.run(render);

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
    () => unitVectors.zero
);

const handleKeyInputs = () => {
    const vector = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].reduce(
        (vector, key) =>
            keys[key] ? Vector.add(vector, controlForces[key]) : vector,
        unitVectors.zero
    );
  
    Vector.magnitude(vector) > 0 && applyForceAtTarget(vector)(ball);
    const { x, y } = ball.velocity;

    const clampedVelocty = {
        x: Math.abs(x) > 6 ? Math.sign(x) * 6 : x,
        y: Math.abs(y) > 6 ? Math.sign(y) * 6 : y
    };
    Body.setVelocity(ball, clampedVelocty);
};

Events.on(engine, 'beforeTick', handleKeyInputs);

Events.on(engine, 'collisionStart', event =>
    event.pairs.forEach(({ bodyA, bodyB }) => {
        bodyA.collisionHandler && bodyA.collisionHandler(event);
        bodyB.collisionHandler && bodyB.collisionHandler(event);
    })
);
