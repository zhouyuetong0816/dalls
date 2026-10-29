import { buildSilhouette } from './shape.js?v=processedit1';
/** Replace this adapter with a server-side AI sketch-to-plush call.
 * Input: {sketchDataUrl, strokes, aspect}. Never expose API keys in the browser.
 * Local result preserves the drawing's silhouette; it does not infer hidden anatomy.
 */
export async function sketchToPlush({sketchDataUrl,strokes,aspect=1,holes=[]}) {
 return {mode:'local-3d',sketchDataUrl,...buildSilhouette(strokes,aspect,holes)};
}
