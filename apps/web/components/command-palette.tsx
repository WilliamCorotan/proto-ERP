"use client";

import Link from "next/link";
import { ArrowRight, Command, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { NavigationItem } from "@erp/core";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./design-system";

type CommandItem = {
  label: string;
  path: string;
  scope: string;
};

export function CommandPalette({ navigation }: { navigation: NavigationItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const commands = useMemo(() => buildCommands(navigation), [navigation]);
  const normalizedQuery = query.trim().toLowerCase();
  const results = normalizedQuery
    ? commands.filter((item) => `${item.label} ${item.path} ${item.scope}`.toLowerCase().includes(normalizedQuery)).slice(0, 8)
    : commands.slice(0, 8);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTextInput =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT" || target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }

      if (!isTextInput && event.key === "/") {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="search-box command-trigger" type="button">
          <Search size={18} aria-hidden="true" />
          <span>Search modules, records, actions</span>
          <kbd>/</kbd>
        </button>
      </DialogTrigger>
      <DialogContent className="command-dialog">
        <div className="command-heading">
          <Command size={18} aria-hidden="true" />
          <div>
            <DialogTitle>Command palette</DialogTitle>
            <DialogDescription>Navigate across ERP modules and operator workspaces.</DialogDescription>
          </div>
        </div>
        <label className="command-search">
          <Search size={18} aria-hidden="true" />
          <input autoFocus placeholder="Type a module, record area, or workspace" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="command-results">
          {results.map((item) => (
            <Link key={item.path} className="command-item" href={item.path} onClick={() => setOpen(false)}>
              <span>
                <strong>{item.label}</strong>
                <small>{item.scope}</small>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
          {results.length === 0 ? <p>No matching commands.</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function buildCommands(navigation: NavigationItem[]): CommandItem[] {
  const items = [
    { label: "Command center", path: "/", scope: "Dashboard" },
    ...navigation.map((item) => ({ label: item.label, path: item.path, scope: "Module" })),
    { label: "Design system", path: "/design-system", scope: "Governance" }
  ];

  return Array.from(new Map(items.map((item) => [item.path, item])).values());
}
