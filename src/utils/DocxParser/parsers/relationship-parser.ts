import { BaseParser } from '../base-parser'
import { Relationship } from '@/types/relationships'

/**
 * Парсер отношений DOCX документа.
 * Отвечает за:
 * - Извлечение связей между частями документа из .rels файлов
 * - Обработку внешних и внутренних ссылок
 * - Связывание изображений, стилей и других ресурсов с документом
 * - Поддержку целостности структуры документа
 */
export class RelationshipParser extends BaseParser {
    /**
     * Парсит XML содержимое файла отношений
     * @param xmlContent - XML содержимое .rels файла
     * @returns Map отношений, где ключ - это ID отношения
     */
    async parse(xmlContent: string): Promise<Map<string, Relationship>> {
        const relationships = new Map<string, Relationship>()
        const rels = this.xmlParser.parse(xmlContent)
        const relationshipElements =
            rels?.['Relationships']?.['Relationship'] || []

        for (const rel of Array.isArray(relationshipElements)
            ? relationshipElements
            : [relationshipElements]) {
            const id = rel['@_Id']
            if (!id) continue

            relationships.set(id, {
                id,
                type: rel['@_Type'],
                target: rel['@_Target'],
                targetMode: rel['@_TargetMode'],
            })
        }

        return relationships
    }

    /**
     * Получает целевой URL по ID отношения
     * @param relationships - Map отношений
     * @param id - ID отношения
     * @returns Целевой URL или пустую строку, если отношение не найдено
     */
    public getTargetById(
        relationships: Map<string, Relationship>,
        id: string,
    ): string {
        const relationship = relationships.get(id)
        return relationship?.target || ''
    }

    /**
     * Получает тип отношения по ID
     * @param relationships - Map отношений
     * @param id - ID отношения
     * @returns Тип отношения или undefined, если отношение не найдено
     */
    public getTypeById(
        relationships: Map<string, Relationship>,
        id: string,
    ): string | undefined {
        return relationships.get(id)?.type
    }

    /**
     * Проверяет, является ли отношение внешним
     * @param relationships - Map отношений
     * @param id - ID отношения
     * @returns true, если отношение внешнее (targetMode === 'External')
     */
    public isExternalTarget(
        relationships: Map<string, Relationship>,
        id: string,
    ): boolean {
        return relationships.get(id)?.targetMode === 'External'
    }
}
