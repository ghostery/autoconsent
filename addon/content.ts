import handleContentMessage from '../lib/web/content';

browser.runtime.onMessage.addListener((message) => {
  return handleContentMessage(message);
})

browser.runtime.sendMessage({
  type: 'frame',
  url: window.location.href,
});
