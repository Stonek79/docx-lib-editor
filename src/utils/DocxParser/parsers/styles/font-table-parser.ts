import { BaseParser } from '../../base-parser'
import { WmlFont } from '@/types/document'

/**
 * Интерфейс для шрифта
 */
export interface IFont {
    name: string
    family?: string
    altName?: string
    charset?: string
    pitch?: string
}

/**
 * Парсер таблицы шрифтов документа
 */
export class FontTableParser extends BaseParser {
    /**
     * Парсит таблицу шрифтов документа
     * @returns Объект с шрифтами
     */
    public async parseFontTable(): Promise<Record<string, IFont>> {
        try {
            const fontTablePath = 'word/fontTable.xml'
            const fontTableXml = await this.loadXmlFile(fontTablePath)
            
            if (!fontTableXml || !fontTableXml.fonts) {
                return {}
            }
            
            const fonts: Record<string, IFont> = {}
            const fontList = fontTableXml.fonts.font
            
            if (!fontList) {
                return fonts
            }
            
            const fontArray = Array.isArray(fontList) ? fontList : [fontList]
            
            for (const font of fontArray) {
                const name = font['@_name']
                
                if (name) {
                    fonts[name] = this.parseFont(font)
                }
            }
            
            return fonts
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse font table:', error)
            }
            return {}
        }
    }
    
    /**
     * Парсит шрифт из XML
     * @param fontXml - XML шрифта
     * @returns Объект шрифта
     */
    private parseFont(fontXml: any): IFont {
        const name = fontXml['@_name'] || ''
        const family = this.parseFontFamily(fontXml)
        const altName = this.parseFontAltName(fontXml)
        const charset = fontXml['@_charset'] || ''
        const pitch = fontXml['@_pitch'] || ''
        
        return {
            name,
            family,
            altName,
            charset,
            pitch
        }
    }
    
    /**
     * Парсит семейство шрифта
     * @param fontXml - XML шрифта
     * @returns Семейство шрифта
     */
    private parseFontFamily(fontXml: any): string | undefined {
        // Получаем значение атрибута family
        const familyValue = fontXml['@_family']
        
        if (!familyValue) {
            return undefined
        }
        
        // Преобразуем числовое значение в текстовое
        switch (familyValue) {
            case '1':
                return 'roman'
            case '2':
                return 'swiss'
            case '3':
                return 'modern'
            case '4':
                return 'script'
            case '5':
                return 'decorative'
            default:
                return familyValue
        }
    }
    
    /**
     * Парсит альтернативное имя шрифта
     * @param fontXml - XML шрифта
     * @returns Альтернативное имя шрифта
     */
    private parseFontAltName(fontXml: any): string | undefined {
        // Проверяем наличие элемента altName
        if (!fontXml.altName) {
            return undefined
        }
        
        // Получаем значение атрибута val
        return fontXml.altName['@_val'] || undefined
    }
    
    /**
     * Создает CSS для шрифтов
     * @param fonts - Объект с шрифтами
     * @returns CSS для шрифтов
     */
    public createFontsCss(fonts: Record<string, IFont>): string {
        let css = ''
        
        // Создаем CSS-переменные для шрифтов
        css += ':root {\n'
        
        for (const [name, font] of Object.entries(fonts)) {
            const cssName = this.createCssVariableName(name)
            css += `  --font-${cssName}: ${this.createFontFamilyValue(font)};\n`
        }
        
        css += '}\n\n'
        
        // Создаем классы для шрифтов
        for (const [name, font] of Object.entries(fonts)) {
            const cssName = this.createCssClassName(name)
            const cssVarName = this.createCssVariableName(name)
            
            css += `.font-${cssName} {\n`
            css += `  font-family: var(--font-${cssVarName});\n`
            
            // Добавляем дополнительные свойства, если они есть
            if (font.pitch === 'fixed') {
                css += '  font-variant-numeric: tabular-nums;\n'
            }
            
            css += '}\n\n'
        }
        
        return css
    }
    
    /**
     * Создает значение для свойства font-family
     * @param font - Объект шрифта
     * @returns Значение для свойства font-family
     */
    private createFontFamilyValue(font: IFont): string {
        const fontNames = [font.name]
        
        // Добавляем альтернативное имя, если оно есть
        if (font.altName) {
            fontNames.push(font.altName)
        }
        
        // Добавляем общие шрифты в зависимости от семейства
        if (font.family) {
            switch (font.family) {
                case 'roman':
                    fontNames.push('Times New Roman', 'serif')
                    break
                case 'swiss':
                    fontNames.push('Arial', 'Helvetica', 'sans-serif')
                    break
                case 'modern':
                    fontNames.push('Courier New', 'monospace')
                    break
                case 'script':
                    fontNames.push('cursive')
                    break
                case 'decorative':
                    fontNames.push('fantasy')
                    break
            }
        } else {
            // Если семейство не указано, добавляем общие запасные шрифты
            fontNames.push('sans-serif')
        }
        
        // Формируем значение для свойства font-family
        return fontNames.map(name => {
            // Если имя содержит пробелы, заключаем его в кавычки
            return name.includes(' ') ? `"${name}"` : name
        }).join(', ')
    }
    
    /**
     * Создает имя CSS-переменной для шрифта
     * @param fontName - Имя шрифта
     * @returns Имя CSS-переменной
     */
    private createCssVariableName(fontName: string): string {
        return fontName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
    }
    
    /**
     * Создает имя CSS-класса для шрифта
     * @param fontName - Имя шрифта
     * @returns Имя CSS-класса
     */
    private createCssClassName(fontName: string): string {
        return this.createCssVariableName(fontName)
    }
    
    /**
     * Преобразует объект шрифта в объект WmlFont
     * @param font - Объект шрифта
     * @returns Объект WmlFont
     */
    public toWmlFont(font: IFont): WmlFont {
        return {
            name: font.name,
            family: font.family,
            altName: font.altName,
            charset: font.charset,
            pitch: font.pitch
        }
    }
}

/**
 * Создает парсер таблицы шрифтов
 * @returns Экземпляр FontTableParser
 */
export function createFontTableParser(): FontTableParser {
    return new FontTableParser()
}
