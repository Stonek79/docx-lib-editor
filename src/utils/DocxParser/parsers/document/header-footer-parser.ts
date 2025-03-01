import { BaseParser } from '../../base-parser'
import { DomType, WmlHeaderFooter, WmlHeaderFooterReference, WmlHeaderFooterReferenceType } from '@/types/document'

/**
 * Тип колонтитула
 */
export enum HeaderFooterType {
    HEADER = 'header',
    FOOTER = 'footer'
}

/**
 * Тип ссылки на колонтитул
 */
export enum HeaderFooterReferenceType {
    DEFAULT = 'default',
    FIRST = 'first',
    EVEN = 'even'
}

/**
 * Интерфейс для ссылки на колонтитул
 */
export interface IHeaderFooterReference {
    type: HeaderFooterReferenceType
    id: string
}

/**
 * Интерфейс для колонтитула
 */
export interface IHeaderFooter {
    id: string
    type: HeaderFooterType
    children: any[]
    referenceType: HeaderFooterReferenceType
}

/**
 * Парсер колонтитулов документа
 */
export class HeaderFooterParser extends BaseParser {
    /**
     * Парсит ссылки на колонтитулы из документа
     * @param documentXml - XML документа
     * @returns Объект с ссылками на колонтитулы
     */
    public parseHeaderFooterReferences(documentXml: any): {
        headers: IHeaderFooterReference[]
        footers: IHeaderFooterReference[]
    } {
        const headers: IHeaderFooterReference[] = []
        const footers: IHeaderFooterReference[] = []
        
        try {
            const sectPr = this.findSectionProperties(documentXml)
            
            if (!sectPr) {
                return { headers, footers }
            }
            
            // Парсим ссылки на верхние колонтитулы
            if (sectPr.headerReference) {
                const headerRefs = Array.isArray(sectPr.headerReference) 
                    ? sectPr.headerReference 
                    : [sectPr.headerReference]
                
                for (const ref of headerRefs) {
                    const type = this.mapReferenceType(ref['@_type'])
                    const id = ref['@_id']
                    
                    if (type && id) {
                        headers.push({ type, id })
                    }
                }
            }
            
            // Парсим ссылки на нижние колонтитулы
            if (sectPr.footerReference) {
                const footerRefs = Array.isArray(sectPr.footerReference) 
                    ? sectPr.footerReference 
                    : [sectPr.footerReference]
                
                for (const ref of footerRefs) {
                    const type = this.mapReferenceType(ref['@_type'])
                    const id = ref['@_id']
                    
                    if (type && id) {
                        footers.push({ type, id })
                    }
                }
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse header/footer references:', error)
            }
        }
        
        return { headers, footers }
    }
    
    /**
     * Парсит колонтитулы документа
     * @param references - Ссылки на колонтитулы
     * @returns Массив колонтитулов
     */
    public async parseHeaderFooters(references: {
        headers: IHeaderFooterReference[]
        footers: IHeaderFooterReference[]
    }): Promise<IHeaderFooter[]> {
        const result: IHeaderFooter[] = []
        
        try {
            // Получаем отношения документа
            const relationshipsPath = 'word/_rels/document.xml.rels'
            const relationshipsXml = await this.loadXmlFile(relationshipsPath)
            
            if (!relationshipsXml || !relationshipsXml.Relationships) {
                return result
            }
            
            const relationships = relationshipsXml.Relationships.Relationship
            const relationshipsArray = Array.isArray(relationships) ? relationships : [relationships]
            
            // Парсим верхние колонтитулы
            for (const headerRef of references.headers) {
                const relationship = relationshipsArray.find(rel => rel['@_Id'] === headerRef.id)
                
                if (relationship) {
                    const target = relationship['@_Target']
                    const headerPath = `word/${target}`
                    
                    try {
                        const headerXml = await this.loadXmlFile(headerPath)
                        
                        if (headerXml && headerXml.hdr) {
                            const children = this.parseHeaderFooterContent(headerXml.hdr)
                            
                            result.push({
                                id: headerRef.id,
                                type: HeaderFooterType.HEADER,
                                children,
                                referenceType: headerRef.type
                            })
                        }
                    } catch (error) {
                        if (this.options.debug) {
                            console.warn(`Failed to parse header ${headerPath}:`, error)
                        }
                    }
                }
            }
            
            // Парсим нижние колонтитулы
            for (const footerRef of references.footers) {
                const relationship = relationshipsArray.find(rel => rel['@_Id'] === footerRef.id)
                
                if (relationship) {
                    const target = relationship['@_Target']
                    const footerPath = `word/${target}`
                    
                    try {
                        const footerXml = await this.loadXmlFile(footerPath)
                        
                        if (footerXml && footerXml.ftr) {
                            const children = this.parseHeaderFooterContent(footerXml.ftr)
                            
                            result.push({
                                id: footerRef.id,
                                type: HeaderFooterType.FOOTER,
                                children,
                                referenceType: footerRef.type
                            })
                        }
                    } catch (error) {
                        if (this.options.debug) {
                            console.warn(`Failed to parse footer ${footerPath}:`, error)
                        }
                    }
                }
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse headers and footers:', error)
            }
        }
        
        return result
    }
    
