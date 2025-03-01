/**
 * Утилита для автоматического разбиения содержимого на страницы формата A4
 */

/**
 * Интерфейс для настроек разбивки на страницы
 */
interface PageBreakerOptions {
    /** Максимальная высота содержимого на странице в пикселях */
    maxContentHeight?: number;
    /** Селектор контейнера страниц */
    pagesContainerSelector?: string;
    /** Селектор страницы */
    pageSelector?: string;
    /** Селектор для элементов, которые нельзя разбивать между страницами */
    nonBreakableSelector?: string;
    /** Селектор для элементов, которые могут быть разбиты между страницами */
    breakableSelector?: string;
    /** Отступы страницы в пикселях */
    pagePadding?: number;
    /** Включить колонтитулы */
    enableHeaders?: boolean;
    /** Включить нижние колонтитулы */
    enableFooters?: boolean;
    /** HTML для верхнего колонтитула */
    headerHtml?: string;
    /** HTML для нижнего колонтитула */
    footerHtml?: string;
    /** Функция для генерации HTML верхнего колонтитула для конкретной страницы */
    headerGenerator?: (pageNumber: number, totalPages: number) => string;
    /** Функция для генерации HTML нижнего колонтитула для конкретной страницы */
    footerGenerator?: (pageNumber: number, totalPages: number) => string;
}

/**
 * Тип разрыва элемента
 */
enum BreakType {
    /** Нет разрыва */
    NONE = 'none',
    /** Разрыв перед элементом */
    BEFORE = 'before',
    /** Разрыв после элемента */
    AFTER = 'after',
    /** Разрыв внутри элемента */
    INSIDE = 'inside'
}

/**
 * Класс для автоматического разбиения содержимого на страницы формата A4
 */
export class PageBreaker {
    private options: Required<PageBreakerOptions>;
    private container: HTMLElement | null = null;
    private pages: HTMLElement[] = [];
    private contentElements: HTMLElement[] = [];
    private totalPages: number = 0;
    
    /**
     * Конструктор PageBreaker
     * @param options - Настройки разбивки на страницы
     */
    constructor(options?: PageBreakerOptions) {
        // Значения по умолчанию
        this.options = {
            maxContentHeight: 257 * 3.78, // 257mm (A4 высота - отступы) в пикселях при 96 dpi
            pagesContainerSelector: '.a4-pages-container',
            pageSelector: '.a4-page',
            nonBreakableSelector: 'table, figure, img, .non-breakable',
            breakableSelector: 'p, div:not(.non-breakable), h1, h2, h3, h4, h5, h6',
            pagePadding: 20 * 3.78, // 20mm в пикселях
            enableHeaders: false,
            enableFooters: false,
            headerHtml: '',
            footerHtml: '',
            headerGenerator: (pageNumber, totalPages) => `<div class="header-content">Страница ${pageNumber} из ${totalPages}</div>`,
            footerGenerator: (pageNumber, totalPages) => `<div class="footer-content">Страница ${pageNumber} из ${totalPages}</div>`,
            ...options
        };
    }
    
    /**
     * Инициализирует разбивку на страницы
     * @param containerElement - Элемент контейнера страниц
     */
    public init(containerElement?: HTMLElement): void {
        // Находим контейнер страниц
        this.container = containerElement || document.querySelector(this.options.pagesContainerSelector);
        
        if (!this.container) {
            console.error('PageBreaker: Container element not found');
            return;
        }
        
        // Находим все страницы
        this.pages = Array.from(this.container.querySelectorAll(this.options.pageSelector)) as HTMLElement[];
        
        if (this.pages.length === 0) {
            console.error('PageBreaker: No pages found');
            return;
        }
        
        // Собираем все элементы содержимого со всех страниц
        this.collectContentElements();
        
        // Разбиваем содержимое на страницы
        this.breakIntoPages();
        
        // Добавляем колонтитулы, если они включены
        this.addHeadersAndFooters();
    }
    
    /**
     * Собирает все элементы содержимого со всех страниц
     */
    private collectContentElements(): void {
        this.contentElements = [];
        
        // Проходим по всем страницам и собираем их содержимое
        for (const page of this.pages) {
            // Исключаем колонтитулы из сбора
            const headerElements = Array.from(page.querySelectorAll('.header'));
            const footerElements = Array.from(page.querySelectorAll('.footer'));
            
            const children = Array.from(page.children) as HTMLElement[];
            const contentChildren = children.filter(child => 
                !headerElements.includes(child) && !footerElements.includes(child)
            );
            
            this.contentElements.push(...contentChildren);
            
            // Очищаем страницу
            page.innerHTML = '';
        }
        
        // Оставляем только первую страницу, остальные удаляем
        const firstPage = this.pages[0];
        this.pages = [firstPage];
        
        // Удаляем все страницы из контейнера, кроме первой
        while (this.container!.children.length > 1) {
            this.container!.removeChild(this.container!.lastChild!);
        }
    }
    
