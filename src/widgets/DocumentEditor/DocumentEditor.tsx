'use client'
import { useState, useEffect, useRef } from 'react'
import { Box, Button, CircularProgress } from '@mui/material'
import { DocxParser } from '@/utils/DocxParser'
import { PageBreaker } from '@/utils/PageBreaker/pageBreaker'
import styles from './styles.module.css'
import '@/styles/a4.css'

/**
 * Компонент редактора DOCX документов
 * Отвечает за:
 * - Загрузку DOCX файлов через интерфейс выбора файлов
 * - Парсинг DOCX документов с помощью DocxParser
 * - Отображение содержимого документа в HTML формате
 * - Индикацию процесса загрузки и обработки файла
 * - Автоматическую разбивку содержимого на страницы
 *
 * @example
 * // Использование компонента
 * <DocumentEditor />
 */
export function DocumentEditor() {
    // Состояние загрузки файла
    const [loading, setLoading] = useState(false)
    // HTML содержимое документа
    const [content, setContent] = useState<string>('')
    // Ссылка на контейнер содержимого
    const contentRef = useRef<HTMLDivElement>(null)
    // Ссылка на объект PageBreaker
    const pageBreakerRef = useRef<PageBreaker | null>(null)

    /**
     * Обработчик выбора файла
     * @param event - Событие изменения input[type="file"]
     */
    const handleFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0]
        if (!file || !file.name.endsWith('.docx')) return

        setLoading(true)
        try {
            const parser = new DocxParser()
            const result = await parser.parse(file)
            
            setContent(result.html)
        } catch (error) {
            console.error('Error parsing document:', error)
        } finally {
            setLoading(false)
        }
    }
    
    /**
     * Инициализация PageBreaker после загрузки содержимого
     */
    useEffect(() => {
        if (content && contentRef.current) {
            // Ждем, пока DOM обновится с новым содержимым
            setTimeout(() => {
                // Если PageBreaker еще не создан, создаем его
                if (!pageBreakerRef.current) {
                    pageBreakerRef.current = new PageBreaker();
                }
                
                // Находим контейнер страниц внутри contentRef
                const pagesContainer = contentRef.current?.querySelector('.a4-pages-container');
                
                if (pagesContainer) {
                    // Инициализируем PageBreaker с контейнером страниц
                    pageBreakerRef.current.init(pagesContainer as HTMLElement);
                }
            }, 100);
        }
    }, [content]);

    return (
        <Box className={styles.editor}>
            <Box className={styles.toolbar}>
                <Button
                    variant="contained"
                    component="label"
                    disabled={loading}
                >
                    Загрузить документ
                    <input
                        type="file"
                        hidden
                        accept=".docx"
                        onChange={handleFileSelect}
                    />
                </Button>
                {loading && <CircularProgress size={24} />}
            </Box>
            <Box className={styles.content}>
                <div ref={contentRef} dangerouslySetInnerHTML={{ __html: content }} />
            </Box>
        </Box>
    )
}
