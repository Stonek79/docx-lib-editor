import { BaseParser } from '../../base-parser'
import { WmlFont } from '@/types/document'

/**
 * Парсер таблицы шрифтов документа Word
 * Обрабатывает файл word/fontTable.xml, который содержит:
 * - Список шрифтов, используемых в документе
 * - Информацию о подстановке шрифтов
 * - Настройки для каждого шрифта
 */
export class FontTableParser extends BaseParser {
    /**
     * Парсит таблицу шрифтов
     * @param xmlContent - XML содержимое файла fontTable.xml
     * @returns Map шрифтов, где ключ - это имя шрифта
     */
    public parse(xmlContent: string): Map<string, WmlFont> {
        const fonts = new Map<string, WmlFont>()
        const xml = this.xmlParser.parse(xmlContent)
        const fontElements = xml['w:fonts']?.['w:font'] || []

        // Обрабатываем каждый шрифт
        for (const font of Array.isArray(fontElements) ? fontElements : [fontElements]) {
            const name = font['@_w:name']
            if (!name) continue

            // Получаем семейство шрифта
            const family = this.getFontFamily(font)

            // Получаем альтернативное имя шрифта
            const altName = this.getAltName(font)

            // Получаем кодировку
            // Получаем кодировку и преобразуем в строку с ведущим нулем
            const charsetNum = font['w:charset']?.['@_w:val']
            const charset = charsetNum !== undefined ? charsetNum.toString().padStart(2, '0') : undefined

            // Получаем pitch (фиксированная ширина или пропорциональный)
            const pitch = font['w:pitch']?.['@_w:val']

            fonts.set(name, {
                name,
                family,
                altName,
                charset,
                pitch
            })
        }

        return fonts
    }

    /**
     * Определяет семейство шрифта
     * @param font - XML элемент шрифта
     * @returns Семейство шрифта
     */
    private getFontFamily(font: any): string | undefined {
        const family = font['w:family']?.['@_w:val']
        if (!family) return undefined

        // Преобразуем значения в более понятные
        const familyMap: { [key: string]: string } = {
            roman: 'serif',
            swiss: 'sans-serif',
            modern: 'monospace',
            script: 'cursive',
            decorative: 'fantasy'
        }

        return familyMap[family] || family
    }

    /**
     * Получает альтернативное имя шрифта
     * @param font - XML элемент шрифта
     * @returns Альтернативное имя шрифта
     */
    private getAltName(font: any): string | undefined {
        // Проверяем различные варианты альтернативных имен
        return (
            font['w:altName']?.['@_w:val'] ||
            font['w:name']?.['@_w:val'] ||
            undefined
        )
    }

    /**
     * Проверяет наличие шрифта в таблице
     * @param fonts - Map шрифтов
     * @param fontName - Имя шрифта для проверки
     */
    public hasFont(fonts: Map<string, WmlFont>, fontName: string): boolean {
        return fonts.has(fontName)
    }

    /**
     * Получает информацию о шрифте
     * @param fonts - Map шрифтов
     * @param fontName - Имя шрифта
     * @returns Информация о шрифте или undefined, если шрифт не найден
     */
    public getFontInfo(fonts: Map<string, WmlFont>, fontName: string): WmlFont | undefined {
        return fonts.get(fontName)
    }

    /**
     * Получает список всех шрифтов определенного семейства
     * @param fonts - Map шрифтов
     * @param family - Семейство шрифтов для фильтрации
     * @returns Массив шрифтов указанного семейства
     */
    public getFontsByFamily(fonts: Map<string, WmlFont>, family: string): WmlFont[] {
        return Array.from(fonts.values()).filter(font => font.family === family)
    }
}
