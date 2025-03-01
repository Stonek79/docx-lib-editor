import { DocxStyle } from './docx-properties'
import { Relationship } from './relationships'
import { NumberingDefinition } from './numbering'
import { WmlHeaderFooter, WmlComment, WmlFont, WmlNote } from './document'
import { DocumentMetadata } from './metadata'

/**
 * Опции парсера DOCX документа
 */
export interface ParserOptions {
    /** Игнорировать ширину элементов при парсинге */
    ignoreWidth?: boolean
    /** Включить отладочный режим */
    debug?: boolean
}

/**
 * Результат парсинга DOCX документа
 */
export interface ParsedDocument {
    /** HTML представление документа */
    html: string
    /** Стили документа */
    styles: DocxStyle[]
    /** Определения нумерации */
    numbering: NumberingDefinition[]
    /** Изображения (ключ - имя файла, значение - base64) */
    images: Map<string, string>
    /** Связи между частями документа */
    relationships: Relationship[]
    /** Верхние колонтитулы */
    headers: WmlHeaderFooter[]
    /** Нижние колонтитулы */
    footers: WmlHeaderFooter[]
    /** Комментарии */
    comments: WmlComment[]
    /** Шрифты */
    fonts: WmlFont[]
    /** Сноски внизу страницы */
    footnotes: WmlNote[]
    /** Концевые сноски */
    endnotes: WmlNote[]
    /** Метаданные документа */
    metadata: DocumentMetadata
}
