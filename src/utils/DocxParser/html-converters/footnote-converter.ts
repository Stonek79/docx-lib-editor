import { WmlNote, DomType, WmlParagraph } from '@/types/document'
import { ParagraphConverter } from './paragraph-converter'
import { DocxStyle } from '@/types/docx-properties'
import { NumberingDefinition } from '@/types/numbering'

/**
 * Конвертер сносок в HTML
 */
export class FootnoteConverter {
    private paragraphConverter: ParagraphConverter

    constructor() {
        this.paragraphConverter = new ParagraphConverter()
    }

    /**
     * Конвертирует сноски в HTML
     * @param footnotes - Карта сносок
     * @param styles - Стили документа
     * @param numbering - Нумерация документа
     * @returns HTML-код сносок
     */
    convertFootnotesToHtml(
        footnotes: Map<string, WmlNote>,
        styles: Map<string, DocxStyle>,
        numbering: Map<string, NumberingDefinition>,
    ): string {
        if (!footnotes || footnotes.size === 0) return ''

        let html = '<div class="footnotes-container">'
        html += '<hr class="footnotes-separator" />'
        html += '<div class="footnotes-list">'

        // Сортируем сноски по ID (чтобы они шли в правильном порядке)
        const sortedFootnotes = Array.from(footnotes.entries()).sort(
            (a, b) => parseInt(a[0]) - parseInt(b[0]),
        )

        for (const [id, footnote] of sortedFootnotes) {        
            html += `<div class="footnote" id="footnote-${id}">`
            html += `<span class="footnote-number">${id}</span> `

            // Конвертируем содержимое сноски
            for (const element of footnote.content) {
                if (element.type === DomType.Paragraph) {
                    // Приводим элемент к типу WmlParagraph
                    const paragraph = element as WmlParagraph
                    html += this.paragraphConverter.convertParagraphToHtml(
                        paragraph,
                        styles,
                        numbering,
                        new Map(), // Пустые отношения, т.к. они не нужны для сносок
                    )
                }
            }

            html += '</div>'
        }

        html += '</div></div>'
        return html
    }
}