    /**
     * Разбивает содержимое на страницы
     */
    private breakIntoPages(): void {
        let currentPage = this.pages[0];
        let currentPageHeight = 0;
        
        // Проходим по всем элементам содержимого
        for (let i = 0; i < this.contentElements.length; i++) {
            const element = this.contentElements[i];
            
            // Проверяем, есть ли у элемента класс page-break-before
            if (element.classList.contains('page-break-before')) {
                // Создаем новую страницу
                currentPage = this.createNewPage();
                currentPageHeight = 0;
            }
            
            // Клонируем элемент, чтобы измерить его высоту
            const clone = element.cloneNode(true) as HTMLElement;
            currentPage.appendChild(clone);
            
            // Проверяем, вмещается ли элемент на текущую страницу
            const elementHeight = clone.offsetHeight;
            
            // Проверяем, не является ли элемент неразрывным
            const isNonBreakable = element.matches(this.options.nonBreakableSelector);
            const isBreakable = element.matches(this.options.breakableSelector);
            
            // Если элемент не вмещается на текущую страницу
            if (currentPageHeight + elementHeight > this.options.maxContentHeight) {
                // Если элемент неразрывный, то переносим его на новую страницу
                if (isNonBreakable) {
                    // Удаляем клон с текущей страницы
                    currentPage.removeChild(clone);
                    
                    // Создаем новую страницу
                    currentPage = this.createNewPage();
                    currentPageHeight = 0;
                    
                    // Добавляем элемент на новую страницу
                    currentPage.appendChild(element);
                    currentPageHeight += elementHeight;
                } else if (isBreakable && element.tagName.toLowerCase() === 'p') {
                    // Если это параграф, который можно разбить
                    // Удаляем клон с текущей страницы
                    currentPage.removeChild(clone);
                    
                    // Разбиваем параграф между страницами
                    const { firstPart, secondPart } = this.splitParagraph(
                        element, 
                        this.options.maxContentHeight - currentPageHeight
                    );
                    
                    // Добавляем первую часть на текущую страницу
                    if (firstPart) {
                        currentPage.appendChild(firstPart);
                        // Не обновляем currentPageHeight, так как мы переходим на новую страницу
                    }
                    
                    // Создаем новую страницу
                    currentPage = this.createNewPage();
                    currentPageHeight = 0;
                    
                    // Добавляем вторую часть на новую страницу
                    if (secondPart) {
                        currentPage.appendChild(secondPart);
                        currentPageHeight += secondPart.offsetHeight;
                    }
                } else {
                    // Если элемент можно разбить, но это не параграф
                    // Удаляем клон с текущей страницы
                    currentPage.removeChild(clone);
                    
                    // Создаем новую страницу
                    currentPage = this.createNewPage();
                    currentPageHeight = 0;
                    
                    // Добавляем элемент на новую страницу
                    currentPage.appendChild(element);
                    currentPageHeight += elementHeight;
                }
            } else {
                // Если элемент вмещается на текущую страницу
                // Удаляем клон и добавляем оригинальный элемент
                currentPage.removeChild(clone);
                currentPage.appendChild(element);
                currentPageHeight += elementHeight;
                
                // Проверяем, есть ли у элемента класс page-break-after
                if (element.classList.contains('page-break-after')) {
                    // Создаем новую страницу для следующего элемента
                    currentPage = this.createNewPage();
                    currentPageHeight = 0;
                }
            }
        }
        
        // Сохраняем общее количество страниц
        this.totalPages = this.pages.length;
    }
    
