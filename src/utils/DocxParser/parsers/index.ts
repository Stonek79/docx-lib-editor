/**
 * Экспорт всех парсеров
 */

// Экспортируем все парсеры документа
export * from './document'

// Экспортируем все парсеры стилей
export * from './styles'

// Создаем единую точку входа для всех парсеров
import { createDocumentParsers } from './document'
import { createStyleParsers } from './styles'

/**
 * Создает все парсеры
 * @returns Объект со всеми парсерами
 */
export function createAllParsers() {
    return {
        ...createDocumentParsers(),
        ...createStyleParsers()
    }
}
