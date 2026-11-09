'use client'

import { useId, useState } from 'react'
import { faq } from '../content'
import { Reveal } from '../ui/reveal'
import { Section, SectionHeader } from '../ui/section'

/** Question dépliable : la réponse s'ouvre en glissant. */
export function FaqItem({ question, answer, open, onToggle }: { question: string; answer: string; open: boolean; onToggle: () => void }) {
  const id = useId()
  return (
    <div className="lp-card rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md">
      <h3>
        <button
          type="button"
          id={`${id}-q`}
          aria-expanded={open}
          aria-controls={`${id}-a`}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 rounded-2xl p-5 text-start text-base font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:p-6"
        >
          {question}
          <svg aria-hidden viewBox="0 0 20 20" className="lp-faq-chevron h-5 w-5 shrink-0 fill-current text-slate-400">
            <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
          </svg>
        </button>
      </h3>
      <div id={`${id}-a`} role="region" aria-labelledby={`${id}-q`} data-open={open} className="lp-faq-panel">
        <div>
          <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6 sm:pb-6">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export function FaqSection() {
  // Une seule question ouverte à la fois
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <Section id="faq" containerClassName="max-w-4xl" className="lg:py-20">
      <SectionHeader eyebrow={faq.eyebrow} title={faq.title} className="mb-10 sm:mb-14" />
      <div className="space-y-4">
        {faq.items.map((item, i) => (
          <Reveal key={item.question} delay={i * 80}>
            <FaqItem {...item} open={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)} />
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
