import React, { lazy } from 'react';
export function Foundations() {
  return (
    <section id="foundations" className="space-y-8 scroll-mt-24">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Foundations</h2>
        <p className="text-muted-foreground mt-2">
          Core visual elements that make up the Aurora ERP design system.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-24 rounded-xl bg-primary shadow-sm flex items-end p-3">
              <span className="text-primary-foreground font-medium text-sm">
                Primary
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Teal 600</p>
          </div>
          <div className="space-y-2">
            <div className="h-24 rounded-xl bg-secondary shadow-sm flex items-end p-3 border">
              <span className="text-secondary-foreground font-medium text-sm">
                Secondary
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Slate 200</p>
          </div>
          <div className="space-y-2">
            <div className="h-24 rounded-xl bg-background shadow-sm flex items-end p-3 border">
              <span className="text-foreground font-medium text-sm">
                Background
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Slate 50</p>
          </div>
          <div className="space-y-2">
            <div className="h-24 rounded-xl bg-foreground shadow-sm flex items-end p-3">
              <span className="text-background font-medium text-sm">
                Foreground
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Slate 900</p>
          </div>
        </div>

        <h4 className="text-sm font-medium mt-6 mb-3">Semantic Colors</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-16 rounded-xl bg-success shadow-sm flex items-end p-3">
              <span className="text-success-foreground font-medium text-sm">
                Success
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-xl bg-warning shadow-sm flex items-end p-3">
              <span className="text-warning-foreground font-medium text-sm">
                Warning
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-xl bg-destructive shadow-sm flex items-end p-3">
              <span className="text-destructive-foreground font-medium text-sm">
                Error
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-xl bg-info shadow-sm flex items-end p-3">
              <span className="text-info-foreground font-medium text-sm">
                Info
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Typography</h3>
        <div className="space-y-6 rounded-xl border p-6 bg-card">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Heading 1</h1>
            <p className="text-sm text-muted-foreground mt-1">
              4xl / Bold / Tracking Tight
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Heading 2</h2>
            <p className="text-sm text-muted-foreground mt-1">
              3xl / Semibold / Tracking Tight
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">Heading 3</h3>
            <p className="text-sm text-muted-foreground mt-1">
              2xl / Semibold / Tracking Tight
            </p>
          </div>
          <div>
            <h4 className="text-xl font-semibold tracking-tight">Heading 4</h4>
            <p className="text-sm text-muted-foreground mt-1">
              xl / Semibold / Tracking Tight
            </p>
          </div>
          <div>
            <p className="text-base leading-7">
              Body text. The quick brown fox jumps over the lazy dog. This is
              standard paragraph text used throughout the application for
              general reading.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Base / Regular / Leading 7
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Small text. Used for secondary information, hints, and metadata.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sm / Regular / Muted
            </p>
          </div>
        </div>
      </div>
    </section>);

}