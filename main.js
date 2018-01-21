var game = new Phaser.Game(600,600,Phaser.CANVAS,'gameDiv')
var player;
var controls = {};
var playerSpeed = 3;
var fireRate = 100;
var explosionRate = 4000;
var nextExplosion = 0;
var missles;
var invaderGroup;
var explosionGroup;
var nextFire = 0;
var MAX_INVADERS = 10;
var lives;
var score;
var scoreText;
var loseText;
var resetText;


    
var spaceBackground;

var mainState ={
    preload: function () {
        game.load.image('spaceBackground', 'assets/starfield.jpg')
        game.load.image('spaceship', 'assets/spaceship.jpg')
        game.load.image('missle', 'assets/bluemissle.png')
        game.load.image('invader', 'assets/invader.png')
        game.load.spritesheet('explosion', 'assets/explosion.png',128,128)
        game.load.audio('music', ['assets/audio/music.ogg','assets/audio/music.mp3']);
        game.load.spritesheet('playerexplosion', 'assets/playerexplosion.png',128,128)
    },



    create: function () {
        
        game.physics.startSystem(Phaser.Physics.ARCADE);   
        game.physics.setBoundsToWorld(); 
        //Background
        spaceBackground = game.add.tileSprite(0,0,600,600,'spaceBackground')
        //game.stage.backgroundColor = '#313131'

        //Music
       // music = game.add.audio('musical');
        
       // music.play();

        //Player
        player = this.add.sprite(300,300,'spaceship')
        player.anchor.setTo(0.5,0.5)
        player.scale.setTo(0.12,0.12);
        this.physics.arcade.enable(player);
        player.enableBody = true;
        player.body.collideWorldBounds = true;
        lives = 5;

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
        invaderGroup = this.game.add.group();
        //game.add.existing(new Invader(game,game.width/2,game.height-16))

        //Explosions
        explosionGroup = this.game.add.group();

        //Score
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
            if (invaderGroup.countLiving() < MAX_INVADERS) {
                // Set the launch point to a random location below the bottom edge
                // of the stage
                spawnInvaders(game.rnd.integerInRange(50, game.width-50),
                    game.height + 50);
                spawnInvaders(game.rnd.integerInRange(50, game.width-50),
                    -50);
                spawnInvaders(-50,
                    game.rnd.integerInRange(50, game.height-50));
                spawnInvaders(game.width+50,
                    game.rnd.integerInRange(50, game.height-50));
            }

            //Check if invaders are close to player
            invaderGroup.forEachAlive(function(m) {
                var distance = game.math.distance(m.x, m.y,
                    player.x, player.y);
                if (distance < 20) {
                    m.kill();
                    lives -= 1;
                    livesText.text = 'Lives: ' + lives;
                }
            });

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

            player.rotation = game.physics.arcade.angleToPointer(player);
            if (game.input.activePointer.isDown){
                fire();
                
            }
            if(controls.up.isDown){
                player.body.velocity.y -= playerSpeed
            // player.body.acceleration.y -= 1;
            } if (controls.right.isDown){
                player.body.velocity.x += playerSpeed
                //player.body.acceleration.x -= 1;
            } if (controls.left.isDown){
                player.body.velocity.x -= playerSpeed
            // player.body.acceleration.x += 1;
            } if (controls.down.isDown){
                player.body.velocity.y += playerSpeed
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
                        score+= 1000;
                        getExplosion(m.x, m.y);
                    }
                });
            }
        }
        else {
            loseText.visible = true;
            resetText.visible = true;
            if (controls.restart.isDown){
                game.state.start('mainState',true,false);
                
            }
        }
    }
}

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

function spawnInvaders (x,y){
    var invader = invaderGroup.getFirstDead();
    // If there aren't any available, create a new one
    if (invader === null) {
        invader = new Invader(this.game);
        this.invaderGroup.add(invader);
    }

    // Revive the invader (set it's alive property to true)
    // You can also define a onRevived event handler in your explosion objects
    // to do stuff when they are revived.
    invader.revive();

    // Move the invader to the given coordinates
    invader.x = x;
    invader.y = y;

    return invader;
}

function getExplosion (x,y){
    var explosion = explosionGroup.getFirstDead();
    
        // If there aren't any available, create a new one
        if (explosion === null) {
            explosion = game.add.sprite(0, 0, 'explosion');
            explosion.anchor.setTo(0.5, 0.5);
            //explosion.scale.setTo(0.5,0.5);
    
            var animation = explosion.animations.add('boom', [0,1,2,3,4,5,6,7,8], 60, false);
            animation.killOnComplete = true;

            // Add the explosion sprite to the group
            explosionGroup.add(explosion);
            
            //explosion.lifespan = 200;
            
        }
    
        // Revive the explosion (set it's alive property to true)
        // You can also define a onRevived event handler in your explosion objects
        // to do stuff when they are revived.
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

Invader.prototype = Object.create(Phaser.Sprite.prototype);
Invader.prototype.constructor = Invader;

Invader.prototype.update = function() {
    // Calculate the angle from the Invader to the mouse cursor game.input.x
    // and game.input.y are the mouse position; substitute with whatever
    // target coordinates you need.
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



game.state.add('mainState', mainState);
game.state.start('mainState');