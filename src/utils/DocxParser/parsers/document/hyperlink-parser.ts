import { BaseParser } from '../../base-parser'
import { DomType } from '@/types/document'

/**
 * Интерфейс для гиперссылки
 */
export interface IHyperlink {
    id: string
    target: string
    tooltip?: string
    anchor?: string
    children: any[]
}

/**
 * Парсер гиперссылок документа
 */
export class HyperlinkParser extends BaseParser {
    /**
     * Парсит гиперссылку из XML
     * @param hyperlinkXml - XML гиперссылки
     * @param relationships - Отношения документа
     * @returns Объект гиперссылки
     */
    public parseHyperlink(hyperlinkXml: any, relationships: Record<string, string>): IHyperlink | null {
        try {
            const id = hyperlinkXml['@_id']
            const anchor = hyperlinkXml['@_anchor']
            const tooltip = hyperlinkXml['@_tooltip']
            
            // Если нет ни id, ни anchor, то это не гиперссылка
            if (!id && !anchor) {
                return null
            }
            
            // Получаем целевой URL из отношений
            let target = ''
            if (id && relationships[id]) {
                target = relationships[id]
            }
            
            // Если есть якорь, но нет цели, то это внутренняя ссылка
            if (anchor && !target) {
                target = `#${anchor}`
            }
            
            // Парсим содержимое гиперссылки
            const children = this.parseHyperlinkContent(hyperlinkXml)
            
            return {
                id: id || '',
                target,
                tooltip,
                anchor,
                children
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse hyperlink:', error)
            }
            return null
        }
    }
    
    /**
     * Парсит содержимое гиперссылки
     * @param hyperlinkXml - XML гиперссылки
     * @returns Массив дочерних элементов
     */
    private parseHyperlinkContent(hyperlinkXml: any): any[] {
        const children: any[] = []
        
        try {
            // Парсим текстовые прогоны
            if (hyperlinkXml.r) {
                const runs = Array.isArray(hyperlinkXml.r) ? hyperlinkXml.r : [hyperlinkXml.r]
                
                for (const run of runs) {
                    // Парсим текст
                    if (run.t) {
                        children.push(this.createTextNode(run.t['#text'] || ''))
                    }
                    
                    // Парсим разрывы строк
                    if (run.br) {
                        children.push(this.createBreakNode('line'))
                    }
                    
                    // Парсим изображения
                    if (run.drawing) {
                        // Здесь должен быть вызов метода для парсинга изображения
                        // Например: const image = this.drawingParser.parseDrawing(run.drawing)
                        // if (image) children.push(image)
                        
                        // Для простоты, добавляем заглушку
                        children.push({
                            type: DomType.Image,
                            src: '',
                            alt: 'Image in hyperlink'
                        })
                    }
                }
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse hyperlink content:', error)
            }
        }
        
        return children
    }
    
    /**
     * Создает HTML для гиперссылки
     * @param hyperlink - Гиперссылка
     * @returns HTML гиперссылки
     */
    public createHyperlinkHtml(hyperlink: IHyperlink): string {
        // Проверяем, является ли ссылка внутренней (на закладку)
        const isInternalLink = hyperlink.target.startsWith('#')
        
        // Создаем атрибуты для ссылки
        const href = hyperlink.target
        const title = hyperlink.tooltip ? ` title="${this.escapeHtml(hyperlink.tooltip)}"` : ''
        const target = isInternalLink ? '' : ' target="_blank" rel="noopener noreferrer"'
        const className = isInternalLink ? 'internal-link' : 'external-link'
        
        // Рендерим содержимое ссылки
        const content = this.renderHyperlinkContent(hyperlink.children)
        
        return `<a href="${href}" class="${className}"${title}${target}>${content}</a>`
    }
    
    /**
     * Рендерит содержимое гиперссылки в HTML
     * @param children - Дочерние элементы гиперссылки
     * @returns HTML содержимого гиперссылки
     */
    private renderHyperlinkContent(children: any[]): string {
        let html = ''
        
        for (const child of children) {
            if (child.type === DomType.Text) {
                html += this.escapeHtml(child.text)
            } else if (child.type === DomType.Break) {
                html += '<br>'
            } else if (child.type === DomType.Image) {
                html += `<img src="${child.src}" alt="${child.alt || ''}" />`
            }
        }
        
        // Если содержимое пустое, используем URL в качестве текста ссылки
        if (!html.trim()) {
            html = '[Ссылка]'
        }
        
        return html
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
 * Создает парсер гиперссылок
 * @returns Экземпляр HyperlinkParser
 */
export function createHyperlinkParser(): HyperlinkParser {
    return new HyperlinkParser()
}
