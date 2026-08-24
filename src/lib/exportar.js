/* Exportação: só o navegador, sem biblioteca — CSV por Blob+download,
   PDF por window.print() numa view com CSS de impressão (guia, "PDF/
   impressão = os mesmos componentes React", nunca um gerador à parte). */
function escaparCSV(valor) {
  const s = String(valor ?? '')
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function baixarCSV(nomeArquivo, cabecalho, linhas) {
  const conteudo = [cabecalho, ...linhas].map((l) => l.map(escaparCSV).join(';')).join('\n')
  const blob = new Blob([`﻿${conteudo}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo.endsWith('.csv') ? nomeArquivo : `${nomeArquivo}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
