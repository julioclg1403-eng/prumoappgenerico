import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import AppGestao from './pages/AppGestao'
import AppCampo from './pages/AppCampo'

/* Checa a sessão, busca o perfil (criado automaticamente pelo gatilho
   handle_new_user no banco) e mostra a shell certa pro papel. Sem
   React Router — cada shell cuida da própria navegação por estado. */
export default function App() {
  const [sessao, setSessao] = useState(undefined) // undefined = carregando, null = sem sessão
  const [perfil, setPerfil] = useState(null)
  const [erroPerfil, setErroPerfil] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => setSessao(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!sessao) { setPerfil(null); return }
    let cancelado = false
    supabase.from('profiles').select('*').eq('id', sessao.user.id).single()
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) { setErroPerfil(error.message); return }
        setPerfil(data)
      })
    return () => { cancelado = true }
  }, [sessao])

  if (sessao === undefined) {
    return <div className="empty">Carregando…</div>
  }

  if (!sessao) {
    return <Login />
  }

  if (!perfil) {
    return (
      <div className="empty">
        {erroPerfil ? `Não consegui carregar seu perfil: ${erroPerfil}` : 'Preparando seu acesso…'}
      </div>
    )
  }

  if (!perfil.organization_id || !perfil.role) {
    return (
      <div className="empty">
        Sua conta ainda não foi liberada por um administrador. Peça para vincularem
        seu usuário a uma organização e um papel.
      </div>
    )
  }

  return perfil.role === 'campo'
    ? <AppCampo perfil={perfil} />
    : <AppGestao perfil={perfil} />
}
