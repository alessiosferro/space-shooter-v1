import './App.css';

import {Box, Button, Container, Flex, Grid, GridItem, Text, VisuallyHidden} from "@chakra-ui/react";
import {useEffect, useRef, useState} from "react";
import ship from './assets/ship.png';
import shipMovingLeft from './assets/ship-moving-left.png';
import shipMovingRight from './assets/ship-moving-right.png';
import projectiles from './assets/projectiles.png';
import backgrounds from './assets/backgrounds.png';
import meteor from './assets/meteor.png';
import explosion1 from './assets/explosion1.png';
import explosion2 from './assets/explosion2.png';
import explosion3 from './assets/explosion3.png';
import {ArrowBackIcon, ArrowDownIcon, ArrowForwardIcon, ArrowUpIcon} from "@chakra-ui/icons";

function App() {
    const canvas = useRef<HTMLCanvasElement | null>(null);
    const meteorImageRef = useRef<HTMLImageElement | null>(null);
    const projectilesImageRef = useRef<HTMLImageElement | null>(null);
    const backgroundsImageRef = useRef<HTMLImageElement | null>(null)
    const explosionFrame1Ref = useRef<HTMLImageElement | null>(null)
    const explosionFrame2Ref = useRef<HTMLImageElement | null>(null)
    const explosionFrame3Ref = useRef<HTMLImageElement | null>(null)
    const shipRef = useRef<HTMLImageElement | null>(null)
    const shipMovingLeftRef = useRef<HTMLImageElement | null>(null)
    const shipMovingRightRef = useRef<HTMLImageElement | null>(null)
    const respawnInvulnerabilityTimer = useRef<number>(0);
    const animationFrameId = useRef<number | null>(null);
    const fireBulletTimeoutId = useRef<number | null>(null);
    const meteorIntervalId = useRef<number | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [points, setPoints] = useState(0);
    const player = useRef(INITIAL_PLAYER_CONFIG);
    const game = useRef(INITIAL_GAME_CONFIG);
    const bullets = useRef<Bullet[]>([]);
    const meteors = useRef<Meteor[]>([]);
    const explosions = useRef<Explosion[]>([]);

    function fireBullet() {
        const {x, y} = player.current;

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

    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            clearInterval(meteorIntervalId.current!);
            spawnMeteors();
        }
    }

    function spawnMeteors() {
        meteorIntervalId.current = setInterval(() => {
            updateMeteors();
        }, 800);
    }

    function handleResetGame() {
        setPoints(0);
        setIsGameOver(!isGameOver);

        player.current = {...INITIAL_PLAYER_CONFIG};
        game.current = {...INITIAL_GAME_CONFIG};
        meteors.current = [];
        bullets.current = [];
        explosions.current = [];
        respawnInvulnerabilityTimer.current = 0;
    }

    function updateMeteors() {
        const velocityY = Math.random() + .2;
        const velocityX = (Math.random() / 5) * (Math.round(Math.random()) === 0 ? 1 : -1);
        const size = Math.round((Math.random() * 40) + 20);
        const x = Math.round(Math.random() * (CANVAS_WIDTH - size))

        meteors.current = [
            ...meteors.current,
            {
                x,
                y: -size,
                velocityX,
                velocityY,
                size
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
        addEventListener('visibilitychange', handleVisibilityChange)

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

        function detectMeteorPlayerCollision() {
            if (respawnInvulnerabilityTimer.current > 0) return;

            const {x, y} = player.current;

            for (const meteor of meteors.current) {
                if (
                    (meteor.x + meteor.size * .6 >= x && meteor.x <= x + PLAYER_SIZE) &&
                    (meteor.y + meteor.size * .6 >= y && meteor.y <= y + PLAYER_SIZE)
                ) {
                    return meteor;
                }
            }

            return null;
        }

        function updatePlayerPosition() {
            if (player.current.status === 'dead') return;

            const meteor = detectMeteorPlayerCollision();

            const {x, speedX, y, hp, speedY} = player.current;

            if (meteor) {
                meteors.current = meteors.current.filter(m => m !== meteor);

                explosions.current = [
                    ...explosions.current,
                    {
                        x,
                        y,
                        size: PLAYER_SIZE,
                        animationTime: 0
                    }
                ];

                updatePlayerStatus('dead');

                if (hp === 0) {
                    setIsGameOver(true);
                    game.current.isGameOver = true;
                    return;
                }

                setTimeout(() => {
                    respawnInvulnerabilityTimer.current = 200;

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

        function detectMeteorBulletCollision() {
            for (const bullet of bullets.current) {
                for (const meteor of meteors.current) {
                    if (
                        (bullet.x >= meteor.x && bullet.x <= meteor.x + meteor.size) &&
                        (bullet.y >= meteor.y && bullet.y <= meteor.y + meteor.size)
                    ) {
                        return {bullet, meteor};
                    }
                }
            }

            return null;
        }

        function updateBulletsPositions() {
            const meteorExplosion = detectMeteorBulletCollision();

            if (meteorExplosion) {
                const {bullet, meteor} = meteorExplosion;
                const {x, y, size} = meteor;

                setPoints((points) => points + Math.round(size));

                bullets.current = bullets.current.filter(b => b !== bullet);
                meteors.current = meteors.current.filter(m => m !== meteor);

                explosions.current = [
                    ...explosions.current,
                    {
                        x,
                        y,
                        size,
                        animationTime: 0
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

        function drawMeteors() {
            for (const meteor of meteors.current) {
                ctx.drawImage(meteorImageRef.current!, meteor.x, meteor.y, meteor.size, meteor.size);
            }
        }

        function updateMeteorsPositions() {
            meteors.current = meteors.current.filter(meteor =>
                meteor.x > -meteor.size &&
                meteor.x < CANVAS_WIDTH + meteor.size &&
                meteor.y < CANVAS_HEIGHT
            ).map(meteor => ({
                ...meteor,
                x: meteor.x + meteor.velocityX,
                y: meteor.y + meteor.velocityY
            }))
        }

        function drawBullets() {
            for (const bullet of bullets.current) {
                ctx.drawImage(projectilesImageRef.current!, bullet.sx, bullet.sy, bullet.sw, bullet.sh, bullet.x, bullet.y, 8, 8);
            }
        }

        function updateExplosionAnimationTime(explosion: Explosion) {
            explosions.current = explosions.current.map(e => {
                if (e !== explosion) return e;
                return {...e, animationTime: e.animationTime + 1}
            });
        }

        function getExplosionFrame(time: number) {
            if (time < ANIMATION_FRAME_TIME) {
                return explosionFrame1Ref.current!
            }

            if (time < ANIMATION_FRAME_TIME * 2) {
                return explosionFrame2Ref.current!
            }

            return explosionFrame3Ref.current!
        }

        function drawExplosions() {
            for (const explosion of explosions.current) {
                const {x, y, animationTime, size} = explosion;

                if (animationTime >= ANIMATION_FRAME_TIME * 3) {
                    explosions.current = explosions.current.filter(e => e !== explosion);
                    return;
                }

                const imageElement = getExplosionFrame(animationTime);
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

            ctx.drawImage(backgroundsImageRef.current!, 0, 0, 127, 255, 0, backgroundY - CANVAS_HEIGHT, 350, 600);
            ctx.drawImage(backgroundsImageRef.current!, 0, 0, 127, 255, 0, backgroundY, 350, 600);
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

        function loop() {
            if (!game.current.isGameOver) {
                ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

                if (respawnInvulnerabilityTimer.current > 0) {
                    respawnInvulnerabilityTimer.current--;
                }

                updateBackgroundPosition();

                if (player.current.status !== 'dead') {
                    updatePlayerPosition();
                    updateBulletsPositions();
                }

                updateMeteorsPositions();

                drawBackground();
                drawBullets();
                drawMeteors();
                drawExplosions();
                drawPlayer();
                drawHp();
            }

            animationFrameId.current = requestAnimationFrame(loop);
        }

        spawnMeteors();

        loop();

        return () => {
            removeEventListener('keydown', handleKeyDown);
            removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(animationFrameId.current!);
            clearInterval(meteorIntervalId.current!);
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
                            color="white"
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
                <img ref={projectilesImageRef} src={projectiles} alt=""/>
                <img ref={backgroundsImageRef} src={backgrounds} alt=""/>
                <img ref={meteorImageRef} src={meteor} alt=""/>
                <img ref={explosionFrame1Ref} src={explosion1} alt=""/>
                <img ref={explosionFrame2Ref} src={explosion2} alt=""/>
                <img ref={explosionFrame3Ref} src={explosion3} alt=""/>

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

type Meteor = {
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
}


const CANVAS_WIDTH = 350;
const CANVAS_HEIGHT = 600;

const PLAYER_SIZE = 48;
const ANIMATION_FRAME_TIME = 8;
const PLAYER_HP_SIZE = 24;

const INITIAL_PLAYER_CONFIG = {
    velocityX: 4,
    velocityY: 3,
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
