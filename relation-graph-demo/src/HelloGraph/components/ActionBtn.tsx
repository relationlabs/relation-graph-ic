import React, { useState } from 'react'

const ActionBtn = ({
    children,
    onClick,
    className,
    gutter = 12,
    style = {},
    size = 'normal',
    danger = false,
    disabled = false,
}: {
    children?: React.ReactNode;
    onClick?: Function;
    size?: 'normal'|'small';
    danger?: boolean;
    gutter?: number;
    className?: string;
    style?: React.CSSProperties;
    disabled?: boolean
}) => {
    const [acting, setActing] = useState(false)
    return (
        <button
            className={`${className} rel-btn${(disabled || acting) ? ' disabled' : ''} size-${size} danger-${String(danger)}`}
            style={{
                margin: gutter,
                ...style,
            }}
            disabled={disabled}
            onClick={async () => {
                setActing(true)
                if (typeof onClick === 'function') await onClick()
                setActing(false)
            }}
            
        >
            {children}  
        </button>
    )
}

export default ActionBtn