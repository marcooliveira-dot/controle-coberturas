export const attachmentLimit=5*1024*1024;
export type FinanceAttachment={id:string,filename:string,mime:string,size:number,uploadedBy:string,uploadedAt:string};
export function attachmentType(bytes:Uint8Array):string|null{
 if(bytes.length>=5&&String.fromCharCode(...bytes.slice(0,5))==='%PDF-')return 'application/pdf';
 if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return 'image/png';
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 return null;
}
