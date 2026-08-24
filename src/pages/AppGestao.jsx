import { useState, useEffect } from 'react'
import { Sidebar, BottomNav } from '../components'
import Inicio from '../screens/Inicio'

const ITENS = [
  { chave: 'inicio', rotulo: 'Início' },
  // próximas fases: diarios, planejamento, cronograma, pendencias, requisicoes, projetos...
]

export default function AppGestao({ perfil }) {
  const [tela, setTela] = useState('inicio')
  const [desktop, setDesktop] = useState(window.innerWidth >= 900)

  useEffect(() => {
    const onResize = () => setDesktop(window.innerWidth >= 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const corpo = tela === 'inicio' ? <Inicio perfil={perfil} /> : null

  return (
    <div className="app" data-desktop={desktop ? '1' : '0'}>
      {desktop && <Sidebar itens={ITENS} atual={tela} onSelecionar={setTela} perfil={perfil} />}
      <div style={{ flex: 1, overflowY: 'auto' }}>{corpo}</div>
      {!desktop && <BottomNav itens={ITENS} atual={tela} onSelecionar={setTela} />}
    </div>
  )
}
