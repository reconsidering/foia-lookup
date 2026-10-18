const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/FOIA_Lookup.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const federal = JSON.parse(fs.readFileSync(__dirname + '/foia_data.json'));
const states = JSON.parse(fs.readFileSync(__dirname + '/state_foia_data.json'));
// These output fields remain form controls even when readonly or CSS is disabled.
for (const [, attributes] of html.matchAll(/<textarea\b([^>]*)>/g)) {
 const id = attributes.match(/\bid="([^"]+)"/)?.[1];
 assert.ok(id, 'Each email output needs a unique id for its visible label');
 const labels = [...html.matchAll(/<label\b([^>]*)>([^<]+)<\/label>/g)];
 assert.ok(labels.some(([, attrs, text]) => attrs.match(/\bfor="([^"]+)"/)?.[1] === id && text.trim()), 'Missing visible form label for ' + id);
 assert.equal([...html.matchAll(/\bid="([^"]+)"/g)].filter(([, value]) => value === id).length, 1);
}
assert.equal([...html.matchAll(/<main\b/g)].length, 1, 'The page needs one main landmark');
assert.match(html, /<main\b[^>]*>[\s\S]*<h1\b[\s\S]*id="resultsList"[\s\S]*<\/main>/);
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
 search('Alabama State Department of Education','state');
 assert.equal(nodes.get('resultsList').children.length,1);
 assert.equal(nodes.get('commaEmails').value,'');assert.equal(nodes.get('semicolonEmails').value,'');
 let card=nodes.get('resultsList').children[0];
 assert.ok(card.children.some(n=>/Portal only/.test(n.textContent)));
 assert.ok(card.children.some(n=>n.textContent==='Request portal: ' && n.children[0].href==='https://alsde.mycusthelp.com/'));
 assert.ok(card.children.some(n=>n.textContent==='Source: ' && /checked \d{4}-\d{2}-\d{2}/.test(n.children[0].textContent)));
 search('Unemployment Insurance Agency','state');
 assert.equal(nodes.get('resultsList').children.length,1);
 assert.ok(nodes.get('resultsList').children[0].children.some(n=>n.children.some(link=>link.href==='https://forms.leo.state.mi.us/foia/')));
 search('Alabama Department of Finance','state');
 assert.equal(nodes.get('commaEmails').value,'');
 assert.ok(nodes.get('resultsList').children[0].children.some(n=>/No verified/.test(n.textContent)));
 search('Maine','state');
 assert.equal(nodes.get('commaEmails').value.toLowerCase().split(', ').filter(email=>email==='foaarequest.dafs@maine.gov').length,1);
 search('Wisconsin Department of Children and Families','state');
 assert.equal(nodes.get('commaEmails').value.toLowerCase(),'dcfrecordsrequest@wisconsin.gov');
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
 assert.throws(()=>context.validateDatabase([{state:'bad',agencies:[{title:'bad',emails:[],sourceUrl:3}]}],'state'));
 assert.throws(()=>context.validateDatabase([{state:'bad',agencies:[{title:'bad',emails:[],sourceChecked:'yesterday'}]}],'state'));
 assert.throws(()=>context.validateDatabase([{state:'bad',agencies:[{title:'bad',emails:[],portalLabel:{}}]}],'state'));
 vm.runInContext(`STATE_DATABASE=[{state:'Fixture',agencies:[{title:'Missing contact',emails:[],sourceUrl:'javascript:bad()',portal:'javascript:bad()',portalLabel:'<img onerror=bad()>'}]}];`,context);
 search('Missing contact','state');card=nodes.get('resultsList').children[0];
 assert.ok(card.children.some(n=>/No verified contact information/.test(n.textContent)));
 assert.ok(!card.children.some(n=>n.children.length));
}
Promise.resolve().then(()=>run()).then(()=>run(true)).then(()=>console.log('PASS: startup, search, grouping, state metadata, empty results, deduplication, safe rendering, suggestions, clipboard, validation, and independent loading')).catch(error=>{console.error(error);process.exitCode=1;});
