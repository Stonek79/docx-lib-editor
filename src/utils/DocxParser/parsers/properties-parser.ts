import { ParagraphProperties, RunProperties } from '@/types/docx-properties'
import { BorderStyle, TableBorders } from '@/types/document'

/**
 * Статический класс для парсинга свойств различных элементов DOCX документа.
 * Отвечает за:
 * - Извлечение свойств параграфов (стиль, выравнивание, отступы)
 * - Извлечение свойств текста (шрифт, размер, цвет, форматирование)
 * - Извлечение свойств таблиц (границы, ширина, стиль)
 * - Извлечение свойств ячеек таблицы (объединение, границы)
 */
export class PropertiesParser {
    /**
     * Парсит свойства параграфа
     * @param props - XML элемент свойств параграфа (w:pPr)
     * @returns Объект свойств параграфа или undefined
     */
    static parseParagraphProperties(
        props: any,
    ): ParagraphProperties | undefined {
        if (!props) return undefined

        return {
            styleId: props['w:pStyle']?.['@_w:val'],
            justification: props['w:jc']?.['@_w:val'],
            indentation: {
                left: parseInt(props['w:ind']?.['@_w:left'] || '0'),
                right: parseInt(props['w:ind']?.['@_w:right'] || '0'),
                firstLine: parseInt(props['w:ind']?.['@_w:firstLine'] || '0'),
                hanging: parseInt(props['w:ind']?.['@_w:hanging'] || '0'),
            },
            spacing: {
                before: parseInt(props['w:spacing']?.['@_w:before'] || '0'),
                after: parseInt(props['w:spacing']?.['@_w:after'] || '0'),
                line: parseInt(props['w:spacing']?.['@_w:line'] || '0'),
                lineRule: props['w:spacing']?.['@_w:lineRule'],
            },
            outlineLevel: parseInt(props['w:outlineLvl']?.['@_w:val'] || '0'),
        }
    }

    /**
     * Парсит свойства текстового прогона
     * @param props - XML элемент свойств текста (w:rPr)
     * @returns Объект свойств текста или undefined
     */
    static parseRunProperties(props: any): RunProperties | undefined {
        if (!props) return undefined

        return {
            styleId: props['w:rStyle']?.['@_w:val'],
            fontSize: parseInt(props['w:sz']?.['@_w:val'] || '0') / 2,
            bold: !!props['w:b'],
            italic: !!props['w:i'],
            underline: props['w:u']?.['@_w:val'],
            strike: !!props['w:strike'],
            vertAlign: props['w:vertAlign']?.['@_w:val'] as 'superscript' | 'subscript',
            color: props['w:color']?.['@_w:val'],
            highlight: props['w:highlight']?.['@_w:val'],
            hyperlink: props['w:hyperlink']?.['@_r:id'],
            caps: !!props['w:caps'],
        }
    }

    /**
     * Парсит свойства таблицы
     * @param props - XML элемент свойств таблицы (w:tblPr)
     * @returns Объект свойств таблицы или undefined
     */
    static parseTableProperties(props: any):
        | {
              width?: number
              style?: string
              borders?: TableBorders
          }
        | undefined {
        if (!props) return undefined

        const styleId = props['w:tblStyle']?.['@_w:val']
        return {
            width: parseInt(props['w:tblW']?.['@_w:w'] || '0'),
            style: styleId || undefined,
            borders: this.parseBorders(props['w:tblBorders']),
        }
    }

    /**
     * Парсит свойства строки таблицы
     * @param props - XML элемент свойств строки (w:trPr)
     * @returns Объект свойств строки или undefined
     */
    static parseTableRowProperties(props: any):
        | {
              height?: number
          }
        | undefined {
        if (!props) return undefined

        return {
            height: parseInt(props['w:trHeight']?.['@_w:val'] || '0'),
        }
    }

    /**
     * Парсит свойства ячейки таблицы
     * @param props - XML элемент свойств ячейки (w:tcPr)
     * @returns Объект свойств ячейки или undefined
     */
    static parseTableCellProperties(props: any):
        | {
              width?: number
              borders?: TableBorders
              verticalMerge?: 'restart' | 'continue'
              horizontalMerge?: 'restart' | 'continue'
              span?: number
          }
        | undefined {
        if (!props) return undefined

        return {
            width: parseInt(props['w:tcW']?.['@_w:w'] || '0'),
            borders: this.parseBorders(props['w:tcBorders']),
            verticalMerge: props['w:vMerge']?.['@_w:val'],
            horizontalMerge: props['w:hMerge']?.['@_w:val'],
            span: parseInt(props['w:gridSpan']?.['@_w:val'] || '1'),
        }
    }

    /**
     * Парсит свойства границ элемента
     * @param borders - XML элемент границ
     * @returns Объект с описанием границ или undefined
     */
    private static parseBorders(borders: any) {
        if (!borders) return undefined

        return {
            top: this.parseBorderStyle(borders['w:top']),
            right: this.parseBorderStyle(borders['w:right']),
            bottom: this.parseBorderStyle(borders['w:bottom']),
            left: this.parseBorderStyle(borders['w:left']),
            insideH: this.parseBorderStyle(borders['w:insideH']),
            insideV: this.parseBorderStyle(borders['w:insideV']),
        }
    }

    /**
     * Парсит стиль границы
     * @param border - XML элемент стиля границы
     * @returns Объект со стилем границы или undefined
     */
    private static parseBorderStyle(border: any) {
        if (!border) return undefined

        return {
            style: border['@_w:val'],
            width: parseInt(border['@_w:sz'] || '0'),
            color: border['@_w:color'],
        }
    }
}
