import './App.css'
import {Flex, VisuallyHidden} from "@chakra-ui/react";
import {useEffect, useRef} from "react";

import ships from './assets/ships.png';
import projectiles from './assets/projectiles.png';
import backgrounds from './assets/backgrounds.png';

const CANVAS_WIDTH = 350;
const CANVAS_HEIGHT = 600;

const PLAYER_SIZE_MULTIPLIER = 6;
const PLAYER_SIZE = PLAYER_SIZE_MULTIPLIER * 8;

function App() {
    const canvas = useRef<HTMLCanvasElement | null>(null);
    const shipsImageRef = useRef<HTMLImageElement | null>(null);
    const projectilesImageRef = useRef<HTMLImageElement | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const backgroundsImageRef = useRef<HTMLImageElement | null>(null)
    const fireBulletTimeoutId = useRef<number | null>(null);

    const player = useRef({
        velocityX: 4,
        velocityY: 3,
        speedX: 0,
        speedY: 0,
        hp: 5,
        status: 'idle',
        x: 150,
        y: 300,
        keysPressed: new Set<string>([])
    });

    const game = useRef({
        backgroundY: 0,
    })

    const bullets = useRef<Bullet[]>([]);

    const main = () => {
        if (!canvas.current) return;

        const canvasElement = canvas.current;
        const ctx = canvasElement.getContext('2d') as CanvasRenderingContext2D;


        canvasElement.addEventListener('keydown', handleKeyDown);
        canvasElement.addEventListener('keyup', handleKeyUp);
        canvasElement.addEventListener('touchstart', handleFireBullet);
        canvasElement.addEventListener('touchstart', handleTouchMove);
        canvasElement.addEventListener('touchend', handleTouchEnd);

        ctx.imageSmoothingEnabled = false;

        function updatePlayerStatus(status: 'idle' | 'moving-left' | 'moving-right') {
            player.current = {
                ...player.current,
                status
            }
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

        function handleFireBullet(e: TouchEvent) {
            e.stopPropagation();
            e.preventDefault();

            if (e.targetTouches.length < 2) return;
            fireBullet();
        }

        function updatePlayerPosition() {
            const {x, speedX, y, speedY} = player.current;

            const nextY = y + speedY;
            const nextX = x + speedX;

            const isYOverflow = nextY > CANVAS_HEIGHT - PLAYER_SIZE || nextY < PLAYER_SIZE;
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

        function handleTouchMove(e: TouchEvent) {
            e.stopPropagation();
            e.preventDefault();

            const [touch] = e.targetTouches;
            const {velocityX, velocityY} = player.current;

            const {clientX, clientY} = touch;

            const offsetTop = (e.target as HTMLCanvasElement).offsetTop;

            console.log(offsetTop)

            if (clientX < 100) {
                updateSpeedX(-velocityX);
            }

            if (clientX > CANVAS_WIDTH - 100) {
                updateSpeedX(velocityX);
            }

            if (clientY - offsetTop < 100) {
                updateSpeedY(-velocityY);
            }

            if (clientY - offsetTop > CANVAS_HEIGHT - 100) {
                updateSpeedY(velocityY);
            }
        }

        function handleTouchEnd() {
            updateSpeedX(0);
            updateSpeedY(0);
            updatePlayerStatus('idle');
        }

        function updateKeysPressed(keysPressed: string[]) {
            player.current = {
                ...player.current,
                keysPressed: new Set(keysPressed)
            }
        }

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

        function updateBulletsPositions() {
            bullets.current = bullets.current
                .filter(bullet => bullet.y >= 0)
                .map(bullet => ({
                    ...bullet,
                    x: bullet.x + bullet.velocityX,
                    y: bullet.y + bullet.velocityY
                }));
        }

        function drawBullets() {
            for (const bullet of bullets.current) {
                ctx.drawImage(projectilesImageRef.current!, bullet.sx, bullet.sy, bullet.sw, bullet.sh, bullet.x, bullet.y, 8, 8);
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
            game.current = {
                ...game.current,
                backgroundY: (game.current.backgroundY % CANVAS_HEIGHT) + .2
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

            drawBackground();
            drawPlayer();
            drawBullets();

            animationFrameId.current = requestAnimationFrame(loop);
        }

        loop();

        return () => {
            canvasElement.removeEventListener('keydown', handleKeyDown);
            canvasElement.removeEventListener('keyup', handleKeyUp);
            canvasElement.removeEventListener('touchstart', handleTouchMove);
            canvasElement.removeEventListener('touchstart', handleFireBullet);
            cancelAnimationFrame(animationFrameId.current!);
        }
    }

    useEffect(() => {
        const clean = main();

        return () => {
            clean?.();
        }
    }, []);

    return (
        <Flex userSelect="none" bgColor="black" minH="100dvh" width="100%" align="center" justify="center">
            <VisuallyHidden>
                <header>
                    <h1>Space Shooter</h1>
                </header>
            </VisuallyHidden>

            <canvas style={{position: 'relative', imageRendering: 'pixelated'}}
                    ref={canvas}
                    height={CANVAS_HEIGHT}
                    width={CANVAS_WIDTH}/>

            <VisuallyHidden>
                <img ref={shipsImageRef} src={ships} alt=""/>

                <img ref={projectilesImageRef} src={projectiles} alt=""/>

                <img ref={backgroundsImageRef} src={backgrounds} alt=""/>

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

export default App
