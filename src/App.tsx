import { type MouseEvent, useEffect, useRef, useState } from 'react'
import './App.css'

/* As três faces visíveis do folder em cada página.
   A ordem é [esquerda, centro, direita] — a mesma usada na desestruturação. */
const PAGE_ONE = ['f1-sobre.png',   'f1-contato.png',  'f1-capa.png'      ] as const
const PAGE_TWO = ['v2-animal.png',  'v2-ajudar.png',   'v2-maustratos.png'] as const

/* Na fase de contato (fase 2 da página 1) trocamos a arte do painel central
   pela versão "limpa": as pílulas e o QR são desenhados como elementos reais
   por cima dela (texto selecionável, ícones SVG, hover suave). */
const CONTACT_BACKGROUND = 'f1-contato-limpo.png'
const CONTACT_QR_IMAGE   = 'qr.png'

/* Os três indicadores (bolinhas) no rodapé, um por fase. */
const PHASE_DOTS = [0, 1, 2] as const

const CONTACT_EMAIL = 'contato@resgatocao.ong.br'
const CONTACT_WHATSAPP = '5531988602469'
const CONTACT_INSTAGRAM = 'resgatocao'
const CONTACT_PIX_KEY = '00020126470014BR.GOV.BCB.PIX0125contato@resgatocao.ong.br5204000053039865802BR5920INSTITUTO RESGATOCAO6014BELO HORIZONTE62070503***6304F14C'

/* Durações (ms) das animações 3D. Precisam casar com os keyframes do App.css.
   FLIP_*  → girar o folder na mão (fase 1 → 2).
   COVER_* → abrir a capa e desdobrar os painéis (fase 0 → 1). */
const FLIP_HALF   = 420
const FLIP_SWITCH = FLIP_HALF - 24   // troca a página um pouco antes do meio do giro
const COVER_HALF  = 500
const COVER_IN    = 1100

/* Quanto tempo a fase 2 (fechar) leva para liberar novo clique. */
const CLOSE_COOLDOWN = 780

type Phase = 0 | 1 | 2
type CurrentPage = 'p1' | 'p2'
type FlipPhase = 'none' | 'out' | 'in' | 'cover-out' | 'cover-in'
type ToastType = 'ok' | 'error' | 'info'

type HotspotId = 'email' | 'whatsapp' | 'instagram' | 'pix-qr'

type ContactHotspot = {
  id: HotspotId
  label: string          // texto para leitores de tela (aria-label / title)
  text?: string          // texto visível dentro da pílula
  href?: string
  openInNewTab?: boolean
  copiesPix?: boolean
}

