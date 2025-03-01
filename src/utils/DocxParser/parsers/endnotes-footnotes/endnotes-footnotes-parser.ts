import { BaseParser } from '../../base-parser'
import { DomType, WmlNote, OpenXmlElement } from '@/types/document'
import { ParagraphParser } from '../document/paragraph-parser'

/**
 * Парсер сносок и концевых сносок документа Word
 * Обрабатывает файлы:
 * - word/footnotes.xml (сноски внизу страницы)
 * - word/endnotes.xml (концевые сноски)
 */
export class EndnotesFootnotesParser extends BaseParser {
    private paragraphParser: ParagraphParser

    constructor() {
        super()
        this.paragraphParser = new ParagraphParser()
    }

    /**
     * Парсит файл сносок
     * @param xmlContent - XML содержимое файла сносок
     * @param isFootnote - true для сносок внизу страницы, false для концевых сносок
     * @returns Map сносок, где ключ - это ID сноски
     */
    public parse(xmlContent: string, isFootnote: boolean): Map<string, WmlNote> {
        const notes = new Map<string, WmlNote>()
        const xml = this.xmlParser.parse(xmlContent)
        
        // Получаем корневой элемент в зависимости от типа сносок
        const rootElement = isFootnote ? xml['w:footnotes'] : xml['w:endnotes']
        if (!rootElement) return notes

        const noteElements = isFootnote 
            ? rootElement['w:footnote'] || []
            : rootElement['w:endnote'] || []

        // Обрабатываем каждую сноску
        const notesToProcess = Array.isArray(noteElements) ? noteElements : [noteElements]
        for (const note of notesToProcess) {
            if (!note) continue
            const id = note['@_w:id']
            if (!id) continue
            
            // Пропускаем специальные сноски (разделители и т.п.)
            if (this.isSpecialNote(note)) continue

            const content = this.parseNoteContent(note)
            if (!content || content.length === 0) continue

            const stringId = String(id)
            notes.set(stringId, {
                type: isFootnote ? DomType.FOOTNOTE : DomType.ENDNOTE,
                id: stringId,
                content
            })
        }

        return notes
    }

    /**
     * Парсит содержимое сноски
     * @param note - XML элемент сноски
     * @returns Массив элементов содержимого сноски
     */
    private parseNoteContent(note: any): OpenXmlElement[] {
        const content: OpenXmlElement[] = []

        // Парсим параграфы в сноске
        const paragraphs = note['w:p'] || []
        const paragraphsToProcess = Array.isArray(paragraphs) ? paragraphs : [paragraphs]
        
        for (const p of paragraphsToProcess) {
            if (!p) continue
            const paragraph = this.paragraphParser.parse(p)
            if (paragraph) content.push(paragraph)
        }

        return content
    }

    /**
     * Проверяет, является ли элемент ссылкой на сноску
     * @param element - XML элемент для проверки
     * @returns true для сноски внизу страницы, false для концевой сноски, undefined если не сноска
     */
    public isNoteReference(element: any): boolean | undefined {
        if (element['w:footnoteReference']) return true
        if (element['w:endnoteReference']) return false
        return undefined
    }

    /**
     * Получает ID сноски из ссылки
     * @param element - XML элемент ссылки на сноску
     * @returns ID сноски
     */
    public getNoteReferenceId(element: any): string | undefined {
        return element['w:footnoteReference']?.['@_w:id'] ||
               element['w:endnoteReference']?.['@_w:id']
    }

    /**
     * Получает сноску по ID
     * @param notes - Map сносок
     * @param id - ID сноски
     * @returns Объект сноски или undefined, если сноска не найдена
     */
    public getNoteById(notes: Map<string, WmlNote>, id: string): WmlNote | undefined {
        return notes.get(id)
    }

    /**
     * Проверяет, является ли сноска специальной (разделитель, продолжение)
     * @param note - XML элемент сноски
     */
    public isSpecialNote(note: any): boolean {        
        if (!note) return false
        const type = note['@_w:type'] || note['w:type']
        return type === 'separator' || type === 'continuationSeparator' || type === 'continuationNotice'
    }
}