    /**
     * Парсит содержимое колонтитула
     * @param headerFooterXml - XML колонтитула
     * @returns Массив дочерних элементов
     */
    private parseHeaderFooterContent(headerFooterXml: any): any[] {
        const children: any[] = []
        
        try {
            // Парсим параграфы
            if (headerFooterXml.p) {
                const paragraphs = Array.isArray(headerFooterXml.p) 
                    ? headerFooterXml.p 
                    : [headerFooterXml.p]
                
                for (const paragraph of paragraphs) {
                    // Здесь должен быть вызов метода для парсинга параграфа
                    // Например: const parsedParagraph = this.paragraphParser.parseParagraph(paragraph)
                    // children.push(parsedParagraph)
                    
                    // Для простоты, добавляем заглушку
                    children.push({
                        type: DomType.Paragraph,
                        children: this.parseHeaderFooterParagraph(paragraph)
                    })
                }
            }
            
            // Парсим таблицы
            if (headerFooterXml.tbl) {
                const tables = Array.isArray(headerFooterXml.tbl) 
                    ? headerFooterXml.tbl 
                    : [headerFooterXml.tbl]
                
                for (const table of tables) {
                    // Здесь должен быть вызов метода для парсинга таблицы
                    // Например: const parsedTable = this.tableParser.parseTable(table)
                    // children.push(parsedTable)
                    
                    // Для простоты, добавляем заглушку
                    children.push({
                        type: DomType.Table,
                        children: []
                    })
                }
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse header/footer content:', error)
            }
        }
        
        return children
    }
    
    /**
     * Парсит параграф колонтитула
     * @param paragraphXml - XML параграфа
     * @returns Массив дочерних элементов
     */
    private parseHeaderFooterParagraph(paragraphXml: any): any[] {
        const children: any[] = []
        
        try {
            // Парсим текстовые прогоны
            if (paragraphXml.r) {
                const runs = Array.isArray(paragraphXml.r) 
                    ? paragraphXml.r 
                    : [paragraphXml.r]
                
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
                console.warn('Failed to parse header/footer paragraph:', error)
            }
        }
        
        return children
    }
    
    /**
     * Находит свойства секции в документе
     * @param documentXml - XML документа
     * @returns Свойства секции или undefined
     */
    private findSectionProperties(documentXml: any): any {
        try {
            if (documentXml.document?.body?.sectPr) {
                return documentXml.document.body.sectPr
            }
            
            // Ищем в последнем параграфе
            if (documentXml.document?.body?.p) {
                const paragraphs = documentXml.document.body.p
                const lastParagraph = Array.isArray(paragraphs) 
                    ? paragraphs[paragraphs.length - 1] 
                    : paragraphs
                
                if (lastParagraph.pPr?.sectPr) {
                    return lastParagraph.pPr.sectPr
                }
            }
        } catch (error) {
            // Игнорируем ошибки
        }
        
        return undefined
    }
    
    /**
     * Преобразует тип ссылки из XML в HeaderFooterReferenceType
     * @param xmlType - Тип ссылки из XML
     * @returns Соответствующий HeaderFooterReferenceType
     */
    private mapReferenceType(xmlType: string): HeaderFooterReferenceType {
        switch (xmlType) {
            case 'first':
                return HeaderFooterReferenceType.FIRST
            case 'even':
                return HeaderFooterReferenceType.EVEN
            case 'default':
            default:
                return HeaderFooterReferenceType.DEFAULT
        }
    }
    
    /**
     * Создает объект WmlHeaderFooterReference
     * @param id - Идентификатор колонтитула
     * @param type - Тип ссылки на колонтитул
     * @returns Объект WmlHeaderFooterReference
     */
    public createHeaderFooterReference(
        id: string, 
        type: HeaderFooterReferenceType
    ): WmlHeaderFooterReference {
        const referenceType = type === HeaderFooterReferenceType.FIRST
            ? WmlHeaderFooterReferenceType.FIRST
            : type === HeaderFooterReferenceType.EVEN
                ? WmlHeaderFooterReferenceType.EVEN
                : WmlHeaderFooterReferenceType.DEFAULT
        
        return {
            id,
            type: referenceType
        }
    }
    
    /**
     * Создает объект WmlHeaderFooter
     * @param type - Тип колонтитула
     * @param children - Дочерние элементы
     * @returns Объект WmlHeaderFooter
     */
    public createHeaderFooter(
        type: HeaderFooterType, 
        children: any[]
    ): WmlHeaderFooter {
        return {
            type: type === HeaderFooterType.HEADER ? DomType.HEADER : DomType.FOOTER,
            children
        }
    }
}

/**
 * Создает парсер колонтитулов
 * @returns Экземпляр HeaderFooterParser
 */
export function createHeaderFooterParser(): HeaderFooterParser {
    return new HeaderFooterParser()
}
