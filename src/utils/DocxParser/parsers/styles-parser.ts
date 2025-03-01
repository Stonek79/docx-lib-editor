import { BaseParser } from '../base-parser'
import { DocxStyle } from '@/types/docx-properties'
import { PropertiesParser } from './properties-parser'

/**
 * Парсер стилей DOCX документов.
 * Отвечает за извлечение и обработку стилей из файла styles.xml.
 *
 * Основные возможности:
 * - Извлечение стилей параграфов и текста
 * - Обработка наследования стилей через basedOn
 * - Поддержка связанных стилей через link
 * - Обработка цепочек стилей через next
 * - Определение стилей по умолчанию
 *
 * @example
 * Пример стиля в DOCX:
 * <w:style w:type="paragraph" w:styleId="Heading1">
 *   <w:name w:val="heading 1"/>
 *   <w:basedOn w:val="Normal"/>
 *   <w:next w:val="Normal"/>
 *   <w:pPr>...</w:pPr>
 *   <w:rPr>...</w:rPr>
 * </w:style>
 */
export class StylesParser extends BaseParser {
    private styles: Map<string, DocxStyle> = new Map()

    /**
     * Парсит XML содержимое стилей
     * @param xmlContent - XML содержимое файла styles.xml
     * @returns Map стилей, где ключ - это id стиля
     *
     * Каждый стиль содержит:
     * - id: уникальный идентификатор стиля
     * - name: отображаемое имя стиля
     * - target: тип стиля (paragraph, character, table, numbering)
     * - basedOn: id базового стиля, от которого наследуются свойства
     * - isDefault: является ли стиль стилем по умолчанию
     * - linked: id связанного стиля (например, для paragraph -> character)
     * - next: id стиля, который будет применен к следующему параграфу
     * - styles: массив дополнительных стилей
     * - paragraphProps: свойства параграфа
     * - runProps: свойства текстового прогона
     */
    async parse(xmlContent: string): Promise<Map<string, DocxStyle>> {
        const styles = this.xmlParser.parse(xmlContent)
        const styleElements = styles?.['w:styles']?.['w:style']

        if (!styleElements) return this.styles

        // Преобразуем в массив, если получили один элемент
        const styleArray = Array.isArray(styleElements)
            ? styleElements
            : [styleElements]

        for (const style of styleArray) {
            const styleId = style['@_w:styleId']
            if (!styleId) continue

            const domStyle: DocxStyle = {
                id: styleId,
                name: style['w:name']?.['@_w:val'],
                target: style['@_w:type'],
                basedOn: style['w:basedOn']?.['@_w:val'],
                isDefault: style['@_w:default'] === '1',
                linked: style['w:link']?.['@_w:val'],
                next: style['w:next']?.['@_w:val'],
                styles: [],
                paragraphProps: PropertiesParser.parseParagraphProperties(
                    style['w:pPr'],
                ),
                runProps: PropertiesParser.parseRunProperties(style['w:rPr']),
            }

            this.styles.set(styleId, domStyle)
        }

        return this.styles
    }

    /**
     * Возвращает inline CSS-стили для данного styleId, объединяя свойства параграфа и текста.
     */
    getStyle(styleId: string): string {
        const style = this.styles.get(styleId);
        if (!style) return '';
        const paragraphCss = this.buildCssFromParagraphProps(style.paragraphProps);
        const runCss = this.buildCssFromRunProps(style.runProps);
        return paragraphCss + runCss;
    }

    /**
     * Преобразует свойства параграфа в строку CSS.
     */
    private buildCssFromParagraphProps(props: any): string {
        if (!props) return '';
        let css = '';
        // Обработка выравнивания
        if (props['w:jc'] && props['w:jc']['@_w:val']) {
            css += `text-align: ${props['w:jc']['@_w:val']}; `;
        }
        // Обработка отступов
        if (props['w:ind']) {
            if (props['w:ind']['@_w:left']) {
                css += `margin-left: ${props['w:ind']['@_w:left']}pt; `;
            }
            if (props['w:ind']['@_w:right']) {
                css += `margin-right: ${props['w:ind']['@_w:right']}pt; `;
            }
        }
        // Дополнительная обработка свойств параграфа...
        return css;
    }

    /**
     * Преобразует свойства текста (run) в строку CSS.
     */
    private buildCssFromRunProps(props: any): string {
        if (!props) return '';
        let css = '';
        // Обработка размера шрифта
        if (props['w:sz'] && props['w:sz']['@_w:val']) {
            const fontSize = Number(props['w:sz']['@_w:val']) / 2; // значение обычно в полпунктах
            css += `font-size: ${fontSize}pt; `;
        }
        // Обработка цвета текста
        if (props['w:color'] && props['w:color']['@_w:val']) {
            css += `color: #${props['w:color']['@_w:val']}; `;
        }
        // Дополнительная обработка свойств текста...
        return css;
    }
}
