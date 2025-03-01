'use client'
import { createTheme } from '@mui/material/styles'
import { Roboto } from 'next/font/google'

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-roboto',
})

const theme = createTheme({
    colorSchemes: { light: true, dark: true },
    cssVariables: {
        colorSchemeSelector: 'class',
    },
    typography: {
        fontFamily: roboto.style.fontFamily,
    },
    components: {
        MuiAlert: {
            styleOverrides: {
                root: {
                    variants: [
                        {
                            props: { severity: 'info' },
                            style: {
                                backgroundColor: '#60a5fa',
                            },
                        },
                    ],
                },
            },
        },
        MuiCssBaseline: {
            styleOverrides: {
                // Глобальное переопределение для класса .paragraph
                '.paragraph': {
                    margin: 0,
                    padding: 0,
                },
            },
        },
    },
})

export default theme
