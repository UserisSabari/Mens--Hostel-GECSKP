import React from 'react'
import Spinner from './Spinner'

type FormButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
}

export const FormButton: React.FC<FormButtonProps> = ({ loading, children, className = '', disabled, ...rest }) => {
  return (
    <button
      className={`inline-flex items-center justify-center px-3 py-1.5 rounded bg-sky-600 text-white text-sm hover:bg-sky-700 disabled:opacity-60 ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner className="h-4 w-4 mr-2" /> : null}
      <span>{children}</span>
    </button>
  )
}

export const ErrorText: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  if (!children) return null
  return <p className={`text-sm text-red-600 ${className}`}>{children}</p>
}

export default null as unknown as Record<string, never>

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }> = ({ loading, children, className = '', ...rest }) => {
  return (
    <button
      className={`inline-flex items-center justify-center px-2 py-1 rounded ${className}`}
      {...rest}
    >
      {loading ? <Spinner className="h-4 w-4" /> : children}
    </button>
  )
}
