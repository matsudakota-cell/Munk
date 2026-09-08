import {cleanNestSave} from './nest.mjs';
export const NEST_STORAGE_KEY='munks.nest.v1';
export function loadNest(storage){
  try{return cleanNestSave(JSON.parse(storage.getItem(NEST_STORAGE_KEY)));}
  catch{return cleanNestSave(null);}
}
export function saveNest(storage,data){
  try{storage.setItem(NEST_STORAGE_KEY,JSON.stringify(cleanNestSave(data)));return true;}
  catch{return false;}
}
