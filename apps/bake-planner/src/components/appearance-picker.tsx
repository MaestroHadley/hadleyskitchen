"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Eye } from "@phosphor-icons/react";
import { saveAppearance } from "@/app/actions";
import { bakeryThemes, type ThemeId } from "@/lib/themes";

export function AppearancePicker({ savedTheme }: { savedTheme: ThemeId }) {
  const [previewTheme, setPreviewTheme] = useState<ThemeId | null>(null);

  useEffect(() => {
    const storedPreview = sessionStorage.getItem("bakery-theme-preview");
    const activeTheme = bakeryThemes.some((theme) => theme.id === storedPreview) ? storedPreview as ThemeId : savedTheme;
    const shell = document.querySelector<HTMLElement>(".app-shell");
    if (shell) shell.dataset.theme = activeTheme;
  }, [savedTheme]);

  function preview() {
    const value = document.querySelector<HTMLInputElement>(".theme-picker input:checked")?.value;
    const theme = bakeryThemes.some((item) => item.id === value) ? value as ThemeId : savedTheme;
    const shell = document.querySelector<HTMLElement>(".app-shell");
    if (shell) shell.dataset.theme = theme;
    sessionStorage.setItem("bakery-theme-preview", theme);
    setPreviewTheme(theme);
  }

  function resetPreview() {
    const shell = document.querySelector<HTMLElement>(".app-shell");
    if (shell) shell.dataset.theme = savedTheme;
    sessionStorage.removeItem("bakery-theme-preview");
    const savedInput = document.querySelector<HTMLInputElement>(`.theme-picker input[value="${savedTheme}"]`);
    if (savedInput) savedInput.checked = true;
    setPreviewTheme(null);
  }

  return <section className="panel appearance-settings" aria-labelledby="appearance-heading">
    <div className="section-heading">
      <div><p className="eyebrow">Appearance</p><h2 id="appearance-heading">Choose your workspace theme</h2><p className="muted">Change the look of your bakery workspace without changing its tools or data.</p></div>
      {previewTheme && previewTheme !== savedTheme && <span className="preview-status"><Eye weight="bold" />Previewing {bakeryThemes.find((theme) => theme.id === previewTheme)?.name}</span>}
    </div>
    <form action={saveAppearance} onSubmit={() => sessionStorage.removeItem("bakery-theme-preview")}>
      <div className="theme-picker" role="radiogroup" aria-label="Workspace theme">
        {bakeryThemes.map((theme) => {
          const checked = savedTheme === theme.id;
          return <label className="theme-option" key={theme.id}>
            <input type="radio" name="themeId" value={theme.id} defaultChecked={checked} />
            <span className={`theme-preview theme-preview-${theme.id}`} aria-hidden="true">
              <span className="theme-preview-bar" />
              <span className="theme-preview-nav" />
              <span className="theme-preview-content"><i /><i /><i /></span>
            </span>
            <span className="theme-option-copy"><strong>{theme.name}</strong><small>{theme.description}</small></span>
            <span className="theme-selected-state selected-copy"><CheckCircle weight="fill" />Selected</span>
            <span className="theme-selected-state select-copy">Select</span>
          </label>;
        })}
      </div>
      <div className="appearance-actions">
        <button className="button secondary" type="button" onClick={preview}><Eye weight="bold" />Preview</button>
        {previewTheme && <button className="text-button" type="button" onClick={resetPreview}>Reset preview</button>}
        <button className="button primary" type="submit">Save appearance</button>
      </div>
    </form>
  </section>;
}
