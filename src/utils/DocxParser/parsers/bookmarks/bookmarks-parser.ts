import { BaseParser } from '../../base-parser'
import { DomType, WmlBookmark, OpenXmlElement } from '@/types/document'

/**
 * Парсер закладок документа Word
 * Обрабатывает элементы w:bookmarkStart и w:bookmarkEnd
 */
export class BookmarksParser extends BaseParser {
    /**
     * Парсит закладку из XML элемента
     * @param element - XML элемент закладки
     * @returns Объект закладки
     */
    public parseBookmarkStart(element: any): WmlBookmark {
        return {
            type: DomType.BOOKMARK,
            id: element['@_w:id'] || '',
            name: element['@_w:name'] || '',
        }
    }

    /**
     * Проверяет, является ли элемент началом закладки
     * @param element - XML элемент для проверки
     */
    public isBookmarkStart(element: any): boolean {
        return 'w:bookmarkStart' in element
    }

    /**
     * Проверяет, является ли элемент концом закладки
     * @param element - XML элемент для проверки
     */
    public isBookmarkEnd(element: any): boolean {
        return 'w:bookmarkEnd' in element
    }

    /**
     * Получает ID закладки из элемента конца закладки
     * @param element - XML элемент конца закладки
     */
    public getBookmarkEndId(element: any): string {
        return element['w:bookmarkEnd']?.['@_w:id'] || ''
    }

    /**
     * Парсит содержимое между началом и концом закладки
     * @param elements - Массив XML элементов между началом и концом закладки
     * @param contentParser - Функция для парсинга содержимого
     * @returns Массив распарсенных элементов
     */
    public parseBookmarkContent(
        elements: any[],
        contentParser: (element: any) => OpenXmlElement | null
    ): OpenXmlElement[] {
        const content: OpenXmlElement[] = []
        
        for (const element of elements) {
            const parsed = contentParser(element)
            if (parsed) {
                content.push(parsed)
            }
        }

        return content
    }
}
