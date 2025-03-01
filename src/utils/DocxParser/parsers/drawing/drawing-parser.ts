import { BaseParser } from '../../base-parser'
import { DomType, WmlDrawing } from '@/types/document'
import { Relationship } from '@/types/relationships'
import { RelationshipParser } from '../relationship-parser'

/**
 * Парсер графических объектов документа Word
 * Обрабатывает элементы w:drawing, включая:
 * - Встроенные изображения (w:inline)
 * - Плавающие изображения (w:anchor)
 * - Фигуры (w:shape)
 * - Диаграммы (w:chart)
 */
export class DrawingParser extends BaseParser {
    private relationshipParser: RelationshipParser

    constructor() {
        super()
        this.relationshipParser = new RelationshipParser()
    }

    /**
     * Парсит графический объект
     * @param element - XML элемент графического объекта
     * @param relationships - Map связей документа
     * @returns Объект графического элемента
     */
    public parse(
        element: any,
        relationships: Map<string, Relationship>
    ): WmlDrawing | null {
        const drawing = element['w:drawing']
        if (!drawing) return null

        // Проверяем тип графического объекта (встроенный или плавающий)
        const inline = drawing['wp:inline']
        const anchor = drawing['wp:anchor']
        const graphicData = inline?.['a:graphic']?.['a:graphicData'] || 
                          anchor?.['a:graphic']?.['a:graphicData']

        if (!graphicData) return null

        // Получаем размеры
        const extent = inline?.['wp:extent'] || anchor?.['wp:extent']
        const width = extent?.['@_cx'] ? Number(extent['@_cx']) / 9525 : undefined // конвертируем EMU в пункты
        const height = extent?.['@_cy'] ? Number(extent['@_cy']) / 9525 : undefined

        // Получаем описание и имя
        const docPr = inline?.['wp:docPr'] || anchor?.['wp:docPr']
        const name = docPr?.['@_name']
        const description = docPr?.['@_descr']

        // Обрабатываем различные типы графических данных
        if (graphicData['pic:pic']) {
            // Изображение
            return this.parsePicture(
                graphicData['pic:pic'],
                relationships,
                { width, height, name, description }
            )
        } else if (graphicData['c:chart']) {
            // Диаграмма
            return this.parseChart(
                graphicData['c:chart'],
                relationships,
                { width, height, name, description }
            )
        }

        return null
    }

    /**
     * Парсит изображение
     * @param picture - XML элемент изображения
     * @param relationships - Map связей документа
     * @param options - Дополнительные параметры (размеры, имя, описание)
     */
    private parsePicture(
        picture: any,
        relationships: Map<string, Relationship>,
        options: { width?: number; height?: number; name?: string; description?: string }
    ): WmlDrawing {
        const blip = picture['pic:blipFill']?.['a:blip']
        const relationshipId = blip?.['@_r:embed'] || blip?.['@_r:link']
        
        return {
            type: DomType.DRAWING,
            id: relationshipId || '',
            name: options.name,
            description: options.description,
            width: options.width,
            height: options.height,
            target: relationshipId 
                ? this.relationshipParser.getTargetById(relationships, relationshipId)
                : ''
        }
    }

    /**
     * Парсит диаграмму
     * @param chart - XML элемент диаграммы
     * @param relationships - Map связей документа
     * @param options - Дополнительные параметры (размеры, имя, описание)
     */
    private parseChart(
        chart: any,
        relationships: Map<string, Relationship>,
        options: { width?: number; height?: number; name?: string; description?: string }
    ): WmlDrawing {
        const relationshipId = chart?.['@_r:id']
        
        return {
            type: DomType.DRAWING,
            id: relationshipId || '',
            name: options.name,
            description: options.description,
            width: options.width,
            height: options.height,
            target: relationshipId 
                ? this.relationshipParser.getTargetById(relationships, relationshipId)
                : ''
        }
    }

    /**
     * Проверяет, является ли элемент графическим объектом
     * @param element - XML элемент для проверки
     */
    public isDrawing(element: any): boolean {
        return 'w:drawing' in element
    }
}
