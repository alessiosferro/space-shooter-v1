import './App.css';

import {Box, Button, Container, Flex, Grid, GridItem, Text, VisuallyHidden} from "@chakra-ui/react";
import {useEffect, useRef, useState} from "react";
import ship from './assets/ships/ship.png';
import shipMovingLeft from './assets/ships/ship-moving-left.png';
import shipMovingRight from './assets/ships/ship-moving-right.png';

import backgrounds from './assets/backgrounds/space.png';
import asteroid from './assets/asteroid.png';

import explosionBlueFrame1 from './assets/animations/explosionBlue/explosionBlueFrame1.png';
import explosionBlueFrame2 from './assets/animations/explosionBlue/explosionBlueFrame2.png';
import explosionBlueFrame3 from './assets/animations/explosionBlue/explosionBlueFrame3.png';
import explosionBlueFrame4 from './assets/animations/explosionBlue/explosionBlueFrame4.png';

import enemyShip from './assets/ships/enemy.png';

import baseProjectile from './assets/base-projectile.png';
import shield from './assets/shield.png';

import laserSound from './assets/sounds/laser.mp3';

import shipExplosion1 from './assets/animations/explosion/explosion1.png';
import shipExplosion2 from './assets/animations/explosion/explosion2.png';
import shipExplosion3 from './assets/animations/explosion/explosion3.png';
import shipExplosion4 from './assets/animations/explosion/explosion4.png';

import {ArrowBackIcon, ArrowDownIcon, ArrowForwardIcon, ArrowUpIcon} from "@chakra-ui/icons";

