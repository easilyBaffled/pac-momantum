/**
* The Matter.js demo page controller and example runner.
*
* NOTE: For the actual example code, refer to the source files in `/examples/`.
*
* @class Demo
*/
const tools = require('matter-tools');
console.log( tools )
(function() {
    var sourceLinkRoot = 'https://github.com/liabru/matter-js/blob/master/examples';

    var demo = MatterTools.Demo.create({
        toolbar: {
            title: 'matter-js',
            url: 'https://github.com/liabru/matter-js',
            reset: true,
            source: true,
            inspector: true,
            tools: true,
            fullscreen: true,
            exampleSelect: true
        },
        tools: {
            inspector: true,
            gui: true
        },
        inline: false,
        preventZoom: true,
        resetOnOrientation: true,
        routing: true,
        startExample: 'slingshot',
        examples: [
            {
                name: 'Slingshot',
                id: 'slingshot',
                init: Example.slingshot,
                sourceLink: sourceLinkRoot + '/slingshot.js'
            },
            {
                name: 'Index',
                id: 'index',
                init: Example.index,
                sourceLink: sourceLinkRoot
            },
        ]
    });

    document.body.appendChild(demo.dom.root);

    MatterTools.Demo.start(demo);
})();
