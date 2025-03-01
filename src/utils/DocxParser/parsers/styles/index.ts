/**
 * Экспорт всех парсеров стилей
 */

// Парсеры стилей
export * from './styles-processor'
export * from './theme-parser'
export * from './font-table-parser'

// Создаем единую точку входа для всех парсеров стилей
import { createStylesProcessor } from './styles-processor'
import { createThemeParser } from './theme-parser'
import { createFontTableParser } from './font-table-parser'

/**
 * Создает все парсеры стилей
 * @returns Объект со всеми парсерами стилей
 */
export function createStyleParsers() {
    return {
        stylesProcessor: createStylesProcessor(),
        themeParser: createThemeParser(),
        fontTableParser: createFontTableParser()
    }
}
