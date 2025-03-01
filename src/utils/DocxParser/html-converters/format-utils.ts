/**
 * Утилиты для форматирования чисел в различные системы счисления
 */
export class FormatUtils {
    /**
     * Конвертирует число в римскую систему счисления
     * @param num - Число для конвертации
     * @returns Строка с римским числом
     */
    static toRoman(num: number): string {
        const roman = {
            M: 1000, CM: 900, D: 500, CD: 400,
            C: 100, XC: 90, L: 50, XL: 40,
            X: 10, IX: 9, V: 5, IV: 4, I: 1
        }
        let str = ''

        for (const i of Object.keys(roman)) {
            const q = Math.floor(num / roman[i as keyof typeof roman])
            num -= q * roman[i as keyof typeof roman]
            str += i.repeat(q)
        }

        return str
    }

    /**
     * Конвертирует число в буквенное представление (A, B, C, ..., Z, AA, AB, ...)
     * @param num - Число для конвертации
     * @returns Строка с буквенным представлением числа
     */
    static toAlpha(num: number): string {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        let result = ''

        while (num > 0) {
            num--
            result = alphabet[num % 26] + result
            num = Math.floor(num / 26)
        }

        return result
    }
}
