const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/FOIA_Lookup.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const federal = JSON.parse(fs.readFileSync(__dirname + '/foia_data.json'));
const states = JSON.parse(fs.readFileSync(__dirname + '/state_foia_data.json'));
function element() { return {style:{},textContent:'',value:'',children:[],classList:{toggle(){}},replaceChildren(){this.children=[];},appendChild(n){this.children.push(n);},addEventListener(){},focus(){this.focused=true;},select(){this.selected=true;}}; }
async function run(failFederal=false) {
 const nodes = new Map();
 const document = { getElementById(id){if(!nodes.has(id)) nodes.set(id,element()); return nodes.get(id);},createElement:element,addEventListener(){} };
 const context = vm.createContext({document,navigator:{clipboard:{writeText:async value=>{context.copied=value;}}},fetch:async path=>({ok:!(failFederal && path.includes('./foia_data')),status:404,json:async()=>path.includes('./foia_data')?federal:states})});
 vm.runInContext(script,context);
 await new Promise(resolve=>setImmediate(resolve));
 const search = (query,tab='federal')=>{context.switchTab(tab);document.getElementById('searchInput').value=query;context.executeSearch();};
 search('DOJ'); assert.equal(nodes.get('resultsList').children.length,federal.find(g=>g.deptAbbr==='DOJ').components.length * !failFederal);
 if(failFederal){ assert.match(nodes.get('statusBanner').textContent,/Unable/);search('California','state');assert.ok(nodes.get('resultsList').children.length);return; }
 search(' FBI ');assert.equal(nodes.get('resultsList').children.length,1);assert.match(nodes.get('commaEmails').value,/fbi.gov/);
 search('California','state');assert.equal(nodes.get('resultsList').children.length,states.find(s=>s.state==='California').agencies.length);assert.equal(nodes.get('stateInfoBox').style.display,'block');
 search('CPRA','state');assert.ok(nodes.get('resultsList').children.length);
 search('District of Columbia','state');assert.ok(nodes.get('resultsList').children.length);
 search('Virginia','state');assert.ok(nodes.get('stateDetails').children.some(n=>/Yes/.test(n.textContent)));
 await context.copyToClipboard('commaEmails');assert.equal(context.copied,nodes.get('commaEmails').value);
 context.navigator.clipboard=undefined;await context.copyToClipboard('commaEmails');assert.ok(nodes.get('commaEmails').selected);
 search('Food and Drug Administration');assert.equal(nodes.get('resultsList').children.length,1);assert.ok(nodes.get('resultsList').children[0].children.some(n=>/Online portal/.test(n.textContent)));assert.ok(nodes.get('resultsList').children[0].children.some(n=>/FOIA\.gov/.test(n.textContent)));
 assert.equal(nodes.get('commaEmails').value,'');
 search('nothing matches');assert.equal(nodes.get('commaEmails').value,'');assert.match(nodes.get('resultsHeader').textContent,/No matching/);
 search('');assert.equal(nodes.get('outputSection').style.display,'none');
 vm.runInContext(`FOIA_DATABASE=[{deptName:'<img onerror=bad()>',deptAbbr:'TEST',components:[{title:'<script>bad()</script>',emails:['same@example.gov',' SAME@example.gov ']}]}];`,context);
 search('TEST');assert.equal(nodes.get('commaEmails').value.toLowerCase(),'same@example.gov');assert.equal(nodes.get('resultsList').children[0].children[0].textContent,'<script>bad()</script>');
 nodes.get('searchInput').value='TEST';context.showSuggestions();assert.equal(nodes.get('suggestionsDropdown').children.length,2);
 assert.throws(()=>context.validateDatabase({},'federal'));
 assert.throws(()=>context.validateDatabase([{deptName:'bad',components:[{title:'bad',emails:[3]}]}],'federal'));
}
Promise.resolve().then(()=>run()).then(()=>run(true)).then(()=>console.log('PASS: startup, search, grouping, state metadata, empty results, deduplication, safe rendering, suggestions, clipboard, validation, and independent loading')).catch(error=>{console.error(error);process.exitCode=1;});