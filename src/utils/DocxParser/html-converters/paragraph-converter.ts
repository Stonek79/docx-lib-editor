import {
    WmlParagraph,
    WmlRun,
    WmlText,
    DomType,
    WmlSymbol,
    WmlBreak,
} from '@/types/document'
import { DocxStyle } from '@/types/docx-properties'
import { NumberingDefinition, NumberingLevel } from '@/types/numbering'
import { NumberingConverter } from './numbering-converter'
import { Relationship } from '@/types/relationships'

/**
 * Конвертер параграфов в HTML
 * Отвечает за:
 * - Конвертацию параграфов в HTML элементы
 * - Применение стилей
 * - Обработку нумерации
 * - Конвертацию текстовых прогонов
 * - Обработку разрывов страниц
 */
export class ParagraphConverter {
    private numberingConverter: NumberingConverter
    private hasPageBreak: boolean = false

    constructor() {
        this.numberingConverter = new NumberingConverter()
    }

    /**
     * Сбрасывает состояние конвертера
     */
    reset(): void {
        this.numberingConverter.reset()
        this.hasPageBreak = false
    }

    /**
     * Проверяет, был ли обнаружен разрыв страницы
     * @returns true, если был обнаружен разрыв страницы
     */
    hasPageBreakDetected(): boolean {
        const result = this.hasPageBreak
        this.hasPageBreak = false
        return result
    }

