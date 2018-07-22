import { Vector, Body } from 'matter-js';
/************
    Set Up
 *************/
console.clear();
console.ident = val => (console.log(val), val);
console.con = val => condition => {
    if (condition(val)) console.log(val);
};

export const withDefault = (obj, defaultFunc) =>
    new Proxy(obj, {
        get: (target, name) =>
            Reflect.get(target, name) || defaultFunc(name, target)
    });

/*****************
    Matter Util
 *****************/
export const vectors = {
    up: Vector.create(0, -1),
    down: Vector.create(0, 1),
    left: Vector.create(-1, 0),
    right: Vector.create(1, 0),
    zero: Vector.create(0, 0)
};

export const setVelocity = vector => target => Body.setVelocity(target, vector);

export const applyVelocity = vector => target =>
    Body.setVelocity(target, Vector.add(vector, target.velocity));

export const applyForceAtTarget = vector => target => {
    Body.applyForce(target, target.position, vector);
    target.torque = 0;
};

export const isCollisionWith = self => handlersDict => event => {
    const { bodyA, bodyB } = event.pairs.find(
        ({ bodyA, bodyB }) =>
            bodyA.label === self.label || bodyB.label === self.label
    );
    const target = bodyA === self ? bodyB : bodyA;
    handlersDict[target.label] &&
        handlersDict[target.label].bind(self)(target, event);
};
