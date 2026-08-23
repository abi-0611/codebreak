/**
 * Open/closed state for the full-screen menu overlay, shared between the
 * header's toggle and the overlay itself.
 */
export const useMenuState = () => useState<boolean>('menu-open', () => false)
