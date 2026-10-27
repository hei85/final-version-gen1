import {expect,test} from 'bun:test';
import {ApiError} from '@/services/api/request';
import {retryResourceUploadChunk} from '@/services/api/resources';

test('瞬时分片失败只重试当前操作并遵守 Retry-After',async()=>{
 let calls=0;const delays:number[]=[];
 const result=await retryResourceUploadChunk(async()=>{if(++calls<3)throw new ApiError('busy',{status:503,retryAfterMs:1500});return 42;},async(ms)=>{delays.push(ms)});
 expect(result).toBe(42);expect(calls).toBe(3);expect(delays).toEqual([1500,1500]);
});
test('参数或归属错误以及取消不重试',async()=>{
 for(const error of [new ApiError('bad',{status:400}),new DOMException('cancel','AbortError')]){
  let calls=0;await expect(retryResourceUploadChunk(async()=>{calls++;throw error},async()=>{})).rejects.toBe(error);expect(calls).toBe(1);
 }
});
test('无 HTTP 响应的网络错误最多尝试三次',async()=>{
 let calls=0;await expect(retryResourceUploadChunk(async()=>{calls++;throw new ApiError('network')},async()=>{})).rejects.toThrow('network');expect(calls).toBe(3);
});
