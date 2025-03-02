import { Box } from '@mui/material'
import { RefObject } from 'react'

export const LoadedHtmlContentContainer = ({
    content,
    contentRef,
}: {
    content: string
    contentRef: RefObject<HTMLDivElement | null>
}) => {
    return (
        <Box
            sx={{
                flex: 1,
                overflow: 'auto',
                padding: '20px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
            }}
        >
            <div
                ref={contentRef}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </Box>
    )
}
