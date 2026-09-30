// The Connect modal is mounted once per app (ConnectHost, in AppData) so the
// sidebar can open it from any page. Anything that wants it open fires this.
export const OPEN_CONNECT_EVENT = 'b4a:open-connect';

export function openConnect(tab = 'mcp') {
  window.dispatchEvent(new CustomEvent(OPEN_CONNECT_EVENT, { detail: { tab } }));
}
