// Export the approved vector lockup without changing its internal composition.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out='outputs/2026-10-07-google-branding/kit';await mkdir(out,{recursive:true});
const svg=await readFile('docs/email/flowmaster-lockup.svg','utf8');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{
 for(const size of [512,120]){
  const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
  await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;background:#101010}body{display:flex;align-items:center;justify-content:center}body>svg{width:88%;height:auto}</style>${svg}`);
  await page.screenshot({path:`${out}/Flowmaster-Google-logo-${size}.png`});await page.close();
 }
 await copyFile('docs/email/flowmaster-lockup.svg',`${out}/Flowmaster-original-lockup.svg`);
 await copyFile('docs/email/flowmaster-lockup.png',`${out}/Flowmaster-original-lockup.png`);
 await writeFile(`${out}/logo-provenance.txt`,'Source: flowmaster-site/docs/email/flowmaster-lockup.svg (owner-approved composition).\nExport: uniform scaling only; centered on #101010; original spacing, lettering, and RGB square proportions preserved.\nUse Flowmaster-Google-logo-512.png for Google upload. 120px fallback included. No credentials are included.\n');
}finally{await browser.close();}
