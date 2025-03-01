import { IDomStyle } from '@/types/document'

/**
 * Интерфейс для цветовой схемы темы документа
 */
export interface IThemeColors {
    [key: string]: string
}

/**
 * Интерфейс для схемы шрифтов темы документа
 */
export interface IThemeFonts {
    majorFont?: {
        latinTypeface: string
        eastAsianTypeface?: string
        complexScriptTypeface?: string
    }
    minorFont?: {
        latinTypeface: string
        eastAsianTypeface?: string
        complexScriptTypeface?: string
    }
}

/**
 * Интерфейс для темы документа
 */
export interface IDocumentTheme {
    colorScheme?: IThemeColors
    fontScheme?: IThemeFonts
    name?: string
}

/**
 * Класс для обработки стилей документа
 * Обеспечивает наследование стилей и применение тем
 */
export class StylesProcessor {
    private styles: IDomStyle[] = []
    private theme: IDocumentTheme = {}
    private stylesMap: Record<string, IDomStyle> = {}
    
    /**
     * Конструктор StylesProcessor
     * @param styles - Массив стилей документа
     * @param theme - Тема документа
     */
    constructor(styles: IDomStyle[] = [], theme: IDocumentTheme = {}) {
        this.styles = styles
        this.theme = theme
        this.processStyles()
    }
    
    /**
     * Устанавливает стили документа
     * @param styles - Массив стилей документа
     */
    public setStyles(styles: IDomStyle[]): void {
        this.styles = styles
        this.processStyles()
    }
    
    /**
     * Устанавливает тему документа
     * @param theme - Тема документа
     */
    public setTheme(theme: IDocumentTheme): void {
        this.theme = theme
        this.processStyles()
    }
    
    /**
     * Получает стиль по его идентификатору
     * @param styleId - Идентификатор стиля
     * @returns Стиль документа или undefined, если стиль не найден
     */
    public getStyle(styleId: string): IDomStyle | undefined {
        return this.stylesMap[styleId]
    }
    
    /**
     * Получает все стили документа
     * @returns Массив всех стилей документа
     */
    public getAllStyles(): IDomStyle[] {
        return this.styles
    }
    
    /**
     * Получает тему документа
     * @returns Тема документа
     */
    public getTheme(): IDocumentTheme {
        return this.theme
    }
    
    /**
     * Обрабатывает стили документа, применяя наследование
     */
    private processStyles(): void {
        // Создаем карту стилей для быстрого доступа
        this.stylesMap = this.styles
            .filter(style => style.id != null)
            .reduce((map, style) => {
                map[style.id!] = style
                return map
            }, {} as Record<string, IDomStyle>)
        
        // Применяем наследование стилей
        for (const style of this.styles.filter((x: IDomStyle) => x.basedOn)) {
            const baseStyle = this.stylesMap[style.basedOn!]
            
            if (baseStyle) {
                // Наследуем свойства параграфа
                if (baseStyle.paragraphProps && style.paragraphProps) {
                    style.paragraphProps = this.mergeDeep(
                        { ...baseStyle.paragraphProps }, 
                        style.paragraphProps
                    )
                } else if (baseStyle.paragraphProps) {
                    style.paragraphProps = { ...baseStyle.paragraphProps }
                }
                
                // Наследуем свойства текстового прогона
                if (baseStyle.runProps && style.runProps) {
                    style.runProps = this.mergeDeep(
                        { ...baseStyle.runProps }, 
                        style.runProps
                    )
                } else if (baseStyle.runProps) {
                    style.runProps = { ...baseStyle.runProps }
                }
                
                // Наследуем стили
                if (baseStyle.styles && baseStyle.styles.length > 0) {
                    for (const baseValues of baseStyle.styles) {
                        const styleValues = style.styles?.find((x) => x.target === baseValues.target)
                        
                        if (styleValues && styleValues.values && baseValues.values) {
                            this.copyStyleProperties(baseValues.values, styleValues.values)
                        } else if (style.styles && baseValues.values) {
                            style.styles.push({ 
                                target: baseValues.target, 
                                values: { ...baseValues.values } 
                            })
                        } else if (baseValues.values) {
                            style.styles = [{ 
                                target: baseValues.target, 
                                values: { ...baseValues.values } 
                            }]
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Копирует свойства стилей из исходного объекта в целевой
     * @param source - Исходный объект со свойствами стилей
     * @param target - Целевой объект для копирования свойств
     */
    private copyStyleProperties(source: Record<string, string | number>, target: Record<string, string | number>): void {
        for (const [key, value] of Object.entries(source)) {
            if (target[key] === undefined) {
                target[key] = value
            }
        }
    }
    
    /**
     * Глубокое слияние объектов
     * @param target - Целевой объект
     * @param source - Исходный объект
     * @returns Результат слияния объектов
     */
    private mergeDeep(target: any, source: any): any {
        if (!source) return target
        
        const result = { ...target }
        
        for (const key in source) {
            if (source[key] === null || source[key] === undefined) {
                continue
            }
            
            if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (typeof target[key] === 'object' && !Array.isArray(target[key])) {
                    result[key] = this.mergeDeep(target[key], source[key])
                } else {
                    result[key] = { ...source[key] }
                }
            } else if (Array.isArray(source[key])) {
                if (Array.isArray(target[key])) {
                    result[key] = [...target[key], ...source[key]]
                } else {
                    result[key] = [...source[key]]
                }
            } else {
                result[key] = source[key]
            }
        }
        
        return result
    }
    
    /**
     * Генерирует CSS переменные для темы документа
     * @returns Объект с CSS переменными
     */
    public generateThemeVariables(): Record<string, string> {
        const variables: Record<string, string> = {}
        const fontScheme = this.theme.fontScheme
        
        if (fontScheme) {
            if (fontScheme.majorFont) {
                variables['--docx-majorHAnsi-font'] = fontScheme.majorFont.latinTypeface
            }
            
            if (fontScheme.minorFont) {
                variables['--docx-minorHAnsi-font'] = fontScheme.minorFont.latinTypeface
            }
        }
        
        const colorScheme = this.theme.colorScheme
        
        if (colorScheme) {
            for (const [key, value] of Object.entries(colorScheme)) {
                variables[`--docx-${key}-color`] = `#${value}`
            }
        }
        
        return variables
    }
    
    /**
     * Применяет CSS переменные темы к элементу
     * @param element - HTML элемент для применения переменных
     */
    public applyThemeVariablesToElement(element: HTMLElement): void {
        const variables = this.generateThemeVariables()
        
        for (const [key, value] of Object.entries(variables)) {
            element.style.setProperty(key, value)
        }
    }
}

/**
 * Создает процессор стилей
 * @param styles - Массив стилей документа
 * @param theme - Тема документа
 * @returns Экземпляр StylesProcessor
 */
export function createStylesProcessor(
    styles: IDomStyle[] = [], 
    theme: IDocumentTheme = {}
): StylesProcessor {
    return new StylesProcessor(styles, theme)
}
