"use strict";

const width = 400;
const height = 300;
const ballSpeed = 0.3;
const paddleSpeed = 0.25;
const rangeMod = Math.PI / 15;
const range1 = [
	-Math.PI / 2 + rangeMod,
	Math.PI / 2 - rangeMod
];
const range2 = [
	3 * Math.PI / 2 - rangeMod,
	Math.PI / 2 + rangeMod
];
let score1, score2, ball, paddle1, paddle2, lastTime, stop, paused, noCollisions;

$.screen( "80x60", null, null, true );
$.setColor( "white" );
$.setPos( 0, 1 );
$.print( "PONG", true, true );
$.setPos( 0, 3 );
$.print( "    Click \n     to\n    begin" );
$.screen( width + "x" + height, null, null, true );
$.setColor( "white" );
$.setBgColor( 0 );
$.onclick( start, true );

function start() {
	score1 = 0;
	score2 = 0;
	startRound();
	lastTime = 0;
	window.requestAnimationFrame( run );
}

function startRound() {
	$.play( "SAWTOOTH O3 T180 V5 A16 B8 C8 A4" );
	setupNewBall();
	paused = true;
	window.setTimeout( () => {
		paused = false;
	}, 1000 );
}

function setupNewBall() {
	noCollisions = false;
	ball = {
		"x": width / 2,
		"y": height / 2,
		"dx": 0,
		"dy": 0,
		"width": 10,
		"height": 10
	};
	paddle1 = {
		"x": 25,
		"y": 150,
		"width": 10,
		"height": 50
	};
	paddle2 = {
		"x": 375,
		"y": 150,
		"width": 10,
		"height": 50
	};
	setRandomBallDirection();
}

function setRandomBallDirection() {
	let angle = Math.floor( Math.random() * Math.PI * 2 );
	console.log( angle );
	ball.dx = Math.cos( angle ) * ballSpeed;
	ball.dy = Math.sin( angle ) * ballSpeed;
	if( ball.dx > 0 ) {
		ball.x -= 20;
	} else {
		ball.x += 20;
	}
}

function run( elapsed ) {
	if( stop ) {
		return;
	}
	let dt = Math.min( elapsed - lastTime, 100 );

	lastTime = elapsed;
	draw();
	if( !paused ) {
		moveBall( dt );
		movePaddles( dt );
	}
	if( ! stop ) {
		window.requestAnimationFrame( run );
	}
}

function draw() {
	
	drawUI();

	$.setScreen( 1 );
	$.cls();
	$.setColor( "white" );

	// Draw the ball
	$.rect( ball.x, ball.y, ball.width, ball.height, "white" );

	// Draw the paddles
	$.rect( paddle1.x, paddle1.y, paddle1.width, paddle1.height, "white" );
	$.rect( paddle2.x, paddle2.y, paddle2.width, paddle2.height, "white" );
}

function drawUI() {
	$.setScreen( 0 );
	$.cls();

	// Draw the dividor
	let x = 39;
	for( let y = 2; y < 58; y += 6 ) {
		$.rect( x, y, 2, 2 );
	}

	$.setPosPx( 30, 5 );
	$.print( score1, true );
	$.setPosPx( 45, 5 );
	$.print( score2, true );
}

function moveBall( dt ) {
	ball.x += ball.dx * dt;
	ball.y += ball.dy * dt;
	
	// Detect paddle collisions
	if( !noCollisions && rectCollision( paddle1, ball ) ) {
		handlePaddleCollision( paddle1, range1 );
		$.play( "V5 O3 SAWTOOTH A16" );
	}

	if( !noCollisions && rectCollision( paddle2, ball ) ) {
		handlePaddleCollision( paddle2, range2 );
		$.play( "V5 O3 SAWTOOTH A16" );
	}

	// Detect floor and ceiling collisions
	if( ball.y < 0 || ball.y >= height ) {
		ball.dy *= -1;
		ball.y += ball.dy * dt;
		$.play( "V5 O4 SAWTOOTH G16" );
	}

	// Detect scores
	if( ball.x < 0 ) {
		score2 += 1;
		if( score2 >= 5 ) {
			$.setScreen( 0 );
			drawUI();
			$.setPos( 3, 3 );
			$.print( "You Lose" );
			$.play( "SAWTOOTH O2 T150 V5 A4 D8 C16 E4 E" );
			stop = true;
		} else {
			startRound();
		}
	} else if( ball.x >= width ) {
		score1 += 1;
		if( score1 >= 5 ) {
			$.setScreen( 0 );
			drawUI();
			$.setPos( 3, 3 );
			$.print( "You Win" );
			$.play( "SAWTOOTH O3 T180 V5 A4 D8 C16 E4 E" );
			stop = true;
		} else {
			startRound();
		}
	}
}

function handlePaddleCollision( paddle, range ) {
	let x = ball.x + ball.width / 2;
	let y = ball.y + ball.height / 2;
	let pct = ( y - paddle.y ) / paddle.height;
	let angle;
	if( pct < 0 ) {
		angle = range[ 0 ];
	} else if( pct > 1 ) {
		angle = range[ 1 ];
	} else {
		angle = getValFromRangeByPct( range[ 0 ], range[ 1 ], pct );
	}
	ball.dx = Math.cos( angle ) * ballSpeed;
	ball.dy = Math.sin( angle ) * ballSpeed;
}

function getValFromRangeByPct( min, max, pct ) {
	if( max > min ) {
		return ( max - min ) * pct + min;
	} else if( max < min ) {
		return ( min - max ) * ( 1 - pct ) + max;
	}
	return min;
}

function movePaddles( dt ) {
	let mouse = $.inmouse();
	if( mouse.y > paddle1.y + paddle1.height / 2 ) {
		paddle1.y += paddleSpeed * dt;
	} else if( mouse.y < paddle1.y ) {
		paddle1.y -= paddleSpeed * dt;
	}

	if( ball.y > paddle2.y + paddle2.height / 2 ) {
		paddle2.y += paddleSpeed * dt;
	} else if( ball.y < paddle2.y ) {
		paddle2.y -= paddleSpeed * dt;
	}
}

function rectCollision( rect1, rect2 ) {
	return (
		rect1.x < rect2.x + rect2.width &&
    	rect1.x + rect1.width > rect2.x &&
    	rect1.y < rect2.y + rect2.height &&
    	rect1.y + rect1.height > rect2.y
	);
}
