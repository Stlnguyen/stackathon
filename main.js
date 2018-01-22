var game = new Phaser.Game(600,600,Phaser.CANVAS,'gameDiv')
var player, playerSpeed = 3;
var controls = {};
var fireRate = 100, nextFire = 0,missles;
var explosionRate = 4000, nextExplosion = 0,explosionGroup;
var invaderGroup, MAX_INVADERS = 10;
var wormInvaderGroup, wormSpawnPosition = 300, nextWorm = 0, wormSpawnRate = 5000, innerWormSpawnRate = 1000, nextInnerWorm = 0;
var lives, score, scoreText, loseText, resetText;
var spaceBackground;

var mainState ={
    preload: function () {
        game.load.image('spaceBackground', 'assets/starfield.jpg')
        game.load.image('spaceship', 'assets/spaceship.png')
        game.load.image('missle', 'assets/bluemissle.png')
        game.load.image('invader', 'assets/invader.png')
        game.load.spritesheet('explosion', 'assets/explosion.png',128,128)
       // game.load.audio('music', ['assets/audio/music.ogg','assets/audio/music.mp3']);
        game.load.spritesheet('playerexplosion', 'assets/playerexplosion.png',128,128)
        game.load.image('worminvader', 'assets/yellowinvader.png')
    },



    create: function () {
        //Initialize the game
        game.physics.startSystem(Phaser.Physics.ARCADE);   
        game.physics.setBoundsToWorld(); 

        //Background
        spaceBackground = game.add.tileSprite(0,0,600,600,'spaceBackground')

        //Music
       // music = game.add.audio('musical');
        
       // music.play();

        //Player
        player = this.add.sprite(300,300,'spaceship')
        player.anchor.setTo(0.5,0.5)
        player.scale.setTo(0.08,0.08);
        this.physics.arcade.enable(player);
        player.enableBody = true;
        player.body.collideWorldBounds = true;
        lives = 5;

        //Controls
        controls = {
            explosion: this.input.keyboard.addKey(Phaser.Keyboard.Q),
            restart: this.input.keyboard.addKey(Phaser.Keyboard.R),
            right: this.input.keyboard.addKey(Phaser.Keyboard.D),
            left: this.input.keyboard.addKey(Phaser.Keyboard.A),
            up: this.input.keyboard.addKey(Phaser.Keyboard.W),
            down: this.input.keyboard.addKey(Phaser.Keyboard.S)
        }

        //Missles
        missles = game.add.group();
        missles.enableBody = true;
        missles.physicsBodyType = Phaser.Physics.ARCADE;
    
        missles.createMultiple(50, 'missle');
        missles.setAll('checkWorldBounds', true);
        missles.setAll('outOfBoundsKill', true);
        missles.setAll('anchor.x', 0.5);
        missles.setAll('anchor.y', 0.5);
        missles.setAll('scale.x', 0.02);
        missles.setAll('scale.y', 0.02);

        //Invaders
        wormInvaderGroup = this.game.add.group();
        invaderGroup = this.game.add.group();
        //game.add.existing(new WormInvader(game,game.width/2,game.height-200));
        //game.add.existing(new Invader(game,game.width/2,game.height-16))

        //Explosions
        explosionGroup = this.game.add.group();

        //Text
        score = 0;
        scoreText = game.add.text(16, 16, 'Score: 0', { fontSize: '16px', fill: '#FFF' });

        livesText = game.add.text(game.width-75,16,'Lives: 5', {fontSize: '16px', fill:'#FFF'})
   
        loseText = game.add.text(game.world.centerX-150,game.world.centerY-50,'You Lose!',{fontSize: '60px', fill:'#FFF'} )
        loseText.visible = false;

        resetText = game.add.text(game.world.centerX-70,game.world.centerY+20,'Press R to restart', {fontSize: '16px', fill:'#FFF'})
        resetText.visible = false;
    },



    update: function () {
        if (lives>0)
        {
            //Randomly change the worm location for spawning
            if (game.time.now > nextWorm) {
                nextWorm = game.time.now + wormSpawnRate;
                wormSpawnPosition = Math.random() * 450 + 75;
            }
            //Spawn worm invaders
            if (game.time.now > nextInnerWorm){
                nextInnerWorm = game.time.now + innerWormSpawnRate;
                
                spawnWormInvaders(wormSpawnPosition, game.height+50);
            }

            //Check if player is too close to worm invader
            wormInvaderGroup.forEachAlive(function(m){
                var distance = game.math.distance(m.x, m.y,
                    player.x, player.y);
                if (distance < 50) {
                    lives = 0;
                    livesText.text = 'Lives: ' + lives;
                }
            })

            //Randomly spawn invaders from all edges of world
            if (invaderGroup.countLiving() < MAX_INVADERS) {
                spawnInvaders(game.rnd.integerInRange(50, game.width-50),
                    game.height + 50);
                spawnInvaders(game.rnd.integerInRange(50, game.width-50),
                    -50);
                spawnInvaders(-50,
                    game.rnd.integerInRange(50, game.height-50));
                spawnInvaders(game.width+50,
                    game.rnd.integerInRange(50, game.height-50));
            }

            //Check if invaders are hitting the player
            invaderGroup.forEachAlive(function(m) {
                var distance = game.math.distance(m.x, m.y,
                    player.x, player.y);
                if (distance < 20) {
                    m.kill();
                    lives -= 1;
                    livesText.text = 'Lives: ' + lives;
                }
            });

           
            //Check if missles are close to invaders, if so increase score and get rid of both
            invaderGroup.forEachAlive(function(i) {
                missles.forEachAlive(function(m){
                    var distance = game.math.distance(m.x,m.y,i.x,i.y)
                    if (distance<10){
                        m.kill();
                        i.kill();
                        score += 1000;
                        scoreText.text = 'Score: ' + score;
                        getExplosion(m.x, m.y);
                    }
                })
            })

            //Rotation for player towards where cursor is
            player.rotation = game.physics.arcade.angleToPointer(player);
            if (game.input.activePointer.isDown){
                fire();
                
            }

            //Controls for player
            if(controls.up.isDown){
                player.y -= playerSpeed
            // player.body.acceleration.y -= 1;
            } if (controls.right.isDown){
                player.x += playerSpeed
                //player.body.acceleration.x -= 1;
            } if (controls.left.isDown){
                player.x -= playerSpeed
            // player.body.acceleration.x += 1;
            } if (controls.down.isDown){
                player.y += playerSpeed
            // player.body.acceleration.y += 1;
            } if (controls.explosion.isDown && game.time.now > nextExplosion){
                nextExplosion = game.time.now + explosionRate;

                var explosion = game.add.sprite(player.x,player.y,'playerexplosion');
                explosion.anchor.setTo(0.5, 0.5);
                explosion.scale.setTo(2,2);
        
                var animation = explosion.animations.add('playerboom', [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17], 60, false);
                animation.killOnComplete = true;

                explosion.animations.play('playerboom');

                invaderGroup.forEachAlive(function(m) {
                    var distance = game.math.distance(m.x, m.y,
                        player.x, player.y);
                    if (distance < 130) {
                        m.kill();
                        score+= 2000;
                        scoreText.text = 'Score: ' + score;
                        getExplosion(m.x, m.y);
                    }
                });
            }
        }
        //Lose text
        else {
            loseText.visible = true;
            resetText.visible = true;
            if (controls.restart.isDown){
                game.state.start('mainState',true,false);
                
            }
        }
    }
}

