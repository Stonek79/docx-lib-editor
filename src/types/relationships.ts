/**
 * Описание связи между частями DOCX документа
 */
export interface Relationship {
    /** Уникальный идентификатор связи */
    id: string
    /** Тип связи (см. RelationshipTypes) */
    type: string
    /** Путь к целевому файлу */
    target: string
    /** Режим обработки цели (External для внешних ссылок) */
    targetMode?: string
}

/**
 * Типы связей в DOCX документе
 * @enum {string}
 */
export enum RelationshipTypes {
    /** Гиперссылка */
    Hyperlink = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
    /** Изображение */
    Image = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
    /** Тема документа */
    Theme = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme',
    /** Настройки документа */
    Settings = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings',
    CHART = "CHART",
}
