import { useState } from 'react'
import { BottomNav } from '../components'
import { supabase } from '../lib/supabase'
import Inicio from '../screens/Inicio'
import Diario from '../screens/Diario'
import Pendencias from '../screens/Pendencias'

const ITENS = [
  { chave: 'inicio', rotulo: 'Início' },
  { chave: 'diario', rotulo: 'Diário' },
  { chave: 'pendencias', rotulo: 'Pendências' },
]

const TELAS = { inicio: Inicio, diario: Diario, pendencias: Pendencias }

export default function AppCampo({ perfil }) {
  const [tela, setTela] = useState('inicio')
  const Tela = TELAS[tela]

  return (
    <div className="app">
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 60 }}><Tela perfil={perfil} /></div>
      <BottomNav itens={ITENS} atual={tela} onSelecionar={setTela} />
      <button
        className="btn btn-ghost" style={{ position: 'fixed', top: 8, right: 8, fontSize: 11 }}
        onClick={() => supabase.auth.signOut()}
      >
        Sair
      </button>
    </div>
  )
}
