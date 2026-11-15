export function readPrototypeLaunch(search=''){
  const query=new URLSearchParams(search),template=query.get('template'),requested=query.get('tab');
  const tab=requested==='checks'?'evaluation':requested;
  return {...(['welcome','dashboard','settings'].includes(template)?{template}:{}),tab:['canvas','code','memory','evaluation'].includes(tab)?tab:'canvas'};
}
