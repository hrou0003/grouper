export async function groupAllTabs() {
  if (
    !browser.tabs ||
    !browser.tabs.query ||
    !browser.tabs.group ||
    !browser.tabs.ungroup
  ) {
    console.error(
      "Basic tab grouping APIs (tabs.group/ungroup) are not available in this Firefox version or environment.",
    );
    return;
  }

  try {
    console.log("Starting tab grouping...");

    const tabs = await browser.tabs.query({ currentWindow: true });
    console.log(`Found ${tabs.length} tabs in the current window.`);

    // Ungroup any currently grouped tabs in this window first
    const tabIdsToUngroup = tabs
      .filter((t) => t.groupId !== -1)
      .map((t) => t.id);

    if (tabIdsToUngroup.length > 0) {
      console.log(
        `Ungrouping ${tabIdsToUngroup.length} previously grouped tabs.`,
      );
      try {
        await browser.tabs.ungroup(tabIdsToUngroup);
        await new Promise((resolve) => setTimeout(resolve, 50)); // Small delay
      } catch (ungroupErr) {
        console.warn("Failed to ungroup tabs:", ungroupErr);
      }
    } else {
      console.log("No tabs were previously grouped. Skipping ungroup step.");
    }

    // Create a map to hold tab IDs grouped by domain
    const domainMap = new Map();

    for (const t of tabs) {
      const domain = getDomain(t.url);
      if (domain) {
        if (!domainMap.has(domain)) {
          domainMap.set(domain, []);
        }
        domainMap.get(domain).push(t.id);
      }
    }

    console.log(
      `Identified ${domainMap.size} unique domains with groupable tabs.`,
    );

    // Iterate through the domain map and create groups
    for (const [domain, tabIds] of domainMap.entries()) {
      // Only group if there's more than one tab for this domain
      if (tabIds.length > 1) {
        console.log(
          `Attempting to group ${tabIds.length} tabs for domain: ${domain}`,
        );
        try {
          // Create a new group for these tabs
          // Note: The group will NOT be automatically named after the domain with this version
          const groupId = await browser.tabs.group({ tabIds: tabIds });
          console.log(
            `Created new group with ID: ${groupId} for ${domain} tabs (manual renaming required).`,
          );

          await browser.tabGroups.update(groupId, {
            title: domain,
          });

          // *** REMOVED: browser.tabGroups.update call ***
          // This is the line removed to avoid the error you reported
        } catch (groupErr) {
          console.error(
            `Error grouping tabs for domain "${domain}":`,
            groupErr,
          );
        }
      } else {
        console.log(`Domain "${domain}" only has one tab. Skipping grouping.`);
      }
    }

    console.log("Tab grouping process finished (without automatic renaming).");
  } catch (error) {
    console.error("An unexpected error occurred during tab grouping:", error);
  }
}

export async function groupCreatedTab(tab) {
  if (
    !browser.tabs ||
    !browser.tabs.query ||
    !browser.tabs.group ||
    !browser.tabs.ungroup
  ) {
    console.error(
      "Basic tab grouping APIs (tabs.group/ungroup) are not available in this Firefox version or environment.",
    );
    return;
  }

  try {
    console.log("Starting tab grouping...");

    const tabs = await browser.tabs.query({ currentWindow: true });
    console.log(`Found ${tabs.length} tabs in the current window.`);

    // Ungroup any currently grouped tabs in this window first
    const tabIdsToUngroup = tabs
      .filter((t) => t.groupId !== -1)
      .map((t) => t.id);

    if (tabIdsToUngroup.length > 0) {
      console.log(
        `Ungrouping ${tabIdsToUngroup.length} previously grouped tabs.`,
      );
      try {
        await browser.tabs.ungroup(tabIdsToUngroup);
        await new Promise((resolve) => setTimeout(resolve, 50)); // Small delay
      } catch (ungroupErr) {
        console.warn("Failed to ungroup tabs:", ungroupErr);
      }
    } else {
      console.log("No tabs were previously grouped. Skipping ungroup step.");
    }

    // Create a map to hold tab IDs grouped by domain
    const domainMap = new Map();

    for (const t of tabs) {
      const domain = getDomain(t.url);
      if (domain) {
        if (!domainMap.has(domain)) {
          domainMap.set(domain, []);
        }
        domainMap.get(domain).push(t.id);
      }
    }

    console.log(
      `Identified ${domainMap.size} unique domains with groupable tabs.`,
    );

    // Iterate through the domain map and create groups
    for (const [domain, tabIds] of domainMap.entries()) {
      // Only group if there's more than one tab for this domain
      if (tabIds.length > 1) {
        console.log(
          `Attempting to group ${tabIds.length} tabs for domain: ${domain}`,
        );
        try {
          // Create a new group for these tabs
          // Note: The group will NOT be automatically named after the domain with this version
          const groupId = await browser.tabs.group({ tabIds: tabIds });
          console.log(
            `Created new group with ID: ${groupId} for ${domain} tabs (manual renaming required).`,
          );

          await browser.tabGroups.update(groupId, {
            title: domain,
          });

          // *** REMOVED: browser.tabGroups.update call ***
          // This is the line removed to avoid the error you reported
        } catch (groupErr) {
          console.error(
            `Error grouping tabs for domain "${domain}":`,
            groupErr,
          );
        }
      } else {
        console.log(`Domain "${domain}" only has one tab. Skipping grouping.`);
      }
    }

    console.log("Tab grouping process finished (without automatic renaming).");
  } catch (error) {
    console.error("An unexpected error occurred during tab grouping:", error);
  }
}

// Helper function to extract the domain (hostname) from a URL
function getDomain(url) {
  try {
    const urlObject = new URL(url);
    if (urlObject.protocol === "http:" || urlObject.protocol === "https:") {
      return urlObject.hostname;
    }
    return null;
  } catch (e) {
    console.error(e);
  }
}
