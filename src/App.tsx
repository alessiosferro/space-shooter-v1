import './App.css'
import {Flex, VisuallyHidden} from "@chakra-ui/react";
import {useEffect, useRef} from "react";

import ships from './assets/SpaceShooterAssetPack_Ships.png';

const CANVAS_WIDTH = 350;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE_MULTIPLIER = 6;

function App() {
    const canvas = useRef<HTMLCanvasElement | null>(null);
    const shipsImage = useRef<HTMLImageElement | null>(null);

    const player = useRef({
        velocityX: 1,
        velocityY: .8,
        speedX: 0,
        speedY: 0,
        hp: 5,
        status: 'idle',
        x: 150,
        y: 300,
    });

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

    function handleKeyUp() {
        updatePlayerStatus('idle');
        updateSpeedX(0);
        updateSpeedY(0);
    }

    function handleKeyDown(e: KeyboardEvent) {
        const {
            velocityX,
            velocityY
        } = player.current;

        switch (e.code) {
            case "Space":
                break;

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

    function updatePlayerPosition() {
        player.current = {
            ...player.current,
            x: player.current.x + player.current.speedX,
            y: player.current.y + player.current.speedY
        }
    }


    const game = () => {
        if (!canvas.current) return;

        const ctx = canvas.current.getContext('2d') as CanvasRenderingContext2D;

        ctx.imageSmoothingEnabled = false;

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
                    ctx.drawImage(shipsImage.current!, 8, 0, 8, 8, x, y, sizeW * PLAYER_SIZE_MULTIPLIER, sizeH * PLAYER_SIZE_MULTIPLIER)
                    break;
                }

                case 'moving-left': {
                    const sizeW = 6;
                    const sizeH = 8;
                    ctx.drawImage(shipsImage.current!, 0, 0, 6, 8, x, y, sizeW * PLAYER_SIZE_MULTIPLIER, sizeH * PLAYER_SIZE_MULTIPLIER)
                    break;
                }

                case 'moving-right': {
                    const sizeW = 6;
                    const sizeH = 8;
                    ctx.drawImage(shipsImage.current!, 18, 0, 6, 8, x, y, sizeW * PLAYER_SIZE_MULTIPLIER, sizeH * PLAYER_SIZE_MULTIPLIER)
                    break;
                }
            }

        }

        function loop() {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            updatePlayerPosition();
            drawPlayer();

            requestAnimationFrame(loop);
        }

        loop();
    }

    useEffect(() => {
        addEventListener('keydown', handleKeyDown);
        addEventListener('keyup', handleKeyUp);

        game();

        return () => {
            removeEventListener('keydown', handleKeyDown);
            removeEventListener('keyup', handleKeyUp);
        }
    }, []);

    return (
        <Flex bgColor="black" minH="100dvh" width="100%" align="center" justify="center">
            <VisuallyHidden>
                <header>
                    <h1>Space Shooter</h1>
                </header>
            </VisuallyHidden>

            <canvas style={{imageRendering: 'pixelated'}}
                    ref={canvas}
                    height={CANVAS_HEIGHT}
                    width={CANVAS_WIDTH}/>

            <VisuallyHidden>
                <img ref={shipsImage} style={{transform: "scale(10)"}} src={ships} alt=""/>

                <footer>
                    <p>Sviluppato da Alessio Sferro</p>
                </footer>
            </VisuallyHidden>
        </Flex>
    )
}

export default App
