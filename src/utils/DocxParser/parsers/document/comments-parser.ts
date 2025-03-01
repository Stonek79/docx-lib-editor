import { BaseParser } from '../../base-parser'
import { DomType } from '@/types/document'

/**
 * Интерфейс для автора комментария
 */
export interface ICommentAuthor {
    id: string
    name: string
    initials: string
}

/**
 * Интерфейс для комментария
 */
export interface IComment {
    id: string
    authorId: string
    date: Date | null
    children: any[]
}

/**
 * Парсер комментариев документа
 */
export class CommentsParser extends BaseParser {
    /**
     * Парсит авторов комментариев
     * @returns Массив авторов комментариев
     */
    public async parseCommentAuthors(): Promise<ICommentAuthor[]> {
        try {
            const authorsPath = 'word/commentsExtended.xml'
            const authorsXml = await this.loadXmlFile(authorsPath)
            
            if (!authorsXml || !authorsXml.commentsExtended) {
                return []
            }
            
            const authors: ICommentAuthor[] = []
            const personList = authorsXml.commentsExtended.person
            
            if (!personList) {
                return authors
            }
            
            const personArray = Array.isArray(personList) ? personList : [personList]
            
            for (const person of personArray) {
                const id = person['@_id']
                const name = person.presenceInfo?.['@_name'] || ''
                const initials = person.presenceInfo?.['@_userId'] || ''
                
                if (id) {
                    authors.push({ id, name, initials })
                }
            }
            
            return authors
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse comment authors:', error)
            }
            return []
        }
    }
    
    /**
     * Парсит комментарии документа
     * @returns Массив комментариев
     */
    public async parseComments(): Promise<IComment[]> {
        try {
            const commentsPath = 'word/comments.xml'
            const commentsXml = await this.loadXmlFile(commentsPath)
            
            if (!commentsXml || !commentsXml.comments) {
                return []
            }
            
            const comments: IComment[] = []
            const commentList = commentsXml.comments.comment
            
            if (!commentList) {
                return comments
            }
            
            const commentArray = Array.isArray(commentList) ? commentList : [commentList]
            
            for (const comment of commentArray) {
                const id = comment['@_id']
                const authorId = comment['@_author']
                const dateStr = comment['@_date']
                
                // Парсим дату
                let date: Date | null = null
                if (dateStr) {
                    try {
                        date = new Date(dateStr)
                    } catch (e) {
                        // Игнорируем ошибки парсинга даты
                    }
                }
                
                if (id) {
                    const children = this.parseCommentContent(comment)
                    
                    comments.push({
                        id,
                        authorId: authorId || '',
                        date,
                        children
                    })
                }
            }
            
            return comments
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse comments:', error)
            }
            return []
        }
    }
    
    /**
     * Парсит содержимое комментария
     * @param commentXml - XML комментария
     * @returns Массив дочерних элементов
     */
    private parseCommentContent(commentXml: any): any[] {
        const children: any[] = []
        
        try {
            // Парсим параграфы
            if (commentXml.p) {
                const paragraphs = Array.isArray(commentXml.p) ? commentXml.p : [commentXml.p]
                
                for (const paragraph of paragraphs) {
                    // Здесь должен быть вызов метода для парсинга параграфа
                    // Например: const parsedParagraph = this.paragraphParser.parseParagraph(paragraph)
                    // children.push(parsedParagraph)
                    
                    // Для простоты, добавляем заглушку
                    children.push({
                        type: DomType.Paragraph,
                        children: this.parseCommentParagraph(paragraph)
                    })
                }
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse comment content:', error)
            }
        }
        
        return children
    }
    
    /**
     * Парсит параграф комментария
     * @param paragraphXml - XML параграфа
     * @returns Массив дочерних элементов
     */
    private parseCommentParagraph(paragraphXml: any): any[] {
        const children: any[] = []
        
        try {
            // Парсим текстовые прогоны
            if (paragraphXml.r) {
                const runs = Array.isArray(paragraphXml.r) ? paragraphXml.r : [paragraphXml.r]
                
                for (const run of runs) {
                    // Парсим текст
                    if (run.t) {
                        children.push(this.createTextNode(run.t['#text'] || ''))
                    }
                    
                    // Парсим разрывы строк
                    if (run.br) {
                        children.push(this.createBreakNode('line'))
                    }
                }
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse comment paragraph:', error)
            }
        }
        
        return children
    }
    
    /**
     * Парсит диапазоны комментариев в документе
     * @param documentXml - XML документа
     * @returns Объект с диапазонами комментариев
     */
    public parseCommentRanges(documentXml: any): Record<string, { start: number; end: number }> {
        const commentRanges: Record<string, { start: number; end: number }> = {}
        
        try {
            // Находим все элементы body
            const body = documentXml.document?.body
            
            if (!body) {
                return commentRanges
            }
            
            // Рекурсивно ищем комментарии в документе
            this.findCommentRanges(body, commentRanges)
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse comment ranges:', error)
            }
        }
        
        return commentRanges
    }
    
    /**
     * Рекурсивно ищет диапазоны комментариев в XML
     * @param node - XML узел
     * @param commentRanges - Объект с диапазонами комментариев
     * @param depth - Текущая глубина рекурсии
     */
    private findCommentRanges(
        node: any, 
        commentRanges: Record<string, { start: number; end: number }>,
        depth: number = 0
    ): void {
        // Ограничиваем глубину рекурсии
        if (depth > 100) {
            return
        }
        
        // Проверяем, является ли узел началом комментария
        if (node.commentRangeStart) {
            const id = node.commentRangeStart['@_id']
            
            if (id) {
                if (!commentRanges[id]) {
                    commentRanges[id] = { start: -1, end: -1 }
                }
                
                commentRanges[id].start = this.getNodePosition(node)
            }
        }
        
        // Проверяем, является ли узел концом комментария
        if (node.commentRangeEnd) {
            const id = node.commentRangeEnd['@_id']
            
            if (id) {
                if (!commentRanges[id]) {
                    commentRanges[id] = { start: -1, end: -1 }
                }
                
                commentRanges[id].end = this.getNodePosition(node)
            }
        }
        
        // Рекурсивно обходим все дочерние узлы
        for (const key in node) {
            if (typeof node[key] === 'object' && node[key] !== null) {
                if (Array.isArray(node[key])) {
                    for (const item of node[key]) {
                        this.findCommentRanges(item, commentRanges, depth + 1)
                    }
                } else {
                    this.findCommentRanges(node[key], commentRanges, depth + 1)
                }
            }
        }
    }
    
    /**
     * Получает позицию узла в документе
     * @param node - XML узел
     * @returns Позиция узла
     */
    private getNodePosition(node: any): number {
        // Это упрощенная реализация, которая возвращает случайное число
        // В реальном приложении нужно реализовать более сложную логику
        return Math.floor(Math.random() * 1000)
    }
    
    /**
     * Создает HTML для комментария
     * @param comment - Комментарий
     * @param author - Автор комментария
     * @returns HTML комментария
     */
    public createCommentHtml(comment: IComment, author?: ICommentAuthor): string {
        const commentId = `comment-${comment.id}`
        
        // Форматируем дату
        let dateStr = ''
        if (comment.date) {
            dateStr = comment.date.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }
        
        // Создаем HTML для маркера комментария
        const commentMarkerHtml = `
            <span class="comment-marker" data-comment-id="${comment.id}">
                <span class="comment-content">
                    <div class="comment-header">
                        <strong>${author?.name || 'Неизвестный автор'}</strong>
                        ${dateStr ? `<span class="comment-date">${dateStr}</span>` : ''}
                    </div>
                    <div class="comment-body">
                        ${this.renderCommentContent(comment.children)}
                    </div>
                </span>
            </span>
        `
        
        return commentMarkerHtml
    }
    
    /**
     * Рендерит содержимое комментария в HTML
     * @param children - Дочерние элементы комментария
     * @returns HTML содержимого комментария
     */
    private renderCommentContent(children: any[]): string {
        let html = ''
        
        for (const child of children) {
            if (child.type === DomType.Paragraph) {
                html += `<p>${this.renderCommentChildren(child.children)}</p>`
            }
        }
        
        return html
    }
    
    /**
     * Рендерит дочерние элементы комментария в HTML
     * @param children - Дочерние элементы
     * @returns HTML дочерних элементов
     */
    private renderCommentChildren(children: any[]): string {
        let html = ''
        
        for (const child of children) {
            if (child.type === DomType.Text) {
                html += child.text
            } else if (child.type === DomType.Break) {
                html += '<br>'
            }
        }
        
        return html
    }
}

/**
 * Создает парсер комментариев
 * @returns Экземпляр CommentsParser
 */
export function createCommentsParser(): CommentsParser {
    return new CommentsParser()
}
