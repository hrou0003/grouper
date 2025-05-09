browser.action.onClicked.addListener(async (tab) => {
  await groupAllTabs();
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url !== undefined) {
    if (
      tab.groupId === undefined ||
      tab.groupId === -1 ||
      getDomain(changeInfo.url) !== browser.tabGroups.get(tab.groupId).title
    ) {
      await groupCreatedTab(tab);
    }
  }
});

browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const tabs = await browser.tabs.query({ currentWindow: true });
  let domainMap = createDomainMap(tabs);
  for (const [domain, tabIds] of domainMap.entries()) {
    if (tabIds.includes(tabId)) {
      var tabsToUngroup = tabIds.filter((id) => id !== tabId);
      if (tabsToUngroup.length <= 1) {
        await browser.tabs.ungroup(tabsToUngroup);
      }
    }
  }
});

async function groupAllTabs() {
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

    let domainMap = createDomainMap(tabs);

    console.log(
      `Identified ${domainMap.size} unique domains with groupable tabs.`,
    );

    for (const [domain, tabIds] of domainMap.entries()) {
      if (tabIds.length > 1) {
        console.log(
          `Attempting to group ${tabIds.length} tabs for domain: ${domain}`,
        );
        try {
          const groupId = await browser.tabs.group({ tabIds: tabIds });
          console.log(
            `Created new group with ID: ${groupId} for ${domain} tabs (manual renaming required).`,
          );

          await browser.tabGroups.update(groupId, {
            title: domain,
          });
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

async function groupCreatedTab(tab) {
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
    const domain = getDomain(tab.url);

    const groups = await browser.tabGroups.query({
      title: domain,
      windowId: tab.windowId,
    });
    let existingGroupId = groups.length > 0 ? groups[0].id : null;

    const tabs = await browser.tabs.query({ currentWindow: true });
    let domainMap = createDomainMap(tabs);

    if (existingGroupId) {
      console.log(
        `Found existing group for domain: ${domain}, Id: ${existingGroupId}`,
      );
      await browser.tabs.group({
        groupId: existingGroupId,
        tabIds: [tab.id],
      });
    } else if (domainMap.get(domain).length > 1) {
      let tabIds = domainMap.get(domain);
      const groupId = await browser.tabs.group({
        tabIds: tabIds,
      });
      const tabGroupTitle = await browser.tabGroups.get(groupId).title;
      if (tabGroupTitle !== domain) {
        await browser.tabGroups.update(groupId, {
          title: domain,
        });
      }
    } else {
      browser.tabs.ungroup([tab.id]);
    }
  } catch (error) {
    console.error("An unexpected error occurred during tab grouping:", error);
  }
}

function createDomainMap(tabs) {
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

  return domainMap;
}

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
