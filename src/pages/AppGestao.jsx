import { useState, useEffect } from 'react'
import { Sidebar, BottomNav, ErroBanner } from '../components'
import { useDados } from '../lib/DadosContext'
import Inicio from '../screens/Inicio'
import Diario from '../screens/Diario'
import Planejamento from '../screens/Planejamento'
import Cronograma from '../screens/Cronograma'
import Requisicoes from '../screens/Requisicoes'
import Projetos from '../screens/Projetos'
import Equipamentos from '../screens/Equipamentos'
import Pendencias from '../screens/Pendencias'
import Cadastros from '../screens/Cadastros'
import Relatorios from '../screens/Relatorios'
import Auditoria from '../screens/Auditoria'

const ITENS_DESKTOP = [
  { chave: 'inicio', rotulo: 'Início' },
  { chave: 'diario', rotulo: 'Diários' },
  { chave: 'planejamento', rotulo: 'Planejamento' },
  { chave: 'cronograma', rotulo: 'Cronograma' },
  { chave: 'requisicoes', rotulo: 'Requisições' },
  { chave: 'projetos', rotulo: 'Projetos' },
  { chave: 'equipamentos', rotulo: 'Equipamentos' },
  { chave: 'pendencias', rotulo: 'Pendências' },
  { chave: 'relatorios', rotulo: 'Relatórios' },
  { chave: 'auditoria', rotulo: 'Auditoria' },
  { chave: 'cadastros', rotulo: 'Cadastros' },
]

/* Celular fica só com os 5 principais — o resto é coisa de escritório,
   melhor no desktop (ver guia, seção "Navegação"). */
const CHAVES_MOBILE = ['inicio', 'diario', 'planejamento', 'pendencias', 'cadastros']
const ITENS_MOBILE = ITENS_DESKTOP.filter((it) => CHAVES_MOBILE.includes(it.chave))

const TELAS = {
  inicio: Inicio, diario: Diario, planejamento: Planejamento, cronograma: Cronograma,
  requisicoes: Requisicoes, projetos: Projetos, equipamentos: Equipamentos, pendencias: Pendencias,
  relatorios: Relatorios, auditoria: Auditoria, cadastros: Cadastros,
}

export default function AppGestao({ perfil }) {
  const dados = useDados()
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
      <ErroBanner erro={dados.erro} onFechar={dados.limparErro} />
      {desktop && <Sidebar itens={ITENS_DESKTOP} atual={tela} onSelecionar={setTela} perfil={perfil} />}
      <div style={{ flex: 1, overflowY: 'auto' }}><Tela perfil={perfil} /></div>
      {!desktop && <BottomNav itens={ITENS_MOBILE} atual={tela} onSelecionar={setTela} />}
    </div>
  )
}
