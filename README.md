# Federal & State Freedom of Information Act (FOIA) Lookup Tool

A lightweight, single-page web application designed to help journalists, researchers, transparency advocates, and citizens quickly look up official public records officers and generate copy-paste email lists for bulk submissions across federal and state government agencies.

---

## Features

- **Dual-Mode Lookup:** Search both Federal FOIA departments and State Public Records offices across all 50 U.S. states.
- **Hierarchical Department Grouping:** Searching for a parent department (e.g., *Department of Justice*, *DHS*, or *California*) automatically retrieves contacts for all underlying component agencies.
- **Instant Email Block Generators:** Generates clean, de-duplicated email lists in both comma-separated (Gmail/Webmail) and semicolon-separated (Outlook) formats with single-click copying.
- **Auto-Suggest Search:** Type ahead to instantly match full department names, sub-components, or standard acronyms (e.g., *OPM*, *FBI*, *CPRA*).
- **Statute Guidance:** Selecting a state displays key legal metadata, including statute citations, response timeframes, and residency requirement warnings.
- **Zero Dependencies:** Pure client-side HTML, CSS, and vanilla JavaScript—runs instantly in any browser without build tools. Serve the files over HTTP so the browser can load the JSON databases.

---

## File Structure

```text
├── FOIA_Lookup.html       # The main single-page web application
├── foia_data.json         # Federal department & component FOIA directory
├── state_foia_data.json   # 50-State and D.C. public records directory & statute metadata
└── README.md              # Project documentation
```

## Run locally

Keep all three app files in the same folder. With Python installed, run:

```sh
python -m http.server 8000
```

Open http://localhost:8000/FOIA_Lookup.html. Opening the HTML directly with a `file://` URL may block JSON loading. Each database loads independently; a failed database displays a loading error when its tab is selected.

Contacts may carry a `portal` URL (shown as a link) and a `note` (for example, "portal only" or "no verified email"). Both fields are optional. Entries pointing to FOIA.gov have no verified direct contact in this directory. Federal additions were checked against web search results only; agency pages could not be fetched directly, so confirm before relying on them.

The bundled contacts and statute summaries have no source URLs or verification dates. Confirm details with the relevant agency before relying on them.
