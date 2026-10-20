import assert from 'node:assert/strict';
import {abi} from 'genlayer-js';
import fs from 'node:fs';
const {calldata}=abi;
for(const [method,args] of [
 ['register',['demo',fs.readFileSync('examples/counter.json','utf8')]],
 ['synthesize',['a'.repeat(64),0]],['get_problem',['a'.repeat(64)]],['get_proof',['a'.repeat(64)]],
 ['attempt_count',['a'.repeat(64)]],['audit',['a'.repeat(64),'x'.repeat(4096)]],
 ['theorem',['a'.repeat(64),'b'.repeat(64),'c'.repeat(64)]]]){
 const bytes=calldata.encode(calldata.makeCalldataObject(method,args,{}));assert.deepEqual(calldata.encode(calldata.decode(bytes)),bytes);
}
console.log('7 SDK calldata roundtrips passed');
