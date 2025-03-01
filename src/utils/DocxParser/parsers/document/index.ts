/**
 * Экспорт всех парсеров документа
 */

// Парсеры документа
export * from './header-footer-parser'
export * from './table-style-parser'
export * from './footnote-endnote-parser'
export * from './comments-parser'
export * from './bookmarks-parser'
export * from './hyperlink-parser'
export * from './drawing-parser'
export * from './field-parser'

// Создаем единую точку входа для всех парсеров документа
import { createHeaderFooterParser } from './header-footer-parser'
import { createTableStyleParser } from './table-style-parser'
import { createFootnoteEndnoteParser } from './footnote-endnote-parser'
import { createCommentsParser } from './comments-parser'
import { createBookmarksParser } from './bookmarks-parser'
import { createHyperlinkParser } from './hyperlink-parser'
import { createDrawingParser } from './drawing-parser'
import { createFieldParser } from './field-parser'

/**
 * Создает все парсеры документа
 * @returns Объект со всеми парсерами документа
 */
export function createDocumentParsers() {
    return {
        headerFooterParser: createHeaderFooterParser(),
        tableStyleParser: createTableStyleParser(),
        footnoteEndnoteParser: createFootnoteEndnoteParser(),
        commentsParser: createCommentsParser(),
        bookmarksParser: createBookmarksParser(),
        hyperlinkParser: createHyperlinkParser(),
        drawingParser: createDrawingParser(),
        fieldParser: createFieldParser()
    }
}
