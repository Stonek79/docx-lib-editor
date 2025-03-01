# DOCX Library Editor

Библиотека для отображения и редактирования DOCX документов в браузере.

## Описание

Проект представляет собой комплексное решение для отображения и редактирования DOCX документов в браузере, аналогично текстовым редакторам, таким как Microsoft Word. Библиотека обеспечивает корректное отображение различных элементов документа, включая:

- Форматирование текста (жирный, курсив, подчеркивание и т.д.)
- Параграфы с различными стилями и отступами
- Таблицы
- Списки (нумерованные и маркированные)
- Изображения
- Колонтитулы
- Разрывы страниц и разделов
- Поддержку различной ориентации страниц

## Задачи проекта

### Отображение документов
- Корректное отображение всех элементов DOCX документа
- Поддержка различных форматов страниц и ориентаций
- Отображение колонтитулов и сносок

### Редактирование документов
- Редактирование текста с сохранением форматирования
- Добавление и удаление элементов (таблицы, изображения, списки)
- Изменение стилей и форматирования
- Поддержка комментариев и отслеживания изменений

### Управление версиями
- Сохранение различных версий документа
- Сравнение версий и визуализация различий
- История изменений документа

### Экспорт и импорт
- Выгрузка документа в формате DOCX
- Выгрузка изменений в виде патчей
- Импорт документов из различных форматов

## Технологии

- TypeScript
- Next.js
- JSZip
- fast-xml-parser

## Структура проекта

Основные компоненты библиотеки:

- **DocxParser**: Основной класс для парсинга DOCX файлов
- **BaseParser**: Базовый класс для всех парсеров
- **Document Parsers**: Парсеры для различных элементов документа (параграфы, текстовые прогоны, таблицы и т.д.)
- **Supporting Parsers**: Вспомогательные парсеры (стили, нумерация, связи, изображения, метаданные)
- **HTML Converters**: Конвертеры для преобразования элементов DOCX в HTML

## Установка и использование

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка проекта
npm run build

# Запуск тестов
npm test
```

## Лицензия

MIT

---

# DOCX Library Editor

Library for displaying and editing DOCX documents in a browser.

## Description

The project is a comprehensive solution for displaying and editing DOCX documents in a browser, similar to text editors such as Microsoft Word. The library provides correct rendering of various document elements, including:

- Text formatting (bold, italic, underline, etc.)
- Paragraphs with various styles and indentations
- Tables
- Lists (numbered and bulleted)
- Images
- Headers and footers
- Page and section breaks
- Support for different page orientations

## Project Tasks

### Document Display
- Correct rendering of all DOCX document elements
- Support for various page formats and orientations
- Display of headers, footers, and footnotes

### Document Editing
- Text editing with formatting preservation
- Adding and removing elements (tables, images, lists)
- Changing styles and formatting
- Support for comments and change tracking

### Version Management
- Saving different versions of the document
- Comparing versions and visualizing differences
- Document change history

### Export and Import
- Exporting documents in DOCX format
- Exporting changes as patches
- Importing documents from various formats

## Technologies

- TypeScript
- Next.js
- JSZip
- fast-xml-parser

## Project Structure

Main library components:

- **DocxParser**: Main class for parsing DOCX files
- **BaseParser**: Base class for all parsers
- **Document Parsers**: Parsers for various document elements (paragraphs, text runs, tables, etc.)
- **Supporting Parsers**: Auxiliary parsers (styles, numbering, relationships, images, metadata)
- **HTML Converters**: Converters for transforming DOCX elements into HTML

## Installation and Usage

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the project
npm run build

# Run tests
npm test
```

## License

MIT
