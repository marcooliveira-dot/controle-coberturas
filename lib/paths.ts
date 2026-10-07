export const basePath=process.env.NEXT_PUBLIC_BASE_PATH || '';
export const withBase=(path:string)=>basePath+path;
