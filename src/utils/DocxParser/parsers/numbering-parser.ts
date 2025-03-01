import { BaseParser } from '../base-parser'
import { NumberingDefinition, NumberingLevel } from '@/types/numbering'
import { PropertiesParser } from './properties-parser'

/**
 * Парсер нумерации DOCX документов.
 * Отвечает за:
 * - Извлечение определений нумерации из numbering.xml
 * - Обработку уровней нумерации
 * - Извлечение форматов нумерации (числа, буквы, римские цифры)
 * - Обработку отступов и выравнивания для каждого уровня
 */
export class NumberingParser extends BaseParser {
    private numbering: Map<string, NumberingDefinition> = new Map()

    /**
     * Парсит XML содержимое нумерации
     * @param xmlContent - XML содержимое файла numbering.xml
     * @returns Map определений нумерации, где ключ - это ID нумерации
     */
    async parse(xmlContent: string): Promise<Map<string, NumberingDefinition>> {
        try {
            const doc = this.xmlParser.parse(xmlContent)
            if (!doc?.['w:numbering']) {
                return new Map()
            }

            // Парсим абстрактные определения
            const abstractNums = Array.isArray(doc['w:numbering']['w:abstractNum'])
                ? doc['w:numbering']['w:abstractNum']
                : doc['w:numbering']['w:abstractNum'] ? [doc['w:numbering']['w:abstractNum']] : []

            const abstractNumMap = new Map()
            for (const abstractNum of abstractNums) {
                const id = abstractNum['@_w:abstractNumId']
                if (!id) continue

                const multiLevelType = abstractNum['w:multiLevelType']?.['@_w:val'] || 'hybridMultilevel'
                const levels = Array.isArray(abstractNum['w:lvl']) 
                    ? abstractNum['w:lvl'] 
                    : abstractNum['w:lvl'] ? [abstractNum['w:lvl']] : []

                // Парсим уровни с учетом иерархии
                const parsedLevels = this.parseLevels(levels, multiLevelType)
                abstractNumMap.set(id, parsedLevels)
            }

            // Парсим конкретные экземпляры нумерации
            const nums = Array.isArray(doc['w:numbering']['w:num']) 
                ? doc['w:numbering']['w:num'] 
                : doc['w:numbering']['w:num'] ? [doc['w:numbering']['w:num']] : []

            this.numbering.clear()
            for (const num of nums) {
                const numId = num['@_w:numId']
                let abstractNumId = num['w:abstractNumId']?.['@_w:val']

                if (!numId) continue

                // Пытаемся получить abstractNumId разными способами
                if (!abstractNumId) {
                    abstractNumId = num['w:abstractNumId']?._text
                }
                
                if (!abstractNumId) {
                    abstractNumId = num['w:abstractNumId']?.val || num['w:abstractNumId']?.['w:val']
                }

                if (!abstractNumId) {
                    abstractNumId = numId
                }

                const abstractLevels = abstractNumMap.get(abstractNumId)
                if (!abstractLevels) continue

                // Обрабатываем переопределения уровней
                const overrides = Array.isArray(num['w:lvlOverride'])
                    ? num['w:lvlOverride']
                    : num['w:lvlOverride'] ? [num['w:lvlOverride']] : []

                const levels = { ...abstractLevels }
                for (const override of overrides) {
                    const level = override['@_w:ilvl']
                    if (level && override['w:lvl']) {
                        levels[level] = this.parseLevel(override['w:lvl'])
                        console.log(`Applied override for level ${level} in instance ${numId}`)
                    }
                }

                this.numbering.set(numId, {
                    id: numId,
                    abstractNumId,
                    levels,
                })
            }

            return this.numbering
        } catch (error) {
            return new Map()
        }
    }

    /**
     * Парсит уровни нумерации
     * @param levels - Массив XML элементов уровней нумерации
     * @returns Объект с уровнями нумерации
     */
    /**
     * Парсит отдельный уровень нумерации
     * @param level XML элемент уровня
     * @returns Структурированный уровень нумерации
     */
    private parseLevel(level: any): NumberingLevel {
        const lvlNum = level['@_w:ilvl'] ? parseInt(level['@_w:ilvl']) : 0
        const format = level['w:numFmt']?.['@_w:val'] || 'decimal'
        const text = level['w:lvlText']?.['@_w:val'] || '%1.'
        const start = level['w:start']?.['@_w:val'] ? parseInt(level['w:start']['@_w:val']) : 1
        const suffix = level['w:suff']?.['@_w:val'] || 'tab'
        const alignment = level['w:lvlJc']?.['@_w:val'] || 'left'
        const isLgl = level['w:isLgl']?.['@_w:val'] === '1'
        const restart = level['w:lvlRestart']?.['@_w:val'] !== '0'

        // Определяем родительский уровень из шаблона текста
        const parentLevel = text.includes('%2') ? lvlNum - 1 : undefined

        return {
            level: lvlNum,
            start,
            format,
            text,
            suffix,
            alignment,
            isLgl,
            restart,
            parentLevel,
            counter: start
        }
    }

    /**
     * Парсит все уровни нумерации
     * @param levels Массив XML элементов уровней
     * @param multiLevelType Тип многоуровневой нумерации
     * @returns Объект с уровнями нумерации
     */
    private parseLevels(levels: any[], multiLevelType: string): Record<string, NumberingLevel> {
        const result: Record<string, NumberingLevel> = {}

        for (const level of levels) {
            const parsedLevel = this.parseLevel(level)
            
            // Добавляем стили параграфа
            if (level['w:pPr']) {
                parsedLevel.style = PropertiesParser.parseParagraphProperties(level['w:pPr'])
            }
            
            // Добавляем стили текста
            if (level['w:rPr']) {
                parsedLevel.runStyle = PropertiesParser.parseRunProperties(level['w:rPr'])
            }

            result[parsedLevel.level.toString()] = parsedLevel

            // Если это многоуровневая нумерация, устанавливаем связи между уровнями
            if (multiLevelType !== 'singleLevel' && parsedLevel.level > 0) {
                parsedLevel.parentLevel = parsedLevel.level - 1
            }
        }

        // Проверяем и настраиваем связи между уровнями
        Object.values(result).forEach(level => {
            if (level.parentLevel !== undefined) {
                const parentLevel = result[level.parentLevel.toString()]
                if (!parentLevel) {
                    level.parentLevel = undefined
                }
            }
        })

        return result
    }
}
