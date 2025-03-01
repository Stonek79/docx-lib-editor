import { BaseParser } from '../../base-parser'
import { DomType, WmlHyperlink, OpenXmlElement } from '@/types/document'
import { RelationshipParser } from '../relationship-parser'
import { Relationship } from '@/types/relationships'

/**
 * Парсер гиперссылок документа Word
 * Обрабатывает элементы w:hyperlink
 */
export class HyperlinkParser extends BaseParser {
    private relationshipParser: RelationshipParser

    constructor() {
        super()
        this.relationshipParser = new RelationshipParser()
    }

    /**
     * Парсит гиперссылку из XML элемента
     * @param element - XML элемент гиперссылки
     * @param contentParser - Функция для парсинга содержимого гиперссылки
     * @param relationships - Map связей документа
     * @returns Объект гиперссылки
     */
    public parse(
        element: any,
        contentParser: (element: any) => OpenXmlElement | null,
        relationships: Map<string, Relationship>,
    ): WmlHyperlink {
        const hyperlink = element['w:hyperlink']
        const relationshipId = hyperlink?.['@_r:id']
        const tooltip = hyperlink?.['@_w:tooltip']

        // Получаем целевой URL из relationships
        const target = relationshipId
            ? this.relationshipParser.getTargetById(
                  relationships,
                  relationshipId,
              )
            : ''

        // Парсим содержимое гиперссылки
        const children: OpenXmlElement[] = []
        if (hyperlink) {
            const runs = hyperlink['w:r'] || []
            if (Array.isArray(runs)) {
                runs.forEach((run) => {
                    const parsed = contentParser(run)
                    if (parsed) children.push(parsed)
                })
            } else if (runs) {
                const parsed = contentParser(runs)
                if (parsed) children.push(parsed)
            }
        }

        return {
            type: DomType.HYPERLINK,
            target,
            tooltip,
            children,
        }
    }

    /**
     * Проверяет, является ли элемент гиперссылкой
     * @param element - XML элемент для проверки
     */
    public isHyperlink(element: any): boolean {
        return 'w:hyperlink' in element
    }
}
