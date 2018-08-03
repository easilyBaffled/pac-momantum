import { Vector, Body } from 'matter-js';
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

export const setVelocity = (vector, target) => Body.setVelocity(target, vector);

// Assumes you'll always want to apply the force at the center target
export const applyForceAtTarget = (vector, target) =>
    Body.applyForce(target, target.position, vector);

export const setCollisions = (self, handlersDict) => event => {
    const { bodyA, bodyB } = event.pairs.find(
        ({ bodyA, bodyB }) =>
            bodyA.label === self.label || bodyB.label === self.label
    );
    const target = bodyA === self ? bodyB : bodyA;
    handlersDict[target.label] &&
        handlersDict[target.label].bind(self)(target, event);
};
