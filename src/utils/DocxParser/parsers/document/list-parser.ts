import { BaseParser } from '../../base-parser'
import { DomType, WmlParagraph, WmlRun, WmlText } from '@/types/document'
import { DocumentElementParser } from '@/types/document-parser'
import { PropertiesParser } from '../properties-parser'
import { RunParser } from './run-parser'

/**
 * Парсер нумерованных и маркированных списков DOCX документа.
 * Отвечает за:
 * - Обработку параграфов с нумерацией (w:numPr)
 * - Извлечение свойств нумерации (уровень, ID)
 * - Парсинг содержимого элемента списка
 * - Поддержку многоуровневых списков
 */
export class ListParser extends BaseParser implements DocumentElementParser {
    private runParser: RunParser

    constructor(options = {}) {
        super(options)
        this.runParser = new RunParser(options)
    }

    /**
     * Проверяет, может ли парсер обработать данный элемент
     * @param element - XML элемент для проверки
     * @returns true если элемент является параграфом с нумерацией
     */
    canParse(element: any): boolean {
        return 'w:p' in element && element['w:p']?.['w:pPr']?.['w:numPr']
    }

    /**
     * Парсит XML элемент списка
     * @param element - XML элемент параграфа с нумерацией
     * @returns Структурированное представление элемента списка
     *
     * Возвращает объект WmlParagraph, содержащий свойства:
     * - type: тип элемента (DomType.Paragraph)
     * - content: содержимое элемента списка (массив текстовых прогонов и текстовых узлов)
     * - properties: свойства элемента списка (включая свойства нумерации)
     */
    parse(element: any): WmlParagraph {
        const paragraph = element['w:p']
        const numPr = paragraph['w:pPr']['w:numPr']

        return {
            type: DomType.Paragraph,
            content: this.parseContent(paragraph),
            properties: {
                ...PropertiesParser.parseParagraphProperties(
                    paragraph['w:pPr'],
                ),
                numbering: {
                    id: numPr['w:numId']?.['@_w:val'],
                    level: parseInt(numPr['w:ilvl']?.['@_w:val'] || '0'),
                },
            },
        }
    }

    /**
     * Парсит содержимое элемента списка
     * @param paragraph - XML элемент параграфа
     * @returns Массив текстовых прогонов и текстовых узлов
     */
    private parseContent(paragraph: any): (WmlRun | WmlText)[] {
        const content: (WmlRun | WmlText)[] = []

        if (paragraph['w:r']) {
            const runs = Array.isArray(paragraph['w:r'])
                ? paragraph['w:r']
                : [paragraph['w:r']]

            for (const run of runs) {
                content.push(this.runParser.parse({ 'w:r': run }))
            }
        }

        return content
    }
}
