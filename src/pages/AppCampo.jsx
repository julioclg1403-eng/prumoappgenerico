import { useState } from 'react'
import { BottomNav } from '../components'
import { supabase } from '../lib/supabase'
import Inicio from '../screens/Inicio'

const ITENS = [
  { chave: 'inicio', rotulo: 'Início' },
  // próximas fases: diario, efetivo, pendencias, requisicoes...
]

export default function AppCampo({ perfil }) {
  const [tela, setTela] = useState('inicio')
  const corpo = tela === 'inicio' ? <Inicio perfil={perfil} /> : null

  return (
    <div className="app">
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 60 }}>{corpo}</div>
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
