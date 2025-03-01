import { BaseParser } from '../../base-parser'
import { DomType, WmlField, OpenXmlElement } from '@/types/document'

/**
 * Парсер полей документа Word
 * Обрабатывает сложные поля (w:complexField) и простые поля (w:fldSimple)
 * Поддерживает:
 * - TOC (оглавление)
 * - REF (перекрестные ссылки)
 * - PAGE (номера страниц)
 * - HYPERLINK (гиперссылки)
 * - DATE (дата)
 * - и другие типы полей
 */
export class FieldParser extends BaseParser {
    /**
     * Парсит простое поле
     * @param element - XML элемент простого поля
     * @param contentParser - Функция для парсинга содержимого поля
     * @returns Объект поля
     */
    public parseSimpleField(
        element: any,
        contentParser: (element: any) => OpenXmlElement | null
    ): WmlField | null {
        const fldSimple = element['w:fldSimple']
        if (!fldSimple) return null

        const instruction = fldSimple['@_w:instr'] || ''
        const fieldType = this.parseFieldType(instruction)
        const result: OpenXmlElement[] = []

        // Парсим содержимое поля
        const runs = fldSimple['w:r'] || []
        if (Array.isArray(runs)) {
            runs.forEach((run) => {
                const parsed = contentParser(run)
                if (parsed) result.push(parsed)
            })
        } else if (runs) {
            const parsed = contentParser(runs)
            if (parsed) result.push(parsed)
        }

        return {
            type: DomType.FIELD,
            fieldType,
            instruction,
            result,
        }
    }

    /**
     * Парсит сложное поле
     * @param elements - Массив XML элементов сложного поля
     * @param contentParser - Функция для парсинга содержимого поля
     * @returns Объект поля
     */
    public parseComplexField(
        elements: any[],
        contentParser: (element: any) => OpenXmlElement | null
    ): WmlField | null {
        let instruction = ''
        const result: OpenXmlElement[] = []
        let isInResult = false

        for (const element of elements) {
            if (element['w:fldChar']) {
                const type = element['w:fldChar']['@_w:fldCharType']
                if (type === 'begin') {
                    isInResult = false
                } else if (type === 'separate') {
                    isInResult = true
                } else if (type === 'end') {
                    break
                }
            } else if (element['w:instrText']) {
                instruction += element['w:instrText']
            } else if (isInResult) {
                const parsed = contentParser(element)
                if (parsed) result.push(parsed)
            }
        }

        const fieldType = this.parseFieldType(instruction)

        return {
            type: DomType.FIELD,
            fieldType,
            instruction: instruction.trim(),
            result,
        }
    }

    /**
     * Определяет тип поля из инструкции
     * @param instruction - Инструкция поля
     * @returns Тип поля
     */
    private parseFieldType(instruction: string): string {
        const match = instruction.trim().match(/^\s*(\w+)/)
        return match ? match[1].toUpperCase() : 'UNKNOWN'
    }

    /**
     * Проверяет, является ли элемент началом сложного поля
     * @param element - XML элемент для проверки
     */
    public isComplexFieldStart(element: any): boolean {
        return (
            element['w:fldChar'] &&
            element['w:fldChar']['@_w:fldCharType'] === 'begin'
        )
    }

    /**
     * Проверяет, является ли элемент концом сложного поля
     * @param element - XML элемент для проверки
     */
    public isComplexFieldEnd(element: any): boolean {
        return (
            element['w:fldChar'] &&
            element['w:fldChar']['@_w:fldCharType'] === 'end'
        )
    }

    /**
     * Проверяет, является ли элемент простым полем
     * @param element - XML элемент для проверки
     */
    public isSimpleField(element: any): boolean {
        return 'w:fldSimple' in element
    }
}