const CONTACT_HOTSPOTS: ContactHotspot[] = [
  {
    id: 'email',
    label: 'Enviar e-mail para a ResgatoCão',
    text: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
  },
  {
    id: 'whatsapp',
    label: 'Falar com a ResgatoCão no WhatsApp',
    text: 'WhatsApp',
    href: `https://wa.me/${CONTACT_WHATSAPP}`,
    openInNewTab: true,
  },
  {
    id: 'instagram',
    label: 'Abrir Instagram da ResgatoCão',
    text: 'Instagram',
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
  const [phase,     setPhase]     = useState<Phase>(0)
  const [page,      setPage]      = useState<CurrentPage>('p1')
  const [flipPhase, setFlipPhase] = useState<FlipPhase>('none')
  const [isOverQrHotspot, setIsOverQrHotspot] = useState(false)
  const [contactToast, setContactToast] = useState<{ type: ToastType; message: string; key: number } | null>(null)

  // Trava de reentrância: ignora cliques enquanto uma animação está em curso.
  const isAnimating = useRef(false)
  // Chave incremental para reiniciar a animação do toast a cada nova mensagem.
  const toastKey = useRef(0)

  // Pré-carrega todas as artes para que as trocas de página não pisquem.
  useEffect(() => {
    ;[...PAGE_ONE, ...PAGE_TWO].forEach(src => { new Image().src = src })
  }, [])

  // O toast some sozinho após um tempo curto.
  useEffect(() => {
    if (!contactToast) return
    const timeoutId = window.setTimeout(() => setContactToast(null), 2200)
    return () => window.clearTimeout(timeoutId)
  }, [contactToast])

  const [leftSrc, centerSrc, rightSrc] = page === 'p2' ? PAGE_TWO : PAGE_ONE
  const isOpen = phase > 0

  // A tela de contato é a página 1. Usamos o fundo "limpo" no painel central
  // SEMPRE que estamos nela — inclusive durante o flip-in que a revela — para
  // que a arte não troque ao assentar (evita o "salto" de tamanho do texto).
  const isContactScreen = page === 'p1' && (phase === 2 || flipPhase === 'in')

  // Os botões são renderizados já durante o flip-in: como vivem dentro do
  // painel central, giram junto com o papel (efeito 3D contínuo, sem fade).
  const showContactHotspots = isContactScreen

  // Mas só aceitam clique quando o folder está parado, para não disparar ações
  // enquanto a peça ainda gira.
  const hotspotsInteractive = isContactScreen && flipPhase === 'none'
  const centerImageSrc = isContactScreen ? CONTACT_BACKGROUND : centerSrc

  useEffect(() => {
    if (!showContactHotspots) setIsOverQrHotspot(false)
  }, [showContactHotspots])

  function showToast(type: ToastType, message: string) {
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

  function handleStageClick(event?: MouseEvent<HTMLDivElement>) {
    // Clicar sobre o QR (que é "pass-through" para o palco) copia o PIX
    // sem disparar a transição de fase.
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

    if (isAnimating.current) return
    isAnimating.current = true

    if (phase === 0) {
      // Capa fechada → abre a capa, troca para a página 2 e desdobra os painéis.
      setFlipPhase('cover-out')
      setTimeout(() => {
        setPage('p2')
        setPhase(1)
        setFlipPhase('cover-in')
      }, COVER_HALF)
      setTimeout(() => {
        setFlipPhase('none')
        isAnimating.current = false
      }, COVER_HALF + COVER_IN)
    } else if (phase === 1) {
      // Página 2 aberta → gira o folder na mão e revela a página 1.
      setFlipPhase('out')
      setTimeout(() => {
        setPage('p1')
        setFlipPhase('in')
      }, FLIP_SWITCH)
      setTimeout(() => {
        setFlipPhase('none')
        setPhase(2)
        isAnimating.current = false
      }, FLIP_SWITCH + FLIP_HALF)
    } else {
      // Página 1 aberta (com contatos) → fecha tudo de volta à capa.
      setPhase(0)
      setTimeout(() => { isAnimating.current = false }, CLOSE_COOLDOWN)
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
        onClick={handleStageClick}
        onMouseMove={updateQrCursorState}
        onMouseLeave={() => setIsOverQrHotspot(false)}
      >
        <div className="book-lift">
          <div className={bookClass}>
            <div className="panel panel-l">
              <img src={leftSrc} alt="painel esquerdo" draggable={false} />
            </div>
            <div className="panel panel-c">
              {/* Na tela de contato usamos o fundo limpo (já durante o flip-in);
                  nas demais páginas, a arte normal. */}
              <img
                src={centerImageSrc}
                alt="painel central"
                draggable={false}
              />
              {showContactHotspots && (
                <div
                  className={joinClass(
                    'contact-hotspots',
                    !hotspotsInteractive && 'contact-hotspots--locked',
                  )}
                  aria-label="Ações de contato"
                >
                  {/* QR do PIX como camada de imagem, alinhado à área limpa. */}
                  <img
                    className="contact-qr-image"
                    src={CONTACT_QR_IMAGE}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                  />
                  {CONTACT_HOTSPOTS.map(hotspot => (
                    <ContactHotspotButton
                      key={hotspot.id}
                      hotspot={hotspot}
                      onEmail={openEmailContact}
                      onCopyPix={copyPixKey}
                      onNotify={showToast}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="panel panel-r">
              <img src={rightSrc} alt="capa" draggable={false} />
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
        {PHASE_DOTS.map(i => (
          <span key={i} className={`dot${phase === i ? ' dot--on' : ''}`} />
        ))}
      </div>
    </main>
  )
}

/* Ícone (SVG) de cada serviço. Herdam a cor via `currentColor`. */
function HotspotIcon({ id }: { id: HotspotId }) {
  switch (id) {
    case 'email':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 6.5h18v11H3zM3.5 7l8.5 6 8.5-6"
          />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M12 2a9.9 9.9 0 0 0-8.5 15l-1.3 4.7 4.8-1.3A9.9 9.9 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.8.8-2.7-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.3 7.3 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.5l.4-.5.3-.4v-.4l-.8-1.9c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-1 2.3 5.3 5.3 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c1.6.6 1.6.4 1.9.4a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z"
          />
        </svg>
      )
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" ry="5"
            fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
        </svg>
      )
    default:
      return null
  }
}

/* Renderiza um único hotspot de contato sobre a arte da página.
   Mantém o comportamento original de cada tipo:
   • e-mail / PIX  → <button> (ação local: abrir mailto ou copiar chave)
   • whatsapp / ig → <a> (link externo, abre em nova aba)
   O QR (pix-qr) não tem conteúdo visual próprio: a imagem do QR já é
   exibida atrás dele e este botão é apenas a área clicável transparente. */
type ContactHotspotButtonProps = {
  hotspot: ContactHotspot
  onEmail: () => void
  onCopyPix: () => void
  onNotify: (type: ToastType, message: string) => void
}

function ContactHotspotButton({ hotspot, onEmail, onCopyPix, onNotify }: ContactHotspotButtonProps) {
  const className = `contact-hotspot contact-hotspot--${hotspot.id}`
  const shared = {
    className,
    'aria-label': hotspot.label,
    title: hotspot.label,
  }

  // Conteúdo visível da pílula: ícone + texto (o QR não tem rótulo visível).
  const content = hotspot.text ? (
    <span className="contact-hotspot__inner">
      <HotspotIcon id={hotspot.id} />
      <span className="contact-hotspot__text">{hotspot.text}</span>
    </span>
  ) : null

  if (hotspot.id === 'email' || hotspot.copiesPix) {
    const action = hotspot.id === 'email' ? onEmail : onCopyPix
    return (
      <button
        type="button"
        {...shared}
        onClick={event => {
          event.stopPropagation()
          action()
        }}
      >
        {content}
      </button>
    )
  }

  return (
    <a
      {...shared}
      href={hotspot.href}
      target={hotspot.openInNewTab ? '_blank' : undefined}
      rel={hotspot.openInNewTab ? 'noreferrer noopener' : undefined}
      onClick={event => {
        event.stopPropagation()
        onNotify('info', hotspot.id === 'whatsapp' ? 'Abrindo WhatsApp...' : 'Abrindo Instagram...')
      }}
    >
      {content}
    </a>
  )
}
