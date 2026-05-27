import { type MouseEvent, useEffect, useRef, useState } from 'react'
import './App.css'

const P1 = ['f1-sobre.png',   'f1-contato.png',  'f1-capa.png'      ] as const
const P2 = ['v2-animal.png',  'v2-ajudar.png',   'v2-maustratos.png'] as const
const DOTS = [0, 1, 2] as const
const CONTACT_EMAIL = 'contato@resgatocao.ong.br'
const CONTACT_WHATSAPP = '5531988602469'
const CONTACT_INSTAGRAM = 'resgatocao'
const CONTACT_PIX_KEY = '00020126470014BR.GOV.BCB.PIX0125contato@resgatocao.ong.br5204000053039865802BR5920INSTITUTO RESGATOCAO6014BELO HORIZONTE62070503***6304F14C'

const FLIP_HALF  = 420
const FLIP_SWITCH = FLIP_HALF - 24
const COVER_HALF = 500
const COVER_IN   = 1100

type ContactHotspot = {
  id: 'email' | 'whatsapp' | 'instagram' | 'pix-qr'
  label: string
  href?: string
  openInNewTab?: boolean
  copiesPix?: boolean
}

const CONTACT_HOTSPOTS: ContactHotspot[] = [
  {
    id: 'email',
    label: 'Enviar e-mail para a ResgatoCão',
    href: `mailto:${CONTACT_EMAIL}`,
  },
  {
    id: 'whatsapp',
    label: 'Falar com a ResgatoCão no WhatsApp',
    href: `https://wa.me/${CONTACT_WHATSAPP}`,
    openInNewTab: true,
  },
  {
    id: 'instagram',
    label: 'Abrir Instagram da ResgatoCão',
    href: `https://instagram.com/${CONTACT_INSTAGRAM}`,
    openInNewTab: true,
  },
  {
    id: 'pix-qr',
    label: 'Copiar chave PIX',
    copiesPix: true,
  },
]

function joinClass(...tokens: Array<string | false>) {
  return tokens.filter(Boolean).join(' ')
}

