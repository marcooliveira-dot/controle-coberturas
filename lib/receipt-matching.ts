export function normalizedName(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
export type ReceiptCandidate={id:string,name:string,cpf:string,operation:string,month:string,ownerName:string,totalCents:number};
export function matchReceipt(text:string,filename:string,records:ReceiptCandidate[]){
 const source=' '+normalizedName(text)+' ',file=' '+normalizedName(filename)+' ';
 const cpfs=new Set(Array.from(text.matchAll(/(?<!\d)\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}(?!\d)/g),m=>m[0].replace(/\D/g,'')));
 return records.flatMap(record=>{
  const name=normalizedName(record.name),fullName=name.split(' ').length>=2&&name.length>=6;
  const reason=cpfs.has(record.cpf.replace(/\D/g,''))?'cpf':fullName&&source.includes(' '+name+' ')?'name':fullName&&file.includes(' '+name+' ')?'filename':null;
  return reason?[{...record,reason}]:[];
 });
}
