import { BaseParser } from '../../base-parser'
import { DomType } from '@/types/document'

/**
 * Тип сноски
 */
export enum NoteType {
    FOOTNOTE = 'footnote',
    ENDNOTE = 'endnote'
}

/**
 * Интерфейс для сноски
 */
export interface INote {
    id: string
    type: NoteType
    children: any[]
}

/**
 * Парсер сносок и концевых сносок документа
 */
export class FootnoteEndnoteParser extends BaseParser {
    /**
     * Парсит сноски документа
     * @returns Массив сносок
     */
    public async parseFootnotes(): Promise<INote[]> {
        try {
            const footnotesPath = 'word/footnotes.xml'
            const footnotesXml = await this.loadXmlFile(footnotesPath)
            
            if (!footnotesXml || !footnotesXml.footnotes) {
                return []
            }
            
            return this.parseNotes(footnotesXml.footnotes.footnote, NoteType.FOOTNOTE)
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse footnotes:', error)
            }
            return []
        }
    }
    
    /**
     * Парсит концевые сноски документа
     * @returns Массив концевых сносок
     */
    public async parseEndnotes(): Promise<INote[]> {
        try {
            const endnotesPath = 'word/endnotes.xml'
            const endnotesXml = await this.loadXmlFile(endnotesPath)
            
            if (!endnotesXml || !endnotesXml.endnotes) {
                return []
            }
            
            return this.parseNotes(endnotesXml.endnotes.endnote, NoteType.ENDNOTE)
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse endnotes:', error)
            }
            return []
        }
    }
    
    /**
     * Парсит сноски или концевые сноски
     * @param notesXml - XML сносок
     * @param noteType - Тип сноски
     * @returns Массив сносок
     */
    private parseNotes(notesXml: any, noteType: NoteType): INote[] {
        const notes: INote[] = []
        
        if (!notesXml) {
            return notes
        }
        
        // Преобразуем в массив, если это один элемент
        const notesArray = Array.isArray(notesXml) ? notesXml : [notesXml]
        
        for (const note of notesArray) {
            // Пропускаем сепараторы и продолжения
            const type = note['@_type']
            if (type === 'separator' || type === 'continuationSeparator') {
                continue
            }
            
            const id = note['@_id']
            if (!id) {
                continue
            }
            
            const children = this.parseNoteContent(note)
            
            notes.push({
                id,
                type: noteType,
                children
            })
        }
        
        return notes
    }
    
    /**
     * Парсит содержимое сноски
     * @param noteXml - XML сноски
     * @returns Массив дочерних элементов
     */
    private parseNoteContent(noteXml: any): any[] {
        const children: any[] = []
        
        try {
            // Парсим параграфы
            if (noteXml.p) {
                const paragraphs = Array.isArray(noteXml.p) ? noteXml.p : [noteXml.p]
                
                for (const paragraph of paragraphs) {
                    // Здесь должен быть вызов метода для парсинга параграфа
                    // Например: const parsedParagraph = this.paragraphParser.parseParagraph(paragraph)
                    // children.push(parsedParagraph)
                    
                    // Для простоты, добавляем заглушку
                    children.push({
                        type: DomType.Paragraph,
                        children: this.parseNoteParagraph(paragraph)
                    })
                }
            }
        } catch (error) {
            if (this.options.debug) {
                console.warn('Failed to parse note content:', error)
            }
        }
        
        return children
    }
    
    /**
     * Парсит параграф сноски
     * @param paragraphXml - XML параграфа
     * @returns Массив дочерних элементов
     */
    private parseNoteParagraph(paragraphXml: any): any[] {
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
                console.warn('Failed to parse note paragraph:', error)
            }
        }
        
        return children
    }
    
    /**
     * Создает HTML для сноски
     * @param note - Сноска
     * @param index - Индекс сноски
     * @returns Объект с HTML для ссылки на сноску и содержимого сноски
     */
    public createNoteHtml(note: INote, index: number): { reference: string; content: string } {
        const noteId = `note-${note.type}-${note.id}`
        const noteRefId = `note-ref-${note.type}-${note.id}`
        
        // Создаем HTML для ссылки на сноску
        const noteRefHtml = `<sup class="footnote-ref" id="${noteRefId}"><a href="#${noteId}">${index}</a></sup>`;
        
        // Создаем HTML для содержимого сноски
        const noteContentHtml = `
            <div class="footnote" id="${noteId}">
                <div class="footnote-number">${index}</div>
                <div class="footnote-content">
                    ${this.renderNoteContent(note.children)}
                    <a href="#${noteRefId}" class="footnote-back">↩</a>
                </div>
            </div>
        `;
        
        return {
            reference: noteRefHtml,
            content: noteContentHtml
        };
    }
    
    /**
     * Рендерит содержимое сноски в HTML
     * @param children - Дочерние элементы сноски
     * @returns HTML содержимого сноски
     */
    private renderNoteContent(children: any[]): string {
        let html = '';
        
        for (const child of children) {
            if (child.type === DomType.Paragraph) {
                html += `<p>${this.renderNoteChildren(child.children)}</p>`;
            }
        }
        
        return html;
    }
    
    /**
     * Рендерит дочерние элементы сноски в HTML
     * @param children - Дочерние элементы
     * @returns HTML дочерних элементов
     */
    private renderNoteChildren(children: any[]): string {
        let html = '';
        
        for (const child of children) {
            if (child.type === DomType.Text) {
                html += child.text;
            } else if (child.type === DomType.Break) {
                html += '<br>';
            }
        }
        
        return html;
    }
}

/**
 * Создает парсер сносок и концевых сносок
 * @returns Экземпляр FootnoteEndnoteParser
 */
export function createFootnoteEndnoteParser(): FootnoteEndnoteParser {
    return new FootnoteEndnoteParser();
}
