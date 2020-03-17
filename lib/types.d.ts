
type Tab = {
  url: string
}

type BrowserTabs = {
  get(tabId: number): Promise<Tab>
}

export type Browser = {
  tabs: BrowserTabs,
}
