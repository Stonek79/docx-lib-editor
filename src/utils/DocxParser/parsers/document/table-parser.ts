import { BaseParser } from '../../base-parser'
import { DomType, WmlTable, WmlTableRow, WmlTableCell } from '@/types/document'
import { DocumentElementParser } from '@/types/document-parser'
import { PropertiesParser } from '../properties-parser'
import { ParagraphParser } from './paragraph-parser'

/**
 * Парсер таблиц DOCX документа.
 * Отвечает за:
 * - Обработку элементов w:tbl (таблицы)
 * - Парсинг строк таблицы (w:tr)
 * - Парсинг ячеек таблицы (w:tc)
 * - Извлечение свойств таблицы (границы, ширина, стиль)
 * - Обработку объединенных ячеек
 */
export class TableParser extends BaseParser implements DocumentElementParser {
    private paragraphParser: ParagraphParser

    constructor(options = {}) {
        super(options)
        this.paragraphParser = new ParagraphParser(options)
    }

    /**
     * Проверяет, может ли парсер обработать данный элемент
     * @param element - XML элемент для проверки
     * @returns true если элемент является таблицей (w:tbl)
     */
    canParse(element: any): boolean {
        return 'w:tbl' in element
    }

    /**
     * Парсит XML элемент таблицы
     * @param element - XML элемент w:tbl
     * @returns Структурированное представление таблицы
     */
    parse(element: any): WmlTable {
        const table = 'w:tbl' in element ? element['w:tbl'] : element
        const properties = PropertiesParser.parseTableProperties(table['w:tblPr'])
        return {
            type: DomType.Table,
            rows: this.parseRows(table),
            properties
        }
    }

    /**
     * Парсит строки таблицы
     * @param table - XML элемент таблицы
     * @returns Массив строк таблицы
     */
    private parseRows(table: any): WmlTableRow[] {
        const rows = table['w:tr'] || []
        return Array.isArray(rows)
            ? rows.map((row) => this.parseRow(row))
            : [this.parseRow(rows)]
    }

    /**
     * Парсит одну строку таблицы
     * @param row - XML элемент строки
     * @returns Структурированное представление строки таблицы
     */
    private parseRow(row: any): WmlTableRow {
        return {
            type: DomType.TableRow,
            cells: this.parseCells(row),
            properties: PropertiesParser.parseTableRowProperties(row['w:trPr']),
        }
    }

    /**
     * Парсит ячейки в строке таблицы
     * @param row - XML элемент строки
     * @returns Массив ячеек таблицы
     */
    private parseCells(row: any): WmlTableCell[] {
        const cells = row['w:tc'] || []
        return Array.isArray(cells)
            ? cells.map((cell) => this.parseCell(cell))
            : [this.parseCell(cells)]
    }

    /**
     * Парсит одну ячейку таблицы
     * @param cell - XML элемент ячейки
     * @returns Структурированное представление ячейки
     */
    private parseCell(cell: any): WmlTableCell {
        const paragraphs = cell['w:p'] || []
        return {
            type: DomType.TableCell,
            content: Array.isArray(paragraphs)
                ? paragraphs.map((p) =>
                      this.paragraphParser.parse({ 'w:p': p }),
                  )
                : [this.paragraphParser.parse({ 'w:p': paragraphs })],
            properties: PropertiesParser.parseTableCellProperties(
                cell['w:tcPr'],
            ),
        }
    }
}
