import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {ChakraProvider, defineStyleConfig, extendTheme, ThemeOverride} from "@chakra-ui/react";

const theme = extendTheme({
    components: {
        Button: defineStyleConfig({
            variants: {
                button: {
                    fontSize: '1.6rem',
                    padding: '2.4rem',
                    minWidth: '5rem',
                    color: 'white',
                    border: '.1rem solid',
                    borderColor: 'white',
                    bgColor: 'rgba(255, 255, 255, .2)'

                }
            }
        })
    },
} satisfies ThemeOverride);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ChakraProvider theme={theme}>
            <App/>
        </ChakraProvider>
    </React.StrictMode>,
)

