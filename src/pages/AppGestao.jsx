import { useState, useEffect } from 'react'
import { Sidebar, BottomNav } from '../components'
import Inicio from '../screens/Inicio'
import Diario from '../screens/Diario'
import Planejamento from '../screens/Planejamento'
import Cronograma from '../screens/Cronograma'
import Requisicoes from '../screens/Requisicoes'
import Pendencias from '../screens/Pendencias'
import Cadastros from '../screens/Cadastros'

const ITENS_DESKTOP = [
  { chave: 'inicio', rotulo: 'Início' },
  { chave: 'diario', rotulo: 'Diários' },
  { chave: 'planejamento', rotulo: 'Planejamento' },
  { chave: 'cronograma', rotulo: 'Cronograma' },
  { chave: 'requisicoes', rotulo: 'Requisições' },
  { chave: 'pendencias', rotulo: 'Pendências' },
  { chave: 'cadastros', rotulo: 'Cadastros' },
]

/* Celular fica só com os 5 principais — o resto é coisa de escritório,
   melhor no desktop (ver guia, seção "Navegação"). */
const ITENS_MOBILE = ITENS_DESKTOP.filter((it) => it.chave !== 'cronograma' && it.chave !== 'requisicoes')

const TELAS = {
  inicio: Inicio, diario: Diario, planejamento: Planejamento, cronograma: Cronograma,
  requisicoes: Requisicoes, pendencias: Pendencias, cadastros: Cadastros,
}

export default function AppGestao({ perfil }) {
  const [tela, setTela] = useState('inicio')
  const [desktop, setDesktop] = useState(window.innerWidth >= 900)

  useEffect(() => {
    const onResize = () => setDesktop(window.innerWidth >= 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const Tela = TELAS[tela]

  return (
    <div className="app" data-desktop={desktop ? '1' : '0'}>
      {desktop && <Sidebar itens={ITENS_DESKTOP} atual={tela} onSelecionar={setTela} perfil={perfil} />}
      <div style={{ flex: 1, overflowY: 'auto' }}><Tela perfil={perfil} /></div>
      {!desktop && <BottomNav itens={ITENS_MOBILE} atual={tela} onSelecionar={setTela} />}
    </div>
  )
}
