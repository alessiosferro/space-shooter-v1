import './App.css'
import {Box, Button, Flex, Grid, GridItem, VisuallyHidden} from "@chakra-ui/react";
import {useEffect, useRef} from "react";

import ships from './assets/ships.png';
import projectiles from './assets/projectiles.png';
import backgrounds from './assets/backgrounds.png';
import meteor from './assets/meteor.png';
import explosion1 from './assets/explosion1.png';
import explosion2 from './assets/explosion2.png';
import explosion3 from './assets/explosion3.png';

import {ArrowBackIcon, ArrowDownIcon, ArrowForwardIcon, ArrowUpIcon} from "@chakra-ui/icons";

const CANVAS_WIDTH = 350;
const CANVAS_HEIGHT = 600;

const PLAYER_SIZE_MULTIPLIER = 6;
const PLAYER_SIZE = PLAYER_SIZE_MULTIPLIER * 8;

function App() {
    const canvas = useRef<HTMLCanvasElement | null>(null);

    const meteorImageRef = useRef<HTMLImageElement | null>(null);
    const shipsImageRef = useRef<HTMLImageElement | null>(null);
    const projectilesImageRef = useRef<HTMLImageElement | null>(null);
    const backgroundsImageRef = useRef<HTMLImageElement | null>(null)
    const explosion1Ref = useRef<HTMLImageElement | null>(null)
    const explosion2Ref = useRef<HTMLImageElement | null>(null)
    const explosion3Ref = useRef<HTMLImageElement | null>(null)

    const animationFrameId = useRef<number | null>(null);
    const fireBulletTimeoutId = useRef<number | null>(null);

    const player = useRef({
        velocityX: 4,
        velocityY: 3,
        speedX: 0,
        speedY: 0,
        hp: 5,
        status: 'idle',
        x: 150,
        y: 400,
        keysPressed: new Set<string>([])
    });

    const game = useRef({
        backgroundY: 0,
        backgroundVelocityY: .3
    })

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
                velocityY: -5,
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

    function updatePlayerStatus(status: 'idle' | 'moving-left' | 'moving-right') {
        player.current = {
            ...player.current,
            status
        }
    }


    const main = () => {
        if (!canvas.current) return;

        const canvasElement = canvas.current;
        const ctx = canvasElement.getContext('2d') as CanvasRenderingContext2D;

        addEventListener('keydown', handleKeyDown);
        addEventListener('keyup', handleKeyUp);

        ctx.imageSmoothingEnabled = false;


        function updatePlayerPosition() {
            const {x, speedX, y, speedY} = player.current;

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

            if (!isMovingHorizontally && !isMovingVertically) {
                updatePlayerStatus('idle');
            }
        }

        function updateKeysPressed(keysPressed: string[]) {
            player.current = {
                ...player.current,
                keysPressed: new Set(keysPressed)
            }
        }

        function detectMeteorCollision() {
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
            const meteorExplosion = detectMeteorCollision();

            if (meteorExplosion) {
                const {bullet, meteor} = meteorExplosion;
                const {x, y, size} = meteor;

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

        function spawnMeteor() {
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

        function getExplosionImage(time: number) {
            if (time < 10) {
                return explosion1Ref.current!
            }

            if (time < 20) {
                return explosion2Ref.current!
            }

            return explosion3Ref.current!
        }

        function drawExplosions() {

            for (const explosion of explosions.current) {
                const {x, y, animationTime, size} = explosion;

                if (animationTime >= 30) {
                    explosions.current = explosions.current.filter(e => e !== explosion);
                    return;
                }

                const imageElement = getExplosionImage(animationTime);
                ctx.drawImage(imageElement, x, y, size, size);
                updateExplosionAnimationTime(explosion);
            }
        }

        function handleKeyDown(e: KeyboardEvent) {
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
                    const sizeW = 8;
                    const sizeH = 8;
                    ctx.drawImage(shipsImageRef.current!, 8, 0, 8, 8, x, y, sizeW * PLAYER_SIZE_MULTIPLIER, sizeH * PLAYER_SIZE_MULTIPLIER)
                    break;
                }

                case 'moving-left': {
                    const sizeW = 6;
                    const sizeH = 8;
                    ctx.drawImage(shipsImageRef.current!, 0, 0, 6, 8, x, y, sizeW * PLAYER_SIZE_MULTIPLIER, sizeH * PLAYER_SIZE_MULTIPLIER)
                    break;
                }

                case 'moving-right': {
                    const sizeW = 6;
                    const sizeH = 8;
                    ctx.drawImage(shipsImageRef.current!, 18, 0, 6, 8, x, y, sizeW * PLAYER_SIZE_MULTIPLIER, sizeH * PLAYER_SIZE_MULTIPLIER)
                    break;
                }
            }

        }

        function loop() {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            updateBackgroundPosition();
            updatePlayerPosition();
            updateBulletsPositions();
            updateMeteorsPositions();

            drawBackground();
            drawPlayer();
            drawBullets();
            drawMeteors();
            drawExplosions();

            animationFrameId.current = requestAnimationFrame(loop);
        }

        loop();

        const intervalId = setInterval(() => {
            spawnMeteor();
        }, 800);

        return () => {
            removeEventListener('keydown', handleKeyDown);
            removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(animationFrameId.current!);
            clearInterval(intervalId);
        }
    }

    useEffect(() => {
        const clean = main();

        return () => {
            clean?.();
        }
    }, []);

    return (
        <Flex style={{touchAction: 'none'}} userSelect="none" bgColor="black" minH="100dvh" width="100%" align="center"
              justify="center">
            <VisuallyHidden>
                <header>
                    <h1>Space Shooter</h1>
                </header>
            </VisuallyHidden>

            <Box position="relative">
                <canvas
                    style={{position: 'relative', userSelect: 'none', imageRendering: 'pixelated', touchAction: 'none'}}
                    ref={canvas}
                    height={CANVAS_HEIGHT}
                    width={CANVAS_WIDTH}/>
                <Flex width="100%"
                      gap="4rem"
                      position="absolute"
                      bottom="1rem"
                      align="flex-end"
                      justify="space-between">
                    <Grid gap=".2rem" templateRows="repeat(2, 1fr)" templateColumns="repeat(3, 1fr)">
                        <GridItem gridColumn="2/3" gridRow="1/2">
                            <Button onMouseUp={() => updateSpeedY(0)}
                                    onMouseDown={() => updateSpeedY(-player.current.velocityY)}
                                    onTouchStart={() => updateSpeedY(-player.current.velocityY)}
                                    onTouchEnd={() => updateSpeedY(0)}
                                    variant="button">
                                <ArrowUpIcon/>
                            </Button>
                        </GridItem>
                        <GridItem gridRow="2/3">
                            <Button variant="button"
                                    onMouseUp={() => {
                                        updateSpeedX(0);
                                        updatePlayerStatus('idle');
                                    }}
                                    onMouseDown={() => {
                                        updatePlayerStatus('moving-left');
                                        updateSpeedX(-player.current.velocityX);
                                    }}
                                    onTouchEnd={() => {
                                        updateSpeedX(0);
                                        updatePlayerStatus('idle');
                                    }}
                                    onTouchStart={() => {
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
                                    onMouseDown={() => updateSpeedY(player.current.velocityY)}
                                    onTouchEnd={() => updateSpeedY(0)}
                                    onTouchStart={() => updateSpeedY(player.current.velocityY)}
                            >
                                <ArrowDownIcon/>
                            </Button>
                        </GridItem>
                        <GridItem gridRow="2/3">
                            <Button variant="button"
                                    onMouseUp={() => {
                                        updateSpeedX(0)
                                        updatePlayerStatus('idle');
                                    }}
                                    onMouseDown={() => {
                                        updateSpeedX(player.current.velocityX);
                                        updatePlayerStatus('moving-right');
                                    }}
                                    onTouchEnd={() => {
                                        updateSpeedX(0)
                                        updatePlayerStatus('idle');
                                    }}
                                    onTouchStart={() => {
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
                <img ref={shipsImageRef} src={ships} alt=""/>
                <img ref={projectilesImageRef} src={projectiles} alt=""/>
                <img ref={backgroundsImageRef} src={backgrounds} alt=""/>
                <img ref={meteorImageRef} src={meteor} alt=""/>
                <img ref={explosion1Ref} src={explosion1} alt=""/>
                <img ref={explosion2Ref} src={explosion2} alt=""/>
                <img ref={explosion3Ref} src={explosion3} alt=""/>

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

export default App
