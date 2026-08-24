import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [codigoConvite, setCodigoConvite] = useState('')
  const [modo, setModo] = useState('entrar') // 'entrar' | 'criar'
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const [aviso, setAviso] = useState(null)

  const entrar = async (e) => {
    e.preventDefault()
    setErro(null); setAviso(null); setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setCarregando(false)
    if (error) setErro(error.message)
  }

  const criarConta = async (e) => {
    e.preventDefault()
    setErro(null); setAviso(null); setCarregando(true)
    const { error } = await supabase.auth.signUp({
      email, password: senha,
      options: { data: { nome, invite_code: codigoConvite.trim() } },
    })
    setCarregando(false)
    if (error) { setErro(error.message); return }
    setAviso('Conta criada. Se o código de convite estava certo, é só entrar.')
  }

  return (
    <div className="empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <h1 style={{ textAlign: 'center', color: 'var(--brand)' }}>Canteiro</h1>
        <p className="t-caption" style={{ textAlign: 'center', marginBottom: 24 }}>
          Gestão de obra, do canteiro ao escritório
        </p>

        <form onSubmit={modo === 'entrar' ? entrar : criarConta} className="card stack-1">
          {modo === 'criar' && (
            <>
              <label className="t-caption">Seu nome</label>
              <input
                required value={nome} onChange={(e) => setNome(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', width: '100%' }}
              />
            </>
          )}
          <label className="t-caption">E-mail</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', width: '100%' }}
          />
          <label className="t-caption">Senha</label>
          <input
            type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', width: '100%' }}
          />
          {modo === 'criar' && (
            <>
              <label className="t-caption">Código de convite (dado pela sua organização)</label>
              <input
                required value={codigoConvite} onChange={(e) => setCodigoConvite(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', width: '100%' }}
              />
            </>
          )}
          {erro && <div className="t-caption" style={{ color: 'var(--danger)' }}>{erro}</div>}
          {aviso && <div className="t-caption" style={{ color: 'var(--success)' }}>{aviso}</div>}
          <button className="btn btn-primary" type="submit" disabled={carregando}>
            {carregando ? 'Enviando…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          className="btn btn-ghost" style={{ width: '100%', marginTop: 12 }}
          onClick={() => { setModo(modo === 'entrar' ? 'criar' : 'entrar'); setErro(null); setAviso(null) }}
        >
          {modo === 'entrar' ? 'Primeira vez? Criar uma conta' : 'Já tenho conta'}
        </button>
      </div>
    </div>
  )
}
