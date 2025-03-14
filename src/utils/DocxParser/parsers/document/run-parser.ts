import { BaseParser } from '../../base-parser'
import { DomType, WmlRun, WmlText, WmlSymbol, WmlBreak } from '@/types/document'
import { DocumentElementParser } from '@/types/document-parser'
import { PropertiesParser } from '../properties-parser'

/**
 * Парсер текстовых прогонов DOCX документов.
 * Отвечает за:
 * - Обработку элементов w:r (текстовые прогоны)
 * - Извлечение текстового содержимого (w:t)
 * - Обработку специальных символов (w:sym)
 * - Обработку свойств текста (жирный, курсив, подчеркивание и т.д.)
 * - Обработку разрывов страниц и строк (w:br)
 */
export class RunParser extends BaseParser implements DocumentElementParser {
    /**
     * Проверяет, может ли парсер обработать данный элемент
     * @param element - XML элемент для проверки
     * @returns true если элемент является текстовым прогоном (w:r)
     */
    canParse(element: any): boolean {
        return 'w:r' in element
    }

    /**
     * Парсит XML элемент текстового прогона
     * @param element - XML элемент w:r
     * @returns Структурированное представление текстового прогона
     */
    parse(element: any): WmlRun {
        const run = element['w:r']

        // Парсим свойства
        const properties = run['w:rPr']
            ? PropertiesParser.parseRunProperties(run['w:rPr'])
            : {}

        // Проверяем наличие гиперссылки
        if (element['w:hyperlink'] && properties) {
            properties.hyperlink = element['w:hyperlink']['@_r:id']
        }
        
        const content = []

        // Парсим содержимое
        content.push(...this.parseRunContent(run))

        return {
            type: DomType.Run,
            content,
            properties,
        }
    }

    /**
     * Парсит содержимое текстового прогона
     * @param run - XML элемент текстового прогона
     * @returns Массив текстовых узлов и символов
     */
    private parseRunContent(
        run: any,
    ): (WmlText | WmlSymbol | WmlBreak)[] {
        const elements: (WmlText | WmlSymbol | WmlBreak)[] = []
        
        // Обрабатываем разрывы страниц и строк
        const breaks = run['w:br'] || ''
        if (breaks) {
            const breakElements = Array.isArray(breaks) ? breaks : [breaks]

            for (const br of breakElements) {
                if (br['@_w:type'] === 'page') {
                    elements.push(this.createBreakNode('page'))
                } else {
                    elements.push(this.createBreakNode('line'))
                }
            }
        }

        if (run['w:t']) {
            // Проверяем разные варианты хранения текста
            let text = ''
            if (typeof run['w:t'] === 'string') {
                text = run['w:t']
            } else if (run['w:t']?.['#text']) {
                text = run['w:t']['#text']
            } else if (Array.isArray(run['w:t'])) {
                text = run['w:t'].map((t) => t?.['#text'] || '').join('')
            }

            // Обрабатываем пробелы
            if (run['w:t']?.['@_xml:space'] === 'preserve') {
                text = text.replace(/ /g, '\u00A0')
            }

            if (text) {
                elements.push(this.createTextNode(text))
            }
        }

        // Обрабатываем сноски
        if (run['w:footnoteReference']) {
            const id = run['w:footnoteReference']['@_w:id']
            // Создаем текстовый узел с параметрами сноски
            elements.push(this.createTextNode(id, true, id))
        }

        if (run['w:sym']) {
            elements.push(
                this.createSymbolNode(
                    run['w:sym']['@_font'] || '',
                    run['w:sym']['@_char'] || '',
                ),
            )
        }

        if (run['w:drawing']) {
            // TODO: Добавить поддержку drawing элементов
        }

        return elements
    }

    /**
     * Создает текстовый узел
     * @param text - Текст узла
     * @param isFootnoteRef - Является ли ссылкой на сноску
     * @param footnoteId - Идентификатор сноски
     * @returns Текстовый узел
     */
    protected override createTextNode(
        text: string,
        isFootnoteRef?: boolean,
        footnoteId?: string,
    ): WmlText {
        if (isFootnoteRef && footnoteId) {
            return {
                type: DomType.Text,
                text: `${footnoteId}`,
                isFootnoteRef,
                footnoteId,
            }
        }

        return {
            type: DomType.Text,
            text,
            isFootnoteRef,
            footnoteId,
        }
    }

    /**
     * Создает узел специального символа
     * @param font - Шрифт символа
     * @param char - Код символа
     * @returns Узел специального символа
     */
    protected override createSymbolNode(font: string, char: string): WmlSymbol {
        return {
            type: DomType.Symbol,
            font,
            char,
        }
    }

    /**
     * Создает узел разрыва страницы или строки
     * @param breakType - Тип разрыва: page, line или column
     * @returns Узел разрыва
     */
    protected createBreakNode(
        breakType: 'page' | 'line' | 'column' = 'line',
    ): WmlBreak {
        return {
            type: DomType.Break,
            breakType,
        }
    }
}
