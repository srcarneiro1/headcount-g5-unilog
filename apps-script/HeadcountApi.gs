/**
 * Google Apps Script — Headcount G5.
 * Destino: implantar como aplicativo da Web executado pelo proprietário.
 * Uma única ação de leitura; NÃO escreve na planilha.
 * Configure Script Properties: HEADCOUNT_API_TOKEN e SPREADSHEET_ID.
 * Nunca mantenha o token aqui ou em código versionado.
 */
function doGet() {
  return headcountJson_({ok:false,error:'Método indisponível.'});
}
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty('HEADCOUNT_API_TOKEN');
    const spreadsheetId = props.getProperty('SPREADSHEET_ID');
    if (!secret || !spreadsheetId || typeof body.token !== 'string' || body.token !== secret || body.action !== 'HEADCOUNT_READ') {
      return headcountJson_({ok:false,error:'Não autorizado.'});
    }
    const doc = SpreadsheetApp.openById(spreadsheetId);
    const sheet = doc.getSheetByName('Cadastros');
    if (!sheet) return headcountJson_({ok:false,error:'Aba Cadastros não encontrada.'});
    const lastRow = sheet.getLastRow();
    const rows = lastRow > 1 ? sheet.getRange(2,1,lastRow-1,22).getDisplayValues() : [];
    const out = [];
    const ids = Object.create(null);
    let duplicateIds = 0;
    let invalidRows = 0;
    for (const row of rows) {
      if (!row.some(Boolean)) continue;
      const id = String(row[6] || '').trim();
      const name = String(row[0] || '').trim();
      if (!id || !name) {invalidRows++;continue;}
      if (Object.prototype.hasOwnProperty.call(ids,id)) {duplicateIds++;continue;}
      ids[id] = true;
      out.push({
        id:id,name:name,role:row[4]||'',area:row[5]||'',admission:row[7]||'',costCenter:row[12]||'',
        status:row[13]||'',client:row[14]||'',shift:row[15]||'',supervisorId:row[16]||'',
        supervisor:row[17]||'',lead:row[19]||'',module:row[20]||'',process:row[21]||''
      });
    }
    const summary = doc.getSheetByName('Dados');
    const sourceDate = summary ? String(summary.getRange('L1').getDisplayValue()||'') : '';
    return headcountJson_({ok:true,updatedAt:new Date().toISOString(),sourceDate:sourceDate,employees:out,quality:{duplicateIds:duplicateIds,invalidRows:invalidRows}});
  } catch (err) {
    console.error('Falha HeadcountApi: '+String(err));
    return headcountJson_({ok:false,error:'Falha ao processar fonte.'});
  }
}
function headcountJson_(obj) {return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