function pointInsideRect(x: number, y: number, rect: DOMRect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

export default function App() {
  const [fase,      setFase]      = useState<0 | 1 | 2>(0)
  const [page,      setPage]      = useState<'p1' | 'p2'>('p1')
  const [flipPhase, setFlipPhase] = useState<'none' | 'out' | 'in' | 'cover-out' | 'cover-in'>('none')
  const [isOverQrHotspot, setIsOverQrHotspot] = useState(false)
  const [contactToast, setContactToast] = useState<{ type: 'ok' | 'error' | 'info'; message: string; key: number } | null>(null)
  const busy = useRef(false)
  const toastKey = useRef(0)

  useEffect(() => {
    ;[...P1, ...P2].forEach(src => { new Image().src = src })
  }, [])

  useEffect(() => {
    if (!contactToast) return
    const timeoutId = window.setTimeout(() => setContactToast(null), 2200)
    return () => window.clearTimeout(timeoutId)
  }, [contactToast])

  const [L, C, R] = page === 'p2' ? P2 : P1
  const isOpen = fase > 0
  const showContactHotspots = page === 'p1' && fase === 2 && flipPhase === 'none'

  useEffect(() => {
    if (!showContactHotspots) setIsOverQrHotspot(false)
  }, [showContactHotspots])

  function showToast(type: 'ok' | 'error' | 'info', message: string) {
    toastKey.current += 1
    setContactToast({ type, message, key: toastKey.current })
  }

  function copyPixKey() {
    const clipboardWrite = navigator.clipboard?.writeText
    if (!clipboardWrite) {
      showToast('error', 'Nao foi possivel copiar a chave PIX.')
      return
    }

    clipboardWrite.call(navigator.clipboard, CONTACT_PIX_KEY)
      .then(() => showToast('ok', 'Chave PIX copiada!'))
      .catch(() => showToast('error', 'Nao foi possivel copiar a chave PIX.'))
  }

  function openEmailContact() {
    showToast('info', 'Abrindo aplicativo de email...')
    window.location.href = `mailto:${CONTACT_EMAIL}`
  }

  function click(event?: MouseEvent<HTMLDivElement>) {
    if (showContactHotspots && event) {
      const qrHotspot = event.currentTarget.querySelector('.contact-hotspot--pix-qr')
      if (qrHotspot instanceof HTMLElement) {
        const qrRect = qrHotspot.getBoundingClientRect()
        if (pointInsideRect(event.clientX, event.clientY, qrRect)) {
          copyPixKey()
          return
        }
      }
    }

    if (busy.current) return
    busy.current = true

    if (fase === 0) {
      setFlipPhase('cover-out')
      setTimeout(() => {
        setPage('p2')
        setFase(1)
        setFlipPhase('cover-in')
      }, COVER_HALF)
      setTimeout(() => {
        setFlipPhase('none')
        busy.current = false
      }, COVER_HALF + COVER_IN)
    } else if (fase === 1) {
      setFlipPhase('out')
      setTimeout(() => {
        setPage('p1')
        setFlipPhase('in')
      }, FLIP_SWITCH)
      setTimeout(() => {
        setFlipPhase('none')
        setFase(2)
        busy.current = false
      }, FLIP_SWITCH + FLIP_HALF)
    } else {
      setFase(0)
      setTimeout(() => { busy.current = false }, 780)
    }
  }

  function updateQrCursorState(event: MouseEvent<HTMLDivElement>) {
    if (!showContactHotspots) {
      if (isOverQrHotspot) setIsOverQrHotspot(false)
      return
    }

    const qrHotspot = event.currentTarget.querySelector('.contact-hotspot--pix-qr')
    if (!(qrHotspot instanceof HTMLElement)) {
      if (isOverQrHotspot) setIsOverQrHotspot(false)
      return
    }

    const qrRect = qrHotspot.getBoundingClientRect()
    const nextIsOver = pointInsideRect(event.clientX, event.clientY, qrRect)
    if (nextIsOver !== isOverQrHotspot) setIsOverQrHotspot(nextIsOver)
  }

  const bookClass = joinClass(
    'book',
    isOpen && 'book--open',
    flipPhase === 'out' && 'book--flip-out',
    flipPhase === 'in' && 'book--flip-in',
    flipPhase === 'cover-out' && 'book--cover-out',
    flipPhase === 'cover-in' && 'book--cover-in',
  )

  const stageClass = joinClass(
    'stage',
    isOpen && 'stage--open',
    isOverQrHotspot && 'stage--over-qr',
    flipPhase !== 'none' && 'stage--flipping',
    flipPhase === 'cover-out' && 'stage--cover-out',
    flipPhase === 'cover-in' && 'stage--cover-in',
    flipPhase === 'out' && 'stage--flip-out',
    flipPhase === 'in' && 'stage--flip-in',
  )

  return (
    <main className="page">
      <img
        src={`${import.meta.env.BASE_URL}logo.svg`}
        alt="ResgatoCão"
        className="brand-logo"
        draggable={false}
      />

      <div
        className={stageClass}
        onClick={click}
        onMouseMove={updateQrCursorState}
        onMouseLeave={() => setIsOverQrHotspot(false)}
      >
        <div className="book-lift">
          <div className={bookClass}>
            <div className="panel panel-l">
              <img src={L} alt="painel esquerdo" draggable={false} />
            </div>
            <div className="panel panel-c">
              <img src={C} alt="painel central" draggable={false} />
              {showContactHotspots && (
                <div className="contact-hotspots" aria-label="Acoes de contato">
                  {CONTACT_HOTSPOTS.map(hotspot => {
                    const hotspotClass = `contact-hotspot contact-hotspot--${hotspot.id}`

                    if (hotspot.id === 'email') {
                      return (
                        <button
                          key={hotspot.id}
                          type="button"
                          className={hotspotClass}
                          aria-label={hotspot.label}
                          title={hotspot.label}
                          onClick={event => {
                            event.stopPropagation()
                            openEmailContact()
                          }}
                        />
                      )
                    }

                    if (hotspot.copiesPix) {
                      return (
                        <button
                          key={hotspot.id}
                          type="button"
                          className={hotspotClass}
                          aria-label={hotspot.label}
                          title={hotspot.label}
                          onClick={event => {
                            event.stopPropagation()
                            copyPixKey()
                          }}
                        />
                      )
                    }

                    return (
                      <a
                        key={hotspot.id}
                        className={hotspotClass}
                        href={hotspot.href}
                        target={hotspot.openInNewTab ? '_blank' : undefined}
                        rel={hotspot.openInNewTab ? 'noreferrer noopener' : undefined}
                        aria-label={hotspot.label}
                        title={hotspot.label}
                        onClick={event => {
                          event.stopPropagation()
                          showToast(
                            'info',
                            hotspot.id === 'whatsapp' ? 'Abrindo WhatsApp...' : 'Abrindo Instagram...',
                          )
                        }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
            <div className="panel panel-r">
              <img src={R} alt="capa" draggable={false} />
            </div>
          </div>
        </div>
        {contactToast && (
          <p
            key={contactToast.key}
            role="status"
            aria-live="polite"
            className={joinClass(
              'contact-toast',
              contactToast.type === 'ok' && 'contact-toast--ok',
              contactToast.type === 'info' && 'contact-toast--info',
              contactToast.type === 'error' && 'contact-toast--error',
            )}
          >
            {contactToast.message}
          </p>
        )}
      </div>

      <div className="dots">
        {DOTS.map(i => (
          <span key={i} className={`dot${fase === i ? ' dot--on' : ''}`} />
        ))}
      </div>
    </main>
  )
}
