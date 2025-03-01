import { BaseParser } from '../../base-parser'
import { DomType, WmlParagraph, WmlRun, WmlText } from '@/types/document'
import { DocumentElementParser } from '@/types/document-parser'
import { PropertiesParser } from '../properties-parser'
import { RunParser } from './run-parser'

/**
 * Парсер параграфов DOCX документов.
 * Отвечает за:
 * - Обработку элементов w:p
 * - Извлечение свойств параграфа (стиль, выравнивание, отступы и т.д.)
 * - Парсинг содержимого параграфа (текстовые прогоны)
 * - Обработку нумерации и маркированных списков
 */
export class ParagraphParser
    extends BaseParser
    implements DocumentElementParser
{
    private runParser: RunParser

    constructor(options = {}) {
        super(options)
        this.runParser = new RunParser(options)
    }

    /**
     * Проверяет, может ли парсер обработать данный элемент
     * @param element - XML элемент для проверки
     * @returns true если элемент является параграфом (w:p)
     */
    canParse(element: any): boolean {
        return 'w:p' in element || element['w:pPr'] || element['w:r']
    }

    /**
     * Парсит XML элемент параграфа
     * @param element - XML элемент w:p
     * @returns Структурированное представление параграфа
     * @description Возвращает объект, содержащий свойства параграфа и его содержимое.
     * Содержимое параграфа представлено в виде массива текстовых прогонов и текстовых узлов.
     */
    parse(element: any): WmlParagraph {
        const paragraph = 'w:p' in element ? element['w:p'] : element
        const properties = paragraph['w:pPr']
            ? PropertiesParser.parseParagraphProperties(paragraph['w:pPr'])
            : {}
        const content = this.parseContent(paragraph)

        // Парсим нумерацию
        const numPr = paragraph['w:pPr']?.['w:numPr']
        let numbering = undefined

        if (numPr) {
            // Получаем numId из разных возможных источников
            let numId =
                numPr['w:numId']?.['@_w:val'] || // Из атрибута val
                numPr['w:numId']?._text || // Из текстового содержимого
                numPr['w:numId']?.['#text'] || // Из текстового узла
                numPr['w:numId'] // Напрямую из значения

            // Преобразуем numId в строку
            if (numId !== undefined && numId !== null) {
                numId = String(numId)
            }

            // Получаем уровень из разных источников
            let levelStr =
                numPr['w:ilvl']?.['@_w:val'] || // Из атрибута val
                numPr['w:ilvl']?._text || // Из текстового содержимого
                numPr['w:ilvl']?.['#text'] || // Из текстового узла
                numPr['w:ilvl'] // Напрямую из значения

            // Преобразуем уровень в число
            let level = 0 // По умолчанию 0-й уровень
            if (levelStr !== undefined && levelStr !== null) {
                const parsed = parseInt(String(levelStr), 10)
                if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0) {
                    level = parsed
                }
            }

            // Если есть numId, создаем объект нумерации
            if (numId) {
                numbering = {
                    id: String(numId),
                    level: level
                }
            }
        }

        // Нормализуем paraId
        let paraId = paragraph['@_w14:paraId']

        if (paraId !== undefined && paraId !== null) {
            // Если строка, пытаемся получить число
            if (typeof paraId === 'string') {
                paraId = paraId.replace(/[^0-9]/g, '')
                paraId = parseInt(paraId, 10)
            }

            // Если число, проверяем на NaN и Infinity
            if (typeof paraId === 'number' && (isNaN(paraId) || !isFinite(paraId))) {
                paraId = null
            } else if (typeof paraId !== 'number') {
                paraId = null
            }
            paraId = undefined
        }

        return {
            type: DomType.Paragraph,
            content,
            properties,
            style: properties?.styleId ? { id: properties.styleId } : undefined,
            numbering,
            paraId,
            formatting: this.extractFormatting(paragraph['w:pPr']),
        }
    }

    /**
     * Извлекает дополнительные свойства форматирования из параграфа
     * @param pPr - Свойства параграфа
     * @returns Объект с дополнительными свойствами форматирования
     */
    private extractFormatting(pPr: any): Record<string, any> {
        if (!pPr) return {}

        const formatting: Record<string, any> = {}

        // Извлекаем выравнивание
        if (pPr['w:jc']) {
            const alignment = pPr['w:jc']['@_w:val'] || pPr['w:jc']
            if (alignment) {
                formatting.alignment = String(alignment)
            }
        }

        // Извлекаем отступы
        if (pPr['w:ind']) {
            const indent = pPr['w:ind']
            formatting.indent = {
                left: indent['@_w:left'] || indent['@_w:start'] || 0,
                right: indent['@_w:right'] || indent['@_w:end'] || 0,
                firstLine: indent['@_w:firstLine'] || 0,
                hanging: indent['@_w:hanging'] || 0,
            }
        }

        // Извлекаем межстрочный интервал
        if (pPr['w:spacing']) {
            const spacing = pPr['w:spacing']
            formatting.spacing = {
                before: spacing['@_w:before'] || 0,
                after: spacing['@_w:after'] || 0,
                line: spacing['@_w:line'] || 240, // По умолчанию 1.0
                lineRule: spacing['@_w:lineRule'] || 'auto',
            }
        }

        // Извлекаем границы
        if (pPr['w:pBdr']) {
            const borders = pPr['w:pBdr']
            formatting.borders = {}
            
            const sides = ['top', 'left', 'bottom', 'right']
            for (const side of sides) {
                const key = `w:${side}`
                if (borders[key]) {
                    formatting.borders[side] = {
                        style: borders[key]['@_w:val'] || 'single',
                        size: borders[key]['@_w:sz'] || 4,
                        color: borders[key]['@_w:color'] || 'auto',
                    }
                }
            }
        }

        // Извлекаем фон
        if (pPr['w:shd']) {
            const shading = pPr['w:shd']
            formatting.shading = {
                fill: shading['@_w:fill'] || 'auto',
                color: shading['@_w:color'] || 'auto',
                value: shading['@_w:val'] || 'clear',
            }
        }

        return formatting
    }

    /**
     * Парсит содержимое параграфа
     * @param paragraph - XML элемент параграфа
     * @returns Массив текстовых прогонов и текстовых узлов
     */
    private parseContent(paragraph: any): (WmlRun | WmlText)[] {
        const content: (WmlRun | WmlText)[] = []
        
        if (paragraph['w:r']) {
            const runs = Array.isArray(paragraph['w:r'])
                ? paragraph['w:r']
                : [paragraph['w:r']]

            // Собираем все прогоны с одинаковыми свойствами
            let currentRun = null
            let currentProperties = null

            for (const run of runs) {
                const parsedRun = this.runParser.parse({ 'w:r': run })

                // Если свойства совпадают с предыдущим прогоном, объединяем содержимое
                if (
                    currentRun &&
                    this.arePropertiesEqual(
                        currentProperties,
                        parsedRun.properties,
                    )
                ) {
                    currentRun.content.push(...parsedRun.content)
                } else {
                    if (currentRun) {
                        content.push(currentRun)
                    }
                    currentRun = parsedRun
                    currentProperties = parsedRun.properties
                }
            }

            // Добавляем последний прогон
            if (currentRun) {
                content.push(currentRun)
            }
        }

        return content
    }

    /**
     * Сравнивает свойства двух прогонов
     */
    private arePropertiesEqual(props1: any, props2: any): boolean {
        if (!props1 || !props2) return props1 === props2

        // Сравниваем только важные свойства форматирования
        const relevantProps = [
            'italic',
            'bold',
            'underline',
            'strike',
            'vertAlign',
            'color',
        ]
        return relevantProps.every((prop) => props1[prop] === props2[prop])
    }
}
