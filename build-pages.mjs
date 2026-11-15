import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {page,header} from './pages/site-shell.mjs';
const root=new URL('./',import.meta.url),dist=new URL('dist/',root);
let home=await readFile(new URL('index.html',dist),'utf8');
home=home.replace(/<!--HEADER-->[\s\S]*?<!--\/HEADER-->/,()=>'<!--HEADER-->'+header()+'<!--/HEADER-->');
await writeFile(new URL('index.html',dist),home);
const pages=[
  ['product','The workspace, explained','Explore the Blue Nebula prototype: visual editing, generated code, project memory, and visible checks.'],
  ['how-it-works','From project context to a reviewable change','Follow the Blue Nebula workflow from project decisions to design, code changes, and named checks.'],
  ['why-local','Your project, with clear boundaries','Explore the local-first product proposal, data boundaries, permission model, and proposed hardware profiles.']
];
for(const [slug,title,description] of pages){
  const folder=new URL(slug+'/',dist);await mkdir(folder,{recursive:true});
  const content=await readFile(new URL(`pages/${slug}.html`,root),'utf8');
  await writeFile(new URL('index.html',folder),page({title,description,path:`/${slug}/`,content}));
}
console.log('Generated Product, How it works, and Why local pages.');
