const assert = require('node:assert/strict');
const fs = require('node:fs');
const states = JSON.parse(fs.readFileSync(__dirname + '/state_foia_data.json', 'utf8'));
const jurisdictions = 'Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|District of Columbia|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming'.split('|');
assert.deepEqual(states.map(s => s.state).sort(), jurisdictions.sort());
const httpUrl = value => {
  const parsed = new URL(value);
  assert.ok(['https:', 'http:'].includes(parsed.protocol), value);
  assert.ok(parsed.hostname, value);
};
let sourced = 0;
for (const state of states) {
  const names = new Set();
  assert.ok(state.agencies.length, state.state);
  assert.equal(typeof state.statute, 'string');
  assert.equal(typeof state.citation, 'string');
  assert.equal(typeof state.response_days, 'string');
  assert.equal(typeof state.residency_required, 'boolean');
  assert.ok(state.agencies.some(a => a.sourceUrl), state.state + ': no sourced additions');
  for (const agency of state.agencies) {
    const label = state.state + ': ' + agency.title;
    assert.equal(typeof agency.title, 'string', label);
    const key = agency.title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
    assert.ok(!names.has(key), 'Duplicate agency: ' + label);
    names.add(key);
    assert.ok(Array.isArray(agency.emails), label);
    for (const email of agency.emails) {
      assert.match(email, /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, label);
      assert.doesNotMatch(email, /(?:example\.|agencyname\.|\.gov(?:mail|email|department)$)/i, label);
    }
    if (agency.portal) httpUrl(agency.portal);
    if (agency.sourceUrl) {
      sourced++;
      httpUrl(agency.sourceUrl);
      assert.match(agency.sourceChecked, /^\d{4}-\d{2}-\d{2}$/, label);
      assert.equal(new Date(agency.sourceChecked).toISOString().slice(0, 10), agency.sourceChecked, label);
      assert.ok(agency.note && agency.note.trim(), label);
      if (agency.portalLabel) {
        assert.ok(agency.portal, label);
        assert.ok(['Request portal', 'Request instructions'].includes(agency.portalLabel), label);
      }
    }
    if (!agency.emails.length && !agency.phone && !agency.portal) {
      assert.ok(agency.sourceUrl, label + ': missing follow-up source');
      assert.match(agency.note, /no verified/i, label);
    }
    if (/^Portal only:/i.test(agency.note || '')) {
      assert.ok(agency.portal, label);
      assert.deepEqual(agency.emails, [], label + ': portal-only contact must not enter email lists');
    }
  }
}
assert.ok(sourced > 0);
console.log('PASS: all 51 jurisdictions, agency uniqueness, contact availability, request email syntax, source dates, and request links');
