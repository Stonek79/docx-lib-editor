import { BaseParser } from '../../base-parser'
import { DomType, WmlComment } from '@/types/document'
import { ParagraphParser } from '../document/paragraph-parser'

/**
 * Парсер комментариев документа Word
 * Обрабатывает файл word/comments.xml
 */
export class CommentsParser extends BaseParser {
    private paragraphParser: ParagraphParser

    constructor() {
        super()
        this.paragraphParser = new ParagraphParser()
    }

    /**
     * Парсит содержимое файла комментариев
     * @param xmlContent - XML содержимое файла comments.xml
     * @returns Массив объектов комментариев
     */
    public parse(xmlContent: string): WmlComment[] {
        const xml = this.xmlParser.parse(xmlContent)
        const comments = xml['w:comments']?.['w:comment'] || []

        if (!comments) return []

        return Array.isArray(comments)
            ? comments.map(comment => this.parseComment(comment))
            : [this.parseComment(comments)]
    }

    /**
     * Парсит отдельный комментарий
     * @param comment - XML элемент комментария
     * @returns Объект комментария
     */
    private parseComment(comment: any): WmlComment {
        const content = []
        
        // Парсим параграфы в комментарии
        const paragraphs = comment['w:p'] || []
        if (Array.isArray(paragraphs)) {
            paragraphs.forEach(p => {
                const paragraph = this.paragraphParser.parse(p)
                if (paragraph) content.push(paragraph)
            })
        } else if (paragraphs) {
            const paragraph = this.paragraphParser.parse(paragraphs)
            if (paragraph) content.push(paragraph)
        }

        return {
            type: DomType.COMMENT,
            id: String(comment['@_w:id'] || ''),
            author: comment['@_w:author'],
            date: comment['@_w:date'],
            content
        }
    }
}