    /**
     * Конвертирует параграф в HTML
     * @param paragraph - Параграф для конвертации
     * @param styles - Map стилей документа
     * @param numbering - Map нумерации документа
     * @param relationships - Map связей документа
     * @returns HTML строка
     */
    convertParagraphToHtml(
        paragraph: WmlParagraph,
        styles: Map<string, DocxStyle>,
        numbering: Map<string, NumberingDefinition>,
        relationships?: Map<string, Relationship>,
    ): string {
        const style = paragraph.style?.id
            ? styles.get(paragraph.style.id)
            : undefined
        let content = ''

        // Добавляем нумерацию
        if (paragraph.numbering && numbering) {
            const numberingDef = numbering.get(paragraph.numbering.id)
            if (numberingDef && paragraph.numbering.level !== undefined) {
                const level =
                    numberingDef.levels[paragraph.numbering.level.toString()]
                if (level) {
                    const numberingHtml =
                        this.numberingConverter.formatNumbering(
                            level,
                            paragraph.numbering.level,
                            paragraph.numbering.id,
                        )
                    if (numberingHtml) {
                        // Собираем все стили для нумерации
                        let styles = []

                        // Добавляем стили параграфа, если они есть
                        if (level.style) {
                            styles.push(this.convertToInlineStyle(level.style))
                        }

                        // Добавляем стили текста, если они есть
                        if (level.runStyle) {
                            styles.push(
                                this.convertRunStylesToInline(level.runStyle),
                            )
                        }

                        const combinedStyles = styles
                            .filter((s) => s)
                            .join('; ')
                        const styleAttr = combinedStyles
                            ? ` style="${combinedStyles}"`
                            : ''

                        content += `<span class="numbering"${styleAttr}>${numberingHtml}</span>`
                    }
                }
            }
        }

        // Добавляем текст
        content += paragraph.content
            .map((child) => {
                if ('type' in child && child.type === DomType.Run) {
                    // Проверяем наличие гиперссылки
                    if (relationships && child.properties?.hyperlink) {
                        const relationship = relationships.get(
                            child.properties.hyperlink,
                        )
                        if (relationship) {
                            child.properties.hyperlink = relationship.target
                        }
                    }
                }
                return this.convertRunToHtml(child)
            })
            .join('')

        // Добавляем классы
        const classes: string[] = ['paragraph']
        if (style?.id) classes.push(`style-${style.id}`)

        // Добавляем классы для выравнивания
        if (paragraph.formatting?.alignment) {
            const alignment = paragraph.formatting.alignment
            if (alignment === 'center') {
                classes.push('align-center')
            } else if (alignment === 'right') {
                classes.push('align-right')
            } else if (alignment === 'both') {
                classes.push('align-justify')
            }
        }

        // Добавляем классы для отступов
        if (paragraph.formatting?.indent?.left) {
            const leftIndent = parseInt(
                String(paragraph.formatting.indent.left),
            )
            if (!isNaN(leftIndent) && leftIndent > 0) {
                if (leftIndent <= 720) classes.push('indent-1')
                else if (leftIndent <= 1440) classes.push('indent-2')
                else classes.push('indent-3')
            }
        }

        // Создаем встроенные стили
        const inlineStyles: string[] = []

        // Добавляем межстрочный интервал
        if (paragraph.formatting?.spacing?.line) {
            const line = parseInt(String(paragraph.formatting.spacing.line))
            if (!isNaN(line)) {
                const lineRule = paragraph.formatting.spacing.lineRule

                if (lineRule === 'auto') {
                    inlineStyles.push(`line-height: ${line / 240}`)
                } else if (lineRule === 'exact') {
                    inlineStyles.push(`line-height: ${line / 20}pt`)
                } else if (lineRule === 'atLeast') {
                    inlineStyles.push(`line-height: ${line / 20}pt`)
                }
            }
        }

        // Добавляем отступы до и после
        if (paragraph.formatting?.spacing?.before) {
            const before = parseInt(String(paragraph.formatting.spacing.before))
            if (!isNaN(before)) {
                inlineStyles.push(`margin-top: ${before / 20}pt`)
            }
        }
        if (paragraph.formatting?.spacing?.after) {
            const after = parseInt(String(paragraph.formatting.spacing.after))
            if (!isNaN(after)) {
                inlineStyles.push(`margin-bottom: ${after / 20}pt`)
            }
        }

        // Добавляем точные отступы слева и справа
        if (paragraph.formatting?.indent?.left) {
            const left = parseInt(String(paragraph.formatting.indent.left))
            if (!isNaN(left)) {
                inlineStyles.push(`padding-left: ${left / 20}pt`)
            }
        }
        if (paragraph.formatting?.indent?.right) {
            const right = parseInt(String(paragraph.formatting.indent.right))
            if (!isNaN(right)) {
                inlineStyles.push(`padding-right: ${right / 20}pt`)
            }
        }

        // Добавляем отступ первой строки
        if (paragraph.formatting?.indent?.firstLine) {
            const firstLine = parseInt(
                String(paragraph.formatting.indent.firstLine),
            )
            if (!isNaN(firstLine)) {
                inlineStyles.push(`text-indent: ${firstLine / 20}pt`)
            }
        }

        // Добавляем висячий отступ
        if (paragraph.formatting?.indent?.hanging) {
            const hanging = parseInt(
                String(paragraph.formatting.indent.hanging),
            )
            if (!isNaN(hanging)) {
                inlineStyles.push(`text-indent: -${hanging / 20}pt`)
            }
        }

        // Добавляем границы
        if (paragraph.formatting?.borders) {
            const borders = paragraph.formatting.borders
            for (const side in borders) {
                const border = borders[side]
                if (
                    border.style &&
                    border.style !== 'nil' &&
                    border.style !== 'none'
                ) {
                    const width = parseInt(String(border.size)) / 8
                    if (!isNaN(width)) {
                        const color =
                            border.color === 'auto'
                                ? '#000000'
                                : `#${border.color}`
                        inlineStyles.push(
                            `border-${side}: ${width}pt solid ${color}`,
                        )
                    }
                }
            }
        }

        // Добавляем фон
        if (
            paragraph.formatting?.shading?.fill &&
            paragraph.formatting.shading.fill !== 'auto'
        ) {
            inlineStyles.push(
                `background-color: #${paragraph.formatting.shading.fill}`,
            )
        }

        // Создаем HTML тег параграфа с классами и встроенными стилями
        const styleAttr =
            inlineStyles.length > 0 ? ` style="${inlineStyles.join('; ')}"` : ''

        // Если параграф пустой, добавляем неразрывный пробел, чтобы он отображался с правильной высотой
        const finalContent = content.trim() === '' ? '' : content

        return `<p class="${classes.join(' ')}"${styleAttr}>${finalContent}</p>`
    }

