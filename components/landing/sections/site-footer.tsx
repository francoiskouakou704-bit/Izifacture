import { footer } from '../content'
import { Container } from '../ui/container'
import { Logo } from '../ui/logo'

/** Colonne de liens du pied de page (un élément sans `href` s'affiche en texte simple). */
export function FooterColumn({ title, links }: { title: string; links: { label: string; href?: string }[] }) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-900">{title}</h3>
      <ul className="space-y-2.5 text-xs">
        {links.map((link) => (
          <li key={link.label}>
            {link.href ? (
              <a href={link.href} className="transition-colors hover:text-ink">
                {link.label}
              </a>
            ) : (
              <span className="text-slate-500">{link.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white pb-12 pt-16 text-sm text-slate-600">
      <Container>
        <div className="grid grid-cols-2 gap-10 border-b border-slate-100 pb-12 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" className="mb-4" />
            <p className="text-xs leading-relaxed text-slate-500">{footer.tagline}</p>
          </div>
          {footer.columns.map((col) => (
            <FooterColumn key={col.title} {...col} />
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 text-center text-xs text-slate-400 sm:flex-row sm:text-start">
          <p>{footer.copyright}</p>
          <p>{footer.notice}</p>
        </div>
      </Container>
    </footer>
  )
}
