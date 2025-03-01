/**
 * Метаданные DOCX документа
 */
export interface DocumentMetadata {
    /** Заголовок документа */
    title?: string
    /** Тема документа */
    subject?: string
    /** Автор документа */
    creator?: string
    /** Ключевые слова */
    keywords?: string
    /** Описание документа */
    description?: string
    /** Последний редактор */
    lastModifiedBy?: string
    /** Номер редакции */
    revision?: string
    /** Дата создания */
    created?: string
    /** Дата последнего изменения */
    modified?: string
}
