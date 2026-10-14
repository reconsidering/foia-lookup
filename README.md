# Federal & State Freedom of Information Act (FOIA) Lookup Tool

A lightweight, single-page web application designed to help journalists, researchers, transparency advocates, and citizens quickly look up official public records officers and generate copy-paste email lists for bulk submissions across federal and state government agencies.

---

## Features

- **Dual-Mode Lookup:** Search both Federal FOIA departments and State Public Records offices across all 50 U.S. states.
- **Hierarchical Department Grouping:** Searching for a parent department (e.g., *Department of Justice*, *DHS*, or *California*) automatically retrieves contacts for all underlying component agencies.
- **Instant Email Block Generators:** Generates clean, de-duplicated email lists in both comma-separated (Gmail/Webmail) and semicolon-separated (Outlook) formats with single-click copying.
- **Auto-Suggest Search:** Type ahead to instantly match full department names, sub-components, or standard acronyms (e.g., *OPM*, *FBI*, *CPRA*).
- **Statute Guidance:** Selecting a state displays key legal metadata, including statute citations, response timeframes, and residency requirement warnings.
- **Zero Dependencies:** Pure client-side HTML, CSS, and vanilla JavaScript—runs instantly in any browser without build tools or external server requirements.

---

## File Structure

```text
├── FOIA_Lookup.html       # The main single-page web application
├── foia_data.json         # Federal department & component FOIA directory
├── state_foia_data.json   # 50-State public records directory & statute metadata
└── README.md              # Project documentation