    /**
     * Конвертирует текстовый прогон в HTML
     * @param run - Текстовый прогон или текстовый узел
     * @returns HTML строка
     */
    private convertRunToHtml(run: WmlRun | WmlText): string {
        try {
            // Получаем стиль прогона
            const style = run.properties || {}

            // Собираем стили форматирования в массив
            const styleAttributes: string[] = []
            if (style.bold) styleAttributes.push('font-weight: bold')
            if (style.italic) styleAttributes.push('font-style: italic')
            if (style.underline)
                styleAttributes.push('text-decoration: underline')
            if (style.strike)
                styleAttributes.push('text-decoration: line-through')
            if (style.color) styleAttributes.push(`color: #${style.color}`)
            if (style.highlight)
                styleAttributes.push(`background-color: #${style.highlight}`)
            if (style.caps) styleAttributes.push('text-transform: uppercase')

            // Формируем строку стилей
            const styleString =
                styleAttributes.length > 0
                    ? ` style="${styleAttributes.join('; ')}"`
                    : ''

            // Обрабатываем текстовый прогон
            let content = ''
            if ('content' in run) {
                for (const child of run.content) {
                    if ('text' in child) {
                        if (
                            'isFootnoteRef' in child &&
                            child.isFootnoteRef &&
                            'footnoteId' in child &&
                            child.footnoteId
                        ) {
                            content += `<a href="#footnote-${child.footnoteId}" class="footnote-ref" id="footnote-ref-${child.footnoteId}">${child.footnoteId}</a>`
                        } else {
                            content += `<span${styleString}>${this.preserveWhitespace(child.text)}</span>`
                        }
                    } else if ('char' in child) {
                        content += `<span${styleString}>${child.char}</span>`
                    } else if ('breakType' in child) {
                        // Обрабатываем разрывы страниц и строк
                        if (child.breakType === 'page') {
                            this.hasPageBreak = true
                            content += '<span class="page-break"></span>'
                        } else if (child.breakType === 'line') {
                            content += '<br>'
                        } else if (child.breakType === 'column') {
                            content += '<span class="column-break"></span>'
                        }
                    }
                }
            }

            let html = content

            // Обрабатываем ссылки
            if (style.hyperlink) {
                html = `<a href="${style.hyperlink}" class="docx-link">${html}</a>`
            }

            return html
        } catch (error) {
            console.error('Error converting run to HTML:', error, run)
            return ''
        }
    }

    /**
     * Преобразует стили нумерации в inline CSS
     * @param style - Стиль из DOCX
     * @returns Строка с inline CSS
     */
    private convertToInlineStyle(style: any): string {
        if (!style) return ''

        const inlineStyles: string[] = []

        // Добавляем выравнивание
        if (style.justification) {
            inlineStyles.push(`text-align: ${style.justification}`)
        }

        // Добавляем интервалы
        if (style.spacing) {
            if (style.spacing.before) {
                const before = parseInt(String(style.spacing.before))
                if (!isNaN(before)) {
                    inlineStyles.push(`margin-top: ${before / 20}pt`)
                }
            }

            if (style.spacing.after) {
                const after = parseInt(String(style.spacing.after))
                if (!isNaN(after)) {
                    inlineStyles.push(`margin-bottom: ${after / 20}pt`)
                }
            }

            if (style.spacing.line) {
                const line = parseInt(String(style.spacing.line))
                if (!isNaN(line)) {
                    // Если lineRule равен 'auto', то значение в твипах / 240
                    // Если lineRule равен 'exact' или 'atLeast', то значение в твипах / 20
                    const lineHeight =
                        style.spacing.lineRule === 'auto'
                            ? line / 240
                            : line / 20
                    inlineStyles.push(`line-height: ${lineHeight}pt`)
                }
            }
        }

        // Добавляем шрифт и цвет
        if (style.runProps) {
            if (style.runProps.fontSize) {
                inlineStyles.push(`font-size: ${style.runProps.fontSize}pt`)
            }

            if (style.runProps.bold) {
                inlineStyles.push('font-weight: bold')
            }

            if (style.runProps.italic) {
                inlineStyles.push('font-style: italic')
            }

            if (style.runProps.color) {
                inlineStyles.push(`color: #${style.runProps.color}`)
            }
        }

        return inlineStyles.join('; ')
    }

