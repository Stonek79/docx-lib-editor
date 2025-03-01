import { BaseParser } from '../../base-parser'
import { IDocumentTheme, IThemeColors, IThemeFonts } from './styles-processor'

/**
 * Парсер тем документа
 * Извлекает информацию о цветовой схеме и шрифтах из темы документа
 */
export class ThemeParser extends BaseParser {
    /**
     * Парсит тему документа из файла theme1.xml
     * @returns Объект с информацией о теме документа
     */
    public async parseTheme(): Promise<IDocumentTheme> {
        try {
            const themePath = 'word/theme/theme1.xml'
            const themeXml = await this.loadXmlFile(themePath)
            
            if (!themeXml) {
                return {}
            }
            
            // Извлекаем название темы
            const name = this.extractThemeName(themeXml)
            
            // Извлекаем цветовую схему
            const colorScheme = this.extractColorScheme(themeXml)
            
            // Извлекаем схему шрифтов
            const fontScheme = this.extractFontScheme(themeXml)
            
            return {
                name,
                colorScheme,
                fontScheme
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse theme:', error)
            }
            return {}
        }
    }
    
    /**
     * Извлекает название темы из XML
     * @param themeXml - XML темы документа
     * @returns Название темы или undefined
     */
    private extractThemeName(themeXml: any): string | undefined {
        try {
            const themeElement = this.findElement(themeXml, 'a:theme')
            return themeElement?.['@_name']
        } catch (error) {
            return undefined
        }
    }
    
    /**
     * Извлекает цветовую схему из XML
     * @param themeXml - XML темы документа
     * @returns Объект с цветовой схемой
     */
    private extractColorScheme(themeXml: any): IThemeColors {
        const colors: IThemeColors = {}
        
        try {
            const themeElement = this.findElement(themeXml, 'a:theme')
            const colorScheme = this.findElement(themeElement, 'a:themeElements')?.['a:clrScheme']
            
            if (!colorScheme) {
                return colors
            }
            
            // Извлекаем основные цвета
            const colorElements = [
                'a:dk1', 'a:lt1', 'a:dk2', 'a:lt2', 
                'a:accent1', 'a:accent2', 'a:accent3', 'a:accent4', 
                'a:accent5', 'a:accent6', 'a:hlink', 'a:folHlink'
            ]
            
            for (const colorElement of colorElements) {
                const element = this.findElement(colorScheme, colorElement)
                
                if (element) {
                    const colorName = colorElement.replace('a:', '')
                    const colorValue = this.extractColorValue(element)
                    
                    if (colorValue) {
                        colors[colorName] = colorValue
                    }
                }
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to extract color scheme:', error)
            }
        }
        
        return colors
    }
    
    /**
     * Извлекает значение цвета из элемента
     * @param element - Элемент с цветом
     * @returns Значение цвета в формате HEX без # или undefined
     */
    private extractColorValue(element: any): string | undefined {
        try {
            // Проверяем разные типы цветов
            if (element['a:srgbClr']) {
                return element['a:srgbClr']['@_val']
            } else if (element['a:sysClr']) {
                return element['a:sysClr']['@_lastClr']
            } else if (element['a:schemeClr']) {
                // Для схемных цветов нужна дополнительная обработка
                // В данной реализации возвращаем undefined
                return undefined
            }
        } catch (error) {
            // Игнорируем ошибки
        }
        
        return undefined
    }
    
    /**
     * Извлекает схему шрифтов из XML
     * @param themeXml - XML темы документа
     * @returns Объект со схемой шрифтов
     */
    private extractFontScheme(themeXml: any): IThemeFonts {
        const fontScheme: IThemeFonts = {}
        
        try {
            const themeElement = this.findElement(themeXml, 'a:theme')
            const fontSchemeElement = this.findElement(themeElement, 'a:themeElements')?.['a:fontScheme']
            
            if (!fontSchemeElement) {
                return fontScheme
            }
            
            // Извлекаем основной шрифт
            const majorFont = this.extractFont(fontSchemeElement['a:majorFont'])
            if (majorFont) {
                fontScheme.majorFont = majorFont
            }
            
            // Извлекаем дополнительный шрифт
            const minorFont = this.extractFont(fontSchemeElement['a:minorFont'])
            if (minorFont) {
                fontScheme.minorFont = minorFont
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to extract font scheme:', error)
            }
        }
        
        return fontScheme
    }
    
    /**
     * Извлекает информацию о шрифте из элемента
     * @param fontElement - Элемент с информацией о шрифте
     * @returns Объект с информацией о шрифте или undefined
     */
    private extractFont(fontElement: any): IThemeFonts['majorFont'] | undefined {
        if (!fontElement) {
            return undefined
        }
        
        try {
            return {
                latinTypeface: fontElement['a:latin']?.['@_typeface'] || 'Calibri',
                eastAsianTypeface: fontElement['a:ea']?.['@_typeface'],
                complexScriptTypeface: fontElement['a:cs']?.['@_typeface']
            }
        } catch (error) {
            return undefined
        }
    }
    
    /**
     * Находит элемент в XML по его имени
     * @param xml - XML для поиска
     * @param elementName - Имя элемента
     * @returns Найденный элемент или undefined
     */
    private findElement(xml: any, elementName: string): any {
        if (!xml) {
            return undefined
        }
        
        // Если элемент существует напрямую
        if (xml[elementName]) {
            return xml[elementName]
        }
        
        // Ищем в дочерних элементах
        for (const key in xml) {
            if (typeof xml[key] === 'object' && xml[key] !== null) {
                const result = this.findElement(xml[key], elementName)
                if (result) {
                    return result
                }
            }
        }
        
        return undefined
    }
}

/**
 * Создает парсер тем документа
 * @returns Экземпляр ThemeParser
 */
export function createThemeParser(): ThemeParser {
    return new ThemeParser()
}
