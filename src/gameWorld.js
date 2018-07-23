import { Engine, Render, World, Bodies, Vector } from 'matter-js';
import { clone } from 'lodash';
import { colors, lighter } from './colors';

import { vectors, isCollisionWith } from './util';

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

export default class GameWorld {
    constructor(height = 400, width = 400) {
        Object.assign(this, this.createWorld(height, width));
        this.unitVectors = {
            up: Vector.create(0, -1 / this.unit),
            down: Vector.create(0, 1 / this.unit),
            left: Vector.create(-1 / this.unit, 0),
            right: Vector.create(1 / this.unit, 0),
            zero: Vector.create(0, 0)
        };

        this.engine = Engine.create();

        this.engine.enableSleeping = true;
        this.engine.world.gravity = vectors.zero;

        this.render = Render.create({
            element: document.body,
            engine: this.engine,
            options: {
                width,
                height,
                wireframes: false,
                showAngleIndicator: true
            }
        });

        this.createBoard();
    }

    createWorld(width, height) {
        return {
            width,
            height,
            top: 0,
            bottom: height,
            left: 0,
            right: width,
            centerX: width / 2,
            centerY: height / 2,
            unit: width / 100
        };
    }

    createBoard() {
        var topWall = Wall(
            this.centerX,
            this.top,
            this.width + this.unit,
            this.unit
        );
        var leftWall = Wall(
            this.left,
            this.centerY,
            this.unit,
            this.height + this.unit
        );
        var rightWall = Wall(
            this.right,
            this.centerY,
            this.unit,
            this.height + this.unit
        );

        var bottomWall = Wall(
            this.centerX,
            this.bottom,
            this.width + this.unit,
            this.unit
        );

        World.add(this.engine.world, [
            topWall,
            leftWall,
            rightWall,
            bottomWall
        ]);
    }
}
