import { BaseParser } from '../../base-parser'
import { DomType } from '@/types/document'

/**
 * Тип графического объекта
 */
export enum DrawingType {
    INLINE = 'inline',
    ANCHOR = 'anchor'
}

/**
 * Интерфейс для размеров изображения
 */
export interface IImageSize {
    width: number
    height: number
    widthType: string
    heightType: string
}

/**
 * Интерфейс для графического объекта
 */
export interface IDrawing {
    type: DrawingType
    id: string
    name: string
    description: string
    relationshipId: string
    size: IImageSize
    position?: {
        x: number
        y: number
        relativeFrom: {
            x: string
            y: string
        }
    }
    wrapping?: string
    behindDoc?: boolean
}

/**
 * Парсер графических объектов документа
 */
export class DrawingParser extends BaseParser {
    /**
     * Парсит графический объект из XML
     * @param drawingXml - XML графического объекта
     * @returns Объект графического объекта
     */
    public parseDrawing(drawingXml: any): IDrawing | null {
        try {
            // Определяем тип графического объекта (inline или anchor)
            if (drawingXml.inline) {
                return this.parseInlineDrawing(drawingXml.inline)
            } else if (drawingXml.anchor) {
                return this.parseAnchorDrawing(drawingXml.anchor)
            }
            
            return null
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse drawing:', error)
            }
            return null
        }
    }
    
    /**
     * Парсит встроенный графический объект
     * @param inlineXml - XML встроенного графического объекта
     * @returns Объект графического объекта
     */
    private parseInlineDrawing(inlineXml: any): IDrawing | null {
        try {
            // Получаем информацию о графическом объекте
            const docPr = inlineXml.docPr
            if (!docPr) {
                return null
            }
            
            const id = docPr['@_id'] || ''
            const name = docPr['@_name'] || ''
            const description = docPr['@_descr'] || ''
            
            // Получаем размеры
            const extent = inlineXml.extent
            const size = this.parseSize(extent)
            
            // Получаем идентификатор отношения
            const blip = this.findBlip(inlineXml)
            const relationshipId = blip?.['@_embed'] || ''
            
            return {
                type: DrawingType.INLINE,
                id,
                name,
                description,
                relationshipId,
                size
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse inline drawing:', error)
            }
            return null
        }
    }
    
    /**
     * Парсит привязанный графический объект
     * @param anchorXml - XML привязанного графического объекта
     * @returns Объект графического объекта
     */
    private parseAnchorDrawing(anchorXml: any): IDrawing | null {
        try {
            // Получаем информацию о графическом объекте
            const docPr = anchorXml.docPr
            if (!docPr) {
                return null
            }
            
            const id = docPr['@_id'] || ''
            const name = docPr['@_name'] || ''
            const description = docPr['@_descr'] || ''
            
            // Получаем размеры
            const extent = anchorXml.extent
            const size = this.parseSize(extent)
            
            // Получаем идентификатор отношения
            const blip = this.findBlip(anchorXml)
            const relationshipId = blip?.['@_embed'] || ''
            
            // Получаем информацию о позиции
            const position = this.parsePosition(anchorXml)
            
            // Получаем информацию о обтекании
            const wrapping = this.parseWrapping(anchorXml)
            
            // Проверяем, находится ли объект за текстом
            const behindDoc = anchorXml.behindDoc?.['@_val'] === '1'
            
            return {
                type: DrawingType.ANCHOR,
                id,
                name,
                description,
                relationshipId,
                size,
                position,
                wrapping,
                behindDoc
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse anchor drawing:', error)
            }
            return null
        }
    }
    
    /**
     * Парсит размеры графического объекта
     * @param extentXml - XML размеров
     * @returns Объект размеров
     */
    private parseSize(extentXml: any): IImageSize {
        const defaultSize: IImageSize = {
            width: 0,
            height: 0,
            widthType: 'dxa',
            heightType: 'dxa'
        }
        
        if (!extentXml) {
            return defaultSize
        }
        
        // Получаем размеры в EMU (English Metric Units)
        // 1 дюйм = 914400 EMU, 1 см = 360000 EMU
        const width = parseInt(extentXml['@_cx'] || '0', 10)
        const height = parseInt(extentXml['@_cy'] || '0', 10)
        
        // Конвертируем EMU в пункты (1 пункт = 12700 EMU)
        const widthPt = Math.round(width / 12700)
        const heightPt = Math.round(height / 12700)
        
        return {
            width: widthPt,
            height: heightPt,
            widthType: 'pt',
            heightType: 'pt'
        }
    }
    
    /**
     * Парсит позицию графического объекта
     * @param anchorXml - XML привязанного графического объекта
     * @returns Объект позиции
     */
    private parsePosition(anchorXml: any): { x: number; y: number; relativeFrom: { x: string; y: string } } | undefined {
        try {
            const positionH = anchorXml.positionH
            const positionV = anchorXml.positionV
            
            if (!positionH || !positionV) {
                return undefined
            }
            
            // Получаем информацию о горизонтальной позиции
            const x = parseInt(positionH.posOffset || '0', 10)
            const relativeFromX = positionH['@_relativeFrom'] || 'column'
            
            // Получаем информацию о вертикальной позиции
            const y = parseInt(positionV.posOffset || '0', 10)
            const relativeFromY = positionV['@_relativeFrom'] || 'paragraph'
            
            return {
                x: Math.round(x / 12700), // Конвертируем EMU в пункты
                y: Math.round(y / 12700), // Конвертируем EMU в пункты
                relativeFrom: {
                    x: relativeFromX,
                    y: relativeFromY
                }
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse position:', error)
            }
            return undefined
        }
    }
    
    /**
     * Парсит тип обтекания графического объекта
     * @param anchorXml - XML привязанного графического объекта
     * @returns Тип обтекания
     */
    private parseWrapping(anchorXml: any): string | undefined {
        try {
            if (anchorXml.wrapNone) {
                return 'none'
            } else if (anchorXml.wrapSquare) {
                return 'square'
            } else if (anchorXml.wrapTight) {
                return 'tight'
            } else if (anchorXml.wrapThrough) {
                return 'through'
            } else if (anchorXml.wrapTopAndBottom) {
                return 'topAndBottom'
            }
            
            return undefined
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse wrapping:', error)
            }
            return undefined
        }
    }
    
    /**
     * Находит элемент blip в графическом объекте
     * @param drawingXml - XML графического объекта
     * @returns Элемент blip
     */
    private findBlip(drawingXml: any): any {
        try {
            // Путь к blip: graphic -> graphicData -> pic -> blipFill -> blip
            const graphic = drawingXml.graphic
            if (!graphic) {
                return null
            }
            
            const graphicData = graphic.graphicData
            if (!graphicData) {
                return null
            }
            
            const pic = graphicData.pic
            if (!pic) {
                return null
            }
            
            const blipFill = pic.blipFill
            if (!blipFill) {
                return null
            }
            
            return blipFill.blip
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to find blip:', error)
            }
            return null
        }
    }
    
    /**
     * Создает HTML для изображения
     * @param drawing - Графический объект
     * @param imageSrc - URL изображения
     * @returns HTML изображения
     */
    public createImageHtml(drawing: IDrawing, imageSrc: string): string {
        // Создаем атрибуты для изображения
        const id = drawing.id ? ` id="img-${drawing.id}"` : ''
        const alt = drawing.description ? ` alt="${this.escapeHtml(drawing.description)}"` : ' alt=""'
        const title = drawing.name ? ` title="${this.escapeHtml(drawing.name)}"` : ''
        
        // Создаем стили для изображения
        let style = ''
        
        if (drawing.size) {
            style += `width: ${drawing.size.width}${drawing.size.widthType}; `
            style += `height: ${drawing.size.height}${drawing.size.heightType}; `
        }
        
        // Добавляем стили для позиционирования, если это привязанный объект
        if (drawing.type === DrawingType.ANCHOR) {
            // Добавляем стили для позиции
            if (drawing.position) {
                style += `position: absolute; `
                style += `left: ${drawing.position.x}pt; `
                style += `top: ${drawing.position.y}pt; `
            }
            
            // Добавляем стили для обтекания
            if (drawing.wrapping) {
                switch (drawing.wrapping) {
                    case 'none':
                        style += `float: none; `
                        break
                    case 'square':
                    case 'tight':
                    case 'through':
                        style += `float: left; `
                        break
                    case 'topAndBottom':
                        style += `display: block; margin: 0 auto; `
                        break
                }
            }
            
            // Добавляем стили для объекта за текстом
            if (drawing.behindDoc) {
                style += `z-index: -1; `
            }
        }
        
        // Создаем класс для изображения
        let className = 'docx-image'
        if (drawing.type === DrawingType.INLINE) {
            className += ' inline-image'
        } else if (drawing.type === DrawingType.ANCHOR) {
            className += ' anchored-image'
            
            if (drawing.wrapping) {
                className += ` wrap-${drawing.wrapping}`
            }
            
            if (drawing.behindDoc) {
                className += ' behind-doc'
            }
        }
        
        // Создаем HTML для изображения
        return `<img src="${imageSrc}"${id} class="${className}"${alt}${title} style="${style}" />`
    }
    
    /**
     * Экранирует HTML-символы
     * @param text - Текст для экранирования
     * @returns Экранированный текст
     */
    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
    }
}

/**
 * Создает парсер графических объектов
 * @returns Экземпляр DrawingParser
 */
export function createDrawingParser(): DrawingParser {
    return new DrawingParser()
}
