import { useEffect, useRef, useState } from 'react'
import './App.css'

const P1 = ['f1-sobre.png',   'f1-contato.png',  'f1-capa.png'      ] as const
const P2 = ['v2-animal.png',  'v2-ajudar.png',   'v2-maustratos.png'] as const
const DOTS = [0, 1, 2] as const

const FLIP_HALF  = 420
const FLIP_SWITCH = FLIP_HALF - 24
const COVER_HALF = 500
const COVER_IN   = 1100

function joinClass(...tokens: Array<string | false>) {
  return tokens.filter(Boolean).join(' ')
}

export default function App() {
  const [fase,      setFase]      = useState<0 | 1 | 2>(0)
  const [page,      setPage]      = useState<'p1' | 'p2'>('p1')
  const [flipPhase, setFlipPhase] = useState<'none' | 'out' | 'in' | 'cover-out' | 'cover-in'>('none')
  const busy = useRef(false)

  useEffect(() => {
    ;[...P1, ...P2].forEach(src => { new Image().src = src })
  }, [])

  const [L, C, R] = page === 'p2' ? P2 : P1
  const isOpen = fase > 0

  function click() {
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

      <div className={stageClass} onClick={click}>
        <div className="book-lift">
          <div className={bookClass}>
            <div className="panel panel-l">
              <img src={L} alt="painel esquerdo" draggable={false} />
            </div>
            <div className="panel panel-c">
              <img src={C} alt="painel central" draggable={false} />
            </div>
            <div className="panel panel-r">
              <img src={R} alt="capa" draggable={false} />
            </div>
          </div>
        </div>
      </div>

      <div className="dots">
        {DOTS.map(i => (
          <span key={i} className={`dot${fase === i ? ' dot--on' : ''}`} />
        ))}
      </div>
    </main>
  )
}
