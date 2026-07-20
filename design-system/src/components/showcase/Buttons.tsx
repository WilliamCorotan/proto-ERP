import React from 'react';
import { Button } from '../ui/Button';
import { Plus, Mail, ArrowRight, Trash2 } from 'lucide-react';
export function Buttons() {
  return (
    <section id="buttons" className="space-y-8 scroll-mt-24">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Buttons</h2>
        <p className="text-muted-foreground mt-2">
          Interactive elements for user actions.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Variants</h3>
          <div className="flex flex-wrap gap-4 p-6 border rounded-xl bg-card items-center">
            <Button variant="default">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Sizes</h3>
          <div className="flex flex-wrap gap-4 p-6 border rounded-xl bg-card items-center">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">States & Icons</h3>
          <div className="flex flex-wrap gap-4 p-6 border rounded-xl bg-card items-center">
            <Button disabled>Disabled</Button>
            <Button isLoading>Loading</Button>
            <Button>
              <Mail className="mr-2 h-4 w-4" /> Login with Email
            </Button>
            <Button variant="outline">
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>);

}