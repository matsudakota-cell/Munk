// Shared authored data: the world, ownership rules and nest use the same IDs.
export const OWNERS=[
  {id:'tilly',name:'Tilly',job:'Gardener',x:-33,z:-7,color:'#658e67',icon:'❀'},
  {id:'bongo',name:'Bongo',job:'Fruit seller',x:37,z:-7,color:'#e89862',icon:'☂'},
  {id:'poppy',name:'Poppy',job:'Picnic keeper',x:-16,z:-14,color:'#cf7183',icon:'☕'},
  {id:'dot',name:'Dot',job:'Painter',x:16,z:-17,color:'#788fc4',icon:'✎'},
  {id:'gus',name:'Gus',job:'Playground boss',x:-16,z:4,color:'#d59b47',icon:'★'},
];
export const EXTRA_BELONGINGS=[
  {id:'trowel',name:'Tilly’s trowel',owner:'tilly',x:-38,z:3},
  {id:'bananas',name:'Bongo’s bananas',owner:'bongo',x:38,z:4},
  {id:'tackle-box',name:'fisherman’s tackle box',owner:'fisherman',x:17,z:35},
  {id:'thermos',name:'fisherman’s thermos',owner:'fisherman',x:10,z:39},
  {id:'sandwich',name:'Poppy’s sandwich',owner:'poppy',x:-19,z:-10},
  {id:'teapot',name:'Poppy’s teapot',owner:'poppy',x:-14,z:-10},
  {id:'paintbrush',name:'Dot’s paintbrush',owner:'dot',x:13,z:-12},
  {id:'palette',name:'Dot’s palette',owner:'dot',x:18,z:-12},
  {id:'gus-glasses',name:'Gus’s glasses',owner:'gus',x:-16,z:4,worn:true},
].map(item=>({...item,kind:'belonging'}));
