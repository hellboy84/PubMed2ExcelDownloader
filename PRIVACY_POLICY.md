# Privacy Policy — PubMed2ExcelDownloader

*Last updated: 2026-04-01*

---

## Summary

PubMed2ExcelDownloader does **not** collect or transmit your data to the developer. However, as required by NCBI's API usage policy, users must provide an email address (and optionally an API key), which are stored locally in your browser and included in requests sent to NCBI's servers.

---

## Data Collected

The developer does **not** collect any data. Specifically:

- No personal information is transmitted to or stored by the developer.
- No browsing history is recorded.
- No search queries are transmitted to any server other than NCBI.
- No analytics or telemetry are used.

The following data is stored **locally in your browser** and is never sent to the developer:

| Data | Purpose |
|---|---|
| Email address | Required by NCBI's E-utilities usage policy; included in API requests sent to NCBI. |
| NCBI API key (optional) | Increases the API request rate limit; included in API requests sent to NCBI. |

Both values are transmitted to NCBI's servers (`eutils.ncbi.nlm.nih.gov`) as part of every API request, in accordance with [NCBI's usage policies](https://www.ncbi.nlm.nih.gov/home/about/policies/).

---

## How the Extension Works

1. The user registers their email address (and optionally an NCBI API key) in the extension's settings. These values are saved to `chrome.storage.local` on the user's device.
2. When the user opens the popup on a PubMed search results page, the extension reads the current search query and PMID list directly from the page DOM (via `content.js` injected into the active PubMed tab only).
3. The extension calls the NCBI E-utilities API (`https://eutils.ncbi.nlm.nih.gov/`) to retrieve bibliographic data (title, authors, abstract, MeSH terms, etc.) in MEDLINE format. The email address and API key (if set) are included in each request as required by NCBI.
4. The retrieved data is processed entirely in memory within the browser and exported as an Excel (.xlsx) or CSV file downloaded to the user's device.
5. No data is sent to any server other than NCBI's E-utilities API.

---

## Third-Party Services

The only external service contacted is the **NCBI E-utilities API** (`eutils.ncbi.nlm.nih.gov`), operated by the U.S. National Center for Biotechnology Information (NCBI). Requests are made solely to retrieve bibliographic data that the user explicitly requests to download. Please refer to [NCBI's Privacy Policy](https://www.ncbi.nlm.nih.gov/home/about/policies/) for information on how NCBI handles API requests.

---

## Permissions Used

| Permission | Purpose |
|---|---|
| `activeTab` | Identifies the currently active tab to verify the user is on a PubMed search results page. |
| `scripting` | Injects `content.js` into the active PubMed tab to read search query and PMID information from the page. |
| `storage` | Saves the user's email address and API key locally in `chrome.storage.local`. |
| `https://eutils.ncbi.nlm.nih.gov/*` | Calls the NCBI E-utilities API to fetch bibliographic data. |

No permission is used beyond its stated purpose.

---

## Changes to This Policy

If this policy is updated, the new version will be posted in this repository with an updated date.

---

## Contact

If you have any questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/hellboy84/PubMed2ExcelDownloader).
