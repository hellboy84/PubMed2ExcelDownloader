# Privacy Policy — PubMed2ExcelDownloader

*Last updated: 2026-03-29*

---

## Summary

PubMed2ExcelDownloader does **not** collect, store, or transmit any personal data. All processing occurs locally in your browser.

---

## Data Collected

This extension does **not** collect any data. Specifically:

- No personal information is collected or stored.
- No browsing history is recorded.
- No search queries are transmitted to any server other than NCBI.
- No cookies or local storage are read or written.
- No analytics or telemetry are used.

---

## How the Extension Works

1. When the user opens the popup on a PubMed search results page, the extension reads the current search query and PMID list directly from the page DOM (via `content.js` injected into the active PubMed tab only).
2. The extension calls the NCBI E-utilities API (`https://eutils.ncbi.nlm.nih.gov/`) to retrieve bibliographic data (title, authors, abstract, MeSH terms, etc.) in MEDLINE format.
3. The retrieved data is processed entirely in memory within the browser and exported as an Excel (.xlsx) or CSV file downloaded to the user's device.
4. No data is sent to any server other than NCBI's E-utilities API.

---

## Third-Party Services

The only external service contacted is the **NCBI E-utilities API** (`eutils.ncbi.nlm.nih.gov`), operated by the U.S. National Center for Biotechnology Information (NCBI). Requests are made solely to retrieve bibliographic data that the user explicitly requests to download. Please refer to [NCBI's Privacy Policy](https://www.ncbi.nlm.nih.gov/home/about/policies/) for information on how NCBI handles API requests.

---

## Permissions Used

| Permission | Purpose |
|---|---|
| `activeTab` | Identifies the currently active tab to verify the user is on a PubMed search results page. |
| `scripting` | Injects `content.js` into the active PubMed tab to read search query and PMID information from the page. |
| `https://eutils.ncbi.nlm.nih.gov/*` | Calls the NCBI E-utilities API to fetch bibliographic data. |

No permission is used beyond its stated purpose.

---

## Changes to This Policy

If this policy is updated, the new version will be posted in this repository with an updated date.

---

## Contact

If you have any questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/hellboy84/PubMed2ExcelDownloader).
