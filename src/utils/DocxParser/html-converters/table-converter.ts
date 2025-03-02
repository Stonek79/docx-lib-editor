import { DomType, WmlParagraph, WmlTable } from '@/types/document'
import { DocxStyle } from '@/types/docx-properties'
import { NumberingDefinition } from '@/types/numbering'
import { ParagraphConverter } from './paragraph-converter'

/**
 * Конвертер таблиц в HTML
 * Отвечает за:
 * - Конвертацию таблиц в HTML элементы
 * - Применение стилей таблиц
 * - Обработку ячеек и строк
 */
export class TableConverter {
    private paragraphConverter: ParagraphConverter

    constructor() {
        this.paragraphConverter = new ParagraphConverter()
    }

    /**
     * Конвертирует таблицу в HTML
     * @param table - Таблица для конвертации
     * @param styles - Map стилей документа
     * @param numbering - Map нумерации документа
     * @returns HTML строка
     */
    async convertTableToHtml(
        table: WmlTable,
        styles: Map<string, DocxStyle>,
        numbering: Map<string, NumberingDefinition>,
    ): Promise<string> {
        const rows = table.rows || []
        const tableHtml: string[] = []

        // Добавляем стили
        const tableClasses = ['table', 'non-breakable']
        if (table.properties?.style) {
            tableClasses.push(`style-${table.properties.style}`)
        }
        
        console.log('Конвертируем таблицу:', table);

        // Обрабатываем строки
        for (const row of rows) {
            const cells = row.cells || []
            const rowHtml: string[] = []

            // Обрабатываем ячейки
            for (const cell of cells) {
                const cellContent: string[] = []

                // Обрабатываем содержимое ячейки
                for (const content of cell.content || []) {
                    if (content.type === DomType.Paragraph) {
                        cellContent.push(
                            this.paragraphConverter.convertParagraphToHtml(
                                content as WmlParagraph,
                                styles,
                                numbering,
                            ),
                        )
                    }
                }

                // Добавляем стили ячейки
                const cellClasses = ['cell']
                if (cell.properties?.style) {
                    cellClasses.push(`style-${cell.properties.style}`)
                }

                rowHtml.push(
                    `<td class="${cellClasses.join(' ')}">${cellContent.join('')}</td>`,
                )
            }

            // Добавляем стили строки
            const rowClasses = ['row']
            if (row.properties?.style) {
                rowClasses.push(`style-${row.properties.style}`)
            }

            tableHtml.push(
                `<tr class="${rowClasses.join(' ')}">${rowHtml.join('')}</tr>`,
            )
        }

        return `<table class="${tableClasses.join(' ')}">${tableHtml.join('')}</table>`
    }
}
