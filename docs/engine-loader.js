// Verify the engine shipped alongside the matching JavaScript bindings.
export const WASM_URL='./vendor/relate_bg.wasm';
export const WASM_BYTES=7184533;
export const WASM_SHA256='ee6e8c6a40c234cb99fd0b85f8acca9318b87649315bc9776eaaac26ab448324';
export async function verifiedWasm({get=fetch,subtle=globalThis.crypto?.subtle}={}){
 if(!subtle)throw Error('Open this demo over HTTPS or localhost so it can verify the engine.');
 let response;
 try{
  response=await get(WASM_URL,{mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(25000)});
 }catch{throw Error('The engine download could not reach this site. Try again when connected.');}
 if(!response.ok)throw Error('The engine download returned HTTP '+response.status+'.');
 const bytes=await response.arrayBuffer();
 if(bytes.byteLength!==WASM_BYTES)throw Error('The engine download is incomplete.');
 const digest=new Uint8Array(await subtle.digest('SHA-256',bytes));
 const actual=Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
 if(actual!==WASM_SHA256)throw Error('The engine download did not pass integrity verification.');
 return bytes;
}