//Handle missle firing
function fire () {
    if (game.time.now > nextFire && missles.countDead() > 0)
    {
        nextFire = game.time.now + fireRate;

        var missle = missles.getFirstDead();
        missle.reset(player.x, player.y);
        game.physics.arcade.moveToPointer(missle, 300);

        var missle1 = missles.getFirstDead();
        if(missle1){
            missle1.reset(player.x, player.y);
            game.physics.arcade.moveToXY(missle1, game.input.x+20, game.input.y+20,300);
        }

        var missle2 = missles.getFirstDead();
        if(missle2){
            missle2.reset(player.x, player.y);
            game.physics.arcade.moveToXY(missle2, game.input.x-20, game.input.y-20,300);
        }
    }
}

//Spawn square invaders
function spawnInvaders (x,y){
    var invader = invaderGroup.getFirstDead();
    if (invader === null) {
        invader = new Invader(this.game);
        this.invaderGroup.add(invader);
    }
    
    invader.revive();

    // Move the invader to the given coordinates
    invader.x = x;
    invader.y = y;

    return invader;
}

//Spawn worm invaders
function spawnWormInvaders (x,y){
    var wormInvader = wormInvaderGroup.getFirstDead();
    if (wormInvader === null) {
        wormInvader = new WormInvader(this.game);
        this.wormInvaderGroup.add(wormInvader);
    }

    wormInvader.revive();

    // Move the worm invader to the given coordinates
    wormInvader.x = x;
    wormInvader.y = y;

    return wormInvader;
}

