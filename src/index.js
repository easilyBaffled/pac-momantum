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
import { colors, lighter, darker } from './colors';
/**********
    Util
 ***********/
console.clear();
console.ident = val => (console.log(val), val);

const withDefault = (obj, defaultFunc) =>
    new Proxy(obj, {
        get: (target, name) =>
            Reflect.get(target, name) || defaultFunc(name, target)
    });

const setVelocity = vector => target => Body.setVelocity(target, vector);

const applyForceAtTarget = vector => target =>
    Body.applyForce(target, target.position, vector);

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

const Wall = (x, y, width, height, options = {}) =>
    Bodies.rectangle(
        x,
        y,
        width,
        height,
        Object.assign(options, { isStatic: true, label: 'wall' })
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

/****************
    Play Space
 *****************/

// bottomWall.restitution = 2;
var ball = Bodies.circle(
    world.centerX,
    world.centerY,
    world.unit * 2,
    {
        friction: 0.05,
        frictionStatic: 0.7,
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
        world.unit,
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

var ghost = Bodies.circle(
    world.centerX,
    world.centerY + 100,
    world.unit * 2,
    {
        friction: 0.05,
        frictionStatic: 0.7,
        restitution: 0.9,
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
        console.log(Vector.magnitude(this.velocity));
        if (Vector.magnitude(this.velocity) > 3) {
            Composite.remove(engine.world, this);
        }
    }
});

World.add(engine.world, [
    makePellet(world.centerX, world.centerY + 20),
    makePellet(world.centerX, world.centerY + 40),
    makePellet(world.centerX, world.centerY + 60),
    makePellet(world.centerX, world.centerY + 80),
    ghost,
    topWall,
    leftWall,
    rightWall,
    ball,
    bottomWall
]);

Engine.run(engine);
Render.run(render);

document.addEventListener('keyup', ({ key }) => {
    const magnitudeMult = 1.5;

    const getDirForce = withDefault(
        {
            ArrowUp: () =>
                applyForceAtTarget({ x: 0, y: -world.unit * magnitudeMult }),
            ArrowDown: () =>
                applyForceAtTarget({ x: 0, y: world.unit * magnitudeMult }),
            ArrowLeft: () =>
                applyForceAtTarget({ x: -world.unit * magnitudeMult, y: 0 }),
            ArrowRight: () =>
                applyForceAtTarget({ x: world.unit * magnitudeMult, y: 0 })
        },
        () => applyForceAtTarget(unitVectors.zero)
    );

    const applyVelocity = getDirForce[key]();

    applyVelocity(ball);
});

Events.on(engine, 'collisionStart', event =>
    event.pairs.forEach(({ bodyA, bodyB }) => {
        bodyA.collisionHandler && bodyA.collisionHandler(event);
        bodyB.collisionHandler && bodyB.collisionHandler(event);
    })
);
