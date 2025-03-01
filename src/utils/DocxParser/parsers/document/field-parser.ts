import { BaseParser } from '../../base-parser'
import { DomType } from '@/types/document'

/**
 * Типы полей документа
 */
export enum FieldType {
    HYPERLINK = 'HYPERLINK',
    PAGE = 'PAGE',
    NUMPAGES = 'NUMPAGES',
    DATE = 'DATE',
    TIME = 'TIME',
    REF = 'REF',
    PAGEREF = 'PAGEREF',
    TOC = 'TOC',
    AUTHOR = 'AUTHOR',
    TITLE = 'TITLE',
    SUBJECT = 'SUBJECT',
    COMMENTS = 'COMMENTS',
    CREATEDATE = 'CREATEDATE',
    SAVEDATE = 'SAVEDATE',
    PRINTDATE = 'PRINTDATE',
    EDITTIME = 'EDITTIME',
    FILENAME = 'FILENAME',
    FILESIZE = 'FILESIZE',
    NUMWORDS = 'NUMWORDS',
    NUMCHARS = 'NUMCHARS',
    UNKNOWN = 'UNKNOWN'
}

/**
 * Интерфейс для поля документа
 */
export interface IField {
    type: FieldType
    instruction: string
    parameters: Record<string, string>
    children: any[]
}

/**
 * Парсер полей документа
 */
export class FieldParser extends BaseParser {
    /**
     * Парсит поле документа
     * @param fieldXml - XML поля
     * @returns Объект поля
     */
    public parseField(fieldXml: any): IField | null {
        try {
            // Получаем инструкцию поля
            const instruction = this.getFieldInstruction(fieldXml)
            if (!instruction) {
                return null
            }
            
            // Определяем тип поля и его параметры
            const { type, parameters } = this.parseFieldInstruction(instruction)
            
            // Парсим содержимое поля
            const children = this.parseFieldContent(fieldXml)
            
            return {
                type,
                instruction,
                parameters,
                children
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse field:', error)
            }
            return null
        }
    }
    
