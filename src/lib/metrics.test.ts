import {describe,expect,it} from 'vitest'
import {demoEmployees} from '../data/demo'
import {distribution,filterEmployees,parseBRDate,stats,supervisors,tenureDistribution} from './metrics'
import {emptyFilters} from '../types'
describe('indicadores headcount G5',()=>{
 it('preserva o total e o recorte',()=>{const s=stats(demoEmployees);expect(s.total).toBe(96);expect(s.working+s.other).toBe(s.total)})
 it('busca por matrícula ou nome sem acentos',()=>{expect(filterEmployees(demoEmployees,{...emptyFilters,query:'ficticio 001'})).toHaveLength(1)})
 it('filtra por cliente e turno',()=>{const rows=filterEmployees(demoEmployees,{...emptyFilters,client:'CELLERA',shift:'MATUTINO'});expect(rows.every(r=>r.client==='CELLERA'&&r.shift==='MATUTINO')).toBe(true)})
 it('separa centros de custo sem presumir 1 por supervisor',()=>{const s=supervisors(demoEmployees);expect(s.reduce((n,x)=>n+x.total,0)).toBe(96);expect(s.some(x=>x.costCenters.size>1)).toBe(true)})
 it('todas distribuições conciliam',()=>{expect(distribution(demoEmployees,'client').reduce((s,r)=>s+r.value,0)).toBe(96);expect(tenureDistribution(demoEmployees).reduce((s,r)=>s+r.value,0)).toBe(96)})
 it('rejeita datas impossíveis',()=>{expect(parseBRDate('31/02/2026')).toBe(null);expect(parseBRDate('16/11/2026')).not.toBe(null)})
})