    /**
     * Преобразует стили текста в inline CSS
     * @param runStyle - Стиль текста из DOCX
     * @returns Строка с inline CSS
     */
    private convertRunStylesToInline(runStyle: any): string {
        if (!runStyle) return ''

        const inlineStyles: string[] = []

        // Добавляем размер шрифта
        if (runStyle.fontSize) {
            inlineStyles.push(`font-size: ${runStyle.fontSize}pt`)
        }

        // Добавляем жирный шрифт
        if (runStyle.bold) {
            inlineStyles.push('font-weight: bold')
        }

        // Добавляем курсив
        if (runStyle.italic) {
            inlineStyles.push('font-style: italic')
        }

        // Добавляем подчеркивание
        if (runStyle.underline && runStyle.underline !== 'none') {
            inlineStyles.push('text-decoration: underline')
        }

        // Добавляем зачеркивание
        if (runStyle.strike) {
            inlineStyles.push('text-decoration: line-through')
        }

        // Добавляем вертикальное выравнивание
        // if (runStyle.vertAlign) {
        //     if (runStyle.vertAlign === 'superscript') {
        //         inlineStyles.push('vertical-align: super')
        //     } else if (runStyle.vertAlign === 'subscript') {
        //         inlineStyles.push('vertical-align: sub')
        //     }
        // }

        // Добавляем цвет
        if (runStyle.color) {
            inlineStyles.push(`color: #${runStyle.color}`)
        }

        // Добавляем выделение
        if (runStyle.highlight) {
            inlineStyles.push(`background-color: #${runStyle.highlight}`)
        }

        // Добавляем заглавные буквы
        if (runStyle.caps) {
            inlineStyles.push('text-transform: uppercase')
        }

        return inlineStyles.join('; ')
    }

    /**
     * Сохраняет пробелы и экранирует HTML
     * @param text - Исходный текст
     * @returns Экранированный текст с сохраненными пробелами
     */
    private preserveWhitespace(text: string): string {
        // Экранируем HTML
        text = typeof text === 'string' ? text : String(text)
        text = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')

        // Обрабатываем неразрывные пробелы (уже в тексте могут быть \u00A0)
        // Сохраняем их как HTML-сущности
        text = text.replace(/\u00A0/g, ' ')

        // Сохраняем пробелы в начале и конце строки
        if (text.startsWith(' ')) {
            text = ' ' + text.substring(1)
        }

        if (text.endsWith(' ')) {
            text = text.substring(0, text.length - 1) + ' '
        }

        // Обрабатываем специальные случаи для кавычек и скобок
        // Добавляем неразрывный пробел после открывающей кавычки
        text = text.replace(/«\s/g, '« ')

        // Добавляем неразрывный пробел перед закрывающей кавычкой
        text = text.replace(/\s»/g, '»')

        // Добавляем неразрывный пробел после открывающей скобки
        text = text.replace(/\(\s/g, ' ')

        // Добавляем неразрывный пробел перед закрывающей скобкой
        text = text.replace(/\s\)/g, ' ')

        // Заменяем множественные пробелы на неразрывные
        text = text.replace(/ {2,}/g, (match) => {
            return ' '.repeat(match.length)
        })

        return text
    }
}
