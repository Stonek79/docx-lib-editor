import { NumberingLevel } from '@/types/numbering'
import { FormatUtils } from './format-utils'

export class NumberingConverter {
    private numberingCounters: Map<string, number[]> = new Map()
    // Новое поле для хранения иерархических счетчиков для каждого numId.
    // Для каждого numId храним объект с двумя массивами:
    // counters – текущие значения счетчиков для каждого уровня,
    // frozen – "замороженные" значения, фиксирующие предыдущие номера родительских элементов.
    private hierarchicalCounters: Map<
        string,
        { counters: number[]; frozen: number[] }
    > = new Map()

    /**
     * Сбрасывает все счетчики нумерации
     */
    reset(): void {
        this.numberingCounters.clear()
        this.hierarchicalCounters.clear()
    }

    /**
     * Форматирует нумерацию для текущего уровня с учетом иерархии.
     * Используется шаблон level.text (например, "%1.%2.") для формирования финального номера.
     *
     * Алгоритм:
     * 1. Для каждого numId создается объект hierarchicalCounters, содержащий два массива (длина 10):
     *    - counters: текущие значения счетчиков, инициализируются стартовым значением (start).
     *    - frozen: "замороженные" значения, фиксирующие номер родительского элемента для дочерних.
     * 2. Если обрабатывается элемент уровня 0:
     *    - Итоговый номер берется из counters[0].
     *    - frozen[0] обновляется этим значением.
     *    - counters[0] увеличивается на 1, а для всех уровней ниже происходит сброс до start.
     * 3. Если обрабатывается элемент уровня больше 0:
     *    - Итоговый номер собирается из frozen[0..currentLevel-1] и counters[currentLevel].
     *    - frozen[currentLevel] фиксируется, если еще не равен counters[currentLevel].
     *    - После формирования номера counters[currentLevel] увеличивается.
     */
    formatNumbering(
        level: NumberingLevel,
        currentLevel: number,
        numId: string,
    ): string {
        if (!level || currentLevel < 0 || !numId) return ''

        const format = level.format || 'decimal'
        const start = level.start || 1

        // Получаем или создаем объект для данного numId.
        let data = this.hierarchicalCounters.get(numId)
        if (!data) {
            const size = 10
            data = {
                counters: new Array(size).fill(start),
                frozen: new Array(size).fill(start),
            }
            this.hierarchicalCounters.set(numId, data)
        }

        if (currentLevel === 0) {
            // Обрабатываем родительский элемент (уровень 0).
            const num = data.counters[0]
            // Фиксируем номер для родительского уровня.
            data.frozen[0] = num
            // После обработки увеличиваем счётчик для родительского уровня.
            data.counters[0]++
            // Сбрасываем дочерние уровни до стартового значения.
            for (let i = 1; i < data.counters.length; i++) {
                data.counters[i] = start
                data.frozen[i] = start
            }
            return this.formatNumber(num, format) + '.'
        } else {
            // Для дочерних элементов.
            // Собираем итоговый номер: номера родительских уровней (frozen) и номер текущего уровня (counters).
            const parts: string[] = []
            for (let i = 0; i < currentLevel; i++) {
                parts.push(this.formatNumber(data.frozen[i], format))
            }
            parts.push(this.formatNumber(data.counters[currentLevel], format))
            const hierarchicalNumber = parts.join('.') + '.'
            // Если еще не "заморожено" значение для текущего уровня, фиксируем его.
            if (data.frozen[currentLevel] !== data.counters[currentLevel]) {
                data.frozen[currentLevel] = data.counters[currentLevel]
            }
            // Увеличиваем счётчик для текущего уровня.
            data.counters[currentLevel]++
            return hierarchicalNumber
        }
    }

    /**
     * Форматирует число в заданном формате.
     */
    private formatNumber(number: number, format: string): string {
        switch (format) {
            case 'decimal':
                return number.toString()
            case 'upperRoman':
                return FormatUtils.toRoman(number).toUpperCase()
            case 'lowerRoman':
                return FormatUtils.toRoman(number).toLowerCase()
            case 'upperLetter':
                return FormatUtils.toAlpha(number).toUpperCase()
            case 'lowerLetter':
                return FormatUtils.toAlpha(number).toLowerCase()
            case 'bullet':
                return '•'
            default:
                return number.toString()
        }
    }
}
