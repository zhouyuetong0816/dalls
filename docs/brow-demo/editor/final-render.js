import {designSignature} from './design-spec.js?v=facelab1';
export class FinalRender{
 constructor(state,{getView}){this.state=state;this.getView=getView;this.signature='';}
 attach(container){this.container=container;this.refresh();}
 refresh(){if(!this.container?.isConnected)return;const view=this.getView();if(!view)return;const signature=designSignature(this.state);if(signature===this.signature)return;this.signature=signature;const image=view.captureTransparent(1200);this.container.innerHTML=`<div class="lab-final"><img src="${image}" alt="包含当前眉毛与嘴筒形状的成品"><aside><h3>带走这个表情。</h3><button id="lab-download-png">保存透明 PNG ↓</button><button id="lab-download-json">保存可继续修改的草稿 ↓</button><p>实验稿只保存在此浏览器，不会提交正式档案袋。</p></aside></div>`;this.container.querySelector('#lab-download-png').onclick=()=>this.download(view.captureTransparent(1600),'snoot-face-lab.png');this.container.querySelector('#lab-download-json').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(this.state)],{type:'application/json'}));this.download(url,'snoot-face-lab-draft.json');setTimeout(()=>URL.revokeObjectURL(url),10000);};}
 download(url,name){const a=document.createElement('a');a.href=url;a.download=name;a.click();}
}
