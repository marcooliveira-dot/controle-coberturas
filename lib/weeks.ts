import { datesByWeekday, type Coverage } from './coverage';
export type MonthWeek={id:string,start:string,end:string};
export function monthWeeks(month:string):MonthWeek[]{
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return [];
 const first=new Date(month+'-01T00:00:00Z');
 const last=new Date(first);last.setUTCMonth(last.getUTCMonth()+1);last.setUTCDate(0);
 const monday=new Date(first);monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));
 const result:MonthWeek[]=[];
 while(monday<=last){
  const sunday=new Date(monday);sunday.setUTCDate(sunday.getUTCDate()+6);
  result.push({id:String(result.length+1),start:monday.toISOString().slice(0,10),end:sunday.toISOString().slice(0,10)});
  monday.setUTCDate(monday.getUTCDate()+7);
 }
 return result;
}
export function recordInWeek(record:Pick<Coverage,'start'|'end'|'weekdays'|'workedDates'>,week?:MonthWeek){
 if(!week)return true;
 const dates=record.workedDates??record.weekdays.flatMap(i=>datesByWeekday(record.start,record.end)[i]);
 return dates.some(date=>date>=week.start&&date<=week.end);
}
export function monthPeriod(month:string,choice:string):{start:string,end:string}|null{
 const weeks=monthWeeks(month);if(!weeks.length)return null;
 if(choice==='all'){
  const last=new Date(month+'-01T00:00:00Z');last.setUTCMonth(last.getUTCMonth()+1);last.setUTCDate(0);
  return {start:month+'-01',end:last.toISOString().slice(0,10)};
 }
 const week=weeks.find(w=>w.id===choice);
 return week?{start:week.start,end:week.end}:null;
}
export function periodChoice(month:string,start:string,end:string){
 for(const choice of ['all',...monthWeeks(month).map(w=>w.id)]){
  const period=monthPeriod(month,choice);
  if(period&&period.start===start&&period.end===end)return choice;
 }
 return 'manual';
}
