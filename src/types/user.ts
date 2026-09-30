/**
 * The signed-in consultant. `id` must be the identity provider's stable
 * subject identifier (not the email), so records keyed on it survive the
 * move from the dev provider to SSO and any later email changes.
 */
export type User = {
  id: string;
  email: string;
  name: string;
};
