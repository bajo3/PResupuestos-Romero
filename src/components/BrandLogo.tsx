interface Props {
  variant?: 'nav' | 'document' | 'compact'
  className?: string
}

export function BrandLogo({ variant = 'document', className = '' }: Props) {
  return (
    <div
      className={`brand-logo brand-logo--${variant} ${className}`}
      role="img"
      aria-label="Lucas Gallastagui Impermeabilizaciones"
    >
      <img
        src="/logo-lucas-gallastagui.png"
        alt=""
        aria-hidden="true"
      />
    </div>
  )
}
