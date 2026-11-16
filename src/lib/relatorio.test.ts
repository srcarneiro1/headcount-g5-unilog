import {describe, expect, it} from 'vitest'
import {COLUNAS_RELATORIO, csvRelatorio, linhasRelatorio} from './relatorio'
import {demoEmployees} from '../data/demo'

describe('relatório de headcount', () => {
  it('tem as colunas na ordem pedida', () => {
    expect(linhasRelatorio(demoEmployees)[0]).toEqual(['Nome', 'Cadastro', 'Cargo', 'C.C', 'ID Superior', 'Nome Superior', 'ID Encarregado', 'Nome Encarregado', 'Alocação'])
    expect(COLUNAS_RELATORIO).toHaveLength(9)
  })
  it('uma linha por colaborador, em ordem alfabética, com os campos certos', () => {
    const linhas = linhasRelatorio(demoEmployees)
    expect(linhas).toHaveLength(demoEmployees.length + 1)
    const nomes = linhas.slice(1).map(l => l[0])
    expect(nomes).toEqual([...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR')))
    const e = demoEmployees.find(x => x.leadId)!
    expect(linhas.find(l => l[1] === e.id)).toEqual([e.name, e.id, e.role, e.costCenter, e.supervisorId, e.supervisor, e.leadId, e.lead, e.client])
  })
  it('CSV abre no Excel: BOM, ";" e CRLF, com aspas quando há ";"', () => {
    const csv = csvRelatorio([{...demoEmployees[0], client: 'CLIENTE; A'}])
    expect(csv.startsWith('\uFEFFNome;Cadastro;Cargo;C.C;')).toBe(true)
    expect(csv.split('\r\n')).toHaveLength(2)
    expect(csv).toContain('"CLIENTE; A"')
  })
})
