/**
 * Compila um tema PrimeReact com a paleta Unilog.
 * O ponto de partida é o Lara Light Indigo, disponível no PrimeReact 10.
 * O CSS gerado não é editado nem versionado: cada ambiente o recompila.
 */
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import path from 'node:path'

const require=createRequire(import.meta.url)
const origin=require.resolve('primereact/resources/themes/lara-light-indigo/theme.css')
const output=path.join(process.cwd(),'src/styles/prime-theme.css')
const replacements={
  '#0ea5e9':'#6d6e78','#0284c7':'#494a56','#3b82f6':'#6d6e78','#2563eb':'#494a56',
  '#ef4444':'#db0812','#dc2626':'#b8070f','#a855f7':'#6d6e78','#9333ea':'#494a56',
  '#22c55e':'#3f7c59','#16a34a':'#2f6d49','#15803d':'#23603c',
  '#f97316':'#a87900','#ea580c':'#8c6800','#eab308':'#a87900',
  '#14b8a6':'#5f8f8b',
  '#eef2ff':'#fdecee','#e0e7ff':'#fbd9dc','#c7d2fe':'#f5b5b9',
  '#a5b4fc':'#ee8a90','#818cf8':'#e55a62','#6366f1':'#db0812',
  '#4f46e5':'#b8070f','#4338ca':'#9e060d','#3730a3':'#83050b','#312e81':'#6a0409',
  '#f7f7fe':'#fff5f6','#dadafc':'#fbd9dc','#bcbdf9':'#f5b5b9',
  '#9ea0f6':'#ee8a90','#8183f4':'#e55a62','#5457cd':'#b8070f',
  '#4547a9':'#9e060d','#363885':'#83050b','#282960':'#6a0409','#b1b3f8':'#f5b5b9'
}
let css=await readFile(origin,'utf8')
// Não incluir fontes nem distribuir binários de fonte no projeto.
css=css.replace(/@font-face\s*{[^}]*}/g,'')
for(const [before,after] of Object.entries(replacements)){
  css=css.replace(new RegExp(before,'gi'),after)
}
css=css.replace(/rgba\(\s*99,\s*102,\s*241,/gi,'rgba(219, 8, 18,')
const leftover=['#6366f1','#4f46e5','#5457cd','#8183f4','#b1b3f8']
if(leftover.some(color=>css.toLowerCase().includes(color))){
  throw Error('Falha ao substituir a paleta original do PrimeReact.')
}
css+='\n:root{--primary-color:#db0812;--primary-color-text:#ffffff;--highlight-bg:#fdecee;--highlight-text-color:#b8070f;--focus-ring:0 0 0 .2rem #f5b5b9}\n'
await mkdir(path.dirname(output),{recursive:true})
await writeFile(output,'/* Tema gerado automaticamente por scripts/build-unilog-theme.mjs */\n'+css)
console.log('Tema Unilog pronto:',path.relative(process.cwd(),output))
