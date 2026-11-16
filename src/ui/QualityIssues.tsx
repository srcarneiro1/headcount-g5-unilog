import {DataTable} from 'primereact/datatable'
import {Column} from 'primereact/column'
import {Tag} from 'primereact/tag'
import {Button} from 'primereact/button'
import type {HubPayload, QualityIssue} from '../types'
import {Panel} from './common'

/** CSV das pendências (mesmo padrão do Extra: BOM, ";" e CRLF) para corrigir a aba Cadastros. */
function exportarPendencias(issues: QualityIssue[]) {
  const cel = (v: string | number) => {
    const t = String(v ?? '')
    return /[;"\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  const linhas = [['Linha na planilha', 'Matrícula', 'Nome', 'Módulo', 'Tipo', 'Motivo'],
    ...issues.map(i => [i.row, i.id, i.name, i.module, i.type === 'DUPLICADO' ? 'Duplicado' : 'Inválido', i.reason])]
  const blob = new Blob(['\uFEFF' + linhas.map(l => l.map(cel).join(';')).join('\r\n')], {type: 'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'headcount-pendencias-cadastros.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Pendências da origem (aba Cadastros): quais registros estão duplicados ou inválidos, com a linha da planilha para
 * correção. Aparece só quando há pendências. Com o Apps Script antigo (só contagens), orienta a publicar o novo.
 */
export function QualityIssues({hub}: {hub: HubPayload}) {
  const total = hub.quality.duplicateIds + hub.quality.invalidRows
  if (!total) return null
  const issues = hub.quality.issues
  const exportar = issues && issues.length > 0
    ? <Button icon="pi pi-download" label="Exportar pendências" outlined severity="secondary" size="small" onClick={() => exportarPendencias(issues)}/>
    : undefined
  return <div className="quality-issues">
    <Panel title="Pendências na origem" kicker="QUALIDADE DO CADASTRO" action={exportar}>
      <p className="hint">
        {hub.quality.duplicateIds} matrícula(s) duplicada(s) e {hub.quality.invalidRows} registro(s) inválido(s) na aba Cadastros.
        Esses registros <strong>não entram</strong> nos totais. Corrija na planilha pela linha indicada.
      </p>
      {issues && issues.length > 0
        ? <DataTable value={issues} size="small" stripedRows scrollable scrollHeight="320px" dataKey="row" className="employee-table quality-issues-table">
            <Column field="row" header="Linha" style={{width: '80px'}}/>
            <Column field="id" header="Matrícula" body={(i: QualityIssue) => i.id || '—'} style={{width: '110px'}}/>
            <Column field="name" header="Nome" body={(i: QualityIssue) => i.name || '—'}/>
            <Column field="type" header="Tipo" body={(i: QualityIssue) => <Tag value={i.type === 'DUPLICADO' ? 'Duplicado' : 'Inválido'} severity={i.type === 'DUPLICADO' ? 'warning' : 'danger'}/>} style={{width: '110px'}}/>
            <Column field="reason" header="Motivo"/>
            <Column field="module" header="Módulo" style={{width: '90px'}}/>
          </DataTable>
        : <p className="hint"><i className="pi pi-info-circle"/> Para ver quais são, publique a versão atual do Apps Script (HeadcountApi.gs) — a versão publicada envia só as contagens.</p>}
    </Panel>
  </div>
}
