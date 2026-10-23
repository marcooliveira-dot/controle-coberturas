'use client';
import { useRef,type ReactNode } from 'react';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from '@/components/ui/dialog';
export default function RecordDialog({title,description,onClose,busy=false,className='',children}:{title:string,description:string,onClose:()=>void,busy?:boolean,className?:string,children:ReactNode}){
 const returnFocus=useRef<HTMLElement|null>(null);
 return <Dialog open onOpenChange={open=>{if(!open&&!busy)onClose();}}><DialogContent
  className={'records-detail '+className} showCloseButton={false}
  style={{width:'min(960px, calc(100vw - 2rem))',maxWidth:'none',maxHeight:'85dvh',overflowY:'auto',margin:0}}
  onOpenAutoFocus={()=>{returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;}}
  onCloseAutoFocus={event=>{if(returnFocus.current?.isConnected){event.preventDefault();returnFocus.current.focus();}}}
  onEscapeKeyDown={event=>{if(busy)event.preventDefault();}}
  onPointerDownOutside={event=>{if(busy)event.preventDefault();}}
 ><div className="toolbar"><DialogTitle>{title}</DialogTitle><button type="button" className="secondary" disabled={busy} onClick={onClose}>Fechar</button></div><DialogDescription>{description}</DialogDescription>{children}</DialogContent></Dialog>;
}