function App() {
    const canvas = useRef<HTMLCanvasElement | null>(null);
    const asteroidImageRef = useRef<HTMLImageElement | null>(null);
    const baseProjectileRef = useRef<HTMLImageElement | null>(null);
    const backgroundsImageRef = useRef<HTMLImageElement | null>(null);

    const shipExplosionFrame1Ref = useRef<HTMLImageElement | null>(null);
    const shipExplosionFrame2Ref = useRef<HTMLImageElement | null>(null);
    const shipExplosionFrame3Ref = useRef<HTMLImageElement | null>(null);
    const shipExplosionFrame4Ref = useRef<HTMLImageElement | null>(null);

    const explosionBlueFrame1Ref = useRef<HTMLImageElement | null>(null);
    const explosionBlueFrame2Ref = useRef<HTMLImageElement | null>(null);
    const explosionBlueFrame3Ref = useRef<HTMLImageElement | null>(null);
    const explosionBlueFrame4Ref = useRef<HTMLImageElement | null>(null);

    const shieldRef = useRef<HTMLImageElement | null>(null);
    const enemyShipRef = useRef<HTMLImageElement | null>(null);

    const shipRef = useRef<HTMLImageElement | null>(null);
    const shipMovingLeftRef = useRef<HTMLImageElement | null>(null);
    const shipMovingRightRef = useRef<HTMLImageElement | null>(null);
    const respawnInvulnerabilityTimer = useRef<number>(0);
    const animationFrameId = useRef<number | null>(null);
    const fireBulletTimeoutId = useRef<number | null>(null);
    const asteroidIntervalId = useRef<number | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [points, setPoints] = useState(0);
    const player = useRef(INITIAL_PLAYER_CONFIG);
    const game = useRef(INITIAL_GAME_CONFIG);
    const bullets = useRef<Bullet[]>([]);
    const asteroids = useRef<Asteroid[]>([]);
    const explosions = useRef<Explosion[]>([]);
    const enemies = useRef<Enemy[]>([]);

    const spawnPhaseTimer = useRef<number>(SPAWN_PHASE_TIME);
    const asteroidSpawnTimer = useRef<number>(300);
    const enemySpawnTimer = useRef<number>(400);

    const laserSoundRef = useRef<HTMLAudioElement | null>(null);

    const [currentLevelIndex] = useState<number>(0);

    const levels = useRef<{ spawns: string[] }[]>([
        {
            spawns: [
                'enemies',
                'asteroids',
                'enemies'
            ]
        }
    ]);

    const currentLevelSpawnIndex = useRef(0);

    const currentLevel = levels.current[currentLevelIndex];

    function fireBullet() {
        const {x, y} = player.current;

        playLaserSound();

        bullets.current = [
            ...bullets.current,
            {
                x: x + 20,
                y,
                velocityX: 0,
                velocityY: -6,
                sx: 4,
                sy: 4,
                sw: 1,
                sh: 1,
            }
        ];
    }

    function updateSpeedX(speedX: number) {
        player.current = {
            ...player.current,
            speedX
        }
    }


    function playLaserSound() {
        laserSoundRef.current!.fastSeek(0);
        laserSoundRef.current!.play();
    }

    function updateSpeedY(speedY: number) {
        player.current = {
            ...player.current,
            speedY
        }
    }

    function updatePlayerStatus(status: 'idle' | 'dead' | 'moving-left' | 'moving-right') {
        player.current = {
            ...player.current,
            status
        }
    }

    function handleResetGame() {
        setPoints(0);
        setIsGameOver(!isGameOver);

        player.current = {...INITIAL_PLAYER_CONFIG};
        game.current = {...INITIAL_GAME_CONFIG};
        asteroids.current = [];
        bullets.current = [];
        explosions.current = [];
        respawnInvulnerabilityTimer.current = 0;
    }

    function createAsteroid() {
        const velocityY = 1;
        const velocityX = (Math.random() / 4) * (Math.round(Math.random()) === 0 ? 1 : -1);
        const size = Math.round(Math.random() * 30) + 30;
        const x = Math.random() * (CANVAS_WIDTH - size)

        asteroids.current = [
            ...asteroids.current,
            {
                x,
                y: -size,
                velocityX,
                velocityY,
                size
            }
        ]
    }

    function createEnemy() {
        const velocityY = 1;
        const velocityX = (Math.random() / 4) * (Math.round(Math.random()) === 0 ? 1 : -1);
        const x = Math.random() * (CANVAS_WIDTH - ENEMY_SIZE)

        enemies.current = [
            ...enemies.current,
            {
                x,
                y: -ENEMY_SIZE,
                velocityX,
                velocityY
            }
        ]
    }

    const main = () => {
        if (!canvas.current) return;

        const canvasElement = canvas.current;
        const ctx = canvasElement.getContext('2d') as CanvasRenderingContext2D;
        ctx.imageSmoothingEnabled = false;

        addEventListener('keydown', handleKeyDown);
        addEventListener('keyup', handleKeyUp);

        function handleKeyUp(e: KeyboardEvent) {
            updateKeysPressed(Array.from(player.current.keysPressed).filter(key => key !== e.code));

            const isMovingVertically = ['ArrowUp', 'ArrowDown'].find(key => player.current.keysPressed.has(key));
            const isMovingHorizontally = ['ArrowLeft', 'ArrowRight'].find(key => player.current.keysPressed.has(key));

            if (!isMovingVertically) {
                updateSpeedY(0);
            }

            if (!isMovingHorizontally) {
                updateSpeedX(0);
            }

            if (!isMovingHorizontally && !isMovingVertically && player.current.status !== 'dead') {
                updatePlayerStatus('idle');
            }
        }

        function updateKeysPressed(keysPressed: string[]) {
            player.current = {
                ...player.current,
                keysPressed: new Set(keysPressed)
            }
        }

        function detectAsteroidPlayerCollision() {
            if (respawnInvulnerabilityTimer.current > 0) return;

            const {x, y} = player.current;

            for (const asteroid of asteroids.current) {
                if (
                    (x + PLAYER_SIZE >= asteroid.x && x <= asteroid.x + asteroid.size) &&
                    (y + PLAYER_SIZE >= asteroid.y && y <= asteroid.y + asteroid.size)
                ) {
                    return asteroid;
                }
            }

            return null;
        }


        function updatePlayerPosition() {
            if (player.current.status === 'dead') return;

            const asteroid = detectAsteroidPlayerCollision();

            const {x, speedX, y, hp, speedY} = player.current;

            if (asteroid) {
                asteroids.current = asteroids.current.filter(m => m !== asteroid);

                explosions.current = [
                    ...explosions.current,
                    {
                        x,
                        y,
                        size: PLAYER_SIZE,
                        animationTime: 0,
                        type: 'player'
                    },
                    {
                        x: asteroid.x,
                        y: asteroid.y,
                        size: asteroid.size,
                        animationTime: 0,
                        type: 'asteroid'
                    }
                ];

                updatePlayerStatus('dead');

                setTimeout(() => {
                    if (hp === 0) {
                        setIsGameOver(true);
                        game.current.isGameOver = true;
                        return;
                    }

                    respawnInvulnerabilityTimer.current = 250;

                    player.current = {
                        ...INITIAL_PLAYER_CONFIG,
                        hp: hp - 1
                    }
                }, 1000);
            }

            const nextY = y + speedY;
            const nextX = x + speedX;

            const isYOverflow = nextY > CANVAS_HEIGHT - PLAYER_SIZE - 150 || nextY < PLAYER_SIZE;
            const isXOverflow = nextX > CANVAS_WIDTH - PLAYER_SIZE || nextX < 0;

            player.current = {
                ...player.current,
                ...(!isYOverflow && {y: nextY}),
                ...(!isXOverflow && {x: nextX})
            }


        }

        function detectAsteroidBulletCollision() {
            for (const bullet of bullets.current) {
                for (const asteroid of asteroids.current) {
                    if (
                        (bullet.x >= asteroid.x && bullet.x <= asteroid.x + asteroid.size) &&
                        (bullet.y >= asteroid.y && bullet.y <= asteroid.y + asteroid.size)
                    ) {
                        return {bullet, asteroid};
                    }
                }
            }

            return null;
        }

        function updateBulletsPositions() {
            const asteroidExplosion = detectAsteroidBulletCollision();

            if (asteroidExplosion) {
                const {bullet, asteroid} = asteroidExplosion;
                const {x, y, size} = asteroid;

                setPoints((points) => points + Math.round(size));

                bullets.current = bullets.current.filter(b => b !== bullet);
                asteroids.current = asteroids.current.filter(m => m !== asteroid);

                explosions.current = [
                    ...explosions.current,
                    {
                        x,
                        y,
                        size,
                        animationTime: 0,
                        type: 'asteroid'
                    }
                ];
            }

            bullets.current = bullets.current
                .filter(bullet => bullet.y >= 0)
                .map(bullet => ({
                    ...bullet,
                    x: bullet.x + bullet.velocityX,
                    y: bullet.y + bullet.velocityY
                }));
        }

        function drawAsteroids() {
            for (const asteroid of asteroids.current) {
                ctx.drawImage(asteroidImageRef.current!, asteroid.x, asteroid.y, asteroid.size, asteroid.size);
            }
        }

        function updateAsteroidsPositions() {
            asteroids.current = asteroids.current.filter(asteroid =>
                asteroid.x > -asteroid.size &&
                asteroid.x < CANVAS_WIDTH + asteroid.size &&
                asteroid.y < CANVAS_HEIGHT
            ).map(asteroid => ({
                ...asteroid,
                x: asteroid.x + asteroid.velocityX,
                y: asteroid.y + asteroid.velocityY
            }))
        }

        function updateEnemiesPositions() {
            enemies.current = enemies.current.filter(enemy =>
                enemy.x > -ENEMY_SIZE &&
                enemy.x < CANVAS_WIDTH + ENEMY_SIZE &&
                enemy.y < CANVAS_HEIGHT
            ).map(enemy => ({
                ...enemy,
                x: enemy.x + enemy.velocityX,
                y: enemy.y + enemy.velocityY
            }))
        }

        function drawBullets() {
            for (const bullet of bullets.current) {
                ctx.drawImage(baseProjectileRef.current!, bullet.x, bullet.y, 8, 8);
            }
        }

        function updateExplosionAnimationTime(explosion: Explosion) {
            explosions.current = explosions.current.map(e => {
                if (e !== explosion) return e;
                return {...e, animationTime: e.animationTime + 1}
            });
        }

        function getExplosionFrame(type: Explosion['type'], time: number) {
            switch (type) {
                case "asteroid": {
                    if (time < ANIMATION_FRAME_TIME) {
                        return explosionBlueFrame1Ref.current!
                    }

                    if (time < ANIMATION_FRAME_TIME * 2) {
                        return explosionBlueFrame2Ref.current!
                    }

                    if (time < ANIMATION_FRAME_TIME * 3) {
                        return explosionBlueFrame3Ref.current!
                    }

                    return explosionBlueFrame4Ref.current!
                }

                case "player": {
                    if (time < ANIMATION_FRAME_TIME) {
                        return shipExplosionFrame1Ref.current!
                    }

                    if (time < ANIMATION_FRAME_TIME * 2) {
                        return shipExplosionFrame2Ref.current!
                    }

                    if (time < ANIMATION_FRAME_TIME * 3) {
                        return shipExplosionFrame2Ref.current!
                    }

                    return shipExplosionFrame3Ref.current!
                }
            }
        }

        function drawExplosions() {
            for (const explosion of explosions.current) {
                const {x, y, animationTime, size, type} = explosion;

                if (animationTime >= ANIMATION_FRAME_TIME * 4) {
                    explosions.current = explosions.current.filter(e => e !== explosion);
                    return;
                }

                const imageElement = getExplosionFrame(type, animationTime);
                ctx.drawImage(imageElement, x, y, size, size);
                updateExplosionAnimationTime(explosion);
            }
        }

        function handleKeyDown(e: KeyboardEvent) {
            if (player.current.status === 'dead') return;

            const {
                velocityX,
                velocityY,
                keysPressed
            } = player.current;

            if (fireBulletTimeoutId.current) {
                clearTimeout(fireBulletTimeoutId.current);
            }

            updateKeysPressed([
                ...Array.from(keysPressed),
                e.code
            ]);

            switch (e.code) {
                case "Space": {
                    fireBulletTimeoutId.current = setTimeout(() => {
                        fireBullet();
                    }, 100)

                    break;
                }

                case "ArrowDown":
                    updateSpeedY(velocityY);
                    break;

                case "ArrowLeft":
                    updatePlayerStatus('moving-left');
                    updateSpeedX(-velocityX);
                    break;

                case "ArrowRight":
                    updatePlayerStatus('moving-right');
                    updateSpeedX(velocityX);
                    break;

                case "ArrowUp":
                    updateSpeedY(-velocityY);
                    break;
            }
        }

        function updateBackgroundPosition() {
            const {backgroundY, backgroundVelocityY} = game.current;

            game.current = {
                ...game.current,
                backgroundY: (backgroundY % CANVAS_HEIGHT) + backgroundVelocityY
            }
        }

        function drawBackground() {
            const {backgroundY} = game.current;

            ctx.drawImage(backgroundsImageRef.current!, 0, backgroundY - CANVAS_HEIGHT, 350, 600);
            ctx.drawImage(backgroundsImageRef.current!, 0, backgroundY, 350, 600);
        }

        function drawPlayer() {
            const {
                status,
                x,
                y
            } = player.current;

            switch (status) {
                case 'idle': {
                    ctx.drawImage(shipRef.current!, x, y, PLAYER_SIZE, PLAYER_SIZE);
                    break;
                }

                case 'moving-left': {
                    ctx.drawImage(shipMovingLeftRef.current!, x, y, PLAYER_SIZE, PLAYER_SIZE);
                    break;
                }

                case 'moving-right': {
                    ctx.drawImage(shipMovingRightRef.current!, x, y, PLAYER_SIZE, PLAYER_SIZE);
                    break;
                }
            }

        }

        function drawHp() {
            const {hp} = player.current;

            for (let i = 0; i < hp; i++) {
                ctx.drawImage(shipRef.current!, i > 0 ? i * PLAYER_HP_SIZE + (i * 5) : 0, 13, PLAYER_HP_SIZE, PLAYER_HP_SIZE);
            }
        }

        function drawShield() {
            const {x, y} = player.current;

            ctx.drawImage(shieldRef.current!, x - 15, y - 15, 80, 80);
        }

        function drawEnemy() {
            for (const enemy of enemies.current) {
                ctx.drawImage(enemyShipRef.current!, enemy.x, enemy.y, ENEMY_SIZE, ENEMY_SIZE);
            }
        }

        let startTime: number,
            fpsInterval: number,
            elapsedTime: number;

        function firstFrame(timeStamp: number) {
            fpsInterval = 1000 / FPS;
            startTime = timeStamp;
            loop(timeStamp);
        }

        function loop(timeStamp: number) {
            const now = (timeStamp - startTime);
            elapsedTime = now - startTime;

            if (!game.current.isGameOver && elapsedTime > fpsInterval) {
                startTime = now - (elapsedTime % fpsInterval);

                spawnPhaseTimer.current--;

                if (spawnPhaseTimer.current === 0) {
                    currentLevelSpawnIndex.current++;
                    spawnPhaseTimer.current = SPAWN_PHASE_TIME;
                }

                switch (currentLevel.spawns[currentLevelSpawnIndex.current]) {
                    case 'asteroids':
                        asteroidSpawnTimer.current--;

                        if (asteroidSpawnTimer.current === 0) {
                            createAsteroid();

                            asteroidSpawnTimer.current = 75;
                        }

                        break;

                    case 'enemies':
                        enemySpawnTimer.current--;

                        if (enemySpawnTimer.current === 0) {
                            createEnemy();

                            enemySpawnTimer.current = 75;
                        }

                        break;
                }

                ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

                updateBackgroundPosition();

                if (player.current.status !== 'dead') {
                    updatePlayerPosition();
                }

                updateBulletsPositions();
                updateAsteroidsPositions();
                updateEnemiesPositions();

                drawBackground();
                drawBullets();
                drawAsteroids();
                drawExplosions();
                drawPlayer();
                drawHp();
                drawEnemy();

                if (respawnInvulnerabilityTimer.current > 0) {
                    drawShield();
                    respawnInvulnerabilityTimer.current--;
                }
            }

            animationFrameId.current = requestAnimationFrame(loop);
        }

        requestAnimationFrame(firstFrame);

        return () => {
            removeEventListener('keydown', handleKeyDown);
            removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(animationFrameId.current!);
            clearInterval(asteroidIntervalId.current!);
        }
    }

    useEffect(() => {
        const clean = main();

        return () => {
            clean?.();
        }
    }, []);

    return (
        <Flex style={{touchAction: 'none'}}
              userSelect="none"
              bgColor="black"
              minH="100dvh"
              width="100%"
              direction="column"
              gap="8rem"
              textAlign="center"
              align="center"
              justify="center">
            <VisuallyHidden>
                <header>
                    <h1>Space Shooter</h1>
                </header>
            </VisuallyHidden>

            {isGameOver && (
                <Container alignItems="center" display="flex" flexDirection="column" gap="3rem">
                    <Flex direction="column" gap="2rem">
                        <Text textTransform="uppercase"
                              color="red"
                              letterSpacing=".3rem"
                              lineHeight="8rem"
                              fontSize="11rem"
                        >Sei morto</Text>


                        <Text display="flex"
                              gap="1rem"
                              flexDirection="column"
                              color="white"
                              letterSpacing=".2rem"
                              fontSize="2rem">
                            <span>Hai raccolto <Box as="strong" color="dodgerblue">{points}</Box> punti.</span>
                            <span>Non sei riuscito a sopravvivere allo
                                spazio interstellare.</span>
                            <span>
                            Purtroppo, non
                            tutti sono
                            adatti a comandare una navicella spaziale.</span>
                        </Text>
                    </Flex>

                    <Button letterSpacing=".2rem"
                            fontSize="3rem"
                            bgColor="red"
                            transition="background-color 200ms ease"
                            color="white"
                            _hover={{bgColor: 'darkred'}}
                            onClick={handleResetGame}
                            padding="3rem">Riprova</Button>
                </Container>
            )}

            <Box position="relative" {...(isGameOver && {display: 'none'})}>
                <canvas
                    style={{position: 'relative', userSelect: 'none', imageRendering: 'pixelated', touchAction: 'none'}}
                    ref={canvas}
                    height={CANVAS_HEIGHT}
                    width={CANVAS_WIDTH}/>

                <Text position="absolute" top={0} right={0} fontSize="3.2rem" color="white">{points}</Text>

                <Flex width="100%"
                      gap="4rem"
                      position="absolute"
                      bottom="1rem"
                      align="flex-end"
                      justify="space-between">
                    <Grid gap=".2rem" templateRows="repeat(2, 1fr)" templateColumns="repeat(3, 1fr)">
                        <GridItem gridColumn="2/3" gridRow="1/2">
                            <Button onMouseUp={() => updateSpeedY(0)}
                                    onMouseDown={() => {
                                        if (player.current.status === 'dead') return;
                                        updateSpeedY(-player.current.velocityY)
                                    }}
                                    onTouchStart={() => {
                                        if (player.current.status === 'dead') return;
                                        updateSpeedY(-player.current.velocityY)
                                    }}
                                    onTouchEnd={() => updateSpeedY(0)}
                                    variant="button">
                                <ArrowUpIcon/>
                            </Button>
                        </GridItem>
                        <GridItem gridRow="2/3">
                            <Button variant="button"
                                    onMouseUp={() => {
                                        if (player.current.status === 'dead') return;
                                        updateSpeedX(0);
                                        updatePlayerStatus('idle');
                                    }}
                                    onMouseDown={() => {
                                        if (player.current.status === 'dead') return;
                                        updatePlayerStatus('moving-left');
                                        updateSpeedX(-player.current.velocityX);
                                    }}
                                    onTouchEnd={() => {
                                        if (player.current.status === 'dead') return;
                                        updateSpeedX(0);
                                        updatePlayerStatus('idle');
                                    }}
                                    onTouchStart={() => {
                                        if (player.current.status === 'dead') return;
                                        updatePlayerStatus('moving-left');
                                        updateSpeedX(-player.current.velocityX);
                                    }}
                            >
                                <ArrowBackIcon/>
                            </Button>
                        </GridItem>
                        <GridItem gridRow="2/3">
                            <Button variant="button"
                                    onMouseUp={() => updateSpeedY(0)}
                                    onMouseDown={() => {
                                        if (player.current.status === 'dead') return;
                                        updateSpeedY(player.current.velocityY)
                                    }}
                                    onTouchEnd={() => updateSpeedY(0)}
                                    onTouchStart={() => {
                                        if (player.current.status === 'dead') return;
                                        updateSpeedY(player.current.velocityY)
                                    }}
                            >
                                <ArrowDownIcon/>
                            </Button>
                        </GridItem>
                        <GridItem gridRow="2/3">
                            <Button variant="button"
                                    onMouseUp={() => {
                                        if (player.current.status === 'dead') return;
                                        updateSpeedX(0)
                                        updatePlayerStatus('idle');
                                    }}
                                    onMouseDown={() => {
                                        if (player.current.status === 'dead') return;
                                        updateSpeedX(player.current.velocityX);
                                        updatePlayerStatus('moving-right');
                                    }}
                                    onTouchEnd={() => {
                                        if (player.current.status === 'dead') return;
                                        updateSpeedX(0)
                                        updatePlayerStatus('idle');
                                    }}
                                    onTouchStart={() => {
                                        if (player.current.status === 'dead') return;
                                        updateSpeedX(player.current.velocityX);
                                        updatePlayerStatus('moving-right');
                                    }}
                            >
                                <ArrowForwardIcon/>
                            </Button>
                        </GridItem>
                    </Grid>

                    <Button onClick={fireBullet} variant="button">
                        💥
                    </Button>
                </Flex>
            </Box>

            <VisuallyHidden>
                <img ref={shipRef} src={ship} alt=""/>
                <img ref={shipMovingLeftRef} src={shipMovingLeft} alt=""/>
                <img ref={shipMovingRightRef} src={shipMovingRight} alt=""/>
                <img ref={baseProjectileRef} src={baseProjectile} alt=""/>
                <img ref={backgroundsImageRef} src={backgrounds} alt=""/>
                <img ref={asteroidImageRef} src={asteroid} alt=""/>

                <img ref={explosionBlueFrame1Ref} src={explosionBlueFrame1} alt=""/>
                <img ref={explosionBlueFrame2Ref} src={explosionBlueFrame2} alt=""/>
                <img ref={explosionBlueFrame3Ref} src={explosionBlueFrame3} alt=""/>
                <img ref={explosionBlueFrame4Ref} src={explosionBlueFrame4} alt=""/>

                <img ref={shieldRef} src={shield} alt=""/>
                <img ref={enemyShipRef} src={enemyShip} alt=""/>

                <img ref={shipExplosionFrame1Ref} src={shipExplosion1} alt=""/>
                <img ref={shipExplosionFrame2Ref} src={shipExplosion2} alt=""/>
                <img ref={shipExplosionFrame3Ref} src={shipExplosion3} alt=""/>
                <img ref={shipExplosionFrame4Ref} src={shipExplosion4} alt=""/>

                <audio ref={laserSoundRef}>
                    <source src={laserSound}/>
                </audio>

                <footer>
                    <p>Sviluppato da Alessio Sferro</p>
                </footer>
            </VisuallyHidden>
        </Flex>
    )
}

type Bullet = {
    x: number;
    y: number;

    // coordinates in image
    sx: number;
    sy: number;
    sw: number;
    sh: number;

    velocityX: number;
    velocityY: number;
}

type Asteroid = {
    x: number;
    y: number;

    velocityX: number;
    velocityY: number;

    size: number;
}

type Explosion = {
    x: number;
    y: number;
    size: number;
    animationTime: number;
    type: 'asteroid' | 'player';
}

type Enemy = {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
}

const CANVAS_WIDTH = 350;
const CANVAS_HEIGHT = 600;

const PLAYER_SIZE = 48;
const ENEMY_SIZE = 32;

const ANIMATION_FRAME_TIME = 5;
const PLAYER_HP_SIZE = 24;

const SPAWN_PHASE_TIME = 2000;

const FPS = 144;

const INITIAL_PLAYER_CONFIG = {
    velocityX: 6,
    velocityY: 5,
    speedX: 0,
    speedY: 0,
    hp: 3,
    status: 'idle',
    x: 150,
    y: 400,
    keysPressed: new Set<string>([])
}

const INITIAL_GAME_CONFIG = {
    backgroundY: 0,
    backgroundVelocityY: .3,
    isGameOver: false
}

export default App
