// Type declaration for the vanilla Liquid Glass UMD module (liquid-glass.js).
type ThemeName = "light" | "dark";

interface GlassKitApi {
  init(scope?: ParentNode): GlassKitApi;
  makeInteractive(el: HTMLElement): HTMLElement;
  makeFloat(el: HTMLElement): HTMLElement;
  theme: {
    apply(): ThemeName;
    applyStoredTheme(): ThemeName;
    set(name: ThemeName, opts?: { persist?: boolean }): ThemeName;
    toggle(): ThemeName;
    current(): ThemeName;
    subscribe(fn: (name: ThemeName) => void): () => void;
  };
}

declare const GlassKit: GlassKitApi;
export default GlassKit;