    /**
     * Получает инструкцию поля
     * @param fieldXml - XML поля
     * @returns Инструкция поля
     */
    private getFieldInstruction(fieldXml: any): string | null {
        try {
            // Проверяем наличие инструкции
            if (fieldXml.instrText) {
                return fieldXml.instrText['#text'] || ''
            }
            
            // Если инструкция находится в дочернем элементе
            if (fieldXml.r) {
                const runs = Array.isArray(fieldXml.r) ? fieldXml.r : [fieldXml.r]
                
                for (const run of runs) {
                    if (run.instrText) {
                        return run.instrText['#text'] || ''
                    }
                }
            }
            
            return null
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to get field instruction:', error)
            }
            return null
        }
    }
    
    /**
     * Парсит инструкцию поля
     * @param instruction - Инструкция поля
     * @returns Тип поля и его параметры
     */
    private parseFieldInstruction(instruction: string): { type: FieldType; parameters: Record<string, string> } {
        const parameters: Record<string, string> = {}
        let fieldType = FieldType.UNKNOWN
        
        try {
            // Удаляем лишние пробелы
            const cleanInstruction = instruction.trim()
            
            // Разбиваем инструкцию на части
            const parts = cleanInstruction.split(/\s+/)
            
            // Первая часть - тип поля
            if (parts.length > 0) {
                const typeStr = parts[0].toUpperCase()
                
                // Проверяем, является ли тип известным
                if (Object.values(FieldType).includes(typeStr as FieldType)) {
                    fieldType = typeStr as FieldType
                }
            }
            
            // Парсим параметры в зависимости от типа поля
            switch (fieldType) {
                case FieldType.HYPERLINK:
                    this.parseHyperlinkParameters(cleanInstruction, parameters)
                    break
                case FieldType.REF:
                case FieldType.PAGEREF:
                    this.parseRefParameters(cleanInstruction, parameters)
                    break
                case FieldType.TOC:
                    this.parseTocParameters(cleanInstruction, parameters)
                    break
                default:
                    // Для других типов полей просто сохраняем всю инструкцию
                    parameters['instruction'] = cleanInstruction
                    break
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse field instruction:', error)
            }
        }
        
        return { type: fieldType, parameters }
    }
    
    /**
     * Парсит параметры гиперссылки
     * @param instruction - Инструкция поля
     * @param parameters - Объект для сохранения параметров
     */
    private parseHyperlinkParameters(instruction: string, parameters: Record<string, string>): void {
        try {
            // Формат: HYPERLINK "url" [\\l "bookmark"] [\\o "tooltip"] [\\t "target"]
            
            // Извлекаем URL
            const urlMatch = instruction.match(/HYPERLINK\s+"([^"]+)"/)
            if (urlMatch && urlMatch[1]) {
                parameters['url'] = urlMatch[1]
            }
            
            // Извлекаем закладку
            const bookmarkMatch = instruction.match(/\\l\s+"([^"]+)"/)
            if (bookmarkMatch && bookmarkMatch[1]) {
                parameters['bookmark'] = bookmarkMatch[1]
            }
            
            // Извлекаем подсказку
            const tooltipMatch = instruction.match(/\\o\s+"([^"]+)"/)
            if (tooltipMatch && tooltipMatch[1]) {
                parameters['tooltip'] = tooltipMatch[1]
            }
            
            // Извлекаем цель
            const targetMatch = instruction.match(/\\t\s+"([^"]+)"/)
            if (targetMatch && targetMatch[1]) {
                parameters['target'] = targetMatch[1]
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse hyperlink parameters:', error)
            }
        }
    }
    
    /**
     * Парсит параметры ссылки на закладку
     * @param instruction - Инструкция поля
     * @param parameters - Объект для сохранения параметров
     */
    private parseRefParameters(instruction: string, parameters: Record<string, string>): void {
        try {
            // Формат: REF/PAGEREF BookmarkName [\\h] [\\p]
            
            // Извлекаем имя закладки
            const bookmarkMatch = instruction.match(/(?:REF|PAGEREF)\s+([^\s\\]+)/)
            if (bookmarkMatch && bookmarkMatch[1]) {
                parameters['bookmark'] = bookmarkMatch[1]
            }
            
            // Проверяем наличие флага гиперссылки
            if (instruction.includes('\\h')) {
                parameters['hyperlink'] = 'true'
            }
            
            // Проверяем наличие флага номера страницы
            if (instruction.includes('\\p')) {
                parameters['page'] = 'true'
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse ref parameters:', error)
            }
        }
    }
    
    /**
     * Парсит параметры оглавления
     * @param instruction - Инструкция поля
     * @param parameters - Объект для сохранения параметров
     */
    private parseTocParameters(instruction: string, parameters: Record<string, string>): void {
        try {
            // Формат: TOC [\\o "levels"] [\\h] [\\w] [\\z] [\\u]
            
            // Извлекаем уровни
            const levelsMatch = instruction.match(/\\o\s+"([^"]+)"/)
            if (levelsMatch && levelsMatch[1]) {
                parameters['levels'] = levelsMatch[1]
            }
            
            // Проверяем наличие флага гиперссылки
            if (instruction.includes('\\h')) {
                parameters['hyperlink'] = 'true'
            }
            
            // Проверяем наличие флага номеров страниц
            if (instruction.includes('\\w')) {
                parameters['webHiding'] = 'true'
            }
            
            // Проверяем наличие флага скрытия табуляции
            if (instruction.includes('\\z')) {
                parameters['hideTabLeader'] = 'true'
            }
            
            // Проверяем наличие флага использования стилей
            if (instruction.includes('\\u')) {
                parameters['useStyles'] = 'true'
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse toc parameters:', error)
            }
        }
    }
    
    /**
     * Парсит содержимое поля
     * @param fieldXml - XML поля
     * @returns Массив дочерних элементов
     */
    private parseFieldContent(fieldXml: any): any[] {
        const children: any[] = []
        
        try {
            // Парсим текстовые прогоны
            if (fieldXml.r) {
                const runs = Array.isArray(fieldXml.r) ? fieldXml.r : [fieldXml.r]
                
                for (const run of runs) {
                    // Пропускаем инструкции
                    if (run.instrText) {
                        continue
                    }
                    
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
                console.warn('Failed to parse field content:', error)
            }
        }
        
        return children
    }
    
    /**
     * Создает HTML для поля
     * @param field - Поле
     * @returns HTML поля
     */
    public createFieldHtml(field: IField): string {
        switch (field.type) {
            case FieldType.HYPERLINK:
                return this.createHyperlinkFieldHtml(field)
            case FieldType.PAGE:
                return this.createPageFieldHtml()
            case FieldType.NUMPAGES:
                return this.createNumPagesFieldHtml()
            case FieldType.REF:
            case FieldType.PAGEREF:
                return this.createRefFieldHtml(field)
            case FieldType.TOC:
                return this.createTocFieldHtml(field)
            default:
                return this.createDefaultFieldHtml(field)
        }
    }
    
    /**
     * Создает HTML для поля гиперссылки
     * @param field - Поле
     * @returns HTML поля
     */
    private createHyperlinkFieldHtml(field: IField): string {
        const url = field.parameters['url'] || ''
        const bookmark = field.parameters['bookmark'] || ''
        const tooltip = field.parameters['tooltip'] || ''
        const target = field.parameters['target'] || ''
        
        // Определяем href
        let href = url
        if (bookmark) {
            href = `#${bookmark}`
        }
        
        // Определяем атрибуты
        const titleAttr = tooltip ? ` title="${this.escapeHtml(tooltip)}"` : ''
        const targetAttr = target ? ` target="${target}"` : ' target="_blank"'
        
        // Рендерим содержимое
        const content = this.renderFieldContent(field.children)
        
        return `<a href="${href}" class="field-hyperlink"${titleAttr}${targetAttr}>${content}</a>`
    }
    
    /**
     * Создает HTML для поля номера страницы
     * @returns HTML поля
     */
    private createPageFieldHtml(): string {
        return '<span class="field-page">{PAGE}</span>'
    }
    
    /**
     * Создает HTML для поля количества страниц
     * @returns HTML поля
     */
    private createNumPagesFieldHtml(): string {
        return '<span class="field-numpages">{NUMPAGES}</span>'
    }
    
    /**
     * Создает HTML для поля ссылки на закладку
     * @param field - Поле
     * @returns HTML поля
     */
    private createRefFieldHtml(field: IField): string {
        const bookmark = field.parameters['bookmark'] || ''
        const isHyperlink = field.parameters['hyperlink'] === 'true'
        const isPage = field.parameters['page'] === 'true'
        
        // Рендерим содержимое
        const content = this.renderFieldContent(field.children)
        
        if (isHyperlink) {
            return `<a href="#${bookmark}" class="field-ref">${content}</a>`
        } else {
            const className = isPage ? 'field-pageref' : 'field-ref'
            return `<span class="${className}" data-bookmark="${bookmark}">${content}</span>`
        }
    }
    
    /**
     * Создает HTML для поля оглавления
     * @param field - Поле
     * @returns HTML поля
     */
    private createTocFieldHtml(field: IField): string {
        // В реальном приложении здесь должна быть логика генерации оглавления
        return '<div class="field-toc">{TOC}</div>'
    }
    
    /**
     * Создает HTML для поля по умолчанию
     * @param field - Поле
     * @returns HTML поля
     */
    private createDefaultFieldHtml(field: IField): string {
        // Рендерим содержимое
        const content = this.renderFieldContent(field.children)
        
        return `<span class="field field-${field.type.toLowerCase()}">${content}</span>`
    }
    
    /**
     * Рендерит содержимое поля в HTML
     * @param children - Дочерние элементы поля
     * @returns HTML содержимого поля
     */
    private renderFieldContent(children: any[]): string {
        let html = ''
        
        for (const child of children) {
            if (child.type === DomType.Text) {
                html += this.escapeHtml(child.text)
            } else if (child.type === DomType.Break) {
                html += '<br>'
            }
        }
        
        // Если содержимое пустое, используем заглушку
        if (!html.trim()) {
            html = '{Field}'
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
 * Создает парсер полей
 * @returns Экземпляр FieldParser
 */
export function createFieldParser(): FieldParser {
    return new FieldParser()
}
