import { BaseParser } from '../base-parser'

/**
 * Интерфейс для размеров страницы
 */
export interface PageSize {
    /** Ширина страницы в twips (1/20 пункта) */
    width: number;
    /** Высота страницы в twips (1/20 пункта) */
    height: number;
    /** Ориентация страницы (portrait или landscape) */
    orientation: 'portrait' | 'landscape';
}

/**
 * Интерфейс для полей страницы
 */
export interface PageMargins {
    /** Верхнее поле в twips */
    top: number;
    /** Правое поле в twips */
    right: number;
    /** Нижнее поле в twips */
    bottom: number;
    /** Левое поле в twips */
    left: number;
    /** Поле верхнего колонтитула в twips */
    header: number;
    /** Поле нижнего колонтитула в twips */
    footer: number;
}

/**
 * Интерфейс для свойств секции
 */
export interface SectionProperties {
    /** Размеры страницы */
    pageSize: PageSize;
    /** Поля страницы */
    pageMargins: PageMargins;
    /** Тип разрыва секции */
    type?: 'nextPage' | 'continuous' | 'evenPage' | 'oddPage';
    /** Идентификаторы колонтитулов */
    headerIds: string[];
    /** Идентификаторы нижних колонтитулов */
    footerIds: string[];
}

/**
 * Парсер свойств секций DOCX документа
 */
export class SectionPropertiesParser extends BaseParser {
    /**
     * Парсит свойства секции из XML
     * @param sectPr - XML элемент свойств секции
     * @returns Объект свойств секции
     */
    public parseSectionProperties(sectPr: any): SectionProperties {
        if (!sectPr) {
            return this.getDefaultSectionProperties()
        }

        return {
            pageSize: this.parsePageSize(sectPr['w:pgSz']),
            pageMargins: this.parsePageMargins(sectPr['w:pgMar']),
            type: this.parseSectionType(sectPr['w:type']),
            headerIds: this.parseHeaderIds(sectPr['w:headerReference']),
            footerIds: this.parseFooterIds(sectPr['w:footerReference'])
        }
    }

    /**
     * Парсит размеры страницы
     * @param pgSz - XML элемент размеров страницы
     * @returns Объект размеров страницы
     */
    private parsePageSize(pgSz: any): PageSize {
        if (!pgSz) {
            return {
                width: 12240, // 8.5" в twips (A4)
                height: 15840, // 11" в twips (A4)
                orientation: 'portrait'
            }
        }

        // Получаем значения ширины и высоты
        const width = parseInt(pgSz['@_w:w'] || pgSz['@w:w'] || '12240', 10)
        const height = parseInt(pgSz['@_h:h'] || pgSz['@h:h'] || '15840', 10)
        
        // Определяем ориентацию
        // В DOCX ориентация может быть задана явно через атрибут orient
        // или неявно через соотношение ширины и высоты
        let orientation: 'portrait' | 'landscape' = 'portrait'
        
        // Проверяем разные варианты атрибута orient
        if (pgSz['@_w:orient'] === 'landscape' || pgSz['@w:orient'] === 'landscape') {
            orientation = 'landscape'
        } else if (width > height) {
            // Если ширина больше высоты, то это альбомная ориентация
            orientation = 'landscape'
        }

        return {
            width,
            height,
            orientation
        }
    }

    /**
     * Парсит поля страницы
     * @param pgMar - XML элемент полей страницы
     * @returns Объект полей страницы
     */
    private parsePageMargins(pgMar: any): PageMargins {
        if (!pgMar) {
            return {
                top: 1440, // 1" в twips
                right: 1440,
                bottom: 1440,
                left: 1440,
                header: 720, // 0.5" в twips
                footer: 720
            }
        }

        return {
            top: parseInt(pgMar['@_w:top'] || '1440', 10),
            right: parseInt(pgMar['@_w:right'] || '1440', 10),
            bottom: parseInt(pgMar['@_w:bottom'] || '1440', 10),
            left: parseInt(pgMar['@_w:left'] || '1440', 10),
            header: parseInt(pgMar['@_w:header'] || '720', 10),
            footer: parseInt(pgMar['@_w:footer'] || '720', 10)
        }
    }

    /**
     * Парсит тип разрыва секции
     * @param type - XML элемент типа разрыва
     * @returns Тип разрыва секции
     */
    private parseSectionType(type: any): 'nextPage' | 'continuous' | 'evenPage' | 'oddPage' | undefined {
        if (!type || !type['@_w:val']) {
            return 'nextPage' // По умолчанию
        }

        const val = type['@_w:val']
        switch (val) {
            case 'continuous':
                return 'continuous'
            case 'evenPage':
                return 'evenPage'
            case 'oddPage':
                return 'oddPage'
            case 'nextPage':
            default:
                return 'nextPage'
        }
    }

    /**
     * Парсит идентификаторы верхних колонтитулов
     * @param headerReference - XML элемент ссылок на колонтитулы
     * @returns Массив идентификаторов колонтитулов
     */
    private parseHeaderIds(headerReference: any): string[] {
        if (!headerReference) {
            return []
        }

        const headerRefs = Array.isArray(headerReference) 
            ? headerReference 
            : [headerReference]
        
        return headerRefs
            .filter(ref => ref['@_r:id'])
            .map(ref => ref['@_r:id'])
    }

    /**
     * Парсит идентификаторы нижних колонтитулов
     * @param footerReference - XML элемент ссылок на нижние колонтитулы
     * @returns Массив идентификаторов нижних колонтитулов
     */
    private parseFooterIds(footerReference: any): string[] {
        if (!footerReference) {
            return []
        }

        const footerRefs = Array.isArray(footerReference) 
            ? footerReference 
            : [footerReference]
        
        return footerRefs
            .filter(ref => ref['@_r:id'])
            .map(ref => ref['@_r:id'])
    }

    /**
     * Возвращает свойства секции по умолчанию
     * @returns Объект свойств секции по умолчанию
     */
    public getDefaultSectionProperties(): SectionProperties {
        return {
            pageSize: {
                width: 12240, // 8.5" в twips (A4)
                height: 15840, // 11" в twips (A4)
                orientation: 'portrait'
            },
            pageMargins: {
                top: 1440, // 1" в twips
                right: 1440,
                bottom: 1440,
                left: 1440,
                header: 720, // 0.5" в twips
                footer: 720
            },
            type: 'nextPage',
            headerIds: [],
            footerIds: []
        }
    }
}
