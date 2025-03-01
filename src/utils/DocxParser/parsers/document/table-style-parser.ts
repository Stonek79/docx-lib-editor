import { BaseParser } from '../../base-parser'
import { IDomSubStyle } from '@/types/document'

/**
 * Тип части таблицы для стилизации
 */
export enum TableStyleType {
    WHOLE_TABLE = 'wholeTable',
    FIRST_ROW = 'firstRow',
    LAST_ROW = 'lastRow',
    FIRST_COLUMN = 'firstColumn',
    LAST_COLUMN = 'lastColumn',
    ODD_ROW = 'oddRow',
    EVEN_ROW = 'evenRow',
    ODD_COLUMN = 'oddColumn',
    EVEN_COLUMN = 'evenColumn',
    TOP_LEFT_CELL = 'topLeftCell',
    TOP_RIGHT_CELL = 'topRightCell',
    BOTTOM_LEFT_CELL = 'bottomLeftCell',
    BOTTOM_RIGHT_CELL = 'bottomRightCell'
}

/**
 * Интерфейс для стиля таблицы
 */
export interface ITableStyle {
    id: string
    name?: string
    basedOn?: string
    subStyles: Record<TableStyleType, IDomSubStyle[]>
    default?: boolean
}

/**
 * Парсер стилей таблиц
 * Извлекает информацию о стилях таблиц из документов
 */
