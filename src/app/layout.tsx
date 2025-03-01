'use client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from '../theme'

/**
 * Корневой макет приложения
 * Отвечает за:
 * - Настройку темы Material-UI
 * - Сброс стилей через CssBaseline
 * - Определение базовой структуры HTML
 *
 * @param props.children - Дочерние компоненты для рендеринга
 */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ru">
            <body>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    {children}
                </ThemeProvider>
            </body>
        </html>
    )
}
