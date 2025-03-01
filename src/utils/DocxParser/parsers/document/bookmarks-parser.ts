import { BaseParser } from '../../base-parser'

/**
 * Интерфейс для закладки
 */
export interface IBookmark {
    id: string
    name: string
    start: number
    end: number
}

/**
 * Парсер закладок документа
 */
export class BookmarksParser extends BaseParser {
    /**
     * Парсит закладки из документа
     * @param documentXml - XML документа
     * @returns Массив закладок
     */
    public parseBookmarks(documentXml: any): IBookmark[] {
        const bookmarks: IBookmark[] = []
        
        try {
            // Находим все элементы body
            const body = documentXml.document?.body
            
            if (!body) {
                return bookmarks
            }
            
            // Создаем временное хранилище для начал и концов закладок
            const bookmarkStarts: Record<string, { id: string; name: string; position: number }> = {}
            const bookmarkEnds: Record<string, { id: string; position: number }> = {}
            
            // Рекурсивно ищем закладки в документе
            this.findBookmarks(body, bookmarkStarts, bookmarkEnds)
            
            // Объединяем начала и концы закладок
            for (const id in bookmarkStarts) {
                const start = bookmarkStarts[id]
                const end = bookmarkEnds[id]
                
                if (start && end) {
                    bookmarks.push({
                        id: start.id,
                        name: start.name,
                        start: start.position,
                        end: end.position
                    })
                }
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse bookmarks:', error)
            }
        }
        
        return bookmarks
    }
    
    /**
     * Рекурсивно ищет закладки в XML
     * @param node - XML узел
     * @param bookmarkStarts - Объект с началами закладок
     * @param bookmarkEnds - Объект с концами закладок
     * @param depth - Текущая глубина рекурсии
     */
    private findBookmarks(
        node: any,
        bookmarkStarts: Record<string, { id: string; name: string; position: number }>,
        bookmarkEnds: Record<string, { id: string; position: number }>,
        depth: number = 0
    ): void {
        // Ограничиваем глубину рекурсии
        if (depth > 100) {
            return
        }
        
        // Проверяем, является ли узел началом закладки
        if (node.bookmarkStart) {
            const bookmarkStart = Array.isArray(node.bookmarkStart) 
                ? node.bookmarkStart 
                : [node.bookmarkStart]
            
            for (const bookmark of bookmarkStart) {
                const id = bookmark['@_id']
                const name = bookmark['@_name']
                
                if (id && name) {
                    bookmarkStarts[id] = {
                        id,
                        name,
                        position: this.getNodePosition(node)
                    }
                }
            }
        }
        
        // Проверяем, является ли узел концом закладки
        if (node.bookmarkEnd) {
            const bookmarkEnd = Array.isArray(node.bookmarkEnd) 
                ? node.bookmarkEnd 
                : [node.bookmarkEnd]
            
            for (const bookmark of bookmarkEnd) {
                const id = bookmark['@_id']
                
                if (id) {
                    bookmarkEnds[id] = {
                        id,
                        position: this.getNodePosition(node)
                    }
                }
            }
        }
        
        // Рекурсивно обходим все дочерние узлы
        for (const key in node) {
            if (typeof node[key] === 'object' && node[key] !== null) {
                if (Array.isArray(node[key])) {
                    for (const item of node[key]) {
                        this.findBookmarks(item, bookmarkStarts, bookmarkEnds, depth + 1)
                    }
                } else {
                    this.findBookmarks(node[key], bookmarkStarts, bookmarkEnds, depth + 1)
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
     * Создает HTML для закладки
     * @param bookmark - Закладка
     * @returns HTML закладки
     */
    public createBookmarkHtml(bookmark: IBookmark): string {
        return `<a id="${this.sanitizeBookmarkName(bookmark.name)}" class="bookmark"></a>`
    }
    
    /**
     * Создает HTML для ссылки на закладку
     * @param bookmarkName - Имя закладки
     * @param text - Текст ссылки
     * @returns HTML ссылки на закладку
     */
    public createBookmarkLinkHtml(bookmarkName: string, text: string): string {
        return `<a href="#${this.sanitizeBookmarkName(bookmarkName)}" class="bookmark-link">${text}</a>`
    }
    
    /**
     * Очищает имя закладки для использования в HTML
     * @param name - Имя закладки
     * @returns Очищенное имя закладки
     */
    private sanitizeBookmarkName(name: string): string {
        // Заменяем пробелы и специальные символы
        return name.replace(/[^a-zA-Z0-9]/g, '_')
    }
}

/**
 * Создает парсер закладок
 * @returns Экземпляр BookmarksParser
 */
export function createBookmarksParser(): BookmarksParser {
    return new BookmarksParser()
}