    /**
     * Разбивает параграф на две части
     * @param paragraph - Параграф для разбивки
     * @param availableHeight - Доступная высота на текущей странице
     * @returns Объект с двумя частями параграфа
     */
    private splitParagraph(paragraph: HTMLElement, availableHeight: number): { 
        firstPart: HTMLElement | null; 
        secondPart: HTMLElement | null; 
    } {
        // Создаем контейнер для тестирования
        const testContainer = document.createElement('div');
        testContainer.style.visibility = 'hidden';
        testContainer.style.position = 'absolute';
        testContainer.style.width = `${paragraph.offsetWidth}px`;
        document.body.appendChild(testContainer);
        
        // Клонируем параграф для тестирования
        const clone = paragraph.cloneNode(true) as HTMLElement;
        testContainer.appendChild(clone);
        
        // Получаем текстовое содержимое параграфа
        const text = paragraph.textContent || '';
        const words = text.split(' ');
        
        // Если параграф содержит только одно слово, не разбиваем его
        if (words.length <= 1) {
            document.body.removeChild(testContainer);
            return { firstPart: null, secondPart: paragraph };
        }
        
        // Бинарный поиск для определения точки разбивки
        let left = 0;
        let right = words.length - 1;
        let splitIndex = 0;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            
            // Устанавливаем текст для клона
            clone.textContent = words.slice(0, mid + 1).join(' ');
            
            // Проверяем высоту
            if (clone.offsetHeight <= availableHeight) {
                splitIndex = mid;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        // Если не удалось найти точку разбивки, не разбиваем параграф
        if (splitIndex === 0) {
            document.body.removeChild(testContainer);
            return { firstPart: null, secondPart: paragraph };
        }
        
        // Создаем две части параграфа
        const firstPart = paragraph.cloneNode() as HTMLElement;
        firstPart.textContent = words.slice(0, splitIndex + 1).join(' ');
        
        const secondPart = paragraph.cloneNode() as HTMLElement;
        secondPart.textContent = words.slice(splitIndex + 1).join(' ');
        
        // Копируем классы и стили
        firstPart.className = paragraph.className;
        secondPart.className = paragraph.className;
        
        // Удаляем тестовый контейнер
        document.body.removeChild(testContainer);
        
        return { firstPart, secondPart };
    }
    
    /**
     * Создает новую страницу
     * @returns Новая страница
     */
    private createNewPage(): HTMLElement {
        // Создаем новую страницу
        const newPage = document.createElement('div');
        newPage.className = 'a4-page';
        
        // Добавляем страницу в контейнер
        this.container!.appendChild(newPage);
        
        // Добавляем страницу в массив страниц
        this.pages.push(newPage);
        
        return newPage;
    }
    
    /**
     * Добавляет колонтитулы на все страницы
     */
    private addHeadersAndFooters(): void {
        if (!this.options.enableHeaders && !this.options.enableFooters) {
            return;
        }
        
        const totalPages = this.pages.length;
        
        for (let i = 0; i < totalPages; i++) {
            const page = this.pages[i];
            const pageNumber = i + 1;
            
            // Добавляем верхний колонтитул
            if (this.options.enableHeaders) {
                const header = document.createElement('div');
                header.className = 'header';
                
                // Используем генератор или статический HTML
                if (this.options.headerGenerator) {
                    header.innerHTML = this.options.headerGenerator(pageNumber, totalPages);
                } else {
                    header.innerHTML = this.options.headerHtml;
                }
                
                // Вставляем колонтитул в начало страницы
                page.insertBefore(header, page.firstChild);
            }
            
            // Добавляем нижний колонтитул
            if (this.options.enableFooters) {
                const footer = document.createElement('div');
                footer.className = 'footer';
                
                // Используем генератор или статический HTML
                if (this.options.footerGenerator) {
                    footer.innerHTML = this.options.footerGenerator(pageNumber, totalPages);
                } else {
                    footer.innerHTML = this.options.footerHtml;
                }
                
                // Добавляем колонтитул в конец страницы
                page.appendChild(footer);
            }
        }
    }
    
    /**
     * Обновляет разбивку на страницы
     */
    public update(): void {
        if (!this.container) {
            console.error('PageBreaker: Container element not found');
            return;
        }
        
        // Собираем все элементы содержимого заново
        this.collectContentElements();
        
        // Разбиваем содержимое на страницы
        this.breakIntoPages();
        
        // Добавляем колонтитулы, если они включены
        this.addHeadersAndFooters();
    }
    
    /**
     * Получает общее количество страниц
     * @returns Общее количество страниц
     */
    public getTotalPages(): number {
        return this.totalPages;
    }
    
    /**
     * Включает или отключает колонтитулы
     * @param enableHeaders - Включить верхние колонтитулы
     * @param enableFooters - Включить нижние колонтитулы
     */
    public setHeadersAndFooters(enableHeaders: boolean, enableFooters: boolean): void {
        this.options.enableHeaders = enableHeaders;
        this.options.enableFooters = enableFooters;
        this.update();
    }
    
    /**
     * Устанавливает HTML для колонтитулов
     * @param headerHtml - HTML для верхнего колонтитула
     * @param footerHtml - HTML для нижнего колонтитула
     */
    public setHeaderAndFooterHtml(headerHtml?: string, footerHtml?: string): void {
        if (headerHtml !== undefined) {
            this.options.headerHtml = headerHtml;
        }
        
        if (footerHtml !== undefined) {
            this.options.footerHtml = footerHtml;
        }
        
        this.update();
    }
    
    /**
     * Устанавливает генераторы для колонтитулов
     * @param headerGenerator - Функция для генерации HTML верхнего колонтитула
     * @param footerGenerator - Функция для генерации HTML нижнего колонтитула
     */
    public setHeaderAndFooterGenerators(
        headerGenerator?: (pageNumber: number, totalPages: number) => string,
        footerGenerator?: (pageNumber: number, totalPages: number) => string
    ): void {
        if (headerGenerator !== undefined) {
            this.options.headerGenerator = headerGenerator;
        }
        
        if (footerGenerator !== undefined) {
            this.options.footerGenerator = footerGenerator;
        }
        
        this.update();
    }
}

/**
 * Создает экземпляр PageBreaker и инициализирует его
 * @param options - Настройки разбивки на страницы
 * @returns Экземпляр PageBreaker
 */
export function createPageBreaker(options?: PageBreakerOptions): PageBreaker {
    const pageBreaker = new PageBreaker(options);
    
    // Инициализируем после загрузки DOM
    if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', () => {
            pageBreaker.init();
        });
    }
    
    return pageBreaker;
}
