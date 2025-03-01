// src/types/document-parser.ts
import {
    OpenXmlElement,
    WmlTable,
    WmlTableCell,
    WmlTableRow,
} from '@/types/document'

/**
 * Интерфейс парсера элементов документа
 * Определяет общий контракт для всех парсеров, обрабатывающих элементы DOCX
 */
export interface DocumentElementParser {
    /**
     * Проверяет, может ли парсер обработать данный элемент
     * @param element - XML элемент для проверки
     * @returns true если парсер может обработать элемент
     */
    canParse(element: any): boolean

    /**
     * Парсит XML элемент
     * @param element - XML элемент для обработки
     * @returns Структурированное представление элемента или массив элементов
     */
    parse(element: any): OpenXmlElement | OpenXmlElement[]
}

/**
 * Контекст для парсинга таблиц
 * Используется для передачи информации о текущей позиции в таблице
 * между различными методами парсера
 */
export interface TableContext {
    /** Текущая таблица */
    table: WmlTable
    /** Текущая строка */
    row: WmlTableRow
    /** Текущая ячейка */
    cell: WmlTableCell
}