//Deal with explosion sprite
function getExplosion (x,y){
    var explosion = explosionGroup.getFirstDead();
        if (explosion === null) {
            explosion = game.add.sprite(0, 0, 'explosion');
            explosion.anchor.setTo(0.5, 0.5);
    
            var animation = explosion.animations.add('boom', [0,1,2,3,4,5,6,7,8], 30, false);
            animation.killOnComplete = true;

            // Add the explosion sprite to the group
            explosionGroup.add(explosion);  
        }
        
        explosion.revive();
    
        // Move the explosion to the given coordinates
        explosion.x = x;
        explosion.y = y;
    
        // Set rotation of the explosion at random for a little variety
        explosion.angle = game.rnd.integerInRange(0, 360);

        explosion.animations.play('boom');

        // Return the explosion itself in case we want to do anything else with it
        return explosion;
}

//Invader constructor
var Invader = function (game,x,y){
    Phaser.Sprite.call(this, game, x, y, 'invader');
    this.anchor.setTo(0.5,0.5);
    this.scale.setTo(0.06,0.06);

    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    this.SPEED = 100; // Invader speed pixels/second
    this.TURN_RATE = 5; // turn rate in degrees/frame
    this.WOBBLE_LIMIT = 15; // degrees
    this.WOBBLE_SPEED = 250; // milliseconds
    this.AVOID_DISTANCE = 30; // pixels

    this.wobble = this.WOBBLE_LIMIT;
    this.game.add.tween(this)
        .to(
            { wobble: -this.WOBBLE_LIMIT },
            this.WOBBLE_SPEED, Phaser.Easing.Sinusoidal.InOut, true, 0,
            Number.POSITIVE_INFINITY, true
        );
    
}

//Worm invader constructor
var WormInvader = function(game,x,y){
    Phaser.Sprite.call(this, game, x, y, 'worminvader');
    this.anchor.setTo(0.5,0.5);
    this.scale.setTo(0.07,0.07);

    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    this.SPEED = 100; // Invader speed pixels/second
}

Invader.prototype = Object.create(Phaser.Sprite.prototype);
Invader.prototype.constructor = Invader;

Invader.prototype.update = function() {
    // Calculate the angle from the Invader to the mouse cursor game.input.x
    // and game.input.y are the mouse position
    var targetAngle = this.game.math.angleBetween(
        this.x, this.y,
        player.x, player.y
    );

    targetAngle += this.game.math.degToRad(this.wobble);

    // Gradually (this.TURN_RATE) aim the Invader towards the target angle
    if (this.rotation !== targetAngle) {
        // Calculate difference between the current angle and targetAngle
        var delta = targetAngle - this.rotation;

        // Keep it in range from -180 to 180 to make the most efficient turns.
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;

        if (delta > 0) {
            // Turn clockwise
            this.angle += this.TURN_RATE;
        } else {
            // Turn counter-clockwise
            this.angle -= this.TURN_RATE;
        }

        // Just set angle to target angle if they are close
        if (Math.abs(delta) < this.game.math.degToRad(this.TURN_RATE)) {
            this.rotation = targetAngle;
        }
    }

    // Calculate velocity vector based on this.rotation and this.SPEED
    this.body.velocity.x = Math.cos(this.rotation) * this.SPEED;
    this.body.velocity.y = Math.sin(this.rotation) * this.SPEED;
};


WormInvader.prototype = Object.create(Phaser.Sprite.prototype);
WormInvader.prototype.constructor = WormInvader
WormInvader.prototype.update = function() {
    // Calculate the angle from the Invader to the mouse cursor game.input.x
    // and game.input.y are the mouse position
    // Calculate the angle from the Invader to the mouse cursor game.input.x
    // and game.input.y are the mouse position
    this.y -= 0.7
};



game.state.add('mainState', mainState);
game.state.start('mainState');