export class TableStyleParser extends BaseParser {
    /**
     * Парсит стили таблиц из файла styles.xml
     * @returns Массив стилей таблиц
     */
    public async parseTableStyles(): Promise<ITableStyle[]> {
        try {
            const stylesPath = 'word/styles.xml'
            const stylesXml = await this.loadXmlFile(stylesPath)
            
            if (!stylesXml || !stylesXml.styles) {
                return []
            }
            
            const tableStyles = stylesXml.styles.tblStyleLst?.tblStyle || []
            
            // Если есть только один стиль таблицы, преобразуем его в массив
            const tableStylesArray = Array.isArray(tableStyles) ? tableStyles : [tableStyles]
            
            return tableStylesArray
                .filter(style => style)
                .map(style => this.parseTableStyle(style))
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse table styles:', error)
            }
            return []
        }
    }
    
    /**
     * Парсит отдельный стиль таблицы
     * @param styleNode - XML узел стиля таблицы
     * @returns Объект стиля таблицы
     */
    private parseTableStyle(styleNode: any): ITableStyle {
        const id = styleNode['@_styleId'] || ''
        const name = styleNode['@_name']
        const basedOn = styleNode.basedOn?.['@_val']
        const isDefault = styleNode['@_default'] === '1'
        
        // Инициализируем подстили для всех типов частей таблицы
        const subStyles: Record<TableStyleType, IDomSubStyle[]> = {
            [TableStyleType.WHOLE_TABLE]: [],
            [TableStyleType.FIRST_ROW]: [],
            [TableStyleType.LAST_ROW]: [],
            [TableStyleType.FIRST_COLUMN]: [],
            [TableStyleType.LAST_COLUMN]: [],
            [TableStyleType.ODD_ROW]: [],
            [TableStyleType.EVEN_ROW]: [],
            [TableStyleType.ODD_COLUMN]: [],
            [TableStyleType.EVEN_COLUMN]: [],
            [TableStyleType.TOP_LEFT_CELL]: [],
            [TableStyleType.TOP_RIGHT_CELL]: [],
            [TableStyleType.BOTTOM_LEFT_CELL]: [],
            [TableStyleType.BOTTOM_RIGHT_CELL]: []
        }
        
        // Парсим подстили для разных частей таблицы
        if (styleNode.tblStylePr) {
            const tblStylePrs = Array.isArray(styleNode.tblStylePr) 
                ? styleNode.tblStylePr 
                : [styleNode.tblStylePr]
            
            for (const tblStylePr of tblStylePrs) {
                const type = tblStylePr['@_type']
                const styleType = this.mapStyleType(type)
                
                if (styleType) {
                    const domSubStyles = this.parseTableStyleProperties(tblStylePr)
                    subStyles[styleType].push(...domSubStyles)
                }
            }
        }
        
        return {
            id,
            name,
            basedOn,
            subStyles,
            default: isDefault
        }
    }
    
    /**
     * Преобразует тип стиля из XML в TableStyleType
     * @param xmlType - Тип стиля из XML
     * @returns Соответствующий TableStyleType или undefined
     */
    private mapStyleType(xmlType: string): TableStyleType | undefined {
        const mapping: Record<string, TableStyleType> = {
            'wholeTbl': TableStyleType.WHOLE_TABLE,
            'firstRow': TableStyleType.FIRST_ROW,
            'lastRow': TableStyleType.LAST_ROW,
            'firstCol': TableStyleType.FIRST_COLUMN,
            'lastCol': TableStyleType.LAST_COLUMN,
            'band1Horz': TableStyleType.ODD_ROW,
            'band2Horz': TableStyleType.EVEN_ROW,
            'band1Vert': TableStyleType.ODD_COLUMN,
            'band2Vert': TableStyleType.EVEN_COLUMN,
            'nwCell': TableStyleType.TOP_LEFT_CELL,
            'neCell': TableStyleType.TOP_RIGHT_CELL,
            'swCell': TableStyleType.BOTTOM_LEFT_CELL,
            'seCell': TableStyleType.BOTTOM_RIGHT_CELL
        }
        
        return mapping[xmlType]
    }
    
    /**
     * Парсит свойства стиля таблицы
     * @param tblStylePr - XML узел свойств стиля таблицы
     * @returns Массив подстилей
     */
    private parseTableStyleProperties(tblStylePr: any): IDomSubStyle[] {
        const result: IDomSubStyle[] = []
        const type = tblStylePr['@_type']
        
        // Определяем CSS селектор и модификатор класса в зависимости от типа
        const { selector, modifier } = this.getSelectorAndModifier(type)
        
        // Парсим свойства ячейки
        if (tblStylePr.tcPr) {
            const cellStyle = this.parseCellProperties(tblStylePr.tcPr)
            if (Object.keys(cellStyle.styles || {}).length > 0) {
                result.push({
                    target: `${selector} td${modifier}`,
                    styles: cellStyle.styles
                })
            }
        }
        
        // Парсим свойства параграфа
        if (tblStylePr.pPr) {
            const paragraphStyle = this.parseParagraphProperties(tblStylePr.pPr)
            if (Object.keys(paragraphStyle.styles || {}).length > 0) {
                result.push({
                    target: `${selector} td${modifier} p`,
                    styles: paragraphStyle.styles
                })
            }
        }
        
        // Парсим свойства текстового прогона
        if (tblStylePr.rPr) {
            const runStyle = this.parseRunProperties(tblStylePr.rPr)
            if (Object.keys(runStyle.styles || {}).length > 0) {
                result.push({
                    target: `${selector} td${modifier} span`,
                    styles: runStyle.styles
                })
            }
        }
        
        return result
    }
    
    /**
     * Получает CSS селектор и модификатор класса для типа стиля таблицы
     * @param type - Тип стиля таблицы из XML
     * @returns Объект с селектором и модификатором
     */
    private getSelectorAndModifier(type: string): { selector: string; modifier: string } {
        switch (type) {
            case 'firstRow':
                return { 
                    selector: 'table tr.first-row', 
                    modifier: '.first-row' 
                }
            case 'lastRow':
                return { 
                    selector: 'table tr.last-row', 
                    modifier: '.last-row' 
                }
            case 'firstCol':
                return { 
                    selector: 'table td.first-col', 
                    modifier: '.first-col' 
                }
            case 'lastCol':
                return { 
                    selector: 'table td.last-col', 
                    modifier: '.last-col' 
                }
            case 'band1Horz':
                return { 
                    selector: 'table tr.odd-row', 
                    modifier: '.odd-row' 
                }
            case 'band2Horz':
                return { 
                    selector: 'table tr.even-row', 
                    modifier: '.even-row' 
                }
            case 'band1Vert':
                return { 
                    selector: 'table td.odd-col', 
                    modifier: '.odd-col' 
                }
            case 'band2Vert':
                return { 
                    selector: 'table td.even-col', 
                    modifier: '.even-col' 
                }
            case 'nwCell':
                return { 
                    selector: 'table tr.first-row td.first-col', 
                    modifier: '.first-row.first-col' 
                }
            case 'neCell':
                return { 
                    selector: 'table tr.first-row td.last-col', 
                    modifier: '.first-row.last-col' 
                }
            case 'swCell':
                return { 
                    selector: 'table tr.last-row td.first-col', 
                    modifier: '.last-row.first-col' 
                }
            case 'seCell':
                return { 
                    selector: 'table tr.last-row td.last-col', 
                    modifier: '.last-row.last-col' 
                }
            default:
                return { 
                    selector: 'table', 
                    modifier: '' 
                }
        }
    }
    
    /**
     * Парсит свойства ячейки таблицы
     * @param tcPr - XML узел свойств ячейки
     * @returns Объект подстиля
     */
    private parseCellProperties(tcPr: any): IDomSubStyle {
        const styles: Record<string, string> = {}
        
        // Парсим цвет фона
        if (tcPr.shd && tcPr.shd['@_fill']) {
            const fill = tcPr.shd['@_fill']
            if (fill !== 'auto' && fill !== '000000') {
                styles['background-color'] = `#${fill}`
            }
        }
        
        // Парсим границы
        if (tcPr.tcBorders) {
            const borders = tcPr.tcBorders
            
            // Верхняя граница
            if (borders.top) {
                const color = borders.top['@_color'] || '000000'
                const size = parseInt(borders.top['@_sz'] || '0') / 8
                styles['border-top'] = `${size}px solid #${color}`
            }
            
            // Нижняя граница
            if (borders.bottom) {
                const color = borders.bottom['@_color'] || '000000'
                const size = parseInt(borders.bottom['@_sz'] || '0') / 8
                styles['border-bottom'] = `${size}px solid #${color}`
            }
            
            // Левая граница
            if (borders.left) {
                const color = borders.left['@_color'] || '000000'
                const size = parseInt(borders.left['@_sz'] || '0') / 8
                styles['border-left'] = `${size}px solid #${color}`
            }
            
            // Правая граница
            if (borders.right) {
                const color = borders.right['@_color'] || '000000'
                const size = parseInt(borders.right['@_sz'] || '0') / 8
                styles['border-right'] = `${size}px solid #${color}`
            }
        }
        
        // Парсим вертикальное выравнивание
        if (tcPr.vAlign) {
            const vAlign = tcPr.vAlign['@_val']
            switch (vAlign) {
                case 'top':
                    styles['vertical-align'] = 'top'
                    break
                case 'center':
                    styles['vertical-align'] = 'middle'
                    break
                case 'bottom':
                    styles['vertical-align'] = 'bottom'
                    break
            }
        }
        
        return { target: '', styles }
    }
    
    /**
     * Парсит свойства параграфа
     * @param pPr - XML узел свойств параграфа
     * @returns Объект подстиля
     */
    private parseParagraphProperties(pPr: any): IDomSubStyle {
        const styles: Record<string, string> = {}
        
        // Парсим выравнивание текста
        if (pPr.jc) {
            const alignment = pPr.jc['@_val']
            switch (alignment) {
                case 'left':
                    styles['text-align'] = 'left'
                    break
                case 'center':
                    styles['text-align'] = 'center'
                    break
                case 'right':
                    styles['text-align'] = 'right'
                    break
                case 'both':
                case 'distribute':
                    styles['text-align'] = 'justify'
                    break
            }
        }
        
        // Парсим отступы
        if (pPr.ind) {
            // Отступ слева
            if (pPr.ind['@_left']) {
                const left = parseInt(pPr.ind['@_left']) / 20
                styles['padding-left'] = `${left}pt`
            }
            
            // Отступ справа
            if (pPr.ind['@_right']) {
                const right = parseInt(pPr.ind['@_right']) / 20
                styles['padding-right'] = `${right}pt`
            }
            
            // Отступ первой строки
            if (pPr.ind['@_firstLine']) {
                const firstLine = parseInt(pPr.ind['@_firstLine']) / 20
                styles['text-indent'] = `${firstLine}pt`
            }
        }
        
        // Парсим интервалы
        if (pPr.spacing) {
            // Интервал перед параграфом
            if (pPr.spacing['@_before']) {
                const before = parseInt(pPr.spacing['@_before']) / 20
                styles['margin-top'] = `${before}pt`
            }
            
            // Интервал после параграфа
            if (pPr.spacing['@_after']) {
                const after = parseInt(pPr.spacing['@_after']) / 20
                styles['margin-bottom'] = `${after}pt`
            }
            
            // Межстрочный интервал
            if (pPr.spacing['@_line']) {
                const line = parseInt(pPr.spacing['@_line']) / 240
                styles['line-height'] = `${line}`
            }
        }
        
        return { target: '', styles }
    }
    
    /**
     * Парсит свойства текстового прогона
     * @param rPr - XML узел свойств текстового прогона
     * @returns Объект подстиля
     */
    private parseRunProperties(rPr: any): IDomSubStyle {
        const styles: Record<string, string> = {}
        
        // Парсим жирный шрифт
        if (rPr.b) {
            styles['font-weight'] = 'bold'
        }
        
        // Парсим курсив
        if (rPr.i) {
            styles['font-style'] = 'italic'
        }
        
        // Парсим подчеркивание
        if (rPr.u) {
            styles['text-decoration'] = 'underline'
        }
        
        // Парсим зачеркивание
        if (rPr.strike) {
            styles['text-decoration'] = styles['text-decoration'] 
                ? `${styles['text-decoration']} line-through` 
                : 'line-through'
        }
        
        // Парсим цвет текста
        if (rPr.color && rPr.color['@_val']) {
            const color = rPr.color['@_val']
            if (color !== 'auto') {
                styles['color'] = `#${color}`
            }
        }
        
        // Парсим размер шрифта
        if (rPr.sz && rPr.sz['@_val']) {
            const size = parseInt(rPr.sz['@_val']) / 2
            styles['font-size'] = `${size}pt`
        }
        
        // Парсим шрифт
        if (rPr.rFonts) {
            const font = rPr.rFonts['@_ascii'] || rPr.rFonts['@_hAnsi']
            if (font) {
                styles['font-family'] = `"${font}", sans-serif`
            }
        }
        
        return { target: '', styles }
    }
}

/**
 * Создает парсер стилей таблиц
 * @returns Экземпляр TableStyleParser
 */
export function createTableStyleParser(): TableStyleParser {
    return new TableStyleParser()
}
