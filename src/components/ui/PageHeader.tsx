import React from 'react'

type PageHeaderProps = {
  title: string;
  description?: string;
  icons?: React.ReactNode;
}

function PageHeader({ title, description, icons, className }: PageHeaderProps & { className?: string }) {
  return (
          <div className={`flex items-center gap-3 ${className || 'mb-6'}`}>
        {icons}
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && <p className="text-sm text-zinc-400">{description}</p>}
        </div>
      </div>
  )
}

export default PageHeader