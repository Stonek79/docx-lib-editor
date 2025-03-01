import { BaseParser } from '../../base-parser'
import { DomType, WmlHeaderFooter, OpenXmlElement } from '@/types/document'
import { ParagraphParser } from '../document/paragraph-parser'
import { TableParser } from '../document/table-parser'

/**
 * Парсер колонтитулов документа Word
 * Обрабатывает файлы header*.xml и footer*.xml из DOCX архива
 */
export class HeaderFooterParser extends BaseParser {
    private paragraphParser: ParagraphParser
    private tableParser: TableParser

    constructor() {
        super()
        this.paragraphParser = new ParagraphParser()
        this.tableParser = new TableParser()
    }

    /**
     * Парсит содержимое колонтитула
     * @param xmlContent - XML содержимое файла колонтитула
     * @param isHeader - true для верхнего колонтитула, false для нижнего
     * @returns Объект колонтитула с распарсенным содержимым
     */
    public parse(xmlContent: string, isHeader: boolean): WmlHeaderFooter {
        const xml = this.xmlParser.parse(xmlContent)
        const type = isHeader ? DomType.HEADER : DomType.FOOTER
        const children: OpenXmlElement[] = []

        // Парсим параграфы
        const paragraphs = xml['w:hdr']?.['w:p'] || xml['w:ftr']?.['w:p'] || []
        if (Array.isArray(paragraphs)) {
            paragraphs.forEach((p) => {
                const paragraph = this.paragraphParser.parse(p)
                if (paragraph) children.push(paragraph)
            })
        } else if (paragraphs) {
            const paragraph = this.paragraphParser.parse(paragraphs)
            if (paragraph) children.push(paragraph)
        }

        // Парсим таблицы
        const tables = xml['w:hdr']?.['w:tbl'] || xml['w:ftr']?.['w:tbl'] || []
        if (Array.isArray(tables)) {
            tables.forEach((tbl) => {
                const table = this.tableParser.parse(tbl)
                if (table) children.push(table)
            })
        } else if (tables) {
            const table = this.tableParser.parse(tables)
            if (table) children.push(table)
        }

        return {
            type,
            children,
        }
    }
}
