# PAC-moMANtum ( better pun to come )
<h1 align="center">
	<br>
	<img src="https://img.dafont.com/preview.php?text=PAC+-+moMANtum&ttf=pacfont0&ext=1&size=50&psize=m&y=57">
	<br>
</h1>
This game is an odd physics based mashup between Pac-Man and Pool. Instead of needed power pellets to get rid of Blinky, Pinky, Inky, and Clyde, Pac-Man needs to ram into the ghosts hard enough for them to burst. 
Build up momentum by charging down long stretches of the maze, slingshot Pac-Man through the looping portals, or get an small burst by eating pellets. 
Bounce ghosts off one another to pull off fun trick shots. 

You can try the game out [here](https://4005qrw1o9.codesandbox.io/)

<h1 align="center">
	<br>
	<img width="360" src="http://www.giphy.com/gifs/1i5nHBY9MgtoYSikvI">
	<br>
</h1>

## Matter.js 
This game is meant not only to be fun(!) but also as an experiment. I am trying out the [Matter.js](http://brm.io/matter-js/)) library for the first time. Matter.js is a popular Rigid-body 2D physics engine for javascript. 
I want to see how much code it takes to set up a basic physics simulation and what it takes to ensure that it’s performant. And if all goes well create a set of utilities and boilerplate to simplify making games in the future.

## codesandbox.io
I have also been taking this opportunity to try [codesandbox.io](codesandbox.io). It is a powerful text editor for the web on the web. I normally use Webstorm, but this has been a nice change of pace. You can check out the project [here](https://codesandbox.io/s/4005qrw1o9)

# Project Files 

## /src
Javascript modules 
`colors.js` - Module holding the primary project colors and utilities to adjust them. 
`gameWorld.js` - Module wrapper around the `engine` to simplify setup and collect commonly needed values.
`index.js` - Main file to run the game. The code that’s in here instead of a util is because it’s likely to change a lot.
`util.js` - and and all commonly used functions and objects that refuse grouping into something more specific, like `colors.js`